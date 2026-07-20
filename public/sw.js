/*
 * Kill-switch service worker.
 *
 * De vorige versie van deze site was een PWA (vite-plugin-pwa) met een service
 * worker die de oude single-page-app agressief cachete. Zonder ingrijpen blijven
 * terugkerende bezoekers die oude versie zien. Deze vervangende service worker
 * ruimt alle caches op, meldt zichzelf af en herlaadt de openstaande pagina's,
 * zodat iedereen de nieuwe (Astro) site krijgt.
 */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach((client) => client.navigate(client.url))
    })(),
  )
})
