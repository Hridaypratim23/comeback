const VERSION = 'comeback-v6'
const CACHE = `comeback-${VERSION}`

// ── Lifecycle ──────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  // Pre-cache icons so they're available offline
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(['/icon.png']))
      .then(() => self.skipWaiting())   // activate immediately, don't wait for old SW to die
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    // Delete every cache that isn't the current version
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()) // take control of all open tabs right now
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

// ── Real Web Push (server-sent) ────────────────────────────────────────────
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

// ── Local fallback pings from the page (when app is open) ─────────────────
let localNotifs = []
let timerRef = null

self.addEventListener('message', event => {
  const { type } = event.data || {}
  if (type === 'SCHEDULE_NOTIFICATIONS') {
    localNotifs = event.data.notifications || []
    if (timerRef) clearInterval(timerRef)
    checkLocalDue()
    timerRef = setInterval(checkLocalDue, 30_000)
  }
  if (type === 'PING') checkLocalDue()
})

function checkLocalDue() {
  const now = Date.now()
  localNotifs.forEach(n => {
    if (!n.fired && n.showAt <= now) {
      n.fired = true
      self.registration.showNotification(n.title, {
        body:               n.body,
        icon:               '/icon.png',
        badge:              '/icon.png',
        tag:                n.id,
        requireInteraction: true,
        vibrate:            [300, 100, 300, 100, 300],
        data:               { url: n.url || '/' },
      })
    }
  })
}
