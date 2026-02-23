const CACHE = "iglesia-v2"
const ARCHIVOS = [
  "/",
  "/index.html",
  "/logo.jpg",
  "/manifest.json"
]

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ARCHIVOS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return
  if (e.request.url.includes("/api/") || e.request.url.includes("render.com")) {
    e.respondWith(fetch(e.request).catch(() => new Response("offline", { status: 503 })))
    return
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        const clone = res.clone()
        caches.open(CACHE).then(cache => cache.put(e.request, clone))
        return res
      }).catch(() => caches.match("/"))
    })
  )
})
