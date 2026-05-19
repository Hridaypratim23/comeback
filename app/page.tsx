'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStore, TARGETS, XP_LEVEL, DAILY_HABITS } from '@/lib/store'
import { getTodayWorkout, WEEKLY_SCHEDULE } from '@/constants/workouts'
import { Flame, Droplets, Trophy, Bell, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import {
  requestNotificationPermission,
  buildDaySchedule,
  sendScheduleToSW,
} from '@/lib/notifications'
import { QUOTES, getQuoteByIndex } from '@/constants/quotes'
import QuoteTicker from '@/components/QuoteTicker'

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function MacroBar({
  label, val, max, color,
}: {
  label: string; val: number; max: number; color: string
}) {
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
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function HomePage() {
  const { stats, dayLogs, getOrCreateToday, addSteps, setSteps, toggleHabit } = useStore()
  const [stepsInput, setStepsInput] = useState('')
  const [stepsMode, setStepsMode] = useState<'add' | 'set'>('add')
  const [mounted, setMounted]                       = useState(false)
  const [notifPermission, setNotifPermission]       = useState<NotificationPermission>('default')
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(false)
  const [now, setNow]                               = useState(new Date())
  const [quoteIdx, setQuoteIdx]                     = useState(0)
  const [quoteVisible, setQuoteVisible]             = useState(true)

  useEffect(() => {
    setMounted(true)
    getOrCreateToday()
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission)
    }
    // seed initial quote from hour + date so it's consistent on load
    const d = new Date()
    setQuoteIdx((d.getHours() + d.getDate() * 3) % QUOTES.length)

    const tick = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(tick)
  }, [getOrCreateToday])

  // Auto-rotate quote every 7 seconds with fade
  useEffect(() => {
    const id = setInterval(() => {
      setQuoteVisible(false)
      setTimeout(() => {
        setQuoteIdx(i => (i + 1) % QUOTES.length)
        setQuoteVisible(true)
      }, 420)
    }, 7_000)
    return () => clearInterval(id)
  }, [])

  const advanceQuote = useCallback(() => {
    setQuoteVisible(false)
    setTimeout(() => {
      setQuoteIdx(i => (i + 1) % QUOTES.length)
      setQuoteVisible(true)
    }, 420)
  }, [])

  if (!mounted) return null

  const today    = now
  const todayKey = today.toISOString().split('T')[0]
  const dayLog   = dayLogs[todayKey]
  const workout  = getTodayWorkout()

  const totalCal  = dayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0
  const totalPro  = dayLog?.meals.reduce((s, m) => s + m.protein, 0) ?? 0
  const totalCarb = dayLog?.meals.reduce((s, m) => s + m.carbs, 0) ?? 0
  const totalFat  = dayLog?.meals.reduce((s, m) => s + m.fat, 0) ?? 0
  const waterPct  = Math.min(((dayLog?.waterMl ?? 0) / TARGETS.waterMl) * 100, 100)
  const xpInLevel = stats.totalXP % XP_LEVEL
  const xpPct     = (xpInLevel / XP_LEVEL) * 100

  const weekOffset = (today.getDay() + 6) % 7
  const weekDays   = Array.from({ length: 7 }, (_, i) => {
    const d  = new Date(today)
    d.setDate(today.getDate() - weekOffset + i)
    const dk = d.toISOString().split('T')[0]
    return {
      date: dk,
      label: DAY_LABELS[d.getDay()],
      isToday: dk === todayKey,
      done: dayLogs[dk]?.workoutDone ?? false,
    }
  })

  const currentHour  = now.getHours()
  const isWorkoutDay = workout.exercises.length > 0
  const workoutDone  = dayLog?.workoutDone ?? false
  const showStreakAlert = currentHour >= 18 && !workoutDone && stats.streak > 0 && isWorkoutDay

  const midnight  = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const msLeft    = midnight.getTime() - now.getTime()
  const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60))
  const minsLeft  = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60))

  const showNotifBanner =
    !notifBannerDismissed &&
    notifPermission === 'default' &&
    typeof Notification !== 'undefined'

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission()
    setNotifPermission(granted ? 'granted' : 'denied')
    if (granted) {
      const schedule = buildDaySchedule({
        streak: stats.streak,
        waterMl: dayLog?.waterMl ?? 0,
        waterTarget: TARGETS.waterMl,
        workoutDone,
        isWorkoutDay,
        workoutLabel: workout.label,
        mealCount: dayLog?.meals.length ?? 0,
        totalCal,
        calTarget: TARGETS.calories,
      })
      sendScheduleToSW(schedule)
    }
  }

  const dateStr = today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }).toUpperCase()
  const dayStr  = DAY_LABELS[today.getDay()]
  const estDate = today.toISOString().split('T')[0]

  return (
    <div className="pb-4 space-y-4">
      {/* ── Quote Ticker ── */}
      <QuoteTicker />

      <div className="px-4 space-y-4">
        {/* ── Streak Death Alert ── */}
        {showStreakAlert && (
          <div className="animate-pulse-red rounded-xl border-2 border-[#FF2800] bg-[#FF280015] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black tracking-widest text-[#FF2800] mb-1">
                  ⚠ STREAK AT RISK — DANGER ZONE
                </div>
                <div className="text-base font-black text-[#EDEDF0]">
                  YOUR {stats.streak}-DAY STREAK DIES IN {hoursLeft}H {minsLeft}M.
                  MOVE.
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
                <div className="text-[11px] font-black tracking-widest text-[#EDEDF0] mb-1">
                  ENABLE NOTIFICATIONS
                </div>
                <div className="text-[10px] text-[#686870] leading-relaxed mb-3">
                  GET HIT AT 6AM. HOURLY WATER CHECKS. STREAK WARNINGS. MINDSET INJECTIONS.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleEnableNotifications}
                    className="flex-1 py-2 rounded-lg bg-[#FF2800] text-white text-[10px] font-black tracking-widest cursor-pointer btn-press"
                  >
                    ENABLE
                  </button>
                  <button
                    onClick={() => setNotifBannerDismissed(true)}
                    className="flex-1 py-2 rounded-lg bg-[#1E1E26] text-[#686870] text-[10px] font-black tracking-widest cursor-pointer btn-press"
                  >
                    NOT NOW
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div>
          <p className="text-[10px] font-black tracking-widest text-[#686870] uppercase">
            {dateStr} · {dayStr}
          </p>
          <h1 className="text-5xl font-black tracking-[-0.04em] text-[#FF2800] leading-none mt-0.5 red-glow">
            COMEBACK
          </h1>
          <p className="text-[10px] font-black tracking-widest text-[#686870] mt-1.5">
            EST. {estDate} · LEVEL{' '}
            <span className="text-[#FF2800] red-glow">{stats.level}</span>
            {' · '}
            <span className="text-[#EDEDF0]">{stats.streak}</span> DAY STREAK
          </p>
        </div>

        {/* ── Rotating Quote Block ── */}
        <div
          className="bg-[#111116] border border-[#1E1E26] rounded-xl p-5 cursor-pointer btn-press"
          onClick={advanceQuote}
        >
          <div className="min-h-[52px] flex flex-col justify-center">
            <p
              className={`text-xl font-black uppercase text-[#EDEDF0] leading-snug transition-opacity ${
                quoteVisible ? 'quote-enter' : 'quote-exit'
              }`}
              style={{ opacity: quoteVisible ? 1 : 0 }}
            >
              {getQuoteByIndex(quoteIdx)}
            </p>
          </div>
          <p className="text-[10px] font-black tracking-widest text-[#FF2800] mt-3">
            — MIND OF A WARRIOR
          </p>
          <p className="text-[9px] text-[#2C2C38] font-bold tracking-widest mt-1">
            TAP FOR NEXT
          </p>
        </div>

        {/* ── XP Bar ── */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-black tracking-widest text-[#686870]">XP PROGRESS</span>
            <span className="text-[10px] font-black text-[#FF2800]">
              {xpInLevel} / {XP_LEVEL}
            </span>
          </div>
          <div className="h-3 bg-[#111116] border border-[#1E1E26] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D42B1A] to-[#FF2800] rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* ── Week Strip ── */}
        <div className="flex gap-1">
          {weekDays.map(({ label, isToday, done, date }) => {
            const w      = WEEKLY_SCHEDULE.find(x => x.day === label)
            const isRest = !w || w.exercises.length === 0
            return (
              <div
                key={date}
                className={`flex-1 flex flex-col items-center py-2 rounded-lg border transition-all
                  ${isToday
                    ? 'bg-[#111116] border-[#FF2800]'
                    : 'bg-[#0D0D10] border-[#1E1E26]'}`}
              >
                <span
                  className={`text-[9px] font-black tracking-wider ${
                    isToday ? 'text-[#EDEDF0]' : 'text-[#686870]'
                  }`}
                >
                  {label}
                </span>
                <div
                  className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center text-[8px] font-black
                    ${done ? 'bg-[#FF2800]' : isRest ? 'bg-[#1E1E26]' : 'border border-[#2C2C38]'}`}
                >
                  {done ? '✓' : isRest ? '—' : ''}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Today's Workout Card ── */}
        <Link href="/workout" className="block cursor-pointer">
          <div
            className="rounded-xl overflow-hidden border-l-4 border border-[#1E1E26] hover:red-border-glow transition-all btn-press"
            style={{ borderLeftColor: workout.color }}
          >
            <div
              className="p-4"
              style={{
                background: `linear-gradient(135deg, ${workout.color}33 0%, #111116 55%)`,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className="text-[10px] font-black tracking-[0.3em] uppercase mb-1"
                    style={{ color: workout.color }}
                  >
                    TODAY'S MISSION
                  </div>
                  <div className="text-2xl font-black text-[#EDEDF0] leading-none">
                    {workout.label}
                  </div>
                  <div className="text-xs text-[#686870] mt-1 tracking-wider font-bold">
                    {workout.muscles}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {dayLog?.workoutDone ? (
                    <span className="px-3 py-1 rounded text-[10px] font-black tracking-wider bg-[#0D7A3A] text-[#1DB954]">
                      DONE ✓
                    </span>
                  ) : (
                    <span
                      className="flex items-center gap-1 px-3 py-1 rounded text-[10px] font-black tracking-wider cursor-pointer"
                      style={{ background: `${workout.color}44`, color: workout.color }}
                    >
                      ATTACK <ChevronRight size={12} />
                    </span>
                  )}
                </div>
              </div>
              {workout.exercises.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {workout.exercises.slice(0, 4).map(ex => (
                    <span
                      key={ex.id}
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-[#686870] bg-[#0D0D10] border border-[#1E1E26]"
                    >
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
        </Link>

        {/* ── Stats Row ── */}
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
                <div
                  className="h-full bg-[#FF5500] rounded-full"
                  style={{ width: `${Math.min((totalCal / TARGETS.calories) * 100, 100)}%` }}
                />
              </div>
            </div>
          </Link>

          <Link href="/hydration" className="cursor-pointer">
            <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-3 hover:red-border-glow transition-all">
              <div className="flex items-center gap-1.5 mb-1">
                <Droplets size={14} className="text-[#2196F3]" />
                <span className="text-[9px] font-black tracking-widest text-[#686870]">WATER</span>
              </div>
              <div className="text-xl font-black text-[#EDEDF0]">
                {((dayLog?.waterMl ?? 0) / 1000).toFixed(1)}L
              </div>
              <div className="text-[10px] text-[#686870]">/ 3.0L</div>
              <div className="mt-2 h-1.5 bg-[#1E1E26] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2196F3] rounded-full"
                  style={{ width: `${waterPct}%` }}
                />
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
                <div
                  className="h-full bg-[#D4A017] rounded-full"
                  style={{ width: `${Math.min((stats.workoutsCompleted / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
          </Link>
        </div>

        {/* ── Steps ── */}
        {(() => {
          const steps = dayLog?.steps ?? 0
          const stepsPct = Math.min((steps / TARGETS.steps) * 100, 100)
          const stepsLeft = Math.max(TARGETS.steps - steps, 0)
          const commitSteps = () => {
            const n = parseInt(stepsInput)
            if (!n || n <= 0) return
            stepsMode === 'add' ? addSteps(n) : setSteps(n)
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
                <div className="h-full bg-gradient-to-r from-[#1A6BB5] to-[#2196F3] rounded-full transition-all duration-700"
                     style={{ width: `${stepsPct}%` }} />
              </div>
              {stepsPct < 100 && (
                <p className="text-[10px] text-[#686870] mb-3">{stepsLeft.toLocaleString()} steps to goal</p>
              )}
              {stepsPct >= 100 && (
                <p className="text-[10px] font-black text-[#1DB954] mb-3">10K GOAL HIT ✓</p>
              )}
              {/* Quick add */}
              <div className="flex gap-1.5 mb-2">
                {[1000, 2500, 5000, 7500].map(n => (
                  <button key={n} onClick={() => addSteps(n)}
                    className="flex-1 py-1.5 rounded-lg border border-[#2196F333] text-[10px] font-black text-[#2196F3] bg-[#0D0D10] hover:bg-[#2196F311] active:scale-95 transition-all cursor-pointer">
                    +{(n/1000).toFixed(n%1000===0?0:1)}K
                  </button>
                ))}
              </div>
              {/* Manual input */}
              <div className="flex gap-2 items-center">
                <div className="flex rounded-lg border border-[#1E1E26] overflow-hidden text-[10px] font-black">
                  <button onClick={() => setStepsMode('add')}
                    className={`px-2 py-1.5 transition-colors cursor-pointer ${stepsMode === 'add' ? 'bg-[#2196F3] text-white' : 'text-[#686870] bg-[#0D0D10]'}`}>
                    +ADD
                  </button>
                  <button onClick={() => setStepsMode('set')}
                    className={`px-2 py-1.5 transition-colors cursor-pointer ${stepsMode === 'set' ? 'bg-[#2196F3] text-white' : 'text-[#686870] bg-[#0D0D10]'}`}>
                    SET
                  </button>
                </div>
                <input type="number" inputMode="numeric" placeholder={stepsMode === 'add' ? 'Add steps...' : 'Set total...'}
                  value={stepsInput} onChange={e => setStepsInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && commitSteps()}
                  className="flex-1 bg-[#0D0D10] border border-[#1E1E26] focus:border-[#2196F3] rounded-lg px-3 py-1.5 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none transition-colors" />
                <button onClick={commitSteps}
                  className="px-4 py-1.5 rounded-lg bg-[#2196F3] text-white text-[10px] font-black cursor-pointer active:scale-95 transition-all">
                  LOG
                </button>
              </div>
            </div>
          )
        })()}

        {/* ── Daily Habits ── */}
        {(() => {
          const habits = dayLog?.habits ?? {}
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
                        <div className="text-[9px] text-[#686870]">+{habit.xp} XP</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all
                        ${done ? 'bg-[#1DB954] border-[#1DB954] text-[#070709]' : 'border-[#2C2C38]'}`}>
                        {done && <span className="text-[10px] font-black">✓</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ── Macros ── */}
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">MACROS</span>
            <Link href="/nutrition" className="text-[10px] font-black text-[#FF2800] cursor-pointer tracking-widest">
              LOG MEAL →
            </Link>
          </div>
          <div className="flex gap-3">
            <MacroBar label="PROTEIN" val={totalPro}  max={TARGETS.protein} color="#FF2800" />
            <MacroBar label="CARBS"   val={totalCarb} max={TARGETS.carbs}   color="#FF5500" />
            <MacroBar label="FAT"     val={totalFat}  max={TARGETS.fat}     color="#D4A017" />
          </div>
        </div>

        {/* ── Badges ── */}
        {stats.badges.length > 0 && (
          <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
            <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-3">BADGES</div>
            <div className="flex gap-2 flex-wrap">
              {stats.badges.map(b => (
                <span
                  key={b}
                  className="px-3 py-1 rounded text-xs font-black bg-[#17171D] border border-[#2C2C38] text-[#D4A017]"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
