'use client'

import { useEffect } from 'react'
import { useStore, TARGETS } from '@/lib/store'
import {
  buildDaySchedule,
  requestNotificationPermission,
  sendScheduleToSW,
  pingServiceWorker,
} from '@/lib/notifications'
import { getTodayWorkout } from '@/constants/workouts'

export default function AppInit() {
  const { stats, dayLogs } = useStore()

  function scheduleForToday() {
    const today = new Date().toISOString().split('T')[0]
    const dayLog = dayLogs[today]
    const workout = getTodayWorkout()
    const isWorkoutDay = workout.exercises.length > 0
    const totalCal = dayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0

    const schedule = buildDaySchedule({
      streak: stats.streak,
      waterMl: dayLog?.waterMl ?? 0,
      waterTarget: TARGETS.waterMl,
      workoutDone: dayLog?.workoutDone ?? false,
      isWorkoutDay,
      workoutLabel: workout.label,
      mealCount: dayLog?.meals.length ?? 0,
      totalCal,
      calTarget: TARGETS.calories,
    })

    sendScheduleToSW(schedule)
  }

  // On mount: register SW, bind focus ping, request permissions after 3s
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(() => {})

    window.addEventListener('focus', pingServiceWorker)

    const timer = setTimeout(async () => {
      const granted = await requestNotificationPermission()
      if (granted) scheduleForToday()
    }, 3000)

    return () => {
      window.removeEventListener('focus', pingServiceWorker)
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-schedule when streak or day logs change (permission already granted)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    scheduleForToday()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.streak, dayLogs])

  return null
}
