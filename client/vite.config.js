import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const spaFallback = () => ({
  name: 'spa-fallback',
  apply: 'build',
  closeBundle() {
    const index = resolve('dist/index.html');
    copyFileSync(index, resolve('dist/404.html'));
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
