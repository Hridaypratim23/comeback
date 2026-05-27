'use client'

import { useState, useEffect, useRef } from 'react'
import { useStore, TARGETS } from '@/lib/store'
import { Edit3, Check, X, Share2, Image, FileText } from 'lucide-react'
import type { Measurement } from '@/lib/store'
import { shareAsImage, saveAsPDF } from '@/lib/exportReport'


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
  label: string; value: number; max: number; color: string
  count: number; target: number; unit: string
}) {
  const pct = Math.min(value / max, 1) * 100
  const done = pct >= 100
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[9px] font-black tracking-widest"
          style={{ color: pct > 0 ? '#EDEDF0' : '#686870' }}>{label}</span>
        <span className="text-[10px] font-black" style={{ color: done ? color : '#686870' }}>
          {done && '✓ '}{count}<span className="text-[9px] opacity-50">/{target} {unit}</span>
        </span>
      </div>
      <div className="h-2.5 bg-[#0D0D10] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 relative"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}55, ${color})` }}>
          <div className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.1) 0%,transparent 100%)' }} />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub: string; color: string
}) {
  return (
    <div className="bg-[#0D0D10] rounded-xl overflow-hidden" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm leading-none">{icon}</span>
          <span className="text-[8px] font-black tracking-widest text-[#686870]">{label}</span>
        </div>
        <div className="text-[24px] font-black leading-none text-[#EDEDF0] mb-1">{value}</div>
        <div className="text-[9px] text-[#686870]">{sub}</div>
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const { stats, dayLogs, updateBodyStats, bodyHistory, prs, measurements, addMeasurement, saveWeeklyCheckin } = useStore()
  const [mounted, setMounted] = useState(false)

  const [mChest, setMChest] = useState('')
  const [mWaist, setMWaist] = useState('')
  const [mHips, setMHips] = useState('')
  const [mLeftArm, setMLeftArm] = useState('')
  const [mRightArm, setMRightArm] = useState('')
  const [mLeftThigh, setMLeftThigh] = useState('')
  const [measureSaved, setMeasureSaved] = useState(false)

  const [ciWeight, setCiWeight] = useState('')
  const [ciSaved, setCiSaved] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [exporting, setExporting] = useState<'image' | 'pdf' | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const handleShareImage = async () => {
    if (!reportRef.current) return
    setExporting('image')
    try { await shareAsImage(reportRef.current) } finally { setExporting(null); setShowShareMenu(false) }
  }
  const handleSavePDF = async () => {
    if (!reportRef.current) return
    setExporting('pdf')
    try { await saveAsPDF(reportRef.current) } finally { setExporting(null); setShowShareMenu(false) }
  }

  useEffect(() => {
    setMounted(true)
    setCiWeight(stats.weight.toString())
    const todayEntry = measurements.find(m => m.date === new Date().toLocaleDateString('en-CA'))
    if (todayEntry) {
      if (todayEntry.chest != null) setMChest(todayEntry.chest.toString())
      if (todayEntry.waist != null) setMWaist(todayEntry.waist.toString())
      if (todayEntry.hips != null) setMHips(todayEntry.hips.toString())
      if (todayEntry.leftArm != null) setMLeftArm(todayEntry.leftArm.toString())
      if (todayEntry.rightArm != null) setMRightArm(todayEntry.rightArm.toString())
      if (todayEntry.leftThigh != null) setMLeftThigh(todayEntry.leftThigh.toString())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!mounted) return null

  const today = new Date().toLocaleDateString('en-CA')
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
    return d.toLocaleDateString('en-CA')
  }).filter(dk => dk <= today)

  const weekLogs = weekDayKeys.map(dk => dayLogs[dk]).filter(Boolean)

  const weekWorkouts = weekLogs.filter(d => d.workoutDone && d.selectedWorkoutId !== 'rest').length
  const weekStepDays = weekLogs.filter(d => d.steps >= 10000).length
  const weekSleepDays = weekLogs.filter(d => d.habits?.sleep).length
  const weekGoodNutritionDays = weekLogs.filter(d => {
    const cal = d.meals.reduce((s, m) => s + m.calories, 0)
    return d.habits?.nojunk && (cal === 0 || cal <= maintenance)
  }).length
  const weekCardioDays = weekLogs.filter(d => d.cardio != null).length
  const weekTotalSteps = weekLogs.reduce((s, d) => s + (d.steps ?? 0), 0)
  const dayBurned = (d: typeof weekLogs[0]) => {
    const isActualLift = !!(d.workoutDone && d.selectedWorkoutId && d.selectedWorkoutId !== 'rest')
    return (isActualLift ? 350 : 0)
      + (d.cardio?.caloriesBurned ?? 0)
      + Math.round((d.steps ?? 0) * stats.weight * 0.00057)
      + Math.round((d.intimacyMinutes ?? 0) * 4)
  }
  const weekCalsBurned = weekLogs.reduce((s, d) => s + dayBurned(d), 0)
  const weekFastingHours = weekLogs.reduce((s, d) => s + (d.fastingHours ?? 0), 0)

  const weeklyWorkoutPct = Math.min(weekWorkouts / 5, 1) * 20
  const weeklyStepsPct = Math.min(weekStepDays / 5, 1) * 20
  const weeklySleepPct = Math.min(weekSleepDays / 7, 1) * 20
  const weeklyNutritionPct = Math.min(weekGoodNutritionDays / 6, 1) * 20
  const weeklyCardioPct = Math.min(weekCardioDays / 3, 1) * 20
  const weeklyScore = Math.round(weeklyWorkoutPct + weeklyStepsPct + weeklySleepPct + weeklyNutritionPct + weeklyCardioPct)

  // ── Daily score (today) ───────────────────────────────────────────────────
  const todayLog = dayLogs[today]
  const todayCal = todayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0
  const todaySteps = todayLog?.steps ?? 0

  const dailyWorkout = (todayLog?.workoutDone ? 25 : 0)
  const dailySteps = Math.min(todaySteps / 10000, 1) * 25
  const dailySleep = (todayLog?.habits?.sleep ? 25 : 0)
  const dailyCal = (todayCal > 0 && todayCal <= maintenance) ? 25 : 0
  const dailyScore = Math.round(dailyWorkout + dailySteps + dailySleep + dailyCal)
  const dailyScoreColor = dailyScore >= 75 ? '#1DB954' : dailyScore >= 50 ? '#D4A017' : '#FF2800'
  const weekScoreColor  = weeklyScore >= 75 ? '#1DB954' : weeklyScore >= 50 ? '#D4A017' : '#FF2800'

  // ── 7-day activity chart (actual dates) ──────────────────────────────────
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dk = d.toLocaleDateString('en-CA')
    const log = dayLogs[dk]
    const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`
    const steps = log?.steps ?? 0
    const workoutDone = log?.workoutDone ?? false
    const barScore = (workoutDone ? 50 : 0) + Math.min(steps / 10000, 1) * 50
    const calories = log?.meals.reduce((s, m) => s + m.calories, 0) ?? 0
    return { dk, label: dateLabel, isToday: dk === today, workoutDone, steps, barScore, calories }
  })

  // ── Monthly summary ──────────────────────────────────────────────────────
  const monthPrefix = today.slice(0, 7)
  const monthName = nowDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  const monthDayLogs = Object.values(dayLogs).filter(d => d.date.startsWith(monthPrefix))
  const workoutsThisMonth = monthDayLogs.filter(d => d.workoutDone && d.selectedWorkoutId !== 'rest').length
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
  const monthTotalSteps = monthDayLogs.reduce((s, d) => s + (d.steps ?? 0), 0)
  const monthCalsBurned = monthDayLogs.reduce((s, d) => s + dayBurned(d), 0)
  const monthFastingHours = monthDayLogs.reduce((s, d) => s + (d.fastingHours ?? 0), 0)

  const weightChartData = bodyHistory.map(e => ({ date: e.date, value: e.weight }))
  const bfChartData = bodyHistory.map(e => ({ date: e.date, value: e.bodyFat }))
  const bodyFatGoal = 15

  const saveBodyStats = (key: 'weight' | 'bodyFat') => (v: number) => {
    updateBodyStats(key === 'weight' ? v : stats.weight, key === 'bodyFat' ? v : stats.bodyFat)
  }

  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.35em] text-[#686870]">YOUR JOURNEY</p>
          <h1 className="text-3xl font-black text-[#EDEDF0] leading-none mt-0.5">GAINS</h1>
        </div>
        <button
          onClick={() => setShowShareMenu(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#111116] border border-[#1E1E26] text-[9px] font-black tracking-widest text-[#686870] hover:text-[#FF2800] hover:border-[#FF2800] transition-colors cursor-pointer"
        >
          <Share2 size={11} />
          SHARE
        </button>
      </div>

      {/* ── Share menu ───────────────────────────────────────────────────────── */}
      {showShareMenu && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowShareMenu(false)}>
          <div
            className="w-full bg-[#111116] border-t border-[#1E1E26] rounded-t-2xl p-5 pb-10 max-w-lg mx-auto space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">EXPORT PROGRESS</span>
              <button onClick={() => setShowShareMenu(false)} className="w-7 h-7 rounded-full bg-[#1E1E26] flex items-center justify-center cursor-pointer">
                <X size={12} className="text-[#686870]" />
              </button>
            </div>
            <button
              onClick={handleShareImage}
              disabled={exporting !== null}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#0D0D10] border border-[#1E1E26] cursor-pointer hover:border-[#2196F3] transition-colors disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-xl bg-[#2196F322] flex items-center justify-center shrink-0">
                <Image size={16} className="text-[#2196F3]" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-[#EDEDF0]">{exporting === 'image' ? 'CAPTURING…' : 'SAVE AS IMAGE'}</div>
                <div className="text-[9px] text-[#686870] mt-0.5">PNG · Share on WhatsApp, Instagram, iMessage</div>
              </div>
            </button>
            <button
              onClick={handleSavePDF}
              disabled={exporting !== null}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#0D0D10] border border-[#1E1E26] cursor-pointer hover:border-[#FF2800] transition-colors disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FF280022] flex items-center justify-center shrink-0">
                <FileText size={16} className="text-[#FF2800]" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-[#EDEDF0]">{exporting === 'pdf' ? 'GENERATING…' : 'SAVE AS PDF'}</div>
                <div className="text-[9px] text-[#686870] mt-0.5">PDF · Email, Slack, Google Drive</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── DAILY SCORE ─────────────────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-2xl overflow-hidden">
        <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${dailyScoreColor} 60%, transparent)` }} />
        <div className="p-4">
          <p className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-4">TODAY&apos;S SCORE</p>

          <div className="flex gap-4 items-center mb-4">
            {/* Circular ring */}
            <div className="relative shrink-0" style={{ width: 92, height: 92 }}>
              <svg viewBox="0 0 92 92" width="92" height="92">
                <circle cx="46" cy="46" r="38" fill="none" stroke="#1E1E26" strokeWidth="8" />
                <circle cx="46" cy="46" r="38" fill="none"
                  stroke={dailyScoreColor} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(dailyScore / 100) * 238.8} 238.8`}
                  transform="rotate(-90 46 46)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[30px] font-black leading-none" style={{ color: dailyScoreColor }}>{dailyScore}</span>
                <span className="text-[9px] font-bold text-[#686870]">/ 100</span>
              </div>
            </div>

            {/* 2×2 pillar cards */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              {([
                { icon: '🏋️', label: 'WORKOUT', value: todayLog?.workoutDone ? 'DONE ✓' : '—', done: dailyWorkout >= 25, color: '#FF2800', pct: dailyWorkout / 25 },
                { icon: '👟', label: 'STEPS', value: todaySteps > 0 ? `${(todaySteps / 1000).toFixed(1)}K` : '—', done: dailySteps >= 25, color: '#2196F3', pct: dailySteps / 25 },
                { icon: '💤', label: 'SLEEP', value: todayLog?.habits?.sleep ? '7H ✓' : '—', done: dailySleep >= 25, color: '#9B59B6', pct: dailySleep / 25 },
                { icon: '🍽️', label: 'CALS', value: todayCal > 0 ? `${todayCal}` : '—', done: dailyCal >= 25, color: '#1DB954', pct: dailyCal / 25 },
              ] as { icon: string; label: string; value: string; done: boolean; color: string; pct: number }[]).map(({ icon, label, value, done, color, pct }) => (
                <div key={label} className="bg-[#0D0D10] rounded-xl p-2.5 border border-[#1E1E26] overflow-hidden relative">
                  <span className="text-[8px] font-black tracking-widest text-[#686870] block mb-1">{icon} {label}</span>
                  <span className="text-sm font-black" style={{ color: done ? color : '#686870' }}>{value}</span>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1E1E26]">
                    <div className="h-full transition-all duration-700" style={{ width: `${Math.min(pct, 1) * 100}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[9px] text-[#2C2C38] font-bold">Maintenance: {maintenance} kcal · Target: {TARGETS.calories} kcal</p>
        </div>
      </div>

      {/* ── THIS WEEK ────────────────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-2xl overflow-hidden">
        <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${weekScoreColor} 60%, transparent)` }} />
        <div className="p-4">
          {/* Header row with score */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">THIS WEEK</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black leading-none" style={{ color: weekScoreColor }}>{weeklyScore}</span>
              <span className="text-sm font-black text-[#686870]">/ 100</span>
            </div>
          </div>

          {/* Master bar */}
          <div className="h-2 bg-[#0D0D10] rounded-full overflow-hidden mb-4">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${weeklyScore}%`, background: `linear-gradient(90deg, ${weekScoreColor}88, ${weekScoreColor})` }} />
          </div>

          {/* Weekly dot matrix */}
          {(() => {
            const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
            const allDays = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(weekStartDate)
              d.setDate(weekStartDate.getDate() + i)
              const dk = d.toLocaleDateString('en-CA')
              const log = dayLogs[dk]
              const isFuture = dk > today
              return {
                dk, label: dayLabels[i], isFuture, isToday: dk === today,
                workout: !isFuture && !!(log?.workoutDone && log.selectedWorkoutId !== 'rest'),
                steps:   !isFuture && (log?.steps ?? 0) >= 10000,
                sleep:   !isFuture && !!(log?.habits?.sleep),
                hasLog:  !isFuture && !!log,
              }
            })
            return (
              <div className="bg-[#0D0D10] rounded-xl p-3 border border-[#1E1E26] mb-4">
                <div className="flex mb-2.5">
                  <div className="w-7" />
                  {allDays.map(({ label, isToday }, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className={`text-[9px] font-black ${isToday ? 'text-[#FF2800]' : 'text-[#686870]'}`}>{label}</span>
                    </div>
                  ))}
                </div>
                {([
                  { key: 'workout', icon: '🏋️', color: '#FF2800' },
                  { key: 'steps',   icon: '👟', color: '#2196F3' },
                  { key: 'sleep',   icon: '💤', color: '#9B59B6' },
                ] as { key: 'workout' | 'steps' | 'sleep'; icon: string; color: string }[]).map(({ key, icon, color }) => (
                  <div key={key} className="flex items-center mb-2 last:mb-0">
                    <div className="w-7 text-xs leading-none">{icon}</div>
                    {allDays.map(({ dk, isFuture, workout, steps, sleep, hasLog }) => {
                      const done = key === 'workout' ? workout : key === 'steps' ? steps : sleep
                      return (
                        <div key={dk} className="flex-1 flex justify-center">
                          {isFuture ? (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1E1E26' }} />
                          ) : hasLog ? (
                            <div className="w-2.5 h-2.5 rounded-full transition-all"
                              style={{ backgroundColor: done ? color : '#1E1E2699', boxShadow: done ? `0 0 6px ${color}66` : 'none' }} />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#1E1E26' }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )
          })()}

          <div className="space-y-2.5">
            <ScoreBar label="5 WORKOUTS" value={weeklyWorkoutPct} max={20} color="#FF2800" count={weekWorkouts} target={5} unit="days" />
            <ScoreBar label="10K STEPS × 5 DAYS" value={weeklyStepsPct} max={20} color="#2196F3" count={weekStepDays} target={5} unit="days" />
            <ScoreBar label="7H SLEEP × 7 DAYS" value={weeklySleepPct} max={20} color="#9B59B6" count={weekSleepDays} target={7} unit="days" />
            <ScoreBar label="CLEAN EAT × 6 DAYS" value={weeklyNutritionPct} max={20} color="#1DB954" count={weekGoodNutritionDays} target={6} unit="days" />
            <ScoreBar label="CARDIO × 3 DAYS" value={weeklyCardioPct} max={20} color="#FF5500" count={weekCardioDays} target={3} unit="days" />
          </div>
          <div className="text-[9px] text-[#686870] mt-3">Clean day = no junk ✓ + cal ≤ maintenance · Cardio = any session logged in LIFT tab</div>
        </div>
      </div>

      {/* ── WEEK IN NUMBERS ─────────────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">WEEK IN NUMBERS</span>
          <span className="text-[9px] font-bold text-[#2C2C38] tracking-widest">RESETS MONDAY</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard icon="🏋️" label="WORKOUTS" color="#FF2800"
            value={`${weekWorkouts}/5`}
            sub="sessions this week" />
          <StatCard icon="🔥" label="CALS BURNED" color="#FF5500"
            value={weekCalsBurned >= 1000 ? `${(weekCalsBurned / 1000).toFixed(1)}K` : `${weekCalsBurned}`}
            sub="lift + steps + cardio" />
          <StatCard icon="👟" label="TOTAL STEPS" color="#2196F3"
            value={weekTotalSteps >= 1000 ? `${(weekTotalSteps / 1000).toFixed(1)}K` : `${weekTotalSteps}`}
            sub={`${weekStepDays}/5 days hit 10K`} />
          <StatCard icon="⏱️" label="FASTING" color="#1DB954"
            value={weekFastingHours > 0 ? `${weekFastingHours}h` : '—'}
            sub={weekFastingHours > 0 ? 'total this week' : 'log via habits'} />
        </div>
      </div>

      {/* ── MONTH IN NUMBERS ────────────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">MONTH IN NUMBERS</span>
          <span className="text-[9px] font-bold text-[#2C2C38] tracking-widest">{monthName}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard icon="🏋️" label="WORKOUTS" color="#FF2800"
            value={`${workoutsThisMonth}`}
            sub="sessions this month" />
          <StatCard icon="🔥" label="CALS BURNED" color="#FF5500"
            value={monthCalsBurned >= 1000 ? `${(monthCalsBurned / 1000).toFixed(1)}K` : `${monthCalsBurned}`}
            sub="lift + steps + cardio" />
          <StatCard icon="👟" label="TOTAL STEPS" color="#2196F3"
            value={monthTotalSteps >= 10000 ? `${(monthTotalSteps / 1000).toFixed(1)}K` : `${monthTotalSteps}`}
            sub={`avg ${avgSteps !== null ? `${(avgSteps / 1000).toFixed(1)}K` : '—'} / day`} />
          <StatCard icon="⏱️" label="FASTING" color="#1DB954"
            value={monthFastingHours > 0 ? `${monthFastingHours}h` : '—'}
            sub={monthFastingHours > 0 ? 'total this month' : 'log via habits'} />
        </div>

        {/* Month highlights row */}
        <div className="mt-3 pt-3 border-t border-[#1E1E26] grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-[9px] font-black tracking-widest text-[#686870] mb-0.5">AVG CALS</div>
            <div className="text-sm font-black text-[#FF5500]">{avgCal !== null ? `${avgCal}` : '—'}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-black tracking-widest text-[#686870] mb-0.5">AVG WATER</div>
            <div className="text-sm font-black text-[#2196F3]">{avgWater !== null ? `${(avgWater / 1000).toFixed(1)}L` : '—'}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-black tracking-widest text-[#686870] mb-0.5">WEIGHT Δ</div>
            <div className="text-sm font-black" style={{ color: weightChange === null ? '#686870' : weightChange <= 0 ? '#1DB954' : '#FF2800' }}>
              {weightChange === null ? '—' : `${weightChange > 0 ? '+' : ''}${weightChange}kg`}
            </div>
          </div>
        </div>
      </div>

      {/* ── 7-DAY ACTIVITY ──────────────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">7-DAY ACTIVITY</span>
          <div className="flex items-center gap-3 text-[9px] text-[#686870]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2196F3] inline-block" />Steps</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF2800] inline-block" />Workout</span>
          </div>
        </div>
        <div className="text-[9px] text-[#2C2C38] font-bold tracking-widest mb-4">Full bar = 10,000 steps</div>

        {/* Chart area */}
        <div className="relative">
          {/* Dashed reference lines at 25 / 50 / 75 / 100% */}
          {[75, 50, 25].map(p => (
            <div key={p} className="absolute left-0 right-0 flex items-center" style={{ bottom: `${(p / 100) * 72}px` }}>
              <div className="flex-1 border-t border-dashed border-[#1E1E2666]" />
              <span className="text-[7px] text-[#2C2C38] font-bold ml-1 w-6 text-right">{(10000 * p / 100 / 1000).toFixed(0)}K</span>
            </div>
          ))}
          <div className="absolute left-0 right-0 flex items-center" style={{ bottom: 72 }}>
            <div className="flex-1 border-t border-dashed border-[#2196F344]" />
            <span className="text-[7px] text-[#2196F3] font-bold ml-1 w-6 text-right">10K</span>
          </div>

          {/* Bars */}
          <div className="flex items-end gap-1.5 pr-7" style={{ height: 110 }}>
            {last7.map(({ dk, label, isToday, workoutDone, steps }) => {
              const stepPct = Math.min(steps / 10000, 1)
              const barH = Math.round(stepPct * 72)
              const stepsLabel = steps >= 1000 ? `${(steps / 1000).toFixed(1)}K` : steps > 0 ? `${steps}` : ''
              return (
                <div key={dk} className="flex-1 flex flex-col items-center" style={{ height: 110 }}>
                  {/* Step label */}
                  <div style={{ height: 14 }} className="flex items-end justify-center mb-0.5">
                    {steps > 0 && (
                      <span className="text-[7px] font-black leading-none"
                        style={{ color: stepPct >= 1 ? '#2196F3' : '#686870' }}>{stepsLabel}</span>
                    )}
                  </div>
                  {/* Workout dot */}
                  <div style={{ height: 10 }} className="flex items-center justify-center">
                    {workoutDone && (
                      <div className="w-2 h-2 rounded-full bg-[#FF2800]"
                        style={{ boxShadow: '0 0 5px #FF280099' }} />
                    )}
                  </div>
                  {/* Bar */}
                  <div className="flex-1 flex items-end w-full">
                    <div className="w-full rounded-t-md transition-all duration-700"
                      style={{
                        height: barH > 0 ? barH : (steps > 0 ? 3 : 2),
                        background: stepPct >= 1
                          ? 'linear-gradient(180deg,#2196F3,#1470CC)'
                          : steps > 0
                          ? 'linear-gradient(180deg,#2196F344,#2196F322)'
                          : '#1E1E26',
                      }}
                    />
                  </div>
                  {/* Date */}
                  <span className={`text-[8px] font-black mt-1.5 ${isToday ? 'text-[#FF2800]' : 'text-[#686870]'}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary row */}
        <div className="flex justify-between text-[9px] text-[#686870] mt-3 pt-3 border-t border-[#1E1E26]">
          <span>🏋️ <span className="font-black text-[#FF2800]">{last7.filter(d => d.workoutDone && d.dk && dayLogs[d.dk]?.selectedWorkoutId !== 'rest').length}</span>/7 workouts</span>
          <span>👟 <span className="font-black text-[#2196F3]">{last7.filter(d => d.steps >= 10000).length}</span>/7 days 10K+</span>
          <span>Total <span className="font-black text-[#EDEDF0]">{last7.reduce((s, d) => s + d.steps, 0).toLocaleString()}</span> steps</span>
        </div>

        {/* Calorie trend */}
        {(() => {
          const calDays = last7.filter(d => d.calories > 0)
          if (calDays.length === 0) return null
          const maxCal = Math.max(...last7.map(d => d.calories), TARGETS.calories)
          const calAvg = Math.round(calDays.reduce((s, d) => s + d.calories, 0) / calDays.length)
          const H = 48
          const toY = (v: number) => H - Math.round((v / maxCal) * H)
          const targetY = toY(TARGETS.calories)
          const avgY = toY(calAvg)
          const pts = last7.map((d, i) => ({ x: Math.round((i / 6) * 100), y: d.calories > 0 ? toY(d.calories) : null, ...d }))
          const linePts = pts.filter(p => p.y !== null)
          return (
            <div className="mt-4 pt-4 border-t border-[#1E1E26]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black tracking-widest text-[#686870]">7-DAY CALORIE TREND</span>
                <span className="text-[9px] font-black" style={{ color: calAvg <= TARGETS.calories ? '#1DB954' : '#FF2800' }}>
                  avg {calAvg.toLocaleString()} kcal
                </span>
              </div>
              <svg viewBox={`0 0 100 ${H + 12}`} className="w-full" style={{ height: 72 }}>
                {/* Target line */}
                <line x1={0} y1={targetY} x2={100} y2={targetY} stroke="#1DB95444" strokeWidth="0.6" strokeDasharray="2,2" />
                {/* Average line */}
                <line x1={0} y1={avgY} x2={100} y2={avgY} stroke="#D4A01766" strokeWidth="0.8" strokeDasharray="3,2" />
                {/* Data line */}
                {linePts.length >= 2 && (
                  <polyline
                    points={linePts.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none" stroke="#FF5500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                )}
                {pts.map((p, i) => p.y !== null && (
                  <circle key={i} cx={p.x} cy={p.y!} r="2"
                    fill={p.calories <= TARGETS.calories ? '#1DB954' : '#FF2800'} />
                ))}
                {/* Date labels */}
                {last7.map((d, i) => (
                  <text key={i} x={Math.round((i / 6) * 100)} y={H + 10} textAnchor="middle" fontSize="5.5"
                    fill={d.isToday ? '#FF2800' : '#686870'}>{d.label}</text>
                ))}
              </svg>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1 text-[8px] text-[#686870]">
                  <svg width="12" height="4"><line x1="0" y1="2" x2="12" y2="2" stroke="#1DB954" strokeWidth="1" strokeDasharray="2,2"/></svg>
                  target {TARGETS.calories}
                </span>
                <span className="flex items-center gap-1 text-[8px] text-[#686870]">
                  <svg width="12" height="4"><line x1="0" y1="2" x2="12" y2="2" stroke="#D4A017" strokeWidth="1" strokeDasharray="3,2"/></svg>
                  7d avg {calAvg.toLocaleString()}
                </span>
              </div>
            </div>
          )
        })()}
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

      {/* Weight Tracker */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] font-black tracking-[0.3em] text-[#686870]">WEIGHT TRACKER</div>
          {bodyHistory.length > 0 && (
            <span className="text-[9px] text-[#686870]">
              Last: {bodyHistory[bodyHistory.length - 1].weight}kg · {bodyHistory[bodyHistory.length - 1].date.slice(5).replace('-', '/')}
            </span>
          )}
        </div>
        <div className="text-[9px] text-[#2C2C38] font-bold tracking-widest mb-4">LOG EVERY MONDAY MORNING</div>

        <LineChart data={weightChartData} color="#2196F3" label="WEIGHT (kg)" unit="kg" />

        <div className="mt-4">
          {ciSaved ? (
            <div className="py-3 text-center text-sm font-black tracking-widest text-[#1DB954]">LOGGED ✓</div>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                inputMode="decimal"
                value={ciWeight}
                onChange={e => setCiWeight(e.target.value)}
                placeholder="Enter weight"
                className="flex-1 bg-[#0D0D10] border border-[#1E1E26] focus:border-[#2196F3] rounded-lg px-3 py-2.5 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none"
              />
              <span className="text-[10px] text-[#686870] font-bold">kg</span>
              <button
                onClick={() => {
                  const weight = parseFloat(ciWeight)
                  if (!weight || weight <= 0) return
                  updateBodyStats(weight, stats.bodyFat)
                  setCiSaved(true)
                  setTimeout(() => { setCiSaved(false); setCiWeight('') }, 2000)
                }}
                className="px-5 py-2.5 rounded-lg bg-[#2196F3] text-white text-[10px] font-black tracking-widest cursor-pointer btn-press"
              >
                LOG
              </button>
            </div>
          )}
        </div>

        {/* Monthly weight dots */}
        {bodyHistory.length >= 2 && (() => {
          const recent = [...bodyHistory].slice(-12)
          const weights = recent.map(e => e.weight)
          const minW = Math.min(...weights)
          const maxW = Math.max(...weights)
          const range = maxW - minW || 1
          return (
            <div className="mt-4 pt-4 border-t border-[#1E1E26]">
              <div className="text-[9px] font-black tracking-widest text-[#2C2C38] mb-2">LAST {recent.length} ENTRIES</div>
              <div className="flex items-end gap-1.5 h-10">
                {recent.map((e, i) => {
                  const pct = ((e.weight - minW) / range)
                  const h = 8 + pct * 24
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-sm bg-[#2196F3]" style={{ height: h }} />
                      <span className="text-[7px] text-[#686870] font-bold">{e.date.slice(5).replace('-', '/')}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[9px] text-[#686870] mt-1">
                <span>{minW}kg</span>
                <span className="font-black text-[#2196F3]">{bodyHistory[bodyHistory.length - 1].weight}kg now</span>
                <span>{maxW}kg</span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── Hidden report card (captured by html-to-image for share/export) ── */}
      <div
        ref={reportRef}
        aria-hidden="true"
        style={{
          position: 'fixed', left: '-9999px', top: 0,
          width: 390, background: '#070709',
          color: '#EDEDF0',
          fontFamily: 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
          padding: '28px 20px 32px', boxSizing: 'border-box',
          pointerEvents: 'none',
        }}
      >
        {/* Brand header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.35em', color: '#686870' }}>YOUR JOURNEY</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#EDEDF0', lineHeight: 1, marginTop: 2 }}>COMEBACK</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#686870' }}>
              {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
            </div>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.2em', color: '#FF2800', marginTop: 3 }}>PROGRESS REPORT</div>
          </div>
        </div>

        {/* Red rule */}
        <div style={{ height: 2, background: 'linear-gradient(90deg,#FF2800,transparent)', marginBottom: 20, borderRadius: 1 }} />

        {/* Dual score rings */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {([
            { label: 'TODAY', score: dailyScore, color: dailyScoreColor },
            { label: 'THIS WEEK', score: weeklyScore, color: weekScoreColor },
          ] as { label: string; score: number; color: string }[]).map(({ label, score, color }) => (
            <div key={label} style={{ flex: 1, background: '#111116', borderRadius: 14, padding: '14px 12px', border: '1px solid #1E1E26', textAlign: 'center' }}>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.3em', color: '#686870', marginBottom: 10 }}>{label}</div>
              <div style={{ position: 'relative', display: 'inline-block', width: 76, height: 76 }}>
                <svg viewBox="0 0 76 76" width="76" height="76">
                  <circle cx="38" cy="38" r="31" fill="none" stroke="#1E1E26" strokeWidth="6.5" />
                  <circle cx="38" cy="38" r="31" fill="none"
                    stroke={color} strokeWidth="6.5" strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 194.8} 194.8`}
                    transform="rotate(-90 38 38)"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
                  <span style={{ fontSize: 8, color: '#686870' }}>/ 100</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly habit dot matrix */}
        {(() => {
          const dayLabels = ['M','T','W','T','F','S','S']
          const allDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStartDate)
            d.setDate(weekStartDate.getDate() + i)
            const dk = d.toLocaleDateString('en-CA')
            const log = dayLogs[dk]
            const isFuture = dk > today
            return {
              dk, label: dayLabels[i], isFuture, isToday: dk === today,
              workout: !isFuture && !!(log?.workoutDone && log.selectedWorkoutId !== 'rest'),
              steps:   !isFuture && (log?.steps ?? 0) >= 10000,
              sleep:   !isFuture && !!(log?.habits?.sleep),
              hasLog:  !isFuture && !!log,
            }
          })
          return (
            <div style={{ background: '#111116', borderRadius: 12, padding: '12px 14px', border: '1px solid #1E1E26', marginBottom: 14 }}>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.3em', color: '#686870', marginBottom: 10 }}>WEEKLY HABITS</div>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <div style={{ width: 26 }} />
                {allDays.map(({ label, isToday }, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 900, color: isToday ? '#FF2800' : '#686870' }}>{label}</div>
                ))}
              </div>
              {([
                { key: 'workout' as const, icon: '🏋️', color: '#FF2800' },
                { key: 'steps'   as const, icon: '👟', color: '#2196F3' },
                { key: 'sleep'   as const, icon: '💤', color: '#9B59B6' },
              ]).map(({ key, icon, color }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ width: 26, fontSize: 12 }}>{icon}</div>
                  {allDays.map(({ dk, isFuture, workout, steps, sleep, hasLog }) => {
                    const done = key === 'workout' ? workout : key === 'steps' ? steps : sleep
                    return (
                      <div key={dk} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                          width: 9, height: 9, borderRadius: '50%',
                          backgroundColor: isFuture ? '#1E1E26' : (hasLog && done) ? color : '#1E1E26',
                          boxShadow: (!isFuture && hasLog && done) ? `0 0 5px ${color}99` : 'none',
                        }} />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )
        })()}

        {/* Week in numbers — 2×2 stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {([
            { icon: '🏋️', label: 'WORKOUTS',    value: `${weekWorkouts}/5`,  sub: 'sessions this week',        color: '#FF2800' },
            { icon: '🔥', label: 'CALS BURNED', value: weekCalsBurned >= 1000 ? `${(weekCalsBurned/1000).toFixed(1)}K` : `${weekCalsBurned}`, sub: 'lift + steps + cardio', color: '#FF5500' },
            { icon: '👟', label: 'TOTAL STEPS', value: weekTotalSteps >= 1000 ? `${(weekTotalSteps/1000).toFixed(1)}K` : `${weekTotalSteps}`, sub: `${weekStepDays}/5 hit 10K`, color: '#2196F3' },
            { icon: '⏱️', label: 'FASTING',     value: weekFastingHours > 0 ? `${weekFastingHours}h` : '—', sub: weekFastingHours > 0 ? 'this week' : 'not logged', color: '#1DB954' },
          ] as { icon: string; label: string; value: string; sub: string; color: string }[]).map(({ icon, label, value, sub, color }) => (
            <div key={label} style={{ background: '#111116', borderRadius: 12, padding: '12px 12px 12px 14px', borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: '0.25em', color: '#686870', marginBottom: 5 }}>{icon} {label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#EDEDF0', lineHeight: 1, marginBottom: 3 }}>{value}</div>
              <div style={{ fontSize: 8, color: '#686870' }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#1E1E26', marginBottom: 14 }} />

        {/* Month in numbers */}
        <div style={{ background: '#111116', borderRadius: 12, padding: '12px 14px', border: '1px solid #1E1E26', marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.3em', color: '#686870' }}>MONTH IN NUMBERS</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#2C2C38', letterSpacing: '0.15em' }}>{monthName}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            {([
              { label: 'WORKOUTS',  value: `${workoutsThisMonth}`,                                                     color: '#FF2800' },
              { label: 'AVG CALS',  value: avgCal !== null ? `${avgCal}` : '—',                                        color: '#FF5500' },
              { label: 'AVG WATER', value: avgWater !== null ? `${(avgWater/1000).toFixed(1)}L` : '—',                  color: '#2196F3' },
              { label: 'WEIGHT Δ',  value: weightChange === null ? '—' : `${weightChange > 0 ? '+' : ''}${weightChange}kg`, color: weightChange !== null && weightChange > 0 ? '#FF2800' : '#1DB954' },
            ] as { label: string; value: string; color: string }[]).map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: '0.18em', color: '#686870' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #1E1E26', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: '0.25em', color: '#2C2C38' }}>COMEBACK • TRAIN. EAT. RISE.</div>
          <div style={{ fontSize: 7, fontWeight: 700, color: '#686870' }}>comeback-one-delta.vercel.app</div>
        </div>
      </div>
    </div>
  )
}
