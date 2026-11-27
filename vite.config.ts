import path from 'node:path'
import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

function legacySwCleanupPlugin(): Plugin {
  return {
    name: 'legacy-sw-cleanup',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'legacy-sw-cleanup.js',
        source: [
          "self.addEventListener('activate', (event) => {",
          '  event.waitUntil(',
          '    caches.keys().then((cacheNames) =>',
          '      Promise.all(',
          '        cacheNames',
          "          .filter((name) => name.startsWith('cashbook-v'))",
          '          .map((name) => caches.delete(name))',
          '      )',
          '    )',
          '  );',
          '});',
        ].join('\n'),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isWeb = mode === 'web'

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isWeb
        ? [
            legacySwCleanupPlugin(),
            VitePWA({
              registerType: 'prompt',
              strategies: 'generateSW',
              injectRegister: false,
              workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
                cleanupOutdatedCaches: true,
                navigateFallback: 'index.html',
                navigateFallbackDenylist: [/^\/api/],
                importScripts: ['/legacy-sw-cleanup.js'],
              },
              manifest: {
                lang: 'en',
                name: 'CashBook - Personal Finance',
                short_name: 'CashBook',
                description: 'Personal Finance & Bank Transaction Manager',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                orientation: 'portrait-primary',
                background_color: '#f1f5f9',
                theme_color: '#f1f5f9',
                id: 'cashbook-app-v3',
                categories: ['finance', 'productivity', 'utilities'],
                icons: [
                  {
                    src: '/pwa-192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any',
                  },
                  {
                    src: '/pwa-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any',
                  },
                  {
                    src: '/pwa-maskable-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'maskable',
                  },
                  {
                    src: '/pwa-icon.svg',
                    sizes: '192x192 512x512',
                    type: 'image/svg+xml',
                    purpose: 'any',
                  },
                  {
                    src: '/logo.svg',
                    sizes: '48x48 72x72 96x96 128x128',
                    type: 'image/svg+xml',
                    purpose: 'any',
                  },
                ],
                shortcuts: [
                  {
                    name: 'Transactions',
                    short_name: 'Transactions',
                    description: 'View all transactions',
                    url: '/#/transactions',
                    icons: [{ src: '/logo.svg', sizes: '96x96', type: 'image/svg+xml' }],
                  },
                  {
                    name: 'Accounts',
                    short_name: 'Accounts',
                    description: 'Manage bank accounts',
                    url: '/#/accounts',
                    icons: [{ src: '/logo.svg', sizes: '96x96', type: 'image/svg+xml' }],
                  },
                ],
              },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: isWeb ? '/' : './',
    build: {
      outDir: isWeb ? 'dist-web' : '../electron/ui',
      emptyOutDir: true,
      sourcemap: false,
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: true,
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
