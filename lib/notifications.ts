export interface ScheduledNotification {
  id: string
  showAt: number  // timestamp ms
  title: string
  body: string
  url: string
  fired?: boolean
}

function todayAt(hour: number, minute = 0): number {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.getTime()
}

export function buildDaySchedule(params: {
  streak: number
  waterMl: number
  waterTarget: number
  workoutDone: boolean
  isWorkoutDay: boolean
  workoutLabel: string
  mealCount: number
  totalCal: number
  calTarget: number
}): ScheduledNotification[] {
  const {
    streak,
    waterMl,
    waterTarget,
    workoutDone,
    isWorkoutDay,
    workoutLabel,
    mealCount,
    totalCal,
    calTarget,
  } = params

  const now = Date.now()
  const schedule: ScheduledNotification[] = []

  const add = (
    id: string,
    showAt: number,
    title: string,
    body: string,
    url: string
  ) => {
    if (showAt > now) {
      schedule.push({ id, showAt, title, body, url, fired: false })
    }
  }

  // 5:55 AM — pre-workout (workout day, not done)
  if (isWorkoutDay && !workoutDone) {
    add(
      'preworkout',
      todayAt(5, 55),
      `${workoutLabel.toUpperCase()} WORKOUT IN 5 MINUTES`,
      'Get your gear on. Bar is waiting. No excuses.',
      '/workout'
    )
  }

  // 6:00 AM — wake up call (workout day, not done)
  if (isWorkoutDay && !workoutDone) {
    add(
      'wakeup',
      todayAt(6, 0),
      `GET UP. IT'S ${workoutLabel.toUpperCase()} DAY.`,
      'The bar is loaded. The clock is running. MOVE.',
      '/workout'
    )
  }

  // 9 AM — rest day reminder
  if (!isWorkoutDay) {
    add(
      'restday',
      todayAt(9, 0),
      'REST DAY.',
      'Hit protein and water. Muscle grows when you rest.',
      '/'
    )
  }

  // Hourly water reminders at 8, 10, 12, 14, 16, 18 — if water not met
  if (waterMl < waterTarget) {
    const waterHours = [8, 10, 12, 14, 16, 18]
    waterHours.forEach(hr => {
      const soFar = (waterMl / 1000).toFixed(1)
      const left = ((waterTarget - waterMl) / 1000).toFixed(1)
      add(
        `water_${hr}`,
        todayAt(hr, 0),
        'DRINK WATER. NOW.',
        `${soFar}L so far. ${left}L left. Dehydration kills gains.`,
        '/hydration'
      )
    })
  }

  // 12 PM — zero meals logged
  if (mealCount === 0) {
    add(
      'zeromeal',
      todayAt(12, 0),
      'ZERO MEALS LOGGED.',
      'Feed the muscle. You\'re running on empty.',
      '/nutrition'
    )
  }

  // 3 PM — calorie check if <40% of target
  if (totalCal < calTarget * 0.4) {
    add(
      'cal_check',
      todayAt(15, 0),
      'CALORIE DEFICIT ALERT.',
      `Only ${totalCal} kcal logged. You need fuel to grow.`,
      '/nutrition'
    )
  }

  // 8 PM — streak warning if streak > 0 and workout not done
  if (streak > 0 && !workoutDone && isWorkoutDay) {
    add(
      'streak_warn',
      todayAt(20, 0),
      `${streak}-DAY STREAK AT RISK.`,
      '4 hours left. Don\'t let it die tonight.',
      '/workout'
    )
  }

  // 10:30 PM — critical streak alert if streak > 2 and workout not done
  if (streak > 2 && !workoutDone && isWorkoutDay) {
    add(
      'streak_critical',
      todayAt(22, 30),
      `${streak} DAYS. 90 MINUTES. CHOOSE.`,
      'Your streak ends at midnight. Log it or lose it.',
      '/workout'
    )
  }

  // 10 PM — bedtime recovery reminder
  add(
    'bedtime',
    todayAt(22, 0),
    'SLEEP IS GAINS.',
    'GH peaks at midnight. 8 hours = free gains. Go.',
    '/'
  )

  return schedule
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function sendScheduleToSW(schedule: ScheduledNotification[]): void {
  if (typeof navigator === 'undefined') return
  if (!navigator.serviceWorker?.controller) return
  navigator.serviceWorker.controller.postMessage({
    type: 'SCHEDULE_NOTIFICATIONS',
    notifications: schedule,
  })
}

export function pingServiceWorker(): void {
  if (typeof navigator === 'undefined') return
  if (!navigator.serviceWorker?.controller) return
  navigator.serviceWorker.controller.postMessage({ type: 'PING' })
}
