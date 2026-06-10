const VERSION = 'comeback-v11'

// ── Lifecycle: install and activate immediately, clear all old caches ──────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// ── Fetch: always network — no caching of any assets ─────────────────────
// (Next.js handles its own caching via content-hashed filenames)
self.addEventListener('fetch', () => { /* pass through to network */ })

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
