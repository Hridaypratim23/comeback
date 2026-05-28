'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useStore, TARGETS, DAILY_HABITS } from '@/lib/store'
import { Flame, Droplets, Trophy, Bell, ChevronRight, ChevronLeft, Edit3, X } from 'lucide-react'
import Link from 'next/link'
import {
  requestNotificationPermission,
  buildDaySchedule,
  sendScheduleToSW,
} from '@/lib/notifications'
import QuoteTicker from '@/components/QuoteTicker'
import { getWorkoutById, REST_WORKOUT } from '@/constants/workouts'
import { generateInsights } from '@/constants/insights'
import InsightCard from '@/components/InsightCard'

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

interface ProgressRingsProps {
  dailyScore: number; weeklyScore: number
  workoutDone: boolean; isRestDay: boolean; todaySteps: number; sleepDone: boolean; todayCal: number; calTarget: number
  weekWorkouts: number; weekStepDays: number; weekSleepDays: number; weekGoodDays: number
  onClick?: () => void
}

function ProgressRings({ dailyScore, weeklyScore, workoutDone, isRestDay, todaySteps, sleepDone, todayCal, calTarget, weekWorkouts, weekStepDays, weekSleepDays, weekGoodDays, onClick }: ProgressRingsProps) {
  const cx = 62, cy = 62, RING_W = 12
  const outerR = 50, innerR = 34
  const outerCirc = 2 * Math.PI * outerR
  const innerCirc = 2 * Math.PI * innerR
  const outerFilled = dailyScore > 0 ? Math.max(outerCirc * (dailyScore / 100), 12) : 0
  const innerFilled = weeklyScore > 0 ? Math.max(innerCirc * (weeklyScore / 100), 12) : 0

  const K = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n)

  const todayPillars = [
    { icon: '🏋️', done: workoutDone,                          value: workoutDone ? (isRestDay ? 'REST' : 'DONE') : '–',     sub: 'workout' },
    { icon: '👟', done: todaySteps >= 10000,                  value: K(todaySteps),                   sub: '/ 10K'   },
    { icon: '😴', done: sleepDone,                            value: sleepDone ? 'DONE' : '–',        sub: 'sleep'   },
    { icon: '🔥', done: todayCal > 0 && todayCal <= calTarget, value: K(todayCal),                   sub: `/ ${K(calTarget)}` },
  ]
  const weekPillars = [
    { icon: '🏋️', done: weekWorkouts >= 5,  value: `${weekWorkouts}/5`,  sub: 'lifts'   },
    { icon: '👟', done: weekStepDays >= 5,   value: `${weekStepDays}/5`,  sub: 'step days' },
    { icon: '😴', done: weekSleepDays >= 7,  value: `${weekSleepDays}/7`, sub: 'nights'  },
    { icon: '🔥', done: weekGoodDays >= 6,   value: `${weekGoodDays}/6`,  sub: 'diet days' },
  ]

  return (
    <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4 cursor-pointer active:scale-[0.99] transition-transform select-none" onClick={onClick}>

      {/* Rings + score rows */}
      <div className="flex items-center gap-5">
        <svg width="124" height="124" viewBox="0 0 124 124" className="flex-shrink-0">
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#FF2800" strokeWidth={RING_W} opacity={0.13} />
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#FF2800" strokeWidth={RING_W}
            strokeLinecap="round" strokeDasharray={`${outerFilled} ${outerCirc}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)', filter: dailyScore > 0 ? 'drop-shadow(0 0 6px #FF280099)' : 'none' }}
          />
          <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#1DB954" strokeWidth={RING_W} opacity={0.13} />
          <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#1DB954" strokeWidth={RING_W}
            strokeLinecap="round" strokeDasharray={`${innerFilled} ${innerCirc}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)', filter: weeklyScore > 0 ? 'drop-shadow(0 0 6px #1DB95499)' : 'none' }}
          />
        </svg>

        {/* Score labels — vertically centred against the 124px SVG */}
        <div className="flex-1 flex flex-col justify-center gap-6 min-w-0">
          {[
            { label: 'TODAY', score: dailyScore, color: '#FF2800' },
            { label: 'THIS WEEK', score: weeklyScore, color: '#1DB954' },
          ].map(({ label, score, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <div>
                <div className="text-[9px] font-black tracking-[0.2em] mb-0.5" style={{ color }}>{label}</div>
                <div className="text-[15px] leading-tight">
                  <span className="font-black text-[#EDEDF0]">{score}</span>
                  <span className="font-bold text-[#686870]">/100</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown — label + 4 equal pills per row */}
      <div className="mt-4 pt-3 border-t border-[#1E1E26] space-y-2">
        {[
          { label: 'TODAY',     color: '#FF2800', pillars: todayPillars },
          { label: 'THIS WEEK', color: '#1DB954', pillars: weekPillars  },
        ].map(({ label, color, pillars }) => (
          <div key={label} className="flex items-stretch gap-2">
            {/* Fixed-width row label */}
            <div className="flex flex-col justify-center items-start gap-0.5 w-[44px] flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[7px] font-black tracking-wide leading-tight" style={{ color }}>{label}</span>
            </div>
            {/* 4 equal vertical pills */}
            <div className="flex gap-1 flex-1">
              {pillars.map(p => (
                <div key={p.sub}
                  className="flex-1 flex flex-col items-center justify-center text-center px-0.5 py-1.5 rounded border gap-0.5"
                  style={{
                    background:   p.done ? `${color}18` : '#0D0D10',
                    borderColor:  p.done ? `${color}44` : '#1E1E26',
                  }}>
                  <span className="text-sm leading-none">{p.icon}</span>
                  <span className="text-[10px] font-black leading-none tabular-nums"
                    style={{ color: p.done ? color : '#EDEDF0' }}>{p.value}</span>
                  <span className="text-[7px] font-bold leading-none text-[#686870]">{p.sub}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

function MacroBar({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  const pct = Math.min((val / max) * 100, 100)
  return (
    <div className="flex-1">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] font-black tracking-widest text-[#686870]">{label}</span>
        <span className="text-xs font-black" style={{ color }}>
          {val}<span className="text-[10px] text-[#686870]">/{max}g</span>
        </span>
      </div>
      <div className="h-1.5 bg-[#1E1E26] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function HomePage() {
  const { stats, dayLogs, bodyHistory, prs, measurements, weeklyCheckins, getOrCreateToday, setSteps, addWater, toggleHabit, setFastingHours, logCardio, logIntimacy, setStepsForDate, setWaterForDate, toggleHabitForDate, setFastingHoursForDate, addMealForDate, removeMealForDate } = useStore()
  const [monthRingsOpen, setMonthRingsOpen] = useState(false)
  const [stepsInput, setStepsInput] = useState('')
  const [pastEditModal, setPastEditModal] = useState<null | 'steps' | 'water' | 'calories' | 'habits' | 'fasting'>(null)
  const [pastStepsInput, setPastStepsInput] = useState('')
  const [pastWaterInput, setPastWaterInput] = useState('')
  const [pastFastingInput, setPastFastingInput] = useState('')
  const [pastMealName, setPastMealName] = useState('')
  const [pastMealCal, setPastMealCal] = useState('')
  const [pastMealPro, setPastMealPro] = useState('')
  const [pastMealCarb, setPastMealCarb] = useState('')
  const [pastMealFat, setPastMealFat] = useState('')
  const [mounted, setMounted] = useState(false)
  const [ifExpanded, setIfExpanded] = useState(false)
  const [ifHours, setIfHours] = useState(16)
  const [cardioExpanded, setCardioExpanded] = useState(false)
  const [cardioType, setCardioType] = useState<'incline_walk' | 'cross_trainer'>('incline_walk')
  const [cardioMinsInput, setCardioMinsInput] = useState('')
  const [cardioKcalInput, setCardioKcalInput] = useState('')
  const [intimacyExpanded, setIntimacyExpanded] = useState(false)
  const [intimacyMinsInput, setIntimacyMinsInput] = useState('')
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(false)
  const [now, setNow] = useState(new Date())
  const [weekShift, setWeekShift] = useState(0) // 0 = current week, -1 = prev, etc.
  const [selectedDate, setSelectedDate] = useState('')
  const [tasksOpen, setTasksOpen] = useState(false)
  const [unCheckPending, setUnCheckPending] = useState<{ id: string; label: string; icon: string } | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const [celebrateFading, setCelebrateFading] = useState(false)
  const prevDailyScoreRef = useRef(0)
  const celebratedTodayRef = useRef(false)
  const [dismissedHydrationHours, setDismissedHydrationHours] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = localStorage.getItem('hydration-dismissed')
      if (!raw) return new Set()
      const { date, hours } = JSON.parse(raw)
      const today = new Date().toLocaleDateString('en-CA')
      return date === today ? new Set<number>(hours) : new Set<number>()
    } catch { return new Set() }
  })

  useEffect(() => {
    setMounted(true)
    getOrCreateToday()
    if (typeof Notification !== 'undefined') setNotifPermission(Notification.permission)
    const d = new Date()
    setSelectedDate(d.toLocaleDateString('en-CA'))
    // Prevent re-showing celebration if ring was already closed today
    if (localStorage.getItem('ring-celebrated') === d.toLocaleDateString('en-CA')) {
      celebratedTodayRef.current = true
    }
    const tick = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(tick)
  }, [getOrCreateToday])

  const haptic = () => { if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10) }

  if (!mounted || !selectedDate) return null

  const todayKey = now.toLocaleDateString('en-CA')
  const isViewingToday = selectedDate === todayKey
  const dayLog = dayLogs[selectedDate]
  const todayLog = dayLogs[todayKey]
  const selectedWorkoutId = todayLog?.selectedWorkoutId
  const workout = selectedWorkoutId ? getWorkoutById(selectedWorkoutId) : REST_WORKOUT

  const totalCal  = dayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0
  const totalPro  = dayLog?.meals.reduce((s, m) => s + m.protein, 0) ?? 0
  const totalCarb = dayLog?.meals.reduce((s, m) => s + m.carbs, 0) ?? 0
  const totalFat  = dayLog?.meals.reduce((s, m) => s + m.fat, 0) ?? 0
  const waterPct  = Math.min(((dayLog?.waterMl ?? 0) / TARGETS.waterMl) * 100, 100)

  // Week strip — Mon to Sun of the shifted week
  const weekStartDate = new Date(now)
  const dow = now.getDay()
  const diffToMon = dow === 0 ? -6 : 1 - dow
  weekStartDate.setDate(now.getDate() + diffToMon + weekShift * 7)
  weekStartDate.setHours(0, 0, 0, 0)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate)
    d.setDate(weekStartDate.getDate() + i)
    const dk = d.toLocaleDateString('en-CA')
    return {
      date: dk,
      day: d.getDate(),
      shortMonth: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      dayLabel: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()],
      isToday: dk === todayKey,
      isFuture: dk > todayKey,
      isSelected: dk === selectedDate,
      workoutDone: dayLogs[dk]?.workoutDone ?? false,
      hasData: !!(dayLogs[dk]?.meals.length || dayLogs[dk]?.waterMl || dayLogs[dk]?.steps),
    }
  })

  // Week label e.g. "MAY 13 – 19"
  const wStart = weekDays[0]
  const wEnd   = weekDays[6]
  const weekLabel = wStart.shortMonth === wEnd.shortMonth
    ? `${wStart.shortMonth} ${wStart.day} – ${wEnd.day}`
    : `${wStart.shortMonth} ${wStart.day} – ${wEnd.shortMonth} ${wEnd.day}`

  const currentHour  = now.getHours()
  const isWorkoutDay = workout.exercises.length > 0
  const workoutDone  = todayLog?.workoutDone ?? false
  const showStreakAlert = isViewingToday && currentHour >= 18 && !workoutDone && stats.streak > 0 && isWorkoutDay

  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const msLeft    = midnight.getTime() - now.getTime()
  const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60))
  const minsLeft  = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60))

  const showNotifBanner = !notifBannerDismissed && notifPermission === 'default' && typeof Notification !== 'undefined'

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission()
    setNotifPermission(granted ? 'granted' : 'denied')
    if (granted) {
      const schedule = buildDaySchedule({
        streak: stats.streak,
        waterMl: todayLog?.waterMl ?? 0,
        waterTarget: TARGETS.waterMl,
        workoutDone,
        weekWorkoutsCompleted: weekWorkouts,
        mealCount: todayLog?.meals.length ?? 0,
        totalCal: todayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0,
        calTarget: TARGETS.calories,
      })
      sendScheduleToSW(schedule)
    }
  }

  // ── Pending tasks for bell ────────────────────────────────────────────────
  const isMonday = now.getDay() === 1
  const lastWeighIn = bodyHistory.length > 0 ? bodyHistory[bodyHistory.length - 1] : null
  const daysSinceWeighIn = lastWeighIn
    ? (now.getTime() - new Date(lastWeighIn.date).getTime()) / (1000 * 60 * 60 * 24)
    : Infinity
  // Hydration: one reminder per hour, 10 AM – 6 PM, dismissed on bell open
  const hydrationDue = currentHour >= 10 && currentHour <= 18 && !dismissedHydrationHours.has(currentHour)
  const pendingTasks: { label: string; sub: string }[] = []
  if (isMonday && daysSinceWeighIn > 0.5)
    pendingTasks.push({ label: 'LOG MONDAY WEIGHT', sub: 'Go to GAINS → Weight Tracker' })
  if (!isMonday && daysSinceWeighIn > 8)
    pendingTasks.push({ label: 'WEIGH-IN OVERDUE', sub: `Last logged ${Math.floor(daysSinceWeighIn)} days ago` })
  if (currentHour >= 12 && (todayLog?.meals.length ?? 0) === 0)
    pendingTasks.push({ label: 'NO MEALS LOGGED TODAY', sub: 'Track your nutrition' })
  if (isWorkoutDay && !workoutDone && currentHour >= 15)
    pendingTasks.push({ label: 'WORKOUT NOT DONE', sub: workout.label })
  if (hydrationDue)
    pendingTasks.push({ label: 'DRINK WATER NOW', sub: `Hourly reminder · ${currentHour}:00` })
  const pendingCount = pendingTasks.length

  const dismissHydrationForCurrentHour = () => {
    if (!hydrationDue) return
    const updated = new Set(dismissedHydrationHours)
    updated.add(currentHour)
    setDismissedHydrationHours(updated)
    try {
      localStorage.setItem('hydration-dismissed', JSON.stringify({
        date: todayKey,
        hours: Array.from(updated),
      }))
    } catch { /* ignore */ }
  }

  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
  const dayStr  = DAY_LABELS[now.getDay()]

  const selectedDateObj = new Date(selectedDate + 'T12:00:00')
  const selectedDateLabel = selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }).toUpperCase()

  // ── Score calculations ─────────────────────────────────────────────────
  const maintenance = Math.round((370 + 21.6 * (stats.weight * (1 - stats.bodyFat / 100))) * 1.55)
  const todayCal   = todayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0
  const todaySteps = todayLog?.steps ?? 0

  // Calories burned: lifting + cardio + steps + intimacy (4 kcal/min)
  // Only count 350 kcal for an actual lift — rest day (selectedWorkoutId='rest') earns no lifting credit
  const isActualLift  = !!(todayLog?.workoutDone && todayLog?.selectedWorkoutId && todayLog.selectedWorkoutId !== 'rest')
  const liftingKcal   = isActualLift ? 350 : 0
  const cardioKcal    = todayLog?.cardio?.caloriesBurned ?? 0
  const stepsKcal     = Math.round(todaySteps * stats.weight * 0.00057)
  const intimacyKcal  = Math.round((todayLog?.intimacyMinutes ?? 0) * 4)
  const totalBurned   = liftingKcal + cardioKcal + stepsKcal + intimacyKcal

  const dailyWorkout = todayLog?.workoutDone ? 25 : 0
  const dailySteps   = Math.min(todaySteps / 10000, 1) * 25
  const dailySleep   = todayLog?.habits?.sleep ? 25 : 0
  const dailyCal     = (todayCal > 0 && todayCal <= maintenance) ? 25 : 0
  const dailyScore   = Math.round(dailyWorkout + dailySteps + dailySleep + dailyCal)

  const curWeekStart = new Date(now)
  const curDow = now.getDay()
  curWeekStart.setDate(now.getDate() + (curDow === 0 ? -6 : 1 - curDow))
  curWeekStart.setHours(0, 0, 0, 0)
  const curWeekKeys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(curWeekStart); d.setDate(curWeekStart.getDate() + i)
    return d.toLocaleDateString('en-CA')
  }).filter(dk => dk <= todayKey)
  const curWeekLogs = curWeekKeys.map(dk => dayLogs[dk]).filter(Boolean)

  const weekWorkouts = curWeekLogs.filter(d => d.workoutDone && d.selectedWorkoutId !== 'rest').length
  const weekStepDays = curWeekLogs.filter(d => d.steps >= 10000).length
  const weekSleepDays = curWeekLogs.filter(d => d.habits?.sleep).length
  const weekGoodDays  = curWeekLogs.filter(d => {
    const cal = d.meals.reduce((s, m) => s + m.calories, 0)
    return d.habits?.nojunk && (cal === 0 || cal <= maintenance)
  }).length
  const weekCardioDays = curWeekLogs.filter(d => d.cardio != null).length
  const weeklyScore = Math.round(
    Math.min(weekWorkouts / 5, 1) * 25 +
    Math.min(weekStepDays / 5, 1) * 25 +
    Math.min(weekSleepDays / 7, 1) * 25 +
    Math.min(weekGoodDays / 6, 1) * 25
  )

  const weekCalLogs = curWeekLogs.filter(d => d.meals.length > 0)
  const weekCalAvg  = weekCalLogs.length > 0
    ? Math.round(weekCalLogs.reduce((s, d) => s + d.meals.reduce((ms, m) => ms + m.calories, 0), 0) / weekCalLogs.length)
    : null

  // ── Smart insights context ─────────────────────────────────────────────

  // Today macros
  const todayProtein = todayLog?.meals.reduce((s, m) => s + m.protein, 0) ?? 0
  const todayCarbs   = todayLog?.meals.reduce((s, m) => s + m.carbs, 0) ?? 0
  const todayFat     = todayLog?.meals.reduce((s, m) => s + m.fat, 0) ?? 0
  // fibre not tracked in meals — default 0
  const todayFibre   = 0

  // Cardio detail
  const cardioLog       = todayLog?.cardio ?? null
  const insightCardioMinutes  = cardioLog?.minutes ?? 0
  const insightCardioType     = cardioLog?.type ?? null

  // Habits
  const sleepDone       = !!(todayLog?.habits?.sleep)
  const supplementsDone = !!(todayLog?.habits?.supplements)
  const veggiesDone     = !!(todayLog?.habits?.veggies)
  const noJunkDone      = !!(todayLog?.habits?.nojunk)

  // Workout exercise progress
  const todayWorkoutObj = selectedWorkoutId ? getWorkoutById(selectedWorkoutId) : null
  const totalExercises  = todayWorkoutObj?.exercises.length ?? 0

  // Count exercises checked off today
  const checkedExercises = todayLog?.checkedExercises ?? []
  const exercisesChecked = todayWorkoutObj
    ? todayWorkoutObj.exercises.filter(ex => checkedExercises.includes(ex.id)).length
    : 0

  // Week supplement / veggie days
  const weekSupplementDays = curWeekLogs.filter(d => d.habits?.supplements).length
  const weekVeggieDays     = curWeekLogs.filter(d => d.habits?.veggies).length

  // PRs
  const benchOneRM    = prs['bench']?.oneRM   ?? prs['bench2']?.oneRM  ?? null
  const squatOneRM    = prs['squat']?.oneRM   ?? null
  const deadliftOneRM = prs['dl']?.oneRM      ?? null
  const ohpOneRM      = prs['ohp']?.oneRM     ?? prs['ohp2']?.oneRM   ?? null

  // Weight trend over last 14 days from bodyHistory
  const latestWeight = bodyHistory.length > 0 ? bodyHistory[bodyHistory.length - 1].weight : stats.weight
  let weightTrend14d: number | null = null
  if (bodyHistory.length >= 2) {
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - 14)
    const cutoffStr = cutoff.toLocaleDateString('en-CA')
    const recent    = bodyHistory.filter(e => e.date >= cutoffStr)
    if (recent.length >= 2) {
      weightTrend14d = recent[recent.length - 1].weight - recent[0].weight
    }
  }

  // Waist trend from measurements (last two entries with waist)
  const sortedMeasurements = [...measurements].sort((a, b) => a.date.localeCompare(b.date))
  const waistEntries = sortedMeasurements.filter(m => m.waist != null)
  const latestWaist  = waistEntries.length > 0 ? (waistEntries[waistEntries.length - 1].waist ?? null) : null
  let waistTrend: number | null = null
  if (waistEntries.length >= 2) {
    const prev = waistEntries[waistEntries.length - 2].waist!
    const curr = waistEntries[waistEntries.length - 1].waist!
    waistTrend = curr - prev
  }

  // Last weekly check-in rating
  const sortedCheckins   = [...weeklyCheckins].sort((a, b) => a.date.localeCompare(b.date))
  const lastCheckinRating = sortedCheckins.length > 0 ? sortedCheckins[sortedCheckins.length - 1].rating : null

  const insights = generateInsights({
    weight:        stats.weight,
    bodyFat:       stats.bodyFat,
    maintenance,
    calories:      todayCal,
    protein:       todayProtein,
    carbs:         todayCarbs,
    fat:           todayFat,
    fibre:         todayFibre,
    steps:         todaySteps,
    totalBurned,
    workoutDone:   todayLog?.workoutDone ?? false,
    isRestDay:     todayLog?.selectedWorkoutId === 'rest',
    cardioLogged:  cardioLog != null,
    cardioMinutes: insightCardioMinutes,
    cardioType:    insightCardioType,
    fastingHours:  todayLog?.fastingHours ?? 0,
    sleepDone,
    supplementsDone,
    veggiesDone,
    noJunkDone,
    todayWorkoutId:    todayLog?.selectedWorkoutId ?? null,
    todayWorkoutLabel: todayWorkoutObj?.label ?? null,
    exercisesChecked,
    totalExercises,
    waterMl:       todayLog?.waterMl ?? 0,
    hour:          now.getHours(),
    dayOfWeek:     now.getDay(),
    weekWorkouts,
    weekCalAvg,
    weekCardioDays,
    weekStepDays,
    weekSleepDays,
    weekSupplementDays,
    weekVeggieDays,
    weekGoodDays,
    targetWeight:  65,
    targetBf:      15,
    calTarget:     TARGETS.calories,
    proteinTarget: TARGETS.protein,
    streak:        stats.streak,
    level:         stats.level,
    totalWorkoutsCompleted: stats.workoutsCompleted,
    benchOneRM,
    squatOneRM,
    deadliftOneRM,
    ohpOneRM,
    weightTrend14d,
    latestWaist,
    waistTrend,
    latestWeight,
    lastCheckinRating,
  })

  // Trigger celebration only the first time rings close today
  if (prevDailyScoreRef.current < 100 && dailyScore >= 100 && !celebrating && !celebratedTodayRef.current) {
    celebratedTodayRef.current = true
    localStorage.setItem('ring-celebrated', todayKey)
    setCelebrating(true)
    setCelebrateFading(false)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([80, 40, 80, 40, 120])
    setTimeout(() => setCelebrateFading(true), 2000)
    setTimeout(() => { setCelebrating(false); setCelebrateFading(false) }, 2500)
  }
  prevDailyScoreRef.current = dailyScore

  return (
    <div className="pb-4 space-y-4">
      <div className="px-4 space-y-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}>
        {/* ── Streak Alert ── */}
        {showStreakAlert && (
          <div className="animate-pulse-red rounded-xl border-2 border-[#FF2800] bg-[#FF280015] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black tracking-widest text-[#FF2800] mb-1">⚠ STREAK AT RISK</div>
                <div className="text-base font-black text-[#EDEDF0]">
                  {stats.streak}-DAY STREAK DIES IN {hoursLeft}H {minsLeft}M. MOVE.
                </div>
              </div>
              <Link href="/workout">
                <button className="px-4 py-2.5 rounded-lg bg-[#FF2800] text-white text-[10px] font-black tracking-widest whitespace-nowrap cursor-pointer btn-press active:scale-95">
                  GO NOW →
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ── Notification Banner ── */}
        {showNotifBanner && (
          <div className="bg-[#111116] border border-[#2C2C38] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Bell size={18} className="text-[#D4A017] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-[11px] font-black tracking-widest text-[#EDEDF0] mb-1">ENABLE NOTIFICATIONS</div>
                <div className="text-[10px] text-[#686870] leading-relaxed mb-3">
                  GET HIT AT 6AM. HOURLY WATER CHECKS. STREAK WARNINGS. MINDSET INJECTIONS.
                </div>
                <div className="flex gap-2">
                  <button onClick={handleEnableNotifications}
                    className="flex-1 py-2 rounded-lg bg-[#FF2800] text-white text-[10px] font-black tracking-widest cursor-pointer btn-press">
                    ENABLE
                  </button>
                  <button onClick={() => setNotifBannerDismissed(true)}
                    className="flex-1 py-2 rounded-lg bg-[#1E1E26] text-[#686870] text-[10px] font-black tracking-widest cursor-pointer btn-press">
                    NOT NOW
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black tracking-widest text-[#686870] uppercase">{dateStr} · {dayStr}</p>
            <div className="mt-0.5">
              <h1 className="text-5xl font-black tracking-[-0.04em] text-[#FF2800] leading-none red-glow">COMEBACK</h1>
              <p className="text-[11px] font-black text-[#FF2800] leading-none mt-0.5 tracking-[0.08em]" style={{ opacity: 0.7 }}>Achieve your prime again</p>
            </div>
          </div>
          <button onClick={() => { if (tasksOpen) dismissHydrationForCurrentHour(); setTasksOpen(o => !o) }}
            className="relative mt-2 w-9 h-9 flex items-center justify-center rounded-full bg-[#111116] border border-[#1E1E26] cursor-pointer btn-press">
            <Bell size={16} className={pendingCount > 0 ? 'text-[#D4A017]' : 'text-[#686870]'} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF2800] rounded-full text-[8px] font-black text-white flex items-center justify-center leading-none">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Ticker ── */}
        <div className="-mx-4">
          <QuoteTicker />
        </div>

        {/* ── Tasks Panel ── */}
        {tasksOpen && (
          <div className="bg-[#111116] border border-[#1E1E26] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1E1E26]">
              <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">
                {pendingCount > 0 ? `${pendingCount} TASK${pendingCount > 1 ? 'S' : ''} PENDING` : 'ALL CAUGHT UP'}
              </span>
            </div>
            {pendingCount === 0 ? (
              <div className="px-4 py-4 text-[11px] font-black text-[#1DB954] tracking-widest">✓ NOTHING OUTSTANDING</div>
            ) : (
              <div className="divide-y divide-[#1E1E26]">
                {pendingTasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF2800] flex-shrink-0" />
                    <div>
                      <div className="text-[11px] font-black text-[#EDEDF0] tracking-wider">{t.label}</div>
                      <div className="text-[9px] text-[#686870] mt-0.5">{t.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Score Rings ── */}
        <ProgressRings
          onClick={() => setMonthRingsOpen(true)}
          dailyScore={dailyScore}
          weeklyScore={weeklyScore}
          workoutDone={todayLog?.workoutDone ?? false}
          isRestDay={todayLog?.selectedWorkoutId === 'rest'}
          todaySteps={todaySteps}
          sleepDone={!!(todayLog?.habits?.sleep)}
          todayCal={todayCal}
          calTarget={TARGETS.calories}
          weekWorkouts={weekWorkouts}
          weekStepDays={weekStepDays}
          weekSleepDays={weekSleepDays}
          weekGoodDays={weekGoodDays}
        />

        {/* ── Coach Insights ── */}
        <InsightCard insights={insights} />

        {/* ── Wellness Journal / Week Navigator ── */}
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
          {/* Week header with nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setWeekShift(w => w - 1)}
              className="w-7 h-7 rounded-lg bg-[#0D0D10] border border-[#1E1E26] flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            >
              <ChevronLeft size={14} className="text-[#686870]" />
            </button>
            <div className="text-center">
              <div className="text-[10px] font-black tracking-[0.3em] text-[#686870]">WELLNESS JOURNAL</div>
              <div className="text-[11px] font-black text-[#EDEDF0] mt-0.5">{weekLabel}</div>
            </div>
            <button
              onClick={() => setWeekShift(w => Math.min(w + 1, 0))}
              disabled={weekShift === 0}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all
                ${weekShift === 0 ? 'border-[#1E1E26] opacity-30 cursor-not-allowed' : 'bg-[#0D0D10] border-[#1E1E26] cursor-pointer active:scale-95'}`}
            >
              <ChevronRight size={14} className="text-[#686870]" />
            </button>
          </div>

          {/* Day cells */}
          <div className="flex gap-1">
            {weekDays.map(({ date, day, shortMonth, dayLabel, isToday, isFuture, isSelected, workoutDone: wDone, hasData }) => (
              <button
                key={date}
                disabled={isFuture}
                onClick={() => setSelectedDate(date)}
                className={`flex-1 flex flex-col items-center py-2 rounded-lg border transition-all cursor-pointer active:scale-95
                  ${isSelected
                    ? 'bg-[#FF280022] border-[#FF2800]'
                    : isToday
                    ? 'bg-[#111116] border-[#686870]'
                    : isFuture
                    ? 'bg-[#0D0D10] border-[#1E1E2644] opacity-30 cursor-not-allowed'
                    : 'bg-[#0D0D10] border-[#1E1E26] hover:border-[#2C2C38]'}`}
              >
                <span className={`text-[8px] font-black tracking-wider ${isSelected ? 'text-[#FF2800]' : isToday ? 'text-[#686870]' : 'text-[#2C2C38]'}`}>
                  {dayLabel}
                </span>
                <span className={`text-sm font-black leading-tight mt-0.5 ${isSelected ? 'text-[#FF2800]' : isToday ? 'text-[#EDEDF0]' : isFuture ? 'text-[#2C2C38]' : 'text-[#686870]'}`}>
                  {day}
                </span>
                <span className={`text-[7px] font-bold ${isSelected ? 'text-[#FF280088]' : 'text-[#2C2C38]'}`}>{shortMonth}</span>
                <div className={`w-3 h-1 rounded-full mt-1 ${wDone ? 'bg-[#FF2800]' : hasData ? 'bg-[#2C2C38]' : 'bg-transparent'}`} />
              </button>
            ))}
          </div>

          {/* Selected date label */}
          {!isViewingToday && (
            <div className="mt-3 pt-3 border-t border-[#1E1E26] flex items-center justify-between">
              <span className="text-[10px] font-black tracking-widest text-[#FF2800]">VIEWING: {selectedDateLabel}</span>
              <button onClick={() => { setSelectedDate(todayKey); setWeekShift(0) }}
                className="text-[10px] font-black text-[#686870] hover:text-[#EDEDF0] cursor-pointer transition-colors tracking-widest">
                ← TODAY
              </button>
            </div>
          )}
        </div>

        {/* ── PAST DATE: Clean summary with edit icons ── */}
        {!isViewingToday && (
          <div className="bg-[#111116] border border-[#1E1E26] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1E1E26]">
              <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">DAY LOG</span>
            </div>
            {/* Workout — read-only */}
            {(() => {
              const rows: { label: string; value: React.ReactNode; modal?: typeof pastEditModal }[] = [
                {
                  label: 'WORKOUT',
                  value: <span className={`text-xs font-black ${dayLog?.workoutDone ? 'text-[#1DB954]' : 'text-[#686870]'}`}>
                    {dayLog?.workoutDone ? (dayLog.selectedWorkoutId === 'rest' ? 'REST ✓' : 'DONE ✓') : '—'}
                  </span>,
                },
                {
                  label: 'CALORIES',
                  value: <span className="text-xs font-black text-[#FF5500]">
                    {totalCal > 0 ? `${totalCal} kcal` : '—'}
                    {totalCal > 0 && <span className="text-[9px] text-[#686870] ml-1">P:{totalPro} C:{totalCarb} F:{totalFat}</span>}
                  </span>,
                  modal: 'calories',
                },
                {
                  label: 'STEPS',
                  value: <span className="text-xs font-black text-[#EDEDF0]">
                    {(dayLog?.steps ?? 0) > 0 ? (dayLog?.steps ?? 0).toLocaleString() : '—'}
                    {(dayLog?.steps ?? 0) >= 10000 && <span className="text-[#1DB954] ml-1">✓</span>}
                  </span>,
                  modal: 'steps',
                },
                {
                  label: 'WATER',
                  value: <span className="text-xs font-black text-[#2196F3]">
                    {(dayLog?.waterMl ?? 0) > 0 ? `${((dayLog?.waterMl ?? 0) / 1000).toFixed(1)}L` : '—'}
                  </span>,
                  modal: 'water',
                },
                {
                  label: 'HABITS',
                  value: <div className="flex gap-1">
                    {DAILY_HABITS.map(h => (
                      <span key={h.id} className={`text-sm ${dayLog?.habits?.[h.id] ? 'opacity-100' : 'opacity-20'}`}>{h.icon}</span>
                    ))}
                  </div>,
                  modal: 'habits',
                },
                {
                  label: 'FASTING',
                  value: <span className="text-xs font-black text-[#1DB954]">
                    {(dayLog?.fastingHours ?? 0) > 0 ? `${dayLog?.fastingHours}h` : '—'}
                  </span>,
                  modal: 'fasting',
                },
              ]
              return rows.map((row, i) => (
                <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i < rows.length - 1 ? 'border-b border-[#1E1E26]' : ''}`}>
                  <span className="text-[10px] font-black tracking-widest text-[#686870]">{row.label}</span>
                  <div className="flex items-center gap-2">
                    {row.value}
                    {row.modal && (
                      <button
                        onClick={() => setPastEditModal(row.modal!)}
                        className="w-6 h-6 rounded-md bg-[#1E1E26] flex items-center justify-center cursor-pointer active:scale-90 transition-all hover:bg-[#2C2C38]"
                      >
                        <Edit3 size={11} className="text-[#686870]" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            })()}
          </div>
        )}

        {/* ── Past-date edit modals (portalled to escape PageTransition transform) ── */}
        {pastEditModal && !isViewingToday && createPortal(
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)' }} onClick={() => setPastEditModal(null)} />
            <div style={{ position: 'relative', background: '#111116', border: '1px solid #2C2C38', borderRadius: 20, width: 'calc(100vw - 3rem)', maxWidth: 340, overflow: 'hidden' }}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E26]">
                <span className="text-[11px] font-black tracking-[0.25em] text-[#EDEDF0]">
                  {pastEditModal === 'steps' && 'EDIT STEPS'}
                  {pastEditModal === 'water' && 'EDIT WATER'}
                  {pastEditModal === 'calories' && 'ADD CALORIES'}
                  {pastEditModal === 'habits' && 'EDIT HABITS'}
                  {pastEditModal === 'fasting' && 'EDIT FASTING'}
                </span>
                <span className="text-[9px] font-bold text-[#686870] tracking-widest">{selectedDateLabel}</span>
              </div>

              <div className="px-5 py-4 space-y-4">

                {/* STEPS modal */}
                {pastEditModal === 'steps' && (
                  <>
                    <div className="text-center py-1">
                      <div className="text-[9px] font-bold tracking-widest text-[#686870] mb-1">CURRENT</div>
                      <div className="text-2xl font-black text-[#EDEDF0]">
                        {(dayLog?.steps ?? 0).toLocaleString()}
                        {(dayLog?.steps ?? 0) >= 10000 && <span className="text-[#1DB954] text-base ml-1">✓</span>}
                      </div>
                    </div>
                    <input
                      type="number" inputMode="numeric" placeholder="New step count"
                      value={pastStepsInput} onChange={e => setPastStepsInput(e.target.value)}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const n = parseInt(pastStepsInput)
                          if (!isNaN(n) && n >= 0) { setStepsForDate(selectedDate, n); setPastStepsInput(''); setPastEditModal(null) }
                        }
                      }}
                      className="w-full bg-[#0D0D10] border border-[#2C2C38] rounded-xl px-4 py-3 text-lg font-black text-[#EDEDF0] outline-none focus:border-[#2196F3] text-center"
                    />
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { setPastStepsInput(''); setPastEditModal(null) }}
                        className="flex-1 py-2.5 rounded-xl bg-[#1E1E26] text-[#686870] text-[10px] font-black tracking-widest cursor-pointer active:scale-95 transition-all">
                        CANCEL
                      </button>
                      <button onClick={() => {
                        const n = parseInt(pastStepsInput)
                        if (!isNaN(n) && n >= 0) { setStepsForDate(selectedDate, n); setPastStepsInput(''); setPastEditModal(null) }
                      }}
                        className="flex-1 py-2.5 rounded-xl bg-[#2196F3] text-white text-[10px] font-black tracking-widest cursor-pointer active:scale-95 transition-all">
                        SAVE
                      </button>
                    </div>
                  </>
                )}

                {/* WATER modal */}
                {pastEditModal === 'water' && (
                  <>
                    <div className="text-center py-1">
                      <div className="text-[9px] font-bold tracking-widest text-[#686870] mb-1">CURRENT</div>
                      <div className="text-2xl font-black text-[#2196F3]">{((dayLog?.waterMl ?? 0) / 1000).toFixed(1)}L</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[[-500,'−500ml'],[- 250,'−250ml'],[250,'+250ml'],[500,'+500ml'],[750,'+750ml'],[1000,'+1L']].map(([ml, label]) => (
                        <button key={label}
                          onClick={() => setWaterForDate(selectedDate, Math.max(0, (dayLog?.waterMl ?? 0) + (ml as number)))}
                          className={`py-2.5 rounded-xl border text-[10px] font-black cursor-pointer active:scale-95 transition-all
                            ${(ml as number) < 0 ? 'bg-[#0D0D10] border-[#1E1E26] text-[#686870]' : 'bg-[#2196F311] border-[#2196F333] text-[#2196F3]'}`}>
                          {label as string}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <input type="number" inputMode="numeric" placeholder="Set exact ml"
                        value={pastWaterInput} onChange={e => setPastWaterInput(e.target.value)}
                        className="flex-1 bg-[#0D0D10] border border-[#2C2C38] rounded-xl px-3 py-2.5 text-sm font-black text-[#EDEDF0] outline-none focus:border-[#2196F3] text-center"
                      />
                      <button onClick={() => {
                        const n = parseInt(pastWaterInput)
                        if (!isNaN(n) && n >= 0) { setWaterForDate(selectedDate, n); setPastWaterInput('') }
                      }} className="px-4 py-2.5 rounded-xl bg-[#2196F3] text-white text-[10px] font-black tracking-widest cursor-pointer active:scale-95 transition-all">
                        SET
                      </button>
                    </div>
                    <button onClick={() => { setPastWaterInput(''); setPastEditModal(null) }}
                      className="w-full py-2.5 rounded-xl bg-[#1E1E26] text-[#686870] text-[10px] font-black tracking-widest cursor-pointer active:scale-95 transition-all">
                      DONE
                    </button>
                  </>
                )}

                {/* CALORIES modal */}
                {pastEditModal === 'calories' && (
                  <>
                    <div className="text-center py-1">
                      <div className="text-[9px] font-bold tracking-widest text-[#686870] mb-1">TOTAL TODAY</div>
                      <div className="text-2xl font-black text-[#FF5500]">{totalCal > 0 ? `${totalCal} kcal` : '—'}</div>
                      {totalCal > 0 && <div className="text-[10px] text-[#686870] mt-0.5">P:{totalPro}g · C:{totalCarb}g · F:{totalFat}g</div>}
                    </div>
                    <div className="space-y-2">
                      <input type="text" placeholder="Name (optional)"
                        value={pastMealName} onChange={e => setPastMealName(e.target.value)}
                        className="w-full bg-[#0D0D10] border border-[#2C2C38] rounded-xl px-4 py-2.5 text-[12px] font-black text-[#EDEDF0] outline-none focus:border-[#FF5500] placeholder:text-[#2C2C38]"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { key: 'cal', label: 'KCAL', val: pastMealCal, set: setPastMealCal, color: '#FF5500' },
                          { key: 'pro', label: 'P(g)', val: pastMealPro, set: setPastMealPro, color: '#EDEDF0' },
                          { key: 'carb', label: 'C(g)', val: pastMealCarb, set: setPastMealCarb, color: '#EDEDF0' },
                          { key: 'fat', label: 'F(g)', val: pastMealFat, set: setPastMealFat, color: '#EDEDF0' },
                        ].map(f => (
                          <div key={f.key} className="flex flex-col gap-1">
                            <span className="text-[8px] font-black tracking-widest text-center" style={{ color: f.color === '#EDEDF0' ? '#686870' : f.color }}>{f.label}</span>
                            <input type="number" inputMode="numeric" placeholder="0"
                              value={f.val} onChange={e => f.set(e.target.value)}
                              className="w-full bg-[#0D0D10] border border-[#2C2C38] rounded-lg px-1 py-2 text-[12px] font-black outline-none focus:border-[#FF5500] text-center"
                              style={{ color: f.color }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { setPastMealName(''); setPastMealCal(''); setPastMealPro(''); setPastMealCarb(''); setPastMealFat(''); setPastEditModal(null) }}
                        className="flex-1 py-2.5 rounded-xl bg-[#1E1E26] text-[#686870] text-[10px] font-black tracking-widest cursor-pointer active:scale-95 transition-all">
                        CANCEL
                      </button>
                      <button onClick={() => {
                        const cal = parseInt(pastMealCal)
                        if (isNaN(cal) || cal <= 0) return
                        addMealForDate(selectedDate, {
                          name: pastMealName.trim() || 'Extra',
                          calories: cal,
                          protein: parseFloat(pastMealPro) || 0,
                          carbs: parseFloat(pastMealCarb) || 0,
                          fat: parseFloat(pastMealFat) || 0,
                        })
                        setPastMealName(''); setPastMealCal(''); setPastMealPro(''); setPastMealCarb(''); setPastMealFat('')
                        setPastEditModal(null)
                      }}
                        className="flex-1 py-2.5 rounded-xl bg-[#FF5500] text-white text-[10px] font-black tracking-widest cursor-pointer active:scale-95 transition-all">
                        ADD
                      </button>
                    </div>
                  </>
                )}

                {/* HABITS modal */}
                {pastEditModal === 'habits' && (
                  <>
                    <div className="space-y-2">
                      {DAILY_HABITS.map(h => {
                        const done = !!(dayLog?.habits?.[h.id])
                        return (
                          <button key={h.id}
                            onClick={() => { haptic(); toggleHabitForDate(selectedDate, h.id) }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer active:scale-[0.98]
                              ${done ? 'bg-[#0D7A3A22] border-[#1DB95444] text-[#1DB954]' : 'bg-[#0D0D10] border-[#1E1E26] text-[#686870]'}`}>
                            <span className="text-lg">{h.icon}</span>
                            <span className="text-[11px] font-black tracking-wider flex-1 text-left">{h.label}</span>
                            <span className="text-[11px] font-black">{done ? '✓' : '○'}</span>
                          </button>
                        )
                      })}
                    </div>
                    <button onClick={() => setPastEditModal(null)}
                      className="w-full py-2.5 rounded-xl bg-[#1DB95422] border border-[#1DB95433] text-[#1DB954] text-[10px] font-black tracking-widest cursor-pointer active:scale-95 transition-all">
                      DONE
                    </button>
                  </>
                )}

                {/* FASTING modal */}
                {pastEditModal === 'fasting' && (
                  <>
                    <div className="text-center py-1">
                      <div className="text-[9px] font-bold tracking-widest text-[#686870] mb-1">CURRENT</div>
                      <div className="text-2xl font-black text-[#1DB954]">
                        {(dayLog?.fastingHours ?? 0) > 0 ? `${dayLog?.fastingHours}h` : '—'}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[12, 14, 16, 18, 20, 24].map(h => (
                        <button key={h} onClick={() => { setFastingHoursForDate(selectedDate, h); setPastFastingInput('') }}
                          className={`py-2.5 rounded-xl border text-[11px] font-black cursor-pointer active:scale-95 transition-all
                            ${dayLog?.fastingHours === h ? 'bg-[#1DB95422] border-[#1DB954] text-[#1DB954]' : 'bg-[#0D0D10] border-[#1E1E26] text-[#686870]'}`}>
                          {h}h
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <input type="number" inputMode="numeric" placeholder="Custom hours"
                        value={pastFastingInput} onChange={e => setPastFastingInput(e.target.value)}
                        className="flex-1 bg-[#0D0D10] border border-[#2C2C38] rounded-xl px-3 py-2.5 text-sm font-black text-[#EDEDF0] outline-none focus:border-[#1DB954] text-center"
                      />
                      <button onClick={() => {
                        const n = parseFloat(pastFastingInput)
                        if (!isNaN(n) && n >= 0) { setFastingHoursForDate(selectedDate, n); setPastFastingInput('') }
                      }} className="px-4 py-2.5 rounded-xl bg-[#1DB95422] border border-[#1DB95433] text-[#1DB954] text-[10px] font-black cursor-pointer active:scale-95 transition-all">
                        SET
                      </button>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { setFastingHoursForDate(selectedDate, 0); setPastFastingInput('') }}
                        className="flex-1 py-2.5 rounded-xl bg-[#FF280011] border border-[#FF280033] text-[#FF2800] text-[10px] font-black tracking-widest cursor-pointer active:scale-95 transition-all">
                        CLEAR
                      </button>
                      <button onClick={() => { setPastFastingInput(''); setPastEditModal(null) }}
                        className="flex-1 py-2.5 rounded-xl bg-[#1E1E26] text-[#686870] text-[10px] font-black tracking-widest cursor-pointer active:scale-95 transition-all">
                        DONE
                      </button>
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>,
          document.body
        )}

        {/* ── TODAY ONLY: full interactive view ── */}
        {isViewingToday && (
          <>
            {/* Workout Card */}
            <Link href="/workout" className="block cursor-pointer">
              {!selectedWorkoutId ? (
                <div className="rounded-xl border border-dashed border-[#FF280044] bg-[#FF280008] p-5 flex items-center justify-between btn-press hover:border-[#FF2800] transition-all">
                  <div>
                    <div className="text-[10px] font-black tracking-[0.3em] text-[#FF2800] mb-1">TODAY&apos;S MISSION</div>
                    <div className="text-xl font-black text-[#686870]">SELECT YOUR WORKOUT</div>
                    <div className="text-xs text-[#2C2C38] mt-1 font-bold">Push A · Pull A · Legs A · Push B · Pull B</div>
                  </div>
                  <ChevronRight size={20} className="text-[#FF2800]" />
                </div>
              ) : (
                <div className={`rounded-xl overflow-hidden border-l-4 border border-[#1E1E26] transition-all btn-press ${!todayLog?.workoutDone ? 'workout-card-pulse' : ''}`}
                  style={{ borderLeftColor: workout.color }}>
                  <div className="p-4" style={{ background: `linear-gradient(135deg, ${workout.color}33 0%, #111116 55%)` }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: workout.color }}>TODAY&apos;S MISSION</div>
                        <div className="text-2xl font-black text-[#EDEDF0] leading-none">{workout.label}</div>
                        <div className="text-xs text-[#686870] mt-1 tracking-wider font-bold">{workout.muscles}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {todayLog?.workoutDone ? (
                          <span className="px-3 py-1 rounded text-[10px] font-black tracking-wider bg-[#0D7A3A] text-[#1DB954]">{workout.id === 'rest' ? 'REST ✓' : 'DONE ✓'}</span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-black tracking-widest cursor-pointer"
                            style={{ background: workout.color, color: '#fff' }}>
                            ATTACK <ChevronRight size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                    {workout.exercises.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {workout.exercises.slice(0, 4).map(ex => (
                          <span key={ex.id} className="px-2 py-0.5 rounded text-[10px] font-bold text-[#686870] bg-[#0D0D10] border border-[#1E1E26]">
                            {ex.name}
                          </span>
                        ))}
                        {workout.exercises.length > 4 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-[#686870] bg-[#0D0D10] border border-[#1E1E26]">
                            +{workout.exercises.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Link>

            {/* Stats 2×2 Grid */}
            {(() => {
              const steps = todayLog?.steps ?? 0
              const stepsPct = Math.min((steps / TARGETS.steps) * 100, 100)
              const commitSteps = () => {
                const n = parseInt(stepsInput)
                if (!n || n <= 0) return
                setSteps(n)
                setStepsInput('')
              }
              const stepsDisplay = steps >= 1000 ? `${(steps / 1000).toFixed(1)}K` : String(steps)
              return (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/nutrition" className="cursor-pointer">
                      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-3 h-full" style={{ boxShadow: 'inset 0 2px 0 rgba(255,85,0,0.4)' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Flame size={13} className="text-[#FF5500]" />
                          <span className="text-[9px] font-black tracking-widest text-[#686870]">CALORIES</span>
                        </div>
                        <div className="text-2xl font-black text-[#EDEDF0] leading-none">{totalCal}</div>
                        <div className="text-[10px] text-[#686870] mt-0.5">/ {TARGETS.calories}</div>
                        <div className="mt-2 h-1.5 bg-[#1E1E26] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((totalCal / TARGETS.calories) * 100, 100)}%`, background: 'linear-gradient(90deg, #CC4000, #FF5500)' }} />
                        </div>
                      </div>
                    </Link>
                    <Link href="/hydration" className="cursor-pointer">
                      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-3 h-full" style={{ boxShadow: 'inset 0 2px 0 rgba(33,150,243,0.4)' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Droplets size={13} className="text-[#2196F3]" />
                          <span className="text-[9px] font-black tracking-widest text-[#686870]">WATER</span>
                        </div>
                        <div className="text-2xl font-black text-[#EDEDF0] leading-none">{((todayLog?.waterMl ?? 0) / 1000).toFixed(1)}L</div>
                        <div className="text-[10px] text-[#686870] mt-0.5">/ 3.0L</div>
                        <div className="mt-2 h-1.5 bg-[#1E1E26] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${waterPct}%`, background: 'linear-gradient(90deg, #1470CC, #2196F3)' }} />
                        </div>
                      </div>
                    </Link>
                    <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-3" style={{ boxShadow: 'inset 0 2px 0 rgba(33,150,243,0.2)' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm leading-none">👟</span>
                        <span className="text-[9px] font-black tracking-widest text-[#686870]">STEPS</span>
                      </div>
                      <div className={`text-2xl font-black leading-none ${steps >= 10000 ? 'text-[#1DB954]' : 'text-[#EDEDF0]'}`}>{stepsDisplay}</div>
                      <div className="text-[10px] text-[#686870] mt-0.5">/ 10K</div>
                      <div className="mt-2 h-1.5 bg-[#1E1E26] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${stepsPct}%`, background: 'linear-gradient(90deg, #1A6BB5, #2196F3)' }} />
                      </div>
                    </div>
                    <Link href="/workout" className="cursor-pointer">
                      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-3 h-full" style={{ boxShadow: 'inset 0 2px 0 rgba(29,185,84,0.4)' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm leading-none">🔥</span>
                          <span className="text-[9px] font-black tracking-widest text-[#686870]">BURNED</span>
                        </div>
                        <div className={`text-2xl font-black leading-none ${totalBurned > 0 ? 'text-[#1DB954]' : 'text-[#EDEDF0]'}`}>{totalBurned}</div>
                        <div className="text-[10px] text-[#686870] mt-0.5">kcal</div>
                        <div className="mt-2 h-1.5 bg-[#1E1E26] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((totalBurned / 1000) * 100, 100)}%`, background: 'linear-gradient(90deg, #0D7A3A, #1DB954)' }} />
                        </div>
                      </div>
                    </Link>
                  </div>
                  {/* Compact steps entry */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={steps > 0 ? `Steps logged: ${steps.toLocaleString()}` : "Log today's steps…"}
                      value={stepsInput}
                      onChange={e => setStepsInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && commitSteps()}
                      className="flex-1 bg-[#111116] border border-[#1E1E26] focus:border-[#2196F3] rounded-lg px-3 py-2 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none transition-colors"
                    />
                    <button onClick={commitSteps}
                      className="px-4 py-2 rounded-lg bg-[#2196F3] text-white text-[10px] font-black tracking-widest cursor-pointer active:scale-95 transition-all">
                      SAVE
                    </button>
                  </div>
                </>
              )
            })()}

            {/* Daily Habits */}
            {(() => {
              const habits = todayLog?.habits ?? {}
              const doneCount = DAILY_HABITS.filter(h => habits[h.id]).length
              const consistencyPct = Math.round((doneCount / DAILY_HABITS.length) * 100)
              return (
                <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">DAILY HABITS</span>
                    <span className={`text-[10px] font-black ${consistencyPct === 100 ? 'text-[#1DB954]' : 'text-[#686870]'}`}>
                      {doneCount}/{DAILY_HABITS.length} · {consistencyPct}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    {DAILY_HABITS.map(habit => {
                      const done = !!habits[habit.id]
                      return (
                        <button key={habit.id}
                          onClick={() => { haptic(); done
                            ? setUnCheckPending({ id: habit.id, label: habit.label, icon: habit.icon })
                            : toggleHabit(habit.id) }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer btn-press text-left
                            ${done ? 'bg-[#0D7A3A22] border-[#1DB95433]' : 'bg-[#0D0D10] border-[#1E1E26] hover:border-[#2C2C38]'}`}>
                          <span className="text-xl leading-none">{habit.icon}</span>
                          <div className="flex-1">
                            <div className={`text-xs font-black tracking-wider ${done ? 'text-[#1DB954]' : 'text-[#EDEDF0]'}`}>
                              {habit.label}
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all
                            ${done ? 'bg-[#1DB954] border-[#1DB954] text-[#070709]' : 'border-[#2C2C38]'}`}>
                            {done && <span className="text-[10px] font-black">✓</span>}
                          </div>
                        </button>
                      )
                    })}

                    {/* Intermittent Fasting — no XP, tracked separately */}
                    {(() => {
                      const fastingHours = todayLog?.fastingHours ?? 0
                      const isActive = fastingHours > 0
                      return (
                        <div className={`rounded-lg border transition-all ${isActive ? 'bg-[#0D7A3A22] border-[#1DB95433]' : 'bg-[#0D0D10] border-[#1E1E26]'}`}>
                          <button
                            onClick={() => { setIfExpanded(e => !e); if (!ifExpanded) setIfHours(fastingHours || 16) }}
                            className="w-full flex items-center gap-3 p-3 cursor-pointer btn-press text-left"
                          >
                            <span className="text-xl leading-none">⏱️</span>
                            <div className="flex-1">
                              <div className={`text-xs font-black tracking-wider ${isActive ? 'text-[#1DB954]' : 'text-[#EDEDF0]'}`}>
                                INTERMITTENT FASTING{isActive ? ` · ${fastingHours}H` : ''}
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all
                              ${isActive ? 'bg-[#1DB954] border-[#1DB954] text-[#070709]' : 'border-[#2C2C38]'}`}>
                              {isActive && <span className="text-[10px] font-black">✓</span>}
                            </div>
                          </button>
                          {ifExpanded && (
                            <div className="px-3 pb-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-[#686870]">10h</span>
                                <span className="text-base font-black text-[#1DB954]">{ifHours}h fast</span>
                                <span className="text-[10px] text-[#686870]">20h</span>
                              </div>
                              <input
                                type="range" min={10} max={20} step={1}
                                value={ifHours}
                                onChange={e => setIfHours(Number(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#1DB954] bg-[#1E1E26]"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setFastingHours(0); setIfExpanded(false); setIfHours(16) }}
                                  className="flex-1 py-2 rounded-lg bg-[#1E1E26] text-[#686870] text-[10px] font-black tracking-widest cursor-pointer btn-press">
                                  CLEAR
                                </button>
                                <button
                                  onClick={() => { setFastingHours(ifHours); setIfExpanded(false) }}
                                  className="flex-1 py-2 rounded-lg bg-[#1DB954] text-[#070709] text-[10px] font-black tracking-widest cursor-pointer btn-press">
                                  SAVE {ifHours}H
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Intimacy */}
                    {(() => {
                      const mins      = todayLog?.intimacyMinutes ?? null
                      const isActive  = mins !== null && mins > 0
                      const kcal      = isActive ? Math.round(mins! * 4) : 0
                      return (
                        <div className={`rounded-lg border transition-all ${isActive ? 'bg-[#FF280011] border-[#FF280033]' : 'bg-[#0D0D10] border-[#1E1E26]'}`}>
                          <button
                            onClick={() => { if (!isActive) setIntimacyExpanded(e => !e) }}
                            className="w-full flex items-center gap-3 p-3 cursor-pointer btn-press text-left"
                          >
                            <span className="text-xl leading-none">❤️‍🔥</span>
                            <div className="flex-1">
                              <div className={`text-xs font-black tracking-wider ${isActive ? 'text-[#FF2800]' : 'text-[#EDEDF0]'}`}>
                                {isActive ? `INTIMACY · ${mins}MIN · ${kcal}KCAL` : 'INTIMACY'}
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all
                              ${isActive ? 'bg-[#FF2800] border-[#FF2800] text-white' : 'border-[#2C2C38]'}`}>
                              {isActive && <span className="text-[10px] font-black">✓</span>}
                            </div>
                          </button>
                          {isActive && (
                            <div className="px-3 pb-3">
                              <button
                                onClick={() => logIntimacy(null)}
                                className="w-full py-2 rounded-lg bg-[#1E1E26] text-[#686870] text-[10px] font-black tracking-widest cursor-pointer btn-press">
                                CLEAR
                              </button>
                            </div>
                          )}
                          {!isActive && intimacyExpanded && (
                            <div className="px-3 pb-3 space-y-3">
                              <div>
                                <div className="text-[9px] font-black tracking-widest text-[#686870] mb-1">DURATION (minutes)</div>
                                <input
                                  type="number" inputMode="numeric" placeholder="15"
                                  value={intimacyMinsInput} onChange={e => setIntimacyMinsInput(e.target.value)}
                                  className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF2800] rounded-lg px-3 py-2 text-sm text-[#EDEDF0] outline-none"
                                />
                                {intimacyMinsInput && parseInt(intimacyMinsInput) > 0 && (
                                  <div className="text-[10px] text-[#FF2800] font-black mt-1">
                                    ≈ {Math.round(parseInt(intimacyMinsInput) * 4)} kcal burned
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setIntimacyExpanded(false); setIntimacyMinsInput('') }}
                                  className="flex-1 py-2 rounded-lg bg-[#1E1E26] text-[#686870] text-[10px] font-black tracking-widest cursor-pointer btn-press">
                                  CANCEL
                                </button>
                                <button
                                  disabled={!intimacyMinsInput || parseInt(intimacyMinsInput) <= 0}
                                  onClick={() => {
                                    logIntimacy(parseInt(intimacyMinsInput))
                                    setIntimacyExpanded(false); setIntimacyMinsInput('')
                                  }}
                                  className="flex-1 py-2 rounded-lg bg-[#FF2800] text-white text-[10px] font-black tracking-widest cursor-pointer btn-press disabled:opacity-40">
                                  LOG
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Cardio */}
                    {(() => {
                      const cardioLog = todayLog?.cardio ?? null
                      const isActive  = cardioLog !== null
                      const label     = isActive
                        ? `${cardioLog!.type === 'incline_walk' ? '⛰ INCLINE WALK' : '🔄 CROSS TRAINER'} · ${cardioLog!.minutes}MIN · ${cardioLog!.caloriesBurned}KCAL`
                        : 'CARDIO SESSION'
                      return (
                        <div className={`rounded-lg border transition-all ${isActive ? 'bg-[#0D7A3A22] border-[#1DB95433]' : 'bg-[#0D0D10] border-[#1E1E26]'}`}>
                          <button
                            onClick={() => {
                              if (isActive) return
                              setCardioExpanded(e => !e)
                            }}
                            className="w-full flex items-center gap-3 p-3 cursor-pointer btn-press text-left"
                          >
                            <span className="text-xl leading-none">🏃</span>
                            <div className="flex-1">
                              <div className={`text-xs font-black tracking-wider ${isActive ? 'text-[#1DB954]' : 'text-[#EDEDF0]'}`}>
                                {label}
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all
                              ${isActive ? 'bg-[#1DB954] border-[#1DB954] text-[#070709]' : 'border-[#2C2C38]'}`}>
                              {isActive && <span className="text-[10px] font-black">✓</span>}
                            </div>
                          </button>
                          {isActive && (
                            <div className="px-3 pb-3">
                              <button
                                onClick={() => logCardio(null)}
                                className="w-full py-2 rounded-lg bg-[#1E1E26] text-[#686870] text-[10px] font-black tracking-widest cursor-pointer btn-press">
                                CLEAR
                              </button>
                            </div>
                          )}
                          {!isActive && cardioExpanded && (
                            <div className="px-3 pb-3 space-y-3">
                              <div className="flex gap-2">
                                {(['incline_walk', 'cross_trainer'] as const).map(t => (
                                  <button
                                    key={t}
                                    onClick={() => setCardioType(t)}
                                    className="flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest cursor-pointer btn-press transition-all"
                                    style={{
                                      background: cardioType === t ? '#1DB95422' : '#0D0D10',
                                      border:     `1px solid ${cardioType === t ? '#1DB954' : '#1E1E26'}`,
                                      color:      cardioType === t ? '#1DB954' : '#686870',
                                    }}>
                                    {t === 'incline_walk' ? '⛰ INCLINE WALK' : '🔄 CROSS TRAINER'}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <div className="text-[9px] font-black tracking-widest text-[#686870] mb-1">MINUTES</div>
                                  <input
                                    type="number" inputMode="numeric" placeholder="30"
                                    value={cardioMinsInput} onChange={e => setCardioMinsInput(e.target.value)}
                                    className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#1DB954] rounded-lg px-3 py-2 text-sm text-[#EDEDF0] outline-none"
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="text-[9px] font-black tracking-widest text-[#686870] mb-1">KCAL BURNED</div>
                                  <input
                                    type="number" inputMode="numeric" placeholder="400"
                                    value={cardioKcalInput} onChange={e => setCardioKcalInput(e.target.value)}
                                    className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#1DB954] rounded-lg px-3 py-2 text-sm text-[#EDEDF0] outline-none"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setCardioExpanded(false); setCardioMinsInput(''); setCardioKcalInput('') }}
                                  className="flex-1 py-2 rounded-lg bg-[#1E1E26] text-[#686870] text-[10px] font-black tracking-widest cursor-pointer btn-press">
                                  CANCEL
                                </button>
                                <button
                                  disabled={!cardioMinsInput || !cardioKcalInput}
                                  onClick={() => {
                                    logCardio({ type: cardioType, minutes: parseInt(cardioMinsInput), caloriesBurned: parseInt(cardioKcalInput) })
                                    setCardioExpanded(false); setCardioMinsInput(''); setCardioKcalInput('')
                                  }}
                                  className="flex-1 py-2 rounded-lg bg-[#1DB954] text-[#070709] text-[10px] font-black tracking-widest cursor-pointer btn-press disabled:opacity-40">
                                  SAVE CARDIO
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )
            })()}

            {/* Macros */}
            <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">MACROS</span>
                <Link href="/nutrition" className="text-[10px] font-black text-[#FF2800] cursor-pointer tracking-widest">LOG MEAL →</Link>
              </div>
              <div className="flex gap-3">
                <MacroBar label="PROTEIN" val={totalPro}  max={TARGETS.protein} color="#FF2800" />
                <MacroBar label="CARBS"   val={totalCarb} max={TARGETS.carbs}   color="#FF5500" />
                <MacroBar label="FAT"     val={totalFat}  max={TARGETS.fat}     color="#D4A017" />
              </div>
            </div>
          </>
        )}
      </div>
      <p className="text-center text-[8px] font-bold text-[#1E1E26] tracking-widest mt-4 pb-2 select-none">
        BUILD 20260520-v6
      </p>

      {/* ── Celebration overlay (portalled to escape PageTransition transform) ── */}
      {celebrating && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="confetti-dot absolute w-2.5 h-2.5 rounded-full"
              style={{
                background: ['#FF2800','#1DB954','#D4A017','#2196F3','#FF5500'][i % 5],
                left: `${8 + i * 9}%`,
                top: `${15 + (i % 4) * 18}%`,
                animationDelay: `${i * 0.07}s`,
              }} />
          ))}
          <div className={`${celebrateFading ? 'celebrate-fade' : 'celebrate-pop'} bg-[#070709ee] border-2 border-[#1DB954] rounded-2xl px-10 py-7 text-center`}
            style={{ boxShadow: '0 0 40px #1DB95444' }}>
            <div className="text-5xl mb-3">🔥</div>
            <div className="text-2xl font-black text-[#1DB954] tracking-wider">RINGS CLOSED</div>
            <div className="text-sm font-bold tracking-widest mt-1" style={{ color: '#1DB95488' }}>PERFECT DAY</div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Monthly rings calendar (portalled to escape PageTransition transform) ── */}
      {monthRingsOpen && createPortal(
        <MonthlyRingsOverlay
          dayLogs={dayLogs}
          todayKey={todayKey}
          maintenance={maintenance}
          onClose={() => setMonthRingsOpen(false)}
        />,
        document.body
      )}

      {/* ── Uncheck habit confirmation (portalled to escape PageTransition transform) ── */}
      {unCheckPending && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setUnCheckPending(null)} />
          <div style={{ position: 'fixed', zIndex: 201, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100vw - 3rem)', maxWidth: '24rem', maxHeight: '85vh', overflowY: 'auto' }}
            className="bg-[#111116] border border-[#2C2C38] rounded-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-4 border-b border-[#1E1E26]">
              <div className="text-[10px] font-black tracking-[0.3em] text-[#D4A017] mb-2">UNCHECK HABIT?</div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{unCheckPending.icon}</span>
                <span className="text-base font-black text-[#EDEDF0]">{unCheckPending.label}</span>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] text-[#686870] leading-relaxed">
                You already marked this as done. Are you sure you want to uncheck it?
              </p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setUnCheckPending(null)}
                className="flex-1 py-3 rounded-xl bg-[#1E1E26] text-[#686870] text-[11px] font-black tracking-widest cursor-pointer btn-press">
                GO BACK
              </button>
              <button
                onClick={() => { toggleHabit(unCheckPending.id); setUnCheckPending(null) }}
                className="flex-1 py-3 rounded-xl bg-[#D4A017] text-[#070709] text-[11px] font-black tracking-widest cursor-pointer btn-press">
                UNCHECK
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

    </div>
  )
}

function MonthlyRingsOverlay({
  dayLogs,
  todayKey,
  maintenance,
  onClose,
}: {
  dayLogs: Record<string, import('@/lib/store').DayLog>
  todayKey: string
  maintenance: number
  onClose: () => void
}) {
  const todayRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    todayRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' })
  }, [])

  function calcScore(dk: string): number {
    const log = dayLogs[dk]
    if (!log) return 0
    const workout = (log.workoutDone && log.selectedWorkoutId !== 'rest') ? 25 : 0
    const steps = Math.min((log.steps ?? 0) / 10000, 1) * 25
    const sleep = log.habits?.sleep ? 25 : 0
    const cal = log.meals.reduce((s: number, m: { calories: number }) => s + m.calories, 0)
    return Math.round(workout + steps + sleep + (cal > 0 && cal <= maintenance ? 25 : 0))
  }

  const today = new Date(todayKey)
  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (2 - i), 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const RS = 36, SW = 5.5

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: '#070709', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', paddingTop: 'calc(env(safe-area-inset-top) + 16px)', paddingRight: 16, paddingBottom: 0 } as React.CSSProperties}>
        <button onClick={onClose}
          style={{ width: 36, height: 36, borderRadius: '50%', background: '#2C2C38', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={16} color="#EDEDF0" />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 12px 100px' } as React.CSSProperties}>
        {months.map(({ year, month }) => {
          const label = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          const startDow = (new Date(year, month, 1).getDay() + 6) % 7
          const daysInMonth = new Date(year, month + 1, 0).getDate()
          const cells: (number | null)[] = [
            ...Array(startDow).fill(null),
            ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
          ]
          while (cells.length % 7 !== 0) cells.push(null)

          return (
            <div key={`${year}-${month}`} style={{ marginBottom: 36 }}>
              <div style={{ textAlign: 'center', color: '#EDEDF0', fontSize: 17, fontWeight: 900, marginBottom: 14 }}>
                {label}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
                {DOW.map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#2C2C38' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 10 }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />
                  const dk = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const isToday = dk === todayKey
                  const isFuture = dk > todayKey
                  const score = calcScore(dk)
                  const hasLog = !!dayLogs[dk]
                  const r = (RS - SW) / 2
                  const circ = 2 * Math.PI * r
                  const filled = score > 0 ? Math.max(circ * score / 100, SW) : 0

                  return (
                    <div key={dk} ref={isToday ? todayRef : undefined}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isToday ? '#FF2800' : 'transparent',
                        fontSize: 10, fontWeight: isToday ? 900 : 600,
                        color: isToday ? '#fff' : isFuture ? '#2C2C38' : '#686870',
                      }}>{day}</div>
                      <svg width={RS} height={RS} viewBox={`0 0 ${RS} ${RS}`}>
                        <circle cx={RS/2} cy={RS/2} r={r} fill="none"
                          stroke={isFuture ? '#111116' : hasLog ? '#FF280028' : '#1A1A1F'}
                          strokeWidth={SW} />
                        {!isFuture && filled > 0 && (
                          <circle cx={RS/2} cy={RS/2} r={r} fill="none" stroke="#FF2800" strokeWidth={SW}
                            strokeLinecap="round"
                            strokeDasharray={`${filled} ${circ}`}
                            transform={`rotate(-90 ${RS/2} ${RS/2})`} />
                        )}
                      </svg>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
