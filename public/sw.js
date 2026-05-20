const VERSION = 'comeback-v5'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

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
