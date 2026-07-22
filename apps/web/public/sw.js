const CACHE = 'cf-v1'
const STATIC_EXTS = /\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp)(\?.*)?$/

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE).then((c) => c.add('/')).catch(() => {})
    )
    self.skipWaiting()
})

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        )
    )
    self.clients.claim()
})

self.addEventListener('fetch', (e) => {
    const { request } = e
    const url = new URL(request.url)

    // Never intercept cross-origin requests, API calls, analytics, or Stripe
    if (
        url.origin !== self.location.origin ||
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/session') ||
        url.pathname.startsWith('/forge')
    ) {
        return
    }

    // Static assets: cache-first
    if (STATIC_EXTS.test(url.pathname)) {
        e.respondWith(
            caches.match(request).then(
                (cached) => cached || fetch(request).then((res) => {
                    if (res.ok) {
                        const clone = res.clone()
                        caches.open(CACHE).then((c) => c.put(request, clone))
                    }
                    return res
                })
            )
        )
        return
    }

    // Navigation requests: network-first, fall back to cache
    if (request.mode === 'navigate') {
        e.respondWith(
            fetch(request).catch(() => caches.match(request).then((c) => c || caches.match('/')))
        )
        return
    }

    // Everything else: network-first
    e.respondWith(
        fetch(request).catch(() => caches.match(request))
    )
})
