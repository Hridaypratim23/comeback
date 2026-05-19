'use client'

import { useState, useEffect } from 'react'
import { useStore, TARGETS, XP_LEVEL } from '@/lib/store'
import { BADGES } from '@/constants/workouts'
import { TrendingUp, Edit3, Check, X } from 'lucide-react'
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
        {/* Y-axis labels */}
        <text x={PAD.left - 2} y={PAD.top + 4} textAnchor="end" fontSize="8" fill="#686870">{maxV.toFixed(1)}{unit}</text>
        <text x={PAD.left - 2} y={PAD.top + innerH} textAnchor="end" fontSize="8" fill="#686870">{minV.toFixed(1)}{unit}</text>

        {/* Polyline */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
        ))}

        {/* X-axis date labels */}
        <text x={pts[0].x} y={H - 2} textAnchor="start" fontSize="7" fill="#686870">
          {pts[0].date.slice(5)}
        </text>
        <text x={pts[pts.length - 1].x} y={H - 2} textAnchor="end" fontSize="7" fill="#686870">
          {pts[pts.length - 1].date.slice(5)}
        </text>
      </svg>
    </div>
  )
}

export default function ProgressPage() {
  const { stats, dayLogs, updateBodyStats, bodyHistory, prs, syncToSupabase, measurements, weeklyCheckins, addMeasurement, saveWeeklyCheckin } = useStore()
  const [mounted, setMounted] = useState(false)

  // Body Measurements form state
  const [mChest, setMChest] = useState('')
  const [mWaist, setMWaist] = useState('')
  const [mHips, setMHips] = useState('')
  const [mLeftArm, setMLeftArm] = useState('')
  const [mRightArm, setMRightArm] = useState('')
  const [mLeftThigh, setMLeftThigh] = useState('')
  const [measureSaved, setMeasureSaved] = useState(false)

  // Weekly Check-in state
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

  // ── Monthly Summary calculations ──────────────────────────────────────
  const nowDate = new Date()
  const monthPrefix = today.slice(0, 7) // "YYYY-MM"
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

  const stepDays = monthDayLogs.filter(d => d.steps > 0)
  const avgSteps = stepDays.length > 0
    ? Math.round(stepDays.reduce((s, d) => s + d.steps, 0) / stepDays.length)
    : null

  const xpThisMonth = monthDayLogs.reduce((s, d) => s + d.xpEarned, 0)

  const monthBodyHistory = bodyHistory.filter(e => e.date.startsWith(monthPrefix)).sort((a, b) => a.date.localeCompare(b.date))
  let weightChange: number | null = null
  if (monthBodyHistory.length >= 2) {
    weightChange = parseFloat((monthBodyHistory[monthBodyHistory.length - 1].weight - monthBodyHistory[0].weight).toFixed(1))
  }

  const hasMonthData = workoutsThisMonth > 0 || avgCal !== null || avgWater !== null || avgSteps !== null || xpThisMonth > 0

  // ── Weekly Check-in visibility ─────────────────────────────────────────
  const isSunday = nowDate.getDay() === 0
  const lastCheckin = weeklyCheckins.length > 0 ? weeklyCheckins[weeklyCheckins.length - 1] : null
  const lastCheckinAge = lastCheckin
    ? (nowDate.getTime() - new Date(lastCheckin.date).getTime()) / (1000 * 60 * 60 * 24)
    : Infinity
  const showCheckin = isSunday || lastCheckinAge > 6
  const xpInLevel = stats.totalXP % XP_LEVEL
  const xpPct = (xpInLevel / XP_LEVEL) * 100

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dk = d.toISOString().split('T')[0]
    const log = dayLogs[dk]
    const label = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()]
    return {
      dk, label, isToday: dk === today,
      workoutDone: log?.workoutDone ?? false,
      calories: log?.meals.reduce((s, m) => s + m.calories, 0) ?? 0,
      water: log?.waterMl ?? 0,
      xp: log?.xpEarned ?? 0,
    }
  })

  const bodyFatGoal = 15
  const bfDiff = stats.bodyFat - bodyFatGoal

  const saveBodyStats = (key: 'weight' | 'bodyFat') => (v: number) => {
    const newWeight = key === 'weight' ? v : stats.weight
    const newBF = key === 'bodyFat' ? v : stats.bodyFat
    updateBodyStats(newWeight, newBF)
  }

  const maxXP = Math.max(...last7.map(d => d.xp), 1)

  // Prepare chart data
  const weightChartData = bodyHistory.map(e => ({ date: e.date, value: e.weight }))
  const bfChartData = bodyHistory.map(e => ({ date: e.date, value: e.bodyFat }))

  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-black tracking-[0.35em] text-[#686870]">YOUR JOURNEY</p>
        <h1 className="text-3xl font-black text-[#EDEDF0] leading-none mt-0.5">GAINS</h1>
      </div>

      {/* Level Card */}
      <div
        className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4"
        style={{ background: 'linear-gradient(135deg, #FF280015 0%, #111116 60%)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-black tracking-[0.3em] text-[#686870]">CURRENT LEVEL</div>
            <div className="text-5xl font-black text-[#FF2800] leading-none mt-1">{stats.level}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-[#EDEDF0]">{stats.totalXP.toLocaleString()}</div>
            <div className="text-[10px] text-[#686870]">total XP</div>
            <div className="text-sm font-black text-[#D4A017] mt-1">{stats.streak}🔥 streak</div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] font-bold text-[#686870] mb-1">
            <span>LEVEL {stats.level}</span>
            <span>{xpInLevel} / {XP_LEVEL} XP</span>
            <span>LEVEL {stats.level + 1}</span>
          </div>
          <div className="h-3 bg-[#0D0D10] border border-[#1E1E26] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D42B1A] to-[#FF2800] rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <div className="text-[10px] text-[#686870] mt-1 text-right">{XP_LEVEL - xpInLevel} XP to next level</div>
        </div>
      </div>

      {/* Workout Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'WORKOUTS', value: stats.workoutsCompleted, color: '#FF2800', suffix: 'total' },
          { label: 'STREAK', value: stats.streak, color: '#D4A017', suffix: 'days' },
        ].map(({ label, value, color, suffix }) => (
          <div key={label} className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
            <div className="text-[10px] font-black tracking-widest text-[#686870]">{label}</div>
            <div className="text-3xl font-black mt-1 leading-none" style={{ color }}>{value}</div>
            <div className="text-[10px] text-[#686870]">{suffix}</div>
          </div>
        ))}
      </div>

      {/* Weekly XP Chart */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-4">7-DAY ACTIVITY</div>
        <div className="flex items-end gap-1.5 h-20">
          {last7.map(({ dk, label, isToday, workoutDone, xp }) => {
            const h = maxXP > 0 ? Math.max((xp / maxXP) * 100, workoutDone ? 20 : 5) : 5
            return (
              <div key={dk} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm transition-all duration-500"
                  style={{
                    height: `${h}%`,
                    background: workoutDone ? (isToday ? '#FF2800' : '#FF280066') : '#1E1E26',
                    minHeight: 4,
                  }}
                />
                <span className={`text-[9px] font-black ${isToday ? 'text-[#FF2800]' : 'text-[#686870]'}`}>{label}</span>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-[10px] text-[#686870] mt-2">
          <span>{last7.filter(d => d.workoutDone).length} workouts</span>
          <span>{last7.reduce((s, d) => s + d.xp, 0)} XP</span>
        </div>
      </div>

      {/* Top Lifts / 1RM Section */}
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
                    <div className="text-sm font-black text-[#EDEDF0] leading-none">
                      {pr.weight}kg × {pr.reps}
                    </div>
                    <div className="text-[10px] text-[#D4A017] font-bold mt-0.5">
                      1RM ~{pr.oneRM}kg
                    </div>
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

        {/* Goal Progress */}
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

      {/* Badges */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-3">BADGES</div>
        <div className="grid grid-cols-2 gap-2">
          {BADGES.map(badge => {
            const unlocked = stats.badges.includes(badge.id)
            return (
              <div
                key={badge.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all
                  ${unlocked
                    ? 'bg-[#D4A01711] border-[#D4A01733]'
                    : 'bg-[#0D0D10] border-[#1E1E26] opacity-50'}`}
              >
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <div className={`text-[11px] font-black leading-none ${unlocked ? 'text-[#D4A017]' : 'text-[#686870]'}`}>{badge.name}</div>
                  <div className="text-[9px] text-[#686870] mt-0.5 leading-tight">{badge.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── A. MONTHLY SUMMARY ──────────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-0.5">MONTHLY SUMMARY</div>
        <div className="text-[9px] font-bold text-[#2C2C38] tracking-widest mb-4">{monthName}</div>
        {!hasMonthData ? (
          <div className="py-4 text-center text-xs font-black text-[#2C2C38] tracking-widest">NO DATA YET THIS MONTH</div>
        ) : (
          <div className="space-y-0">
            {/* Workouts */}
            <div className="flex items-center justify-between py-2.5 border-b border-[#1E1E26]">
              <span className="text-[10px] font-black tracking-widest text-[#686870]">WORKOUTS</span>
              <span className="text-sm font-black" style={{ color: '#FF2800' }}>{workoutsThisMonth}</span>
            </div>
            {/* Avg Calories */}
            <div className="flex items-center justify-between py-2.5 border-b border-[#1E1E26]">
              <span className="text-[10px] font-black tracking-widest text-[#686870]">AVG CALORIES</span>
              <span className="text-sm font-black" style={{ color: '#FF5500' }}>
                {avgCal !== null ? `${avgCal} kcal` : '—'}
              </span>
            </div>
            {/* Avg Water */}
            <div className="flex items-center justify-between py-2.5 border-b border-[#1E1E26]">
              <span className="text-[10px] font-black tracking-widest text-[#686870]">AVG WATER</span>
              <span className="text-sm font-black" style={{ color: '#2196F3' }}>
                {avgWater !== null ? `${(avgWater / 1000).toFixed(1)}L` : '—'}
              </span>
            </div>
            {/* Avg Steps */}
            <div className="flex items-center justify-between py-2.5 border-b border-[#1E1E26]">
              <span className="text-[10px] font-black tracking-widest text-[#686870]">AVG STEPS</span>
              <span className="text-sm font-black" style={{ color: '#686870' }}>
                {avgSteps !== null ? avgSteps.toLocaleString() : '—'}
              </span>
            </div>
            {/* XP */}
            <div className="flex items-center justify-between py-2.5 border-b border-[#1E1E26]">
              <span className="text-[10px] font-black tracking-widest text-[#686870]">XP EARNED</span>
              <span className="text-sm font-black" style={{ color: '#D4A017' }}>{xpThisMonth} XP</span>
            </div>
            {/* Weight Change */}
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[10px] font-black tracking-widest text-[#686870]">WEIGHT CHANGE</span>
              <span
                className="text-sm font-black"
                style={{ color: weightChange === null ? '#686870' : weightChange <= 0 ? '#1DB954' : '#FF2800' }}
              >
                {weightChange === null
                  ? '—'
                  : `${weightChange > 0 ? '+' : ''}${weightChange}kg`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── B. BODY MEASUREMENTS ────────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-4">BODY MEASUREMENTS</div>

        {/* Input grid */}
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

        {/* Last 3 entries table */}
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
                          {entry.leftArm ?? entry.rightArm
                            ? `${entry.leftArm ?? '—'}/${entry.rightArm ?? '—'}`
                            : '—'}
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

      {/* ── C. WEEKLY CHECK-IN (Sundays or > 6 days since last) ─────────────── */}
      {showCheckin && (
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
          <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-4">WEEKLY CHECK-IN</div>

          {ciSaved ? (
            <div className="py-6 text-center text-sm font-black tracking-widest text-[#1DB954]">
              CHECK-IN SAVED ✓
            </div>
          ) : (
            <>
              {/* Rating */}
              <div className="mb-4">
                <div className="text-[10px] font-black tracking-widest text-[#686870] mb-2">HOW WAS THIS WEEK?</div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setCiRating(n)}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-black transition-all cursor-pointer btn-press active:scale-95
                        ${ciRating === n
                          ? 'bg-[#FF2800] border-[#FF2800] text-white'
                          : 'bg-[#0D0D10] border-[#1E1E26] text-[#686870] hover:border-[#FF280066]'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight */}
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

              {/* Intention */}
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

              {/* Save */}
              <button
                onClick={() => {
                  if (!ciRating) return
                  const weight = parseFloat(ciWeight) || stats.weight
                  saveWeeklyCheckin({ rating: ciRating, weight, intention: ciIntention })
                  setCiSaved(true)
                }}
                className="w-full py-3 rounded-lg bg-[#FF2800] text-white text-[10px] font-black tracking-widest cursor-pointer btn-press active:scale-95 transition-all"
              >
                SAVE CHECK-IN · +50 XP
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
