'use client'

import { useEffect, useState } from 'react'
import { useStore, TARGETS, XP_LEVEL } from '@/lib/store'
import { getTodayWorkout, MOTIVATION, WEEKLY_SCHEDULE } from '@/constants/workouts'
import { Flame, Zap, Droplets, Target, ChevronRight, Trophy } from 'lucide-react'
import Link from 'next/link'

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function MacroBar({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  const pct = Math.min((val / max) * 100, 100)
  return (
    <div className="flex-1">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] font-bold tracking-widest text-[#686870]">{label}</span>
        <span className="text-xs font-black" style={{ color }}>{val}<span className="text-[10px] text-[#686870]">/{max}g</span></span>
      </div>
      <div className="h-1.5 bg-[#1E1E26] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function HomePage() {
  const { stats, dayLogs, getOrCreateToday } = useStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    getOrCreateToday()
  }, [getOrCreateToday])

  if (!mounted) return null

  const today = new Date()
  const todayKey = today.toISOString().split('T')[0]
  const dayLog = dayLogs[todayKey]
  const workout = getTodayWorkout()
  const dayName = DAY_LABELS[today.getDay()] as keyof typeof MOTIVATION
  const quote = MOTIVATION[dayName] ?? 'Show up. Every day.'

  const totalCal = dayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0
  const totalPro = dayLog?.meals.reduce((s, m) => s + m.protein, 0) ?? 0
  const totalCarb = dayLog?.meals.reduce((s, m) => s + m.carbs, 0) ?? 0
  const totalFat = dayLog?.meals.reduce((s, m) => s + m.fat, 0) ?? 0
  const waterPct = Math.min(((dayLog?.waterMl ?? 0) / TARGETS.waterMl) * 100, 100)
  const xpInLevel = stats.totalXP % XP_LEVEL
  const xpPct = (xpInLevel / XP_LEVEL) * 100

  const weekOffset = (today.getDay() + 6) % 7
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - weekOffset + i)
    const dk = d.toISOString().split('T')[0]
    return { date: dk, label: DAY_LABELS[d.getDay()], isToday: dk === todayKey, done: dayLogs[dk]?.workoutDone ?? false }
  })

  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-[0.3em] text-[#686870] uppercase">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <h1 className="text-4xl font-black tracking-[-0.03em] text-[#EDEDF0] leading-none mt-0.5">COMEBACK</h1>
          <p className="text-xs text-[#686870] mt-1 italic">"{quote}"</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold tracking-widest text-[#686870]">LEVEL</div>
          <div className="text-3xl font-black text-[#FF2800] leading-none">{stats.level}</div>
          <div className="text-[10px] text-[#686870]">{stats.streak}d streak</div>
        </div>
      </div>

      {/* XP Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold tracking-widest text-[#686870]">XP</span>
          <span className="text-[10px] font-bold text-[#FF2800]">{xpInLevel} / {XP_LEVEL}</span>
        </div>
        <div className="h-2 bg-[#111116] border border-[#1E1E26] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#D42B1A] to-[#FF2800] rounded-full transition-all duration-700"
               style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      {/* Week Strip */}
      <div className="flex gap-1">
        {weekDays.map(({ label, isToday, done, date }) => {
          const w = WEEKLY_SCHEDULE.find(x => x.day === label)
          const isRest = !w || w.exercises.length === 0
          return (
            <div key={date}
              className={`flex-1 flex flex-col items-center py-2 rounded-lg border transition-all
                ${isToday
                  ? 'bg-[#111116] border-[#FF2800]'
                  : 'bg-[#0D0D10] border-[#1E1E26]'}`}>
              <span className={`text-[9px] font-black tracking-wider ${isToday ? 'text-[#EDEDF0]' : 'text-[#686870]'}`}>{label}</span>
              <div className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center text-[8px] font-black
                ${done ? 'bg-[#FF2800]' : isRest ? 'bg-[#1E1E26]' : 'border border-[#2C2C38]'}`}>
                {done ? '✓' : isRest ? '—' : ''}
              </div>
            </div>
          )
        })}
      </div>

      {/* Today's Workout Card */}
      <Link href="/workout" className="block cursor-pointer">
        <div className="rounded-2xl overflow-hidden border border-[#1E1E26] hover:border-[#2C2C38] transition-colors">
          <div className="p-4" style={{ background: `linear-gradient(135deg, ${workout.color}22 0%, #111116 60%)` }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: workout.color }}>TODAY'S WORKOUT</div>
                <div className="text-2xl font-black text-[#EDEDF0] leading-none">{workout.label}</div>
                <div className="text-xs text-[#686870] mt-1">{workout.muscles}</div>
              </div>
              <div className="flex items-center gap-1">
                {dayLog?.workoutDone
                  ? <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider bg-[#0D7A3A] text-[#1DB954]">DONE ✓</span>
                  : <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-wider"
                           style={{ background: `${workout.color}33`, color: workout.color }}>
                      GO <ChevronRight size={12} />
                    </span>
                }
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
      </Link>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <Link href="/nutrition" className="cursor-pointer">
          <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-3 hover:border-[#2C2C38] transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame size={14} className="text-[#FF5500]" />
              <span className="text-[9px] font-black tracking-widest text-[#686870]">CALORIES</span>
            </div>
            <div className="text-xl font-black text-[#EDEDF0]">{totalCal}</div>
            <div className="text-[10px] text-[#686870]">/ {TARGETS.calories}</div>
            <div className="mt-2 h-1 bg-[#1E1E26] rounded-full overflow-hidden">
              <div className="h-full bg-[#FF5500] rounded-full" style={{ width: `${Math.min((totalCal / TARGETS.calories) * 100, 100)}%` }} />
            </div>
          </div>
        </Link>

        <Link href="/hydration" className="cursor-pointer">
          <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-3 hover:border-[#2C2C38] transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Droplets size={14} className="text-[#2196F3]" />
              <span className="text-[9px] font-black tracking-widest text-[#686870]">WATER</span>
            </div>
            <div className="text-xl font-black text-[#EDEDF0]">{((dayLog?.waterMl ?? 0) / 1000).toFixed(1)}L</div>
            <div className="text-[10px] text-[#686870]">/ 3.0L</div>
            <div className="mt-2 h-1 bg-[#1E1E26] rounded-full overflow-hidden">
              <div className="h-full bg-[#2196F3] rounded-full" style={{ width: `${waterPct}%` }} />
            </div>
          </div>
        </Link>

        <Link href="/progress" className="cursor-pointer">
          <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-3 hover:border-[#2C2C38] transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy size={14} className="text-[#D4A017]" />
              <span className="text-[9px] font-black tracking-widest text-[#686870]">WORKOUTS</span>
            </div>
            <div className="text-xl font-black text-[#EDEDF0]">{stats.workoutsCompleted}</div>
            <div className="text-[10px] text-[#686870]">total</div>
            <div className="mt-2 h-1 bg-[#1E1E26] rounded-full overflow-hidden">
              <div className="h-full bg-[#D4A017] rounded-full" style={{ width: `${Math.min((stats.workoutsCompleted / 100) * 100, 100)}%` }} />
            </div>
          </div>
        </Link>
      </div>

      {/* Macros */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">MACROS</span>
          <Link href="/nutrition" className="text-[10px] font-bold text-[#FF2800] cursor-pointer">LOG MEAL →</Link>
        </div>
        <div className="flex gap-3">
          <MacroBar label="PROTEIN" val={totalPro} max={TARGETS.protein} color="#FF2800" />
          <MacroBar label="CARBS" val={totalCarb} max={TARGETS.carbs} color="#FF5500" />
          <MacroBar label="FAT" val={totalFat} max={TARGETS.fat} color="#D4A017" />
        </div>
      </div>

      {/* Badges */}
      {stats.badges.length > 0 && (
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
          <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-3">BADGES</div>
          <div className="flex gap-2 flex-wrap">
            {stats.badges.map(b => (
              <span key={b} className="px-3 py-1 rounded-full text-xs font-black bg-[#17171D] border border-[#2C2C38] text-[#D4A017]">{b}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
