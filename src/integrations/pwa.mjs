import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { generateSW } from 'workbox-build'

const manifest = {
  name: 'Ben ik financieel onafhankelijk?',
  short_name: 'BenIkFO',
  description:
    'Onafhankelijke uitleg en gratis rekentools over financiële onafhankelijkheid, pensioen en vermogensopbouw.',
  start_url: '/',
  display: 'standalone',
  background_color: '#E4E1DC',
  theme_color: '#29392E',
  orientation: 'any',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
}

/**
 * Eigen, minimale PWA-integratie i.p.v. @vite-pwa/astro (nog geen Astro
 * 7-support, peer dep stopt bij ^5.0.0) of vite-plugin-pwa rechtstreeks via
 * vite.plugins (geprobeerd en verworpen: de closeBundle-hook waar dat pakket
 * op leunt vuurt op Astro's tussenliggende "static entrypoints"-Vite-build,
 * niet ná de volledige site-build — sw.js werd daardoor nooit geschreven,
 * geverifieerd tijdens deze sessie).
 *
 * Genereert manifest + service worker pas op astro:build:done, als alle
 * pagina's al in dist/ staan, met dezelfde workbox-build-library die
 * vite-plugin-pwa/@vite-pwa/astro er zelf ook onder de motorkap voor gebruikt.
 */
export default function pwaIntegration() {
  return {
    name: 'benikfo-pwa',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir)

        await writeFile(new URL('manifest.webmanifest', dir), JSON.stringify(manifest), 'utf-8')

        const { count, size, warnings } = await generateSW({
          swDest: fileURLToPath(new URL('sw.js', dir)),
          globDirectory: outDir,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
          globIgnores: ['sw.js', 'workbox-*.js'],
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              // Google Fonts cachen voor offline gebruik.
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        })

        warnings.forEach((w) => logger.warn(w))
        logger.info(`PWA: sw.js gegenereerd, ${count} bestanden gecached (${Math.round(size / 1024)} kB)`)
      },
    },
  }
}
