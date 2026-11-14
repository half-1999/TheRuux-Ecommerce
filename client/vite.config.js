import { copyFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const SITE = 'https://theruux.in';
const API = 'https://theruux-ecommerce-jbpe.onrender.com/api';
const STATIC_PATHS = [
  '/',
  '/shop',
  '/new-arrivals',
  '/bestsellers',
  '/about',
  '/our-story',
  '/contact',
  '/help/shipping',
  '/help/returns',
  '/help/faqs',
  '/help/size-guide',
  '/legal/privacy',
  '/legal/terms',
];

const escapeXml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function writeSitemap(dist) {
  const paths = new Set(STATIC_PATHS);
  let products = null;
  try {
    const load = async (url) => {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) return null;
      return response.json();
    };
    const [productPage, categories, collections] = await Promise.all([
      load(`${API}/products?pageSize=100`),
      load(`${API}/categories`),
      load(`${API}/collections`),
    ]);
    products = productPage;
    for (const item of products?.items || []) if (item.slug) paths.add(`/product/${item.slug}`);
    for (const item of categories?.items || []) if (item.slug) paths.add(`/shop/${item.slug}`);
    for (const item of collections?.items || []) if (item.slug) paths.add(`/collections/${item.slug}`);
  } catch {
    // shortcut: catalog was unreachable, sitemap keeps the fixed pages until the next build
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...paths].map((path) => `  <url><loc>${escapeXml(`${SITE}${path}`)}</loc></url>`).join('\n')}
</urlset>
`;
  writeFileSync(resolve(dist, 'sitemap.xml'), xml);

  const merchantItems = (products?.items || []).map((item) => {
    const description = `${item.name} ${item.title}. TheRuux.`;
    const available = 'in_stock';
    return `    <item>
      <g:id>${escapeXml(item.slug)}</g:id>
      <g:title>${escapeXml(`${item.name} ${item.title}`)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(`${SITE}/product/${item.slug}`)}</g:link>
      <g:image_link>${escapeXml(item.image?.url || '')}</g:image_link>
      <g:availability>${available}</g:availability>
      <g:price>${item.price} INR</g:price>
      <g:brand>TheRuux</g:brand>
      <g:condition>new</g:condition>
    </item>`;
  });
  writeFileSync(
    resolve(dist, 'google-merchant.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>TheRuux</title>
    <link>${SITE}</link>
    <description>TheRuux products</description>
${merchantItems.join('\n')}
  </channel>
</rss>
`,
  );
}

const spaFallback = () => ({
  name: 'spa-fallback',
  apply: 'build',
  async closeBundle() {
    const dist = resolve('dist');
    copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'));
    // Cloudflare rejects "/* /index.html 200" as an infinite loop. SPA fallback is wrangler not_found_handling.
    rmSync(resolve(dist, '_redirects'), { force: true });
    await writeSitemap(dist);
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Local dev uploads (no Cloudinary) are served by the API.
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
