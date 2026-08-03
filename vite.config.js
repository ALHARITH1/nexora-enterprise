import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'sitemap.xml', 'manifest.json'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Exclude Supabase API from caching
        navigateFallbackDenylist: [/^\/supabase\//, /^\/auth\/v1\//, /^\/rest\/v1\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => {
              return url.hostname.includes('supabase') || url.pathname.includes('/auth/v1') || url.pathname.includes('/rest/v1');
            },
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  publicDir: 'public', // Vite default, but we don't have a public directory. We'll use plugins to copy assets or we just include them in root.
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js']
  }
});
