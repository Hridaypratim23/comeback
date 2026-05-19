'use client'

import { useEffect } from 'react'
import { useStore, TARGETS } from '@/lib/store'
import {
  buildDaySchedule,
  requestNotificationPermission,
  sendScheduleToSW,
  pingServiceWorker,
} from '@/lib/notifications'
import { getWorkoutById, REST_WORKOUT } from '@/constants/workouts'

export default function AppInit() {
  const { stats, dayLogs } = useStore()

  function scheduleForToday() {
    const today    = new Date().toISOString().split('T')[0]
    const dayLog   = dayLogs[today]
    const selectedId = dayLog?.selectedWorkoutId
    const workout  = selectedId ? getWorkoutById(selectedId) : REST_WORKOUT
    const totalCal = dayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0

    const schedule = buildDaySchedule({
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

    sendScheduleToSW(schedule)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').then(reg => {
      // Force new SW to activate immediately when waiting
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing
        sw?.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            sw.postMessage({ type: 'SKIP_WAITING' })
          }
        })
      })
    }).catch(() => {})

    const ping = () => pingServiceWorker()
    window.addEventListener('focus', ping)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') ping()
    })

    const timer = setTimeout(async () => {
      const granted = await requestNotificationPermission()
      if (granted) scheduleForToday()
    }, 2000)

    return () => {
      window.removeEventListener('focus', ping)
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    scheduleForToday()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.streak, dayLogs])

  return null
}
