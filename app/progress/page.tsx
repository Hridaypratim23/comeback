'use client'

import { useState, useEffect } from 'react'
import { useStore, TARGETS } from '@/lib/store'
import { Edit3, Check, X } from 'lucide-react'
import type { Measurement } from '@/lib/store'

const MAIN_LIFTS = [
  { id: 'bench', name: 'BENCH PRESS' },
  { id: 'dl', name: 'DEADLIFT' },
  { id: 'squat', name: 'BACK SQUAT' },
  { id: 'ohp', name: 'OHP' },
  { id: 'pullup', name: 'PULL-UPS' },
]

function StatEditor({
  label,
  value,
  unit,
  onSave,
}: {
  label: string
  value: number
  unit: string
  onSave: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value.toString())

  const save = () => {
    const n = parseFloat(val)
    if (!isNaN(n) && n > 0) onSave(n)
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1E1E26] last:border-0">
      <span className="text-xs font-bold tracking-widest text-[#686870]">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={val}
            onChange={e => setVal(e.target.value)}
            className="w-20 bg-[#0D0D10] border border-[#FF2800] rounded px-2 py-1 text-sm font-black text-[#EDEDF0] text-right outline-none"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') setEditing(false)
            }}
          />
          <span className="text-xs text-[#686870]">{unit}</span>
          <button
            onClick={save}
            className="w-6 h-6 rounded-full bg-[#1DB954] text-[#070709] flex items-center justify-center cursor-pointer"
          >
            <Check size={12} />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="w-6 h-6 rounded-full bg-[#1E1E26] text-[#686870] flex items-center justify-center cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-[#EDEDF0]">
            {value}
            <span className="text-xs text-[#686870] ml-1">{unit}</span>
          </span>
          <button
            onClick={() => { setVal(value.toString()); setEditing(true) }}
            className="w-6 h-6 rounded-full bg-[#1E1E26] text-[#686870] hover:text-[#FF2800] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Edit3 size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

function LineChart({
  data,
  color,
  label,
  unit,
}: {
  data: Array<{ date: string; value: number }>
  color: string
  label: string
  unit: string
}) {
  if (data.length < 2) {
    return (
      <div className="py-6 text-center text-[#686870] text-xs font-bold">
        No history yet — update your stats to start tracking
      </div>
    )
  }

  const W = 300
  const H = 80
  const PAD = { top: 8, bottom: 20, left: 32, right: 8 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const values = data.map(d => d.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * innerW,
    y: PAD.top + innerH - ((d.value - minV) / range) * innerH,
    value: d.value,
    date: d.date,
  }))

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div>
      <div className="text-[10px] font-black tracking-widest mb-1" style={{ color }}>
        {label}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        <text x={PAD.left - 2} y={PAD.top + 4} textAnchor="end" fontSize="8" fill="#686870">{maxV.toFixed(1)}{unit}</text>
        <text x={PAD.left - 2} y={PAD.top + innerH} textAnchor="end" fontSize="8" fill="#686870">{minV.toFixed(1)}{unit}</text>
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
        ))}
        {pts.map((p, i) => (
          <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize="7" fill="#686870">
            {p.date.slice(5).replace('-', '/')}
          </text>
        ))}
      </svg>
    </div>
  )
}

// Katch-McArdle + moderate activity multiplier
function calcMaintenance(weight: number, bodyFat: number): number {
  const lbm = weight * (1 - bodyFat / 100)
  const bmr = 370 + 21.6 * lbm
  return Math.round(bmr * 1.55)
}

function ScoreBar({ label, value, max, color, count, target, unit }: {
  label: string
  value: number
  max: number
  color: string
  count: number
  target: number
  unit: string
}) {
  const pct = Math.min(value / max, 1) * 100
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-black tracking-widest text-[#686870]">{label}</span>
        <span className="text-[10px] font-black" style={{ color }}>
          {count}/{target} {unit}
        </span>
      </div>
      <div className="h-2 bg-[#0D0D10] border border-[#1E1E26] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const { stats, dayLogs, updateBodyStats, bodyHistory, prs, measurements, weeklyCheckins, addMeasurement, saveWeeklyCheckin } = useStore()
  const [mounted, setMounted] = useState(false)

  const [mChest, setMChest] = useState('')
  const [mWaist, setMWaist] = useState('')
  const [mHips, setMHips] = useState('')
  const [mLeftArm, setMLeftArm] = useState('')
  const [mRightArm, setMRightArm] = useState('')
  const [mLeftThigh, setMLeftThigh] = useState('')
  const [measureSaved, setMeasureSaved] = useState(false)

  const [ciRating, setCiRating] = useState(0)
  const [ciWeight, setCiWeight] = useState('')
  const [ciIntention, setCiIntention] = useState('')
  const [ciSaved, setCiSaved] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCiWeight(stats.weight.toString())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!mounted) return null

  const today = new Date().toISOString().split('T')[0]
  const nowDate = new Date()
  const maintenance = calcMaintenance(stats.weight, stats.bodyFat)

  // ── Weekly score (Mon–Sun of current week) ────────────────────────────────
  const weekStartDate = new Date(nowDate)
  const dayOfWeek = nowDate.getDay()
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  weekStartDate.setDate(nowDate.getDate() + diffToMon)
  weekStartDate.setHours(0, 0, 0, 0)

  const weekDayKeys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate)
    d.setDate(weekStartDate.getDate() + i)
    return d.toISOString().split('T')[0]
  }).filter(dk => dk <= today)

  const weekLogs = weekDayKeys.map(dk => dayLogs[dk]).filter(Boolean)

  const weekWorkouts = weekLogs.filter(d => d.workoutDone).length
  const weekStepDays = weekLogs.filter(d => d.steps >= 10000).length
  const weekSleepDays = weekLogs.filter(d => d.habits?.sleep).length
  const weekGoodNutritionDays = weekLogs.filter(d => {
    const cal = d.meals.reduce((s, m) => s + m.calories, 0)
    return d.habits?.nojunk && (cal === 0 || cal <= maintenance)
  }).length
  const weekTotalSteps = weekLogs.reduce((s, d) => s + (d.steps ?? 0), 0)
  const weekCalsBurned = Math.round((weekTotalSteps / 10000) * 500)
  const weekFastingHours = weekLogs.reduce((s, d) => s + (d.fastingHours ?? 0), 0)

  const weeklyWorkoutPct = Math.min(weekWorkouts / 5, 1) * 25
  const weeklyStepsPct = Math.min(weekStepDays / 5, 1) * 25
  const weeklySleepPct = Math.min(weekSleepDays / 7, 1) * 25
  const weeklyNutritionPct = Math.min(weekGoodNutritionDays / 6, 1) * 25
  const weeklyScore = Math.round(weeklyWorkoutPct + weeklyStepsPct + weeklySleepPct + weeklyNutritionPct)

  // ── Daily score (today) ───────────────────────────────────────────────────
  const todayLog = dayLogs[today]
  const todayCal = todayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0
  const todaySteps = todayLog?.steps ?? 0

  const dailyWorkout = (todayLog?.workoutDone ? 25 : 0)
  const dailySteps = Math.min(todaySteps / 10000, 1) * 25
  const dailySleep = (todayLog?.habits?.sleep ? 25 : 0)
  const dailyCal = (todayCal > 0 && todayCal <= maintenance) ? 25 : 0
  const dailyScore = Math.round(dailyWorkout + dailySteps + dailySleep + dailyCal)

  // ── 7-day activity chart (actual dates) ──────────────────────────────────
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dk = d.toISOString().split('T')[0]
    const log = dayLogs[dk]
    const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`
    const steps = log?.steps ?? 0
    const workoutDone = log?.workoutDone ?? false
    const barScore = (workoutDone ? 50 : 0) + Math.min(steps / 10000, 1) * 50
    return { dk, label: dateLabel, isToday: dk === today, workoutDone, steps, barScore }
  })

  // ── Monthly summary ──────────────────────────────────────────────────────
  const monthPrefix = today.slice(0, 7)
  const monthName = nowDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  const monthDayLogs = Object.values(dayLogs).filter(d => d.date.startsWith(monthPrefix))
  const workoutsThisMonth = monthDayLogs.filter(d => d.workoutDone).length
  const calDays = monthDayLogs.filter(d => d.meals.length > 0)
  const avgCal = calDays.length > 0
    ? Math.round(calDays.reduce((s, d) => s + d.meals.reduce((ms, m) => ms + m.calories, 0), 0) / calDays.length)
    : null
  const waterDays = monthDayLogs.filter(d => d.waterMl > 0)
  const avgWater = waterDays.length > 0
    ? Math.round(waterDays.reduce((s, d) => s + d.waterMl, 0) / waterDays.length)
    : null
  const stepDaysArr = monthDayLogs.filter(d => d.steps > 0)
  const avgSteps = stepDaysArr.length > 0
    ? Math.round(stepDaysArr.reduce((s, d) => s + d.steps, 0) / stepDaysArr.length)
    : null
  const monthBodyHistory = bodyHistory.filter(e => e.date.startsWith(monthPrefix)).sort((a, b) => a.date.localeCompare(b.date))
  let weightChange: number | null = null
  if (monthBodyHistory.length >= 2) {
    weightChange = parseFloat((monthBodyHistory[monthBodyHistory.length - 1].weight - monthBodyHistory[0].weight).toFixed(1))
  }
  const hasMonthData = workoutsThisMonth > 0 || avgCal !== null || avgWater !== null || avgSteps !== null

  // ── Weekly check-in visibility ────────────────────────────────────────────
  const isSunday = nowDate.getDay() === 0
  const lastCheckin = weeklyCheckins.length > 0 ? weeklyCheckins[weeklyCheckins.length - 1] : null
  const lastCheckinAge = lastCheckin
    ? (nowDate.getTime() - new Date(lastCheckin.date).getTime()) / (1000 * 60 * 60 * 24)
    : Infinity
  const showCheckin = isSunday || lastCheckinAge > 6

  const weightChartData = bodyHistory.map(e => ({ date: e.date, value: e.weight }))
  const bfChartData = bodyHistory.map(e => ({ date: e.date, value: e.bodyFat }))
  const bodyFatGoal = 15

  const saveBodyStats = (key: 'weight' | 'bodyFat') => (v: number) => {
    updateBodyStats(key === 'weight' ? v : stats.weight, key === 'bodyFat' ? v : stats.bodyFat)
  }

  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-black tracking-[0.35em] text-[#686870]">YOUR JOURNEY</p>
        <h1 className="text-3xl font-black text-[#EDEDF0] leading-none mt-0.5">GAINS</h1>
      </div>

      {/* ── DAILY SCORE ─────────────────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-black tracking-[0.3em] text-[#686870]">TODAY&apos;S SCORE</div>
          <div className="text-2xl font-black text-[#FF2800]">{dailyScore}%</div>
        </div>
        {/* Master bar */}
        <div className="h-3 bg-[#0D0D10] border border-[#1E1E26] rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${dailyScore}%`,
              background: dailyScore >= 75 ? '#1DB954' : dailyScore >= 50 ? '#D4A017' : '#FF2800',
            }}
          />
        </div>
        <div className="space-y-2.5">
          <ScoreBar label="WORKOUT" value={dailyWorkout} max={25} color="#FF2800" count={todayLog?.workoutDone ? 1 : 0} target={1} unit="done" />
          <ScoreBar label="10K STEPS" value={dailySteps} max={25} color="#2196F3" count={todaySteps} target={10000} unit="steps" />
          <ScoreBar label="7H SLEEP" value={dailySleep} max={25} color="#9B59B6" count={todayLog?.habits?.sleep ? 1 : 0} target={1} unit="done" />
          <ScoreBar label={`CALORIC DEFICIT (<${maintenance} kcal)`} value={dailyCal} max={25} color="#1DB954" count={todayCal} target={maintenance} unit="kcal" />
        </div>
        <div className="text-[9px] text-[#686870] mt-2">Maintenance: {maintenance} kcal · Target: {TARGETS.calories} kcal</div>
      </div>

      {/* ── WEEKLY SCORE ────────────────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-black tracking-[0.3em] text-[#686870]">THIS WEEK</div>
          <div className="text-2xl font-black text-[#D4A017]">{weeklyScore}%</div>
        </div>
        {/* Master bar */}
        <div className="h-3 bg-[#0D0D10] border border-[#1E1E26] rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${weeklyScore}%`,
              background: weeklyScore >= 75 ? '#1DB954' : weeklyScore >= 50 ? '#D4A017' : '#FF2800',
            }}
          />
        </div>
        <div className="space-y-2.5">
          <ScoreBar label="5 WORKOUTS" value={weeklyWorkoutPct} max={25} color="#FF2800" count={weekWorkouts} target={5} unit="days" />
          <ScoreBar label="10K STEPS × 5 DAYS" value={weeklyStepsPct} max={25} color="#2196F3" count={weekStepDays} target={5} unit="days" />
          <ScoreBar label="7H SLEEP × 7 DAYS" value={weeklySleepPct} max={25} color="#9B59B6" count={weekSleepDays} target={7} unit="days" />
          <ScoreBar label="CLEAN EAT × 6 DAYS" value={weeklyNutritionPct} max={25} color="#1DB954" count={weekGoodNutritionDays} target={6} unit="days" />
        </div>
        <div className="text-[9px] text-[#686870] mt-2">Clean day = no junk habit ✓ + calories ≤ maintenance</div>
      </div>

      {/* ── WEEKLY ACTIVITY STATS ───────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-3">WEEK IN NUMBERS</div>
        <div className="space-y-0">
          <div className="flex items-center justify-between py-2.5 border-b border-[#1E1E26]">
            <span className="text-[10px] font-black tracking-widest text-[#686870]">TOTAL STEPS</span>
            <span className="text-sm font-black text-[#2196F3]">{weekTotalSteps.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-[#1E1E26]">
            <span className="text-[10px] font-black tracking-widest text-[#686870]">CALS BURNED (STEPS)</span>
            <span className="text-sm font-black text-[#FF5500]">{weekCalsBurned.toLocaleString()} kcal</span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[10px] font-black tracking-widest text-[#686870]">FASTING HOURS</span>
            <div className="text-right">
              <span className="text-sm font-black text-[#1DB954]">{weekFastingHours}h</span>
              {weekFastingHours === 0 && (
                <span className="text-[10px] text-[#2C2C38] ml-1">log via habits</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-[9px] text-[#686870] mt-2">Resets Monday · 10,000 steps = 500 kcal</div>
      </div>

      {/* ── 7-DAY ACTIVITY (date labels) ────────────────────────────────────── */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-4">7-DAY ACTIVITY</div>
        <div className="flex items-end gap-1.5 h-20">
          {last7.map(({ dk, label, isToday, workoutDone, barScore }) => (
            <div key={dk} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm transition-all duration-500"
                style={{
                  height: `${Math.max(barScore, workoutDone ? 20 : 5)}%`,
                  background: workoutDone ? (isToday ? '#FF2800' : '#FF280066') : '#1E1E26',
                  minHeight: 4,
                }}
              />
              <span className={`text-[9px] font-black ${isToday ? 'text-[#FF2800]' : 'text-[#686870]'}`}>{label}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-[#686870] mt-2">
          <span>{last7.filter(d => d.workoutDone).length}/7 workouts</span>
          <span>{last7.filter(d => d.steps >= 10000).length}/7 days 10k steps</span>
        </div>
      </div>

      {/* Workout total stat */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-widest text-[#686870]">TOTAL WORKOUTS</div>
        <div className="text-3xl font-black text-[#FF2800] mt-1 leading-none">{stats.workoutsCompleted}</div>
        <div className="text-[10px] text-[#686870] mt-0.5">all time</div>
      </div>

      {/* Top Lifts / 1RM */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-3">TOP LIFTS · 1RM</div>
        <div className="grid grid-cols-2 gap-2">
          {MAIN_LIFTS.map(lift => {
            const pr = prs[lift.id]
            return (
              <div key={lift.id} className="bg-[#0D0D10] border border-[#1E1E26] rounded-lg p-3">
                <div className="text-[9px] font-black tracking-widest text-[#686870] mb-1">{lift.name}</div>
                {pr ? (
                  <>
                    <div className="text-sm font-black text-[#EDEDF0] leading-none">{pr.weight}kg × {pr.reps}</div>
                    <div className="text-[10px] text-[#D4A017] font-bold mt-0.5">1RM ~{pr.oneRM}kg</div>
                    <div className="text-[9px] text-[#686870] mt-0.5">{pr.date}</div>
                  </>
                ) : (
                  <div className="text-xl font-black text-[#2C2C38]">—</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Body Metrics */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-1">BODY METRICS</div>
        <div className="text-[10px] text-[#686870] mb-3">Tap the edit icon to update</div>
        <StatEditor label="WEIGHT" value={stats.weight} unit="kg" onSave={saveBodyStats('weight')} />
        <StatEditor label="BODY FAT" value={stats.bodyFat} unit="%" onSave={saveBodyStats('bodyFat')} />
        <div className="mt-3 pt-3 border-t border-[#1E1E26]">
          <div className="flex justify-between text-[10px] mb-2">
            <span className="font-bold text-[#686870]">BF% PROGRESS</span>
            <span className="font-black text-[#1DB954]">Goal: {bodyFatGoal}%</span>
          </div>
          <div className="h-2 bg-[#0D0D10] border border-[#1E1E26] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1DB954] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(((25 - stats.bodyFat) / (25 - bodyFatGoal)) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#686870] mt-1">
            <span>START: 22%</span>
            <span>NOW: {stats.bodyFat}%</span>
            <span>GOAL: {bodyFatGoal}%</span>
          </div>
        </div>
      </div>

      {/* Body Stats Charts */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4 space-y-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870]">BODY STATS HISTORY</div>
        <LineChart data={weightChartData} color="#2196F3" label="WEIGHT (kg)" unit="kg" />
        <LineChart data={bfChartData} color="#1DB954" label="BODY FAT (%)" unit="%" />
      </div>

      {/* Monthly Summary */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-0.5">MONTHLY SUMMARY</div>
        <div className="text-[9px] font-bold text-[#2C2C38] tracking-widest mb-4">{monthName}</div>
        {!hasMonthData ? (
          <div className="py-4 text-center text-xs font-black text-[#2C2C38] tracking-widest">NO DATA YET THIS MONTH</div>
        ) : (
          <div className="space-y-0">
            <div className="flex items-center justify-between py-2.5 border-b border-[#1E1E26]">
              <span className="text-[10px] font-black tracking-widest text-[#686870]">WORKOUTS</span>
              <span className="text-sm font-black text-[#FF2800]">{workoutsThisMonth}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-[#1E1E26]">
              <span className="text-[10px] font-black tracking-widest text-[#686870]">AVG CALORIES</span>
              <span className="text-sm font-black text-[#FF5500]">{avgCal !== null ? `${avgCal} kcal` : '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-[#1E1E26]">
              <span className="text-[10px] font-black tracking-widest text-[#686870]">AVG WATER</span>
              <span className="text-sm font-black text-[#2196F3]">{avgWater !== null ? `${(avgWater / 1000).toFixed(1)}L` : '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-[#1E1E26]">
              <span className="text-[10px] font-black tracking-widest text-[#686870]">AVG STEPS</span>
              <span className="text-sm font-black text-[#686870]">{avgSteps !== null ? avgSteps.toLocaleString() : '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[10px] font-black tracking-widest text-[#686870]">WEIGHT CHANGE</span>
              <span className="text-sm font-black" style={{ color: weightChange === null ? '#686870' : weightChange <= 0 ? '#1DB954' : '#FF2800' }}>
                {weightChange === null ? '—' : `${weightChange > 0 ? '+' : ''}${weightChange}kg`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Body Measurements */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-4">BODY MEASUREMENTS</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {([
            { label: 'CHEST', value: mChest, setter: setMChest },
            { label: 'WAIST', value: mWaist, setter: setMWaist },
            { label: 'HIPS', value: mHips, setter: setMHips },
            { label: 'LEFT ARM', value: mLeftArm, setter: setMLeftArm },
            { label: 'RIGHT ARM', value: mRightArm, setter: setMRightArm },
            { label: 'LEFT THIGH', value: mLeftThigh, setter: setMLeftThigh },
          ] as Array<{ label: string; value: string; setter: (v: string) => void }>).map(({ label, value, setter }) => (
            <div key={label}>
              <div className="text-[9px] font-black tracking-widest text-[#686870] mb-1">{label} <span className="text-[#2C2C38]">cm</span></div>
              <input
                type="number"
                inputMode="decimal"
                placeholder="—"
                value={value}
                onChange={e => setter(e.target.value)}
                className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF2800] rounded-lg px-3 py-2 text-sm text-[#EDEDF0] outline-none"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            const m: Omit<Measurement, 'date'> = {}
            if (mChest) m.chest = parseFloat(mChest)
            if (mWaist) m.waist = parseFloat(mWaist)
            if (mHips) m.hips = parseFloat(mHips)
            if (mLeftArm) m.leftArm = parseFloat(mLeftArm)
            if (mRightArm) m.rightArm = parseFloat(mRightArm)
            if (mLeftThigh) m.leftThigh = parseFloat(mLeftThigh)
            addMeasurement(m)
            setMChest(''); setMWaist(''); setMHips(''); setMLeftArm(''); setMRightArm(''); setMLeftThigh('')
            setMeasureSaved(true)
            setTimeout(() => setMeasureSaved(false), 2500)
          }}
          className="w-full py-2.5 rounded-lg bg-[#FF2800] text-white text-[10px] font-black tracking-widest cursor-pointer btn-press active:scale-95 transition-all mb-4"
        >
          {measureSaved ? 'SAVED ✓' : 'SAVE MEASUREMENTS'}
        </button>
        {measurements.length > 0 && (() => {
          const sorted = [...measurements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
          return (
            <div>
              <div className="text-[9px] font-black tracking-widest text-[#2C2C38] mb-2">RECENT ENTRIES</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-[#1E1E26]">
                      {['DATE', 'CHEST', 'WAIST', 'HIPS', 'ARMS', 'THIGH'].map(h => (
                        <th key={h} className="text-left pb-2 font-black tracking-widest text-[#686870] pr-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map(entry => (
                      <tr key={entry.date} className="border-b border-[#1E1E2660] last:border-0">
                        <td className="py-2 pr-2 font-bold text-[#686870]">{entry.date.slice(5)}</td>
                        <td className="py-2 pr-2 font-black text-[#EDEDF0]">{entry.chest ?? '—'}</td>
                        <td className="py-2 pr-2 font-black text-[#EDEDF0]">{entry.waist ?? '—'}</td>
                        <td className="py-2 pr-2 font-black text-[#EDEDF0]">{entry.hips ?? '—'}</td>
                        <td className="py-2 pr-2 font-black text-[#EDEDF0]">
                          {entry.leftArm ?? entry.rightArm ? `${entry.leftArm ?? '—'}/${entry.rightArm ?? '—'}` : '—'}
                        </td>
                        <td className="py-2 font-black text-[#EDEDF0]">{entry.leftThigh ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Weekly Check-in */}
      {showCheckin && (
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
          <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-4">WEEKLY CHECK-IN</div>
          {ciSaved ? (
            <div className="py-6 text-center text-sm font-black tracking-widest text-[#1DB954]">CHECK-IN SAVED ✓</div>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-[10px] font-black tracking-widest text-[#686870] mb-2">HOW WAS THIS WEEK?</div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setCiRating(n)}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-black transition-all cursor-pointer btn-press active:scale-95
                        ${ciRating === n ? 'bg-[#FF2800] border-[#FF2800] text-white' : 'bg-[#0D0D10] border-[#1E1E26] text-[#686870] hover:border-[#FF280066]'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <div className="text-[9px] font-black tracking-widest text-[#686870] mb-1">CURRENT WEIGHT <span className="text-[#2C2C38]">kg</span></div>
                <input
                  type="number"
                  inputMode="decimal"
                  value={ciWeight}
                  onChange={e => setCiWeight(e.target.value)}
                  className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF2800] rounded-lg px-3 py-2 text-sm text-[#EDEDF0] outline-none"
                />
              </div>
              <div className="mb-4">
                <div className="text-[9px] font-black tracking-widest text-[#686870] mb-1">INTENTION FOR NEXT WEEK</div>
                <textarea
                  rows={3}
                  value={ciIntention}
                  onChange={e => setCiIntention(e.target.value)}
                  placeholder="INTENTION FOR NEXT WEEK"
                  className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF2800] rounded-lg px-3 py-2 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none resize-none"
                />
              </div>
              <button
                onClick={() => {
                  if (!ciRating) return
                  const weight = parseFloat(ciWeight) || stats.weight
                  saveWeeklyCheckin({ rating: ciRating, weight, intention: ciIntention })
                  setCiSaved(true)
                }}
                className="w-full py-3 rounded-lg bg-[#FF2800] text-white text-[10px] font-black tracking-widest cursor-pointer btn-press active:scale-95 transition-all"
              >
                SAVE CHECK-IN
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
