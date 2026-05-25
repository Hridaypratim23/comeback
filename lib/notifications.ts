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
  // Roll to tomorrow if this time slot has already passed today
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1)
  }
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
  weekWorkoutsCompleted: number
  mealCount: number
  totalCal: number
  calTarget: number
}): ScheduledNotification[] {
  const {
    streak,
    waterMl,
    waterTarget,
    workoutDone,
    weekWorkoutsCompleted,
    mealCount,
    totalCal,
    calTarget,
  } = params

  const needsWorkout = weekWorkoutsCompleted < 5 && !workoutDone
  const weekDone = weekWorkoutsCompleted >= 5
  const dow = new Date().getDay() // 0=Sun, 6=Sat
  const isWeekend = dow === 0 || dow === 6

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

  if (!isWeekend) {
    // ── WEEKDAY: 5:00 AM — early alarm ──────────────────────────────────
    add(
      'early_500',
      todayAt(5, 0),
      'ALARM. EYES OPEN.',
      withQuote(
        "It's 5AM. The gym is waiting. Everyone who skipped is still in bed — that's your edge. Get up.",
        5
      ),
      '/workout'
    )

    // ── WEEKDAY: 5:15 AM — final push before gym ────────────────────────
    add(
      'getup_515',
      todayAt(5, 15),
      "GET UP. DON'T MISS THIS.",
      withQuote(
        "You set this alarm for a reason. 15 minutes to get moving. Shoes on. Bag packed. Go.",
        5
      ),
      '/workout'
    )

    // ── WEEKDAY: 5:30 AM — wake-up call ─────────────────────────────────
    if (needsWorkout) {
      add(
        'preworkout',
        todayAt(5, 30),
        'RISE. GET TO THE GYM.',
        withQuote(
          `Up. ${weekWorkoutsCompleted}/5 workouts this week. Gym in 30 minutes — get your gear on.`,
          5
        ),
        '/workout'
      )
    }

    // ── WEEKDAY: 5:50 AM — leave now ────────────────────────────────────
    if (needsWorkout) {
      add(
        'wakeup',
        todayAt(5, 50),
        'LEAVE NOW.',
        withQuote(
          'Every rep you do now, your competition is sleeping through. 10 minutes — out the door.',
          5
        ),
        '/workout'
      )
    }

    // ── WEEKDAY: 9:00 AM — rest day (weekly target hit) ─────────────────
    if (weekDone && !workoutDone) {
      add(
        'restday',
        todayAt(9, 0),
        '5/5. EARNED REST DAY.',
        withQuote(
          'You hit your 5 workouts this week. Today is recovery — hit protein, hit water, let the muscle grow.',
          9
        ),
        '/'
      )
    }

    // ── WEEKDAY: 11:00 AM — mindset check ───────────────────────────────
    add(
      'mindset_11',
      todayAt(11, 0),
      'STAY LOCKED IN.',
      withQuote('No distractions. No excuses. Stay in the fight.', 11),
      '/'
    )

    // ── WEEKDAY: Water reminders (office hours) ──────────────────────────
    if (waterMl < waterTarget) {
      const waterHours = [8, 10, 12, 14, 16, 18];
      [8, 10, 12, 14, 16, 18].forEach(hr => {
        const soFar = (waterMl / 1000).toFixed(1)
        const left  = ((waterTarget - waterMl) / 1000).toFixed(1)
        add(
          `water_${hr}`,
          todayAt(hr, 0),
          "YOU'RE DEHYDRATING. DRINK.",
          withQuote(`${soFar}L so far. ${left}L still owed. Dehydration kills gains.`, hr),
          '/hydration'
        )
      })
      void waterHours
    }

    // ── WEEKDAY: 3:05 PM — afternoon grind ──────────────────────────────
    add(
      'grind_15',
      todayAt(15, 5),
      'AFTERNOON GRIND.',
      withQuote('Most people quit in the afternoon. Not you.', 15),
      '/'
    )

    // ── WEEKDAY: Sedentary office alerts every 45 min 10:45 AM – 5:30 PM
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
      add(`sedentary_${hr}_${min}`, todayAt(hr, min), msg.title, withQuote(msg.body, hr), '/')
    })

  } else {
    // ── WEEKEND: 7:30 AM — relaxed wake-up ──────────────────────────────
    add(
      'weekend_wakeup',
      todayAt(7, 30),
      'WEEKEND. GYM STILL COUNTS.',
      withQuote(
        "No office, no excuse. The only appointment that matters is the one with the barbell. Get up.",
        7
      ),
      '/workout'
    )

    // ── WEEKEND: 8:30 AM — gym push ─────────────────────────────────────
    if (needsWorkout) {
      add(
        'weekend_gym',
        todayAt(8, 30),
        `GYM. ${weekWorkoutsCompleted}/5 THIS WEEK.`,
        withQuote(
          "You've got the whole morning. No commute, no rush. Just you and the weights. Go.",
          8
        ),
        '/workout'
      )
    }

    // ── WEEKEND: 9:30 AM — rest day (weekly target hit) ─────────────────
    if (weekDone && !workoutDone) {
      add(
        'restday',
        todayAt(9, 30),
        '5/5. WEEKEND RECOVERY MODE.',
        withQuote(
          'Full week done. Today is about recovery — eat clean, stay hydrated, let the muscle grow.',
          9
        ),
        '/'
      )
    }

    // ── WEEKEND: 10:00 AM — mindset check ───────────────────────────────
    add(
      'mindset_11',
      todayAt(10, 0),
      'MAKE THE WEEKEND COUNT.',
      withQuote(
        'Two days without an office. Two days to eat right, train hard, and recover fully.',
        10
      ),
      '/'
    )

    // ── WEEKEND: Water reminders (later start, no office timing) ─────────
    if (waterMl < waterTarget) {
      [9, 11, 13, 15, 17, 19].forEach(hr => {
        const soFar = (waterMl / 1000).toFixed(1)
        const left  = ((waterTarget - waterMl) / 1000).toFixed(1)
        add(
          `water_${hr}`,
          todayAt(hr, 0),
          "DRINK. STAY SHARP.",
          withQuote(`${soFar}L so far. ${left}L to go. Weekend dehydration is real.`, hr),
          '/hydration'
        )
      })
    }

    // ── WEEKEND: 1:00 PM — meal prep / nutrition check ───────────────────
    add(
      'weekend_nutrition',
      todayAt(13, 0),
      'MEAL PREP WINDOW.',
      withQuote(
        "Use the free afternoon. Cook your proteins. Prep tomorrow's meals. The weekday version of you will thank you.",
        13
      ),
      '/nutrition'
    )
  }

  // ── 12:00 PM — zero meals (both days) ────────────────────────────────
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

  // ── 3:00 PM — calorie deficit check (both days) ───────────────────────
  if (totalCal < calTarget * 0.4) {
    add(
      'cal_check',
      todayAt(15, 0),
      'CALORIE DEFICIT ALERT.',
      withQuote(`Only ${totalCal} kcal logged. You need fuel to grow. Eat.`, 15),
      '/nutrition'
    )
  }

  // ── 8:00 PM — streak warning (both days) ─────────────────────────────
  if (streak > 0 && needsWorkout) {
    add(
      'streak_warn',
      todayAt(20, 0),
      `${streak}-DAY STREAK AT RISK.`,
      withQuote('4 hours left. The streak dies at midnight. Move.', 20),
      '/workout'
    )
  }

  // ── 10:30 PM — critical streak (both days) ───────────────────────────
  if (streak > 2 && needsWorkout) {
    add(
      'streak_critical',
      todayAt(22, 30),
      `⚠️ ${streak} DAYS. 90 MIN. OR IT'S GONE.`,
      withQuote('Your streak ends at midnight. Every minute you wait makes it harder.', 22),
      '/workout'
    )
  }

  // ── Sunday: progress photo + weekly summary ───────────────────────────
  if (dow === 0) {
    add(
      'photo_reminder',
      todayAt(9, 0),
      'PROGRESS PHOTO TIME',
      'Same pose. Same light. Same angle. 13 weeks builds a body — document it.\n\n"THE BODY ACHIEVES WHAT THE MIND BELIEVES."',
      '/'
    )
    const wrapup = weekWorkoutsCompleted >= 5
      ? 'Full week. 5/5. Machine standard — hold it next week.'
      : weekWorkoutsCompleted >= 3
      ? `${weekWorkoutsCompleted}/5 workouts. Decent. Not enough. Attack Monday harder.`
      : `${weekWorkoutsCompleted}/5 this week. Well below standard. Sunday reset — Monday attack.`
    add(
      'weekly_summary',
      todayAt(19, 30),
      `WEEK DONE — ${weekWorkoutsCompleted}/5 WORKOUTS`,
      withQuote(`Streak: ${streak} days. ${wrapup}`, 19),
      '/progress'
    )
  }

  // ── 8:30 PM — log daily steps ─────────────────────────────────────────
  add(
    'log_steps_830',
    todayAt(20, 30),
    'LOG YOUR STEPS.',
    "How many steps today? Open the app and log them before the day slips by.",
    '/'
  )

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

  // De-conflict: if two notifications land at the exact same time, push
  // each subsequent one 5 minutes later so none are swallowed.
  const FIVE_MIN = 5 * 60 * 1000
  schedule.sort((a, b) => a.showAt - b.showAt)
  for (let i = 1; i < schedule.length; i++) {
    if (schedule[i].showAt === schedule[i - 1].showAt) {
      schedule[i].showAt = schedule[i - 1].showAt + FIVE_MIN
    }
  }

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
