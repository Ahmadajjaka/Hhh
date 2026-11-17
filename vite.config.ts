import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import {VitePWA, type ManifestOptions} from 'vite-plugin-pwa';

const pwaManifest: Partial<ManifestOptions> = {
  id: '/',
  name: 'نور القرآن - منصة إسلامية متكاملة',
  short_name: 'نور القرآن',
  description:
    'تطبيق إسلامي متكامل للمصحف الشريف بالرسم العثماني، التلاوات، مواقيت الصلاة والأذان، والأذكار والرقية الشرعية.',
  theme_color: '#041e15',
  background_color: '#031911',
  display: 'standalone',
  orientation: 'portrait-primary',
  dir: 'rtl',
  lang: 'ar',
  start_url: '/',
  scope: '/',
  categories: ['books', 'lifestyle', 'education'],
  prefer_related_applications: false,
  shortcuts: [
    {
      name: 'المصحف الشريف',
      short_name: 'المصحف',
      url: '/?screen=quran',
      icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
    },
    {
      name: 'الشيخ أبو نوار',
      short_name: 'أبو نوار',
      url: '/?screen=sheikh_ai',
      icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
    },
    {
      name: 'الأدعية والرقية',
      short_name: 'الأدعية',
      url: '/?screen=duas_ruqyah',
      icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
    },
    {
      name: 'مواقيت الصلاة',
      short_name: 'الصلاة',
      url: '/?screen=prayer',
      icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
    },
  ],
  icons: [
    {
      src: '/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/pwa-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

function devManifestFallback(isHmrDisabled: boolean): Plugin | null {
  if (!isHmrDisabled) return null;
  return {
    name: 'dev-manifest-fallback',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/manifest.webmanifest', (_req, res) => {
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
        res.end(JSON.stringify(pwaManifest, null, 2));
      });
    },
    transformIndexHtml(html) {
      return html.includes('rel="manifest"')
        ? html
        : html.replace('</head>', '    <link rel="manifest" href="/manifest.webmanifest" />\n  </head>');
    },
  };
}

export default defineConfig(() => {
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon.svg',
          'icon-maskable.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: pwaManifest,
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/\.netlify\//, /^\/\.well-known\//],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2,json,webmanifest}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/api\.alquran\.cloud\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'alquran-api-cache',
                expiration: {
                  maxEntries: 800,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/api\.quran\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'quran-com-api-cache',
                expiration: {
                  maxEntries: 400,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: !isHmrDisabled,
          type: 'module',
        },
      }),
      devManifestFallback(isHmrDisabled),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
