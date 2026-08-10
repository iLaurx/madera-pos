import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const woodTextureCache = {
  handler: 'CacheFirst',
  options: {
    cacheName: 'wood-textures',
    expiration: {
      maxEntries: 12,
      maxAgeSeconds: 60 * 60 * 24 * 365,
    },
  },
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: [
        'favicon.ico',
        'logo.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'wood-pattern.png',
        'wood-pattern-dark.png',
        'wood-pattern-horizontal.png',
        'wood-pattern-dark-horizontal.png',
      ],
      manifest: {
        name: 'Madera Boutique',
        short_name: 'Madera',
        description: 'Sistema de inventario y punto de venta para Madera Boutique',
        theme_color: '#FFFFFC',
        background_color: '#FFFFFC',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        lang: 'es',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /\/wood-pattern\.png$/i,
            ...woodTextureCache,
          },
          {
            urlPattern: /\/wood-pattern-dark\.png$/i,
            ...woodTextureCache,
          },
          {
            urlPattern: /\/wood-pattern-horizontal\.png$/i,
            ...woodTextureCache,
          },
          {
            urlPattern: /\/wood-pattern-dark-horizontal\.png$/i,
            ...woodTextureCache,
          },
        ],
      },
    }),
  ],
})
