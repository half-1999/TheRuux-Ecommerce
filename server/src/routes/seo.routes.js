import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { env } from '../config/env.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { Variant } from '../models/Variant.js';
import { deliveryUrl } from '../utils/serializers.js';

const router = Router();

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

const escapeXml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

router.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /checkout
Disallow: /auth
Disallow: /order-confirmation

Sitemap: ${env.siteUrl}/sitemap.xml
`);
});

router.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const [products, categories, collections] = await Promise.all([
      Product.find({ status: 'active' }).select('slug updatedAt').lean(),
      Category.find({ isActive: true }).select('slug').lean(),
      Collection.find({ isActive: true }).select('slug').lean(),
    ]);
    const urls = [
      ...STATIC_PATHS.map((path) => `${env.siteUrl}${path}`),
      ...categories.map((item) => `${env.siteUrl}/shop/${item.slug}`),
      ...collections.map((item) => `${env.siteUrl}/collections/${item.slug}`),
      ...products.map((item) => `${env.siteUrl}/product/${item.slug}`),
    ];
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${escapeXml(loc)}</loc></url>`).join('\n')}
</urlset>
`;
    res.type('application/xml').send(body);
  }),
);

router.get(
  '/google-merchant.xml',
  asyncHandler(async (_req, res) => {
    const products = await Product.find({ status: 'active' })
      .select('name title slug description basePrice currency images')
      .lean();
    const variants = await Variant.find({
      productId: { $in: products.map((product) => product._id) },
      isActive: true,
    })
      .select('productId stockQty')
      .lean();
    const stock = new Map();
    for (const variant of variants) {
      const id = variant.productId.toString();
      stock.set(id, (stock.get(id) || 0) + (Number(variant.stockQty) || 0));
    }
    const items = products.map((product) => {
      const image = [...(product.images || [])].sort((a, b) => a.sortOrder - b.sortOrder)[0];
      const description = (product.description || `${product.name} ${product.title}`).replace(/\s+/g, ' ').slice(0, 500);
      const available = (stock.get(product._id.toString()) || 0) > 0 ? 'in_stock' : 'out_of_stock';
      return `    <item>
      <g:id>${escapeXml(product.slug)}</g:id>
      <g:title>${escapeXml(`${product.name} ${product.title}`)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(`${env.siteUrl}/product/${product.slug}`)}</g:link>
      <g:image_link>${escapeXml(deliveryUrl(image?.url || ''))}</g:image_link>
      <g:availability>${available}</g:availability>
      <g:price>${Number(product.basePrice).toFixed(2)} ${product.currency || 'INR'}</g:price>
      <g:brand>TheRuux</g:brand>
      <g:condition>new</g:condition>
    </item>`;
    });
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>TheRuux</title>
    <link>${env.siteUrl}</link>
    <description>TheRuux products</description>
${items.join('\n')}
  </channel>
</rss>
`);
  }),
);

export default router;
