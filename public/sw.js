const VERSION = 'comeback-v9'
const CACHE = `comeback-${VERSION}`

// ── Lifecycle ──────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(['/icon.png']))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// ── Fetch: cache-first for immutable static assets ────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (url.origin !== self.location.origin) return
  if (!url.pathname.startsWith('/_next/static/')) return

  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit
      return fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()))
        return res
      })
    })
  )
})

// ── Server-sent Web Push ───────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { return }

  event.waitUntil(
    self.registration.showNotification(data.title || 'COMEBACK', {
      body:               data.body || '',
      icon:               '/icon.png',
      badge:              '/icon.png',
      tag:                data.tag || 'comeback',
      requireInteraction: true,
      vibrate:            [300, 100, 300, 100, 300],
      data:               data.data || { url: '/' },
    })
  )
})

// ── Notification click ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const match = list.find(c => c.url.includes(self.location.origin))
      if (match) { match.focus(); match.navigate(url); return }
      return clients.openWindow(url)
    })
  )
})
