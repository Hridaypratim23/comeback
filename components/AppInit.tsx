'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useStore, TARGETS } from '@/lib/store'
import { buildDaySchedule, requestNotificationPermission } from '@/lib/notifications'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  const buf = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
  return buf
}

async function subscribeToPush(schedule: ReturnType<typeof buildDaySchedule>) {
  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), schedule }),
    })
  } catch {
    // Push subscription may not be supported (e.g. non-PWA Safari)
  }
}

export default function AppInit() {
  const { stats, dayLogs, customMeals, mergeRemoteState, syncToSupabase } = useStore()
  const pathname = usePathname()
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildSchedule() {
    const now   = new Date()
    const today = now.toISOString().split('T')[0]
    const dayLog = dayLogs[today]
    const totalCal = dayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0

    // Count workouts completed Mon–Sun of the current week
    const dow = now.getDay()
    const diffToMon = dow === 0 ? -6 : 1 - dow
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + diffToMon)
    weekStart.setHours(0, 0, 0, 0)
    const weekWorkoutsCompleted = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d.toISOString().split('T')[0]
    }).filter(dk => dk <= today && dayLogs[dk]?.workoutDone).length

    return buildDaySchedule({
      streak:               stats.streak,
      waterMl:              dayLog?.waterMl ?? 0,
      waterTarget:          TARGETS.waterMl,
      workoutDone:          dayLog?.workoutDone ?? false,
      weekWorkoutsCompleted,
      mealCount:            dayLog?.meals.length ?? 0,
      totalCal,
      calTarget:            TARGETS.calories,
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Pull remote state and merge with local, then push merged result back
    fetch('/api/state')
      .then(r => r.json())
      .then(({ data }) => {
        if (data) mergeRemoteState(data)
        // Push current local state up so it's always backed up
        useStore.getState().syncToSupabase()
      })
      .catch(() => {})

    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(() => {})

    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloading) { reloading = true; window.location.reload() }
    })

    const timer = setTimeout(async () => {
      const granted = await requestNotificationPermission()
      if (!granted) return
      await subscribeToPush(buildSchedule())
    }, 2000)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll to top instantly on page navigation (override smooth scroll-behavior).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  // Re-save schedule to server whenever state changes.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    subscribeToPush(buildSchedule())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.streak, dayLogs])

  // Debounced cloud backup on every state change (3s after last write)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => { syncToSupabase() }, 3000)
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayLogs, stats, customMeals])

  return null
}
