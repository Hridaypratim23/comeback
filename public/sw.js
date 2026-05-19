const VERSION = 'comeback-v3'
const DB_NAME = 'comeback-sw'
const STORE   = 'notifications'

// ── IndexedDB helpers ──────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess  = e => resolve(e.target.result)
    req.onerror    = e => reject(e.target.error)
  })
}

async function dbUpsertAll(items) {
  const db = await openDB()
  return new Promise(resolve => {
    const tx = db.transaction(STORE, 'readwrite')
    const s  = tx.objectStore(STORE)
    // Remove fired entries first, then upsert new ones
    const delReq = s.openCursor()
    const toDelete = []
    delReq.onsuccess = e => {
      const cursor = e.target.result
      if (cursor) {
        if (cursor.value.fired) toDelete.push(cursor.value.id)
        cursor.continue()
      } else {
        toDelete.forEach(id => s.delete(id))
        items.forEach(item => s.put(item))
        tx.oncomplete = resolve
      }
    }
  })
}

async function dbLoadAll() {
  const db = await openDB()
  return new Promise(resolve => {
    const tx  = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = e => resolve(e.target.result || [])
    req.onerror   = () => resolve([])
  })
}

async function dbMarkFired(id) {
  const db = await openDB()
  return new Promise(resolve => {
    const tx  = db.transaction(STORE, 'readwrite')
    const s   = tx.objectStore(STORE)
    const req = s.get(id)
    req.onsuccess = e => {
      const item = e.target.result
      if (item) { item.fired = true; s.put(item) }
      resolve()
    }
    req.onerror = resolve
  })
}

// ── Core check ────────────────────────────────────────────────────────────

let checking = false

async function checkDue() {
  if (checking) return
  checking = true
  try {
    const now  = Date.now()
    const list = await dbLoadAll()
    for (const n of list) {
      if (!n.fired && n.showAt <= now) {
        await dbMarkFired(n.id)
        self.registration.showNotification(n.title, {
          body:              n.body,
          icon:              '/icon.png',
          badge:             '/icon.png',
          tag:               n.id,
          requireInteraction: true,
          vibrate:           [300, 100, 300, 100, 300],
          data:              { url: n.url || '/' },
        })
      }
    }
  } finally {
    checking = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────

self.addEventListener('install', () => self.skipWaiting())

let timerRef = null

self.addEventListener('activate', e => {
  e.waitUntil(
    clients.claim().then(async () => {
      // Fire any notifications that came due while SW was dead
      await checkDue()
      if (timerRef) clearInterval(timerRef)
      timerRef = setInterval(checkDue, 30_000) // every 30s while alive
    })
  )
})

// ── Messages from the page ─────────────────────────────────────────────────

self.addEventListener('message', async event => {
  const { type } = event.data || {}

  if (type === 'SCHEDULE_NOTIFICATIONS') {
    const notifications = event.data.notifications || []
    await dbUpsertAll(notifications)
    checkDue()
    if (timerRef) clearInterval(timerRef)
    timerRef = setInterval(checkDue, 30_000)
  }

  if (type === 'PING') {
    await checkDue()
  }
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
