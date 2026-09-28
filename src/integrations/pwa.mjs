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
          // Geen HTML in de precache (28 september 2026). Een precachte pagina gaat
          // vóór het netwerk, dus een terugkerende bezoeker zag na elke deploy bij het
          // eerste bezoek de vorige versie, met de vorige cijfers. Pagina's lopen nu
          // via de NetworkFirst-regel hieronder; alleen zonder verbinding komt de
          // laatst bezochte versie uit de cache. De bestanden in /_astro/ hebben een
          // hash in hun naam en mogen wel vooraf gecachet worden.
          globPatterns: ['**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
          globIgnores: ['sw.js', 'workbox-*.js'],
          skipWaiting: true,
          clientsClaim: true,
          // Ruimt de precache van de vorige sw.js op, inclusief de oude HTML.
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'paginas',
                // Bij een trage verbinding na 4 seconden de bewaarde versie tonen.
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 50 },
                cacheableResponse: { statuses: [200] },
              },
            },
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
