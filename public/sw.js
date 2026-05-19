const VERSION = 'comeback-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

let notifications = []
let timerRef = null

self.addEventListener('message', event => {
  const { type } = event.data || {}
  if (type === 'SCHEDULE_NOTIFICATIONS') {
    notifications = event.data.notifications || []
    if (timerRef) clearInterval(timerRef)
    checkDue()
    timerRef = setInterval(checkDue, 60_000)
  }
  if (type === 'PING') checkDue()
})

function checkDue() {
  const now = Date.now()
  notifications.forEach(n => {
    if (!n.fired && n.showAt <= now) {
      n.fired = true
      self.registration.showNotification(n.title, {
        body: n.body,
        icon: '/icon.png',
        badge: '/icon.png',
        tag: n.id,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
        data: { url: n.url || '/' },
      })
    }
  })
}

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length) { list[0].focus(); list[0].navigate(url) }
      else clients.openWindow(url)
    })
  )
})
