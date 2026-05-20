import { getQuoteByIndex } from '../constants/quotes'

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

/** Returns a quote that rotates by day+hour so it varies but is consistent per slot. */
function quoteForSlot(hour: number): string {
  const d = new Date()
  return getQuoteByIndex(d.getDate() * 24 + hour)
}

function withQuote(body: string, hour: number): string {
  return `${body}\n\n"${quoteForSlot(hour)}"`
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

  const now      = Date.now()
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

  // ── 5:30 AM — wake-up call ─────────────────────────────────────────────
  if (isWorkoutDay && !workoutDone) {
    add(
      'preworkout',
      todayAt(5, 30),
      `RISE. ${workoutLabel.toUpperCase()}. NOW.`,
      withQuote(
        'Up. Gym in 30 minutes. Get your gear on.',
        5
      ),
      '/workout'
    )
  }

  // ── 5:50 AM — leave now ────────────────────────────────────────────────
  if (isWorkoutDay && !workoutDone) {
    add(
      'wakeup',
      todayAt(5, 50),
      `LEAVE NOW. ${workoutLabel.toUpperCase()}.`,
      withQuote(
        'Gym opens in 10 minutes. Every rep you do now, your competition is sleeping through.',
        5
      ),
      '/workout'
    )
  }

  // ── 9:00 AM — rest day ────────────────────────────────────────────────
  if (!isWorkoutDay) {
    add(
      'restday',
      todayAt(9, 0),
      'REST DAY. RECOVER HARD.',
      withQuote(
        'Hit protein. Hit water. Muscle grows when you rest.',
        9
      ),
      '/'
    )
  }

  // ── 11:00 AM — mindset check (every day) ──────────────────────────────
  add(
    'mindset_11',
    todayAt(11, 0),
    'STAY LOCKED IN.',
    withQuote(
      'No distractions. No excuses. Stay in the fight.',
      11
    ),
    '/'
  )

  // ── Hourly water reminders ─────────────────────────────────────────────
  if (waterMl < waterTarget) {
    const waterHours = [8, 10, 12, 14, 16, 18]
    waterHours.forEach(hr => {
      const soFar = (waterMl / 1000).toFixed(1)
      const left  = ((waterTarget - waterMl) / 1000).toFixed(1)
      add(
        `water_${hr}`,
        todayAt(hr, 0),
        "YOU'RE DEHYDRATING. DRINK.",
        withQuote(
          `${soFar}L so far. ${left}L still owed. Dehydration kills gains.`,
          hr
        ),
        '/hydration'
      )
    })
  }

  // ── 12:00 PM — zero meals ─────────────────────────────────────────────
  if (mealCount === 0) {
    add(
      'zeromeal',
      todayAt(12, 0),
      'ZERO MEALS LOGGED.',
      withQuote(
        "Feed the machine. You're running on empty. A soldier doesn't fight hungry.",
        12
      ),
      '/nutrition'
    )
  }

  // ── 3:00 PM — calorie deficit check ───────────────────────────────────
  if (totalCal < calTarget * 0.4) {
    add(
      'cal_check',
      todayAt(15, 0),
      'CALORIE DEFICIT ALERT.',
      withQuote(
        `Only ${totalCal} kcal logged. You need fuel to grow. Eat.`,
        15
      ),
      '/nutrition'
    )
  }

  // ── 3:00 PM — afternoon grind reminder (every day) ────────────────────
  add(
    'grind_15',
    todayAt(15, 5),
    'AFTERNOON GRIND.',
    withQuote(
      'Most people quit in the afternoon. Not you.',
      15
    ),
    '/'
  )

  // ── 8:00 PM — streak warning ──────────────────────────────────────────
  if (streak > 0 && !workoutDone && isWorkoutDay) {
    add(
      'streak_warn',
      todayAt(20, 0),
      `${streak}-DAY STREAK AT RISK.`,
      withQuote(
        '4 hours left. The streak dies at midnight. Move.',
        20
      ),
      '/workout'
    )
  }

  // ── 10:30 PM — critical streak ────────────────────────────────────────
  if (streak > 2 && !workoutDone && isWorkoutDay) {
    add(
      'streak_critical',
      todayAt(22, 30),
      `⚠️ ${streak} DAYS. 90 MIN. OR IT'S GONE.`,
      withQuote(
        'Your streak ends at midnight. Every minute you wait makes it harder.',
        22
      ),
      '/workout'
    )
  }

  // ── Sedentary alerts — every 45 min, 10 AM to 6 PM ───────────────────
  const sedentaryMessages = [
    { title: 'GET UP.', body: "45 minutes in the chair. Stand up. Walk to the water cooler. NOW." },
    { title: 'MOVE YOUR BODY.', body: "Sitting is the new smoking. 2 minutes on your feet. Go." },
    { title: 'SEDENTARY ALERT.', body: "Your back is stiffening. Your hips are tightening. Get up." },
    { title: 'STAND UP.', body: "Walk to the window. Stretch your neck. Reset. 2 minutes." },
    { title: 'CIRCULATION CHECK.', body: "Blood pools when you sit. Get up and walk the floor. Do it." },
    { title: 'OFF THE CHAIR. NOW.', body: "10 squats at your desk. Stretch your hip flexors. Move." },
    { title: 'YOUR BODY IS RUSTING.', body: "45 minutes of stillness. Undo it. Walk. Breathe. Reset." },
    { title: 'MOVE. NO EXCUSES.', body: "Stand. Walk to the bathroom and back. That's all. Just move." },
    { title: 'BREAK THE SITTING.', body: "Office hours are for the mind. Your body still needs blood flow. Up." },
    { title: 'LAST SEDENTARY ALERT.', body: "End of office hours. You made it. Get home and move properly." },
  ]
  const sedentarySlots: Array<[number, number]> = [
    [10, 45], [11, 30], [12, 15], [13, 0],
    [13, 45], [14, 30], [15, 15], [16, 0],
    [16, 45], [17, 30],
  ]
  sedentarySlots.forEach(([hr, min], i) => {
    const msg = sedentaryMessages[i % sedentaryMessages.length]
    add(
      `sedentary_${hr}_${min}`,
      todayAt(hr, min),
      msg.title,
      withQuote(msg.body, hr),
      '/'
    )
  })

  // ── 9:00 AM — Sunday progress photo reminder ──────────────────────────
  if (new Date().getDay() === 0) {
    add(
      'photo_reminder',
      todayAt(9, 0),
      'PROGRESS PHOTO TIME',
      'Same pose. Same light. Same angle. 13 weeks builds a body — document it.\n\n"THE BODY ACHIEVES WHAT THE MIND BELIEVES."',
      '/'
    )
  }

  // ── 8:30 PM — wind down ───────────────────────────────────────────────
  add(
    'winddown_830',
    todayAt(20, 30),
    'WIND DOWN. PHONE DOWN IN 30.',
    "You're up at 5:30. Every minute on this screen costs you recovery. Start winding down — now.",
    '/'
  )

  // ── 9:00 PM — phone away ──────────────────────────────────────────────
  add(
    'phone_down_900',
    todayAt(21, 0),
    'PHONE DOWN. GYM IN 9 HOURS.',
    "Put it face down. Right now. Tomorrow's session is built on tonight's sleep. Screen off.",
    '/'
  )

  // ── 9:30 PM — pre-gym motivation ──────────────────────────────────────
  add(
    'prep_gym_930',
    todayAt(21, 30),
    'TOMORROW YOU LIFT.',
    withQuote(
      "Bar is loaded at 6AM. Lights off by 10. Your future self is already in the gym — make sure you show up.",
      21
    ),
    '/workout'
  )

  // ── 10:00 PM — bedtime ────────────────────────────────────────────────
  add(
    'bedtime',
    todayAt(22, 0),
    'SLEEP IS GAINS. PUT IT DOWN.',
    'GH peaks at midnight. 8 hours = free gains. Screen off. Eyes shut. You know the drill.',
    '/'
  )

  // ── 10:30 PM — lights out ─────────────────────────────────────────────
  add(
    'sleep_now_1030',
    todayAt(22, 30),
    'LIGHTS OUT. NOW.',
    "Sleep is the most anabolic thing you can do right now. Cortisol spikes when you skip it. Testosterone drops. Close the screen.",
    '/'
  )

  // ── 11:00 PM — final push ─────────────────────────────────────────────
  add(
    'final_1100',
    todayAt(23, 0),
    "IT'S 11PM. FLOOR IT.",
    withQuote(
      "5:30AM alarm in 6.5 hours. You signed up for this. Put the phone down and own the next 6 hours of recovery.",
      23
    ),
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
