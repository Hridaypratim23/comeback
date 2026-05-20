'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useStore, TARGETS } from '@/lib/store'
import { buildDaySchedule, requestNotificationPermission } from '@/lib/notifications'
import { getWorkoutById, REST_WORKOUT } from '@/constants/workouts'

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
  const { stats, dayLogs } = useStore()
  const pathname = usePathname()

  function buildSchedule() {
    const today   = new Date().toISOString().split('T')[0]
    const dayLog  = dayLogs[today]
    const workout = dayLog?.selectedWorkoutId ? getWorkoutById(dayLog.selectedWorkoutId) : REST_WORKOUT
    const totalCal = dayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0

    return buildDaySchedule({
      streak:       stats.streak,
      waterMl:      dayLog?.waterMl ?? 0,
      waterTarget:  TARGETS.waterMl,
      workoutDone:  dayLog?.workoutDone ?? false,
      isWorkoutDay: workout.exercises.length > 0,
      workoutLabel: workout.label,
      mealCount:    dayLog?.meals.length ?? 0,
      totalCal,
      calTarget:    TARGETS.calories,
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
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

  return null
}
