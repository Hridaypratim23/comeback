'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStore, TARGETS, DAILY_HABITS } from '@/lib/store'
import { Flame, Droplets, Trophy, Bell, ChevronRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import {
  requestNotificationPermission,
  buildDaySchedule,
  sendScheduleToSW,
} from '@/lib/notifications'
import { QUOTES, getQuoteByIndex } from '@/constants/quotes'
import QuoteTicker from '@/components/QuoteTicker'
import { getWorkoutById, REST_WORKOUT } from '@/constants/workouts'

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function CircularScore({
  label,
  score,
  pillars,
}: {
  label: string
  score: number
  pillars: { key: string; text: string; done: boolean }[]
}) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color = score >= 75 ? '#1DB954' : score >= 50 ? '#D4A017' : '#FF2800'

  return (
    <div className="flex-1 flex flex-col items-center gap-2.5">
      <div className="relative w-[88px] h-[88px]">
        <svg width="88" height="88" viewBox="0 0 88 88" className="overflow-visible">
          {/* Outer subtle glow ring */}
          <circle cx="44" cy="44" r={r} fill="none" stroke={score > 0 ? color : 'transparent'}
            strokeWidth="12" opacity="0.06" />
          {/* Track */}
          <circle cx="44" cy="44" r={r} fill="none" stroke="#1A1A22" strokeWidth="7" />
          {/* Progress arc */}
          <circle
            cx="44" cy="44" r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={score === 0 ? circ : offset}
            transform="rotate(-90 44 44)"
            style={{
              transition: 'stroke-dashoffset 0.85s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease',
              filter: score > 0 ? `drop-shadow(0 0 6px ${color}99)` : 'none',
            }}
          />
        </svg>
        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <span className="text-[27px] font-black leading-none tabular-nums" style={{ color: score > 0 ? '#EDEDF0' : '#2C2C38' }}>
            {score}
          </span>
          <span className="text-[9px] font-black tracking-[0.2em] text-[#686870] -mt-0.5">%</span>
        </div>
      </div>

      {/* Label */}
      <span className="text-[9px] font-black tracking-[0.3em] text-[#686870]">{label}</span>

      {/* 2×2 pillar grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 w-full">
        {pillars.map(({ key, text, done }) => (
          <div key={key} className="flex items-center gap-1.5 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-500"
              style={{ backgroundColor: done ? color : '#2C2C38' }} />
            <span className={`text-[8px] font-black tracking-wider truncate transition-colors duration-500 ${done ? 'text-[#EDEDF0]' : 'text-[#2C2C38]'}`}>
              {text}
            </span>
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
  const { stats, dayLogs, getOrCreateToday, setSteps, toggleHabit, setFastingHours } = useStore()
  const [stepsInput, setStepsInput] = useState('')
  const [mounted, setMounted] = useState(false)
  const [ifExpanded, setIfExpanded] = useState(false)
  const [ifHours, setIfHours] = useState(16)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(false)
  const [now, setNow] = useState(new Date())
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [quoteVisible, setQuoteVisible] = useState(true)
  const [weekShift, setWeekShift] = useState(0) // 0 = current week, -1 = prev, etc.
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    setMounted(true)
    getOrCreateToday()
    if (typeof Notification !== 'undefined') setNotifPermission(Notification.permission)
    const d = new Date()
    setQuoteIdx((d.getHours() + d.getDate() * 3) % QUOTES.length)
    setSelectedDate(d.toISOString().split('T')[0])
    const tick = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(tick)
  }, [getOrCreateToday])

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteVisible(false)
      setTimeout(() => { setQuoteIdx(i => (i + 1) % QUOTES.length); setQuoteVisible(true) }, 420)
    }, 7_000)
    return () => clearInterval(id)
  }, [])

  const advanceQuote = useCallback(() => {
    setQuoteVisible(false)
    setTimeout(() => { setQuoteIdx(i => (i + 1) % QUOTES.length); setQuoteVisible(true) }, 420)
  }, [])

  if (!mounted || !selectedDate) return null

  const todayKey = now.toISOString().split('T')[0]
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
    const dk = d.toISOString().split('T')[0]
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
        isWorkoutDay,
        workoutLabel: workout.label,
        mealCount: todayLog?.meals.length ?? 0,
        totalCal: todayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0,
        calTarget: TARGETS.calories,
      })
      sendScheduleToSW(schedule)
    }
  }

  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
  const dayStr  = DAY_LABELS[now.getDay()]

  const selectedDateObj = new Date(selectedDate + 'T12:00:00')
  const selectedDateLabel = selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }).toUpperCase()

  // ── Score calculations ─────────────────────────────────────────────────
  const maintenance = Math.round((370 + 21.6 * (stats.weight * (1 - stats.bodyFat / 100))) * 1.55)
  const todayCal   = todayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0
  const todaySteps = todayLog?.steps ?? 0

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
    return d.toISOString().split('T')[0]
  }).filter(dk => dk <= todayKey)
  const curWeekLogs = curWeekKeys.map(dk => dayLogs[dk]).filter(Boolean)

  const weekWorkouts = curWeekLogs.filter(d => d.workoutDone).length
  const weekStepDays = curWeekLogs.filter(d => d.steps >= 10000).length
  const weekSleepDays = curWeekLogs.filter(d => d.habits?.sleep).length
  const weekGoodDays  = curWeekLogs.filter(d => {
    const cal = d.meals.reduce((s, m) => s + m.calories, 0)
    return d.habits?.nojunk && (cal === 0 || cal <= maintenance)
  }).length
  const weeklyScore = Math.round(
    Math.min(weekWorkouts / 5, 1) * 25 +
    Math.min(weekStepDays / 5, 1) * 25 +
    Math.min(weekSleepDays / 7, 1) * 25 +
    Math.min(weekGoodDays / 6, 1) * 25
  )

  return (
    <div className="pb-4 space-y-4">
      <QuoteTicker />

      <div className="px-4 space-y-4">
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
        <div>
          <p className="text-[10px] font-black tracking-widest text-[#686870] uppercase">{dateStr} · {dayStr}</p>
          <h1 className="text-5xl font-black tracking-[-0.04em] text-[#FF2800] leading-none mt-0.5 red-glow">COMEBACK</h1>
          <p className="text-[10px] font-black tracking-widest text-[#686870] mt-1.5">
            <span className="text-[#EDEDF0]">{stats.streak}</span> DAY STREAK · {stats.workoutsCompleted} WORKOUTS
          </p>
        </div>

        {/* ── Quote Block ── */}
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-5 cursor-pointer btn-press" onClick={advanceQuote}>
          <div className="min-h-[52px] flex flex-col justify-center">
            <p className={`text-xl font-black uppercase text-[#EDEDF0] leading-snug transition-opacity ${quoteVisible ? 'quote-enter' : 'quote-exit'}`}
              style={{ opacity: quoteVisible ? 1 : 0 }}>
              {getQuoteByIndex(quoteIdx)}
            </p>
          </div>
          <p className="text-[10px] font-black tracking-widest text-[#FF2800] mt-3">— MIND OF A WARRIOR</p>
          <p className="text-[9px] text-[#2C2C38] font-bold tracking-widest mt-1">TAP FOR NEXT</p>
        </div>

        {/* ── Score Rings ── */}
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl px-5 py-5">
          <div className="flex items-start gap-4">
            <CircularScore
              label="TODAY"
              score={dailyScore}
              pillars={[
                { key: 'workout', text: 'WORKOUT', done: dailyWorkout > 0 },
                { key: 'steps',   text: 'STEPS',   done: todaySteps >= 10000 },
                { key: 'sleep',   text: 'SLEEP',   done: dailySleep > 0 },
                { key: 'diet',    text: 'DIET',    done: dailyCal > 0 },
              ]}
            />
            <div className="w-px self-stretch bg-[#1E1E26]" />
            <CircularScore
              label="THIS WEEK"
              score={weeklyScore}
              pillars={[
                { key: 'wo',    text: `${weekWorkouts}/5 WO`,    done: weekWorkouts >= 5 },
                { key: 'steps', text: `${weekStepDays}/5 STEPS`, done: weekStepDays >= 5 },
                { key: 'sleep', text: `${weekSleepDays}/7 SLEEP`,done: weekSleepDays >= 7 },
                { key: 'diet',  text: `${weekGoodDays}/6 DIET`,  done: weekGoodDays >= 6 },
              ]}
            />
          </div>
        </div>

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

        {/* ── PAST DATE: Read-only journal entry ── */}
        {!isViewingToday && (
          <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4 space-y-3">
            <div className="text-[10px] font-black tracking-[0.3em] text-[#686870]">DAY SUMMARY</div>

            {!dayLog ? (
              <div className="py-4 text-center text-xs font-black text-[#2C2C38] tracking-widest">NO DATA LOGGED THIS DAY</div>
            ) : (
              <>
                {/* Workout */}
                <div className="flex items-center justify-between py-2 border-b border-[#1E1E26]">
                  <span className="text-[10px] font-black tracking-widest text-[#686870]">WORKOUT</span>
                  <span className={`text-xs font-black ${dayLog.workoutDone ? 'text-[#1DB954]' : 'text-[#686870]'}`}>
                    {dayLog.workoutDone ? 'DONE ✓' : 'NOT LOGGED'}
                  </span>
                </div>
                {/* Calories */}
                <div className="flex items-center justify-between py-2 border-b border-[#1E1E26]">
                  <span className="text-[10px] font-black tracking-widest text-[#686870]">CALORIES</span>
                  <span className="text-xs font-black text-[#FF5500]">
                    {totalCal > 0 ? `${totalCal} kcal` : '—'}
                  </span>
                </div>
                {/* Macros */}
                {totalCal > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-[#1E1E26]">
                    <span className="text-[10px] font-black tracking-widest text-[#686870]">MACROS</span>
                    <span className="text-[10px] font-black text-[#686870]">
                      P:{totalPro}g · C:{totalCarb}g · F:{totalFat}g
                    </span>
                  </div>
                )}
                {/* Water */}
                <div className="flex items-center justify-between py-2 border-b border-[#1E1E26]">
                  <span className="text-[10px] font-black tracking-widest text-[#686870]">WATER</span>
                  <span className="text-xs font-black text-[#2196F3]">
                    {dayLog.waterMl > 0 ? `${(dayLog.waterMl / 1000).toFixed(1)}L` : '—'}
                  </span>
                </div>
                {/* Steps */}
                <div className="flex items-center justify-between py-2 border-b border-[#1E1E26]">
                  <span className="text-[10px] font-black tracking-widest text-[#686870]">STEPS</span>
                  <span className="text-xs font-black text-[#EDEDF0]">
                    {dayLog.steps > 0 ? dayLog.steps.toLocaleString() : '—'}
                    {dayLog.steps >= 10000 && <span className="text-[#1DB954] ml-1">✓</span>}
                  </span>
                </div>
                {/* Habits */}
                <div className="py-2">
                  <span className="text-[10px] font-black tracking-widest text-[#686870] block mb-2">HABITS</span>
                  <div className="flex flex-wrap gap-1.5">
                    {DAILY_HABITS.map(h => {
                      const done = !!dayLog.habits?.[h.id]
                      return (
                        <span key={h.id}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border
                            ${done ? 'bg-[#0D7A3A22] border-[#1DB95433] text-[#1DB954]' : 'bg-[#0D0D10] border-[#1E1E26] text-[#2C2C38]'}`}>
                          {h.icon} {done ? '✓' : '✗'}
                        </span>
                      )
                    })}
                    {(dayLog.fastingHours ?? 0) > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border bg-[#0D7A3A22] border-[#1DB95433] text-[#1DB954]">
                        ⏱️ {dayLog.fastingHours}h fast ✓
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
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
                <div className="rounded-xl overflow-hidden border-l-4 border border-[#1E1E26] hover:red-border-glow transition-all btn-press"
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
                          <span className="px-3 py-1 rounded text-[10px] font-black tracking-wider bg-[#0D7A3A] text-[#1DB954]">DONE ✓</span>
                        ) : (
                          <span className="flex items-center gap-1 px-3 py-1 rounded text-[10px] font-black tracking-wider cursor-pointer"
                            style={{ background: `${workout.color}44`, color: workout.color }}>
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

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              <Link href="/nutrition" className="cursor-pointer">
                <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-3 hover:red-border-glow transition-all">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Flame size={14} className="text-[#FF5500]" />
                    <span className="text-[9px] font-black tracking-widest text-[#686870]">CALORIES</span>
                  </div>
                  <div className="text-xl font-black text-[#EDEDF0]">{totalCal}</div>
                  <div className="text-[10px] text-[#686870]">/ {TARGETS.calories}</div>
                  <div className="mt-2 h-1.5 bg-[#1E1E26] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF5500] rounded-full" style={{ width: `${Math.min((totalCal / TARGETS.calories) * 100, 100)}%` }} />
                  </div>
                </div>
              </Link>
              <Link href="/hydration" className="cursor-pointer">
                <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-3 hover:red-border-glow transition-all">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Droplets size={14} className="text-[#2196F3]" />
                    <span className="text-[9px] font-black tracking-widest text-[#686870]">WATER</span>
                  </div>
                  <div className="text-xl font-black text-[#EDEDF0]">{((todayLog?.waterMl ?? 0) / 1000).toFixed(1)}L</div>
                  <div className="text-[10px] text-[#686870]">/ 3.0L</div>
                  <div className="mt-2 h-1.5 bg-[#1E1E26] rounded-full overflow-hidden">
                    <div className="h-full bg-[#2196F3] rounded-full" style={{ width: `${waterPct}%` }} />
                  </div>
                </div>
              </Link>
              <Link href="/progress" className="cursor-pointer">
                <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-3 hover:red-border-glow transition-all">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Trophy size={14} className="text-[#D4A017]" />
                    <span className="text-[9px] font-black tracking-widest text-[#686870]">WORKOUTS</span>
                  </div>
                  <div className="text-xl font-black text-[#EDEDF0]">{stats.workoutsCompleted}</div>
                  <div className="text-[10px] text-[#686870]">total</div>
                  <div className="mt-2 h-1.5 bg-[#1E1E26] rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4A017] rounded-full" style={{ width: `${Math.min((stats.workoutsCompleted / 100) * 100, 100)}%` }} />
                  </div>
                </div>
              </Link>
            </div>

            {/* Steps */}
            {(() => {
              const steps = todayLog?.steps ?? 0
              const stepsPct = Math.min((steps / TARGETS.steps) * 100, 100)
              const stepsLeft = Math.max(TARGETS.steps - steps, 0)
              const commitSteps = () => {
                const n = parseInt(stepsInput)
                if (!n || n <= 0) return
                setSteps(n)           // always overwrite — manual entry is source of truth
                setStepsInput('')
              }
              return (
                <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👟</span>
                      <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">STEPS</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-[#EDEDF0]">{steps.toLocaleString()}</span>
                      <span className="text-[10px] text-[#686870] ml-1">/ 10,000</span>
                    </div>
                  </div>
                  <div className="h-2 bg-[#0D0D10] border border-[#1E1E26] rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-gradient-to-r from-[#1A6BB5] to-[#2196F3] rounded-full transition-all duration-700" style={{ width: `${stepsPct}%` }} />
                  </div>
                  {stepsPct < 100
                    ? <p className="text-[10px] text-[#686870] mb-3">{stepsLeft.toLocaleString()} steps to goal</p>
                    : <p className="text-[10px] font-black text-[#1DB954] mb-3">10K GOAL HIT ✓</p>
                  }
                  {/* Manual entry — always overwrites (source of truth) */}
                  <div className="space-y-1.5">
                    <div className="text-[9px] font-black tracking-widest text-[#686870]">
                      ENTER TODAY&apos;S TOTAL — overwrites current
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder={`Current: ${steps.toLocaleString()}`}
                        value={stepsInput}
                        onChange={e => setStepsInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && commitSteps()}
                        className="flex-1 bg-[#0D0D10] border border-[#1E1E26] focus:border-[#2196F3] rounded-lg px-3 py-1.5 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none transition-colors"
                      />
                      <button
                        onClick={commitSteps}
                        className="px-4 py-1.5 rounded-lg bg-[#2196F3] text-white text-[10px] font-black cursor-pointer active:scale-95 transition-all">
                        SAVE
                      </button>
                    </div>
                  </div>
                </div>
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
                        <button key={habit.id} onClick={() => toggleHabit(habit.id)}
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
    </div>
  )
}
