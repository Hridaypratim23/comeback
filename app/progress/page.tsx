'use client'

import { useState, useEffect } from 'react'
import { useStore, TARGETS, XP_LEVEL } from '@/lib/store'
import { BADGES } from '@/constants/workouts'
import { TrendingUp, Edit3, Check, X } from 'lucide-react'

function StatEditor({ label, value, unit, onSave }: { label: string; value: number; unit: string; onSave: (v: number) => void }) {
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
          <input type="number" inputMode="decimal" value={val}
            onChange={e => setVal(e.target.value)}
            className="w-20 bg-[#0D0D10] border border-[#FF2800] rounded px-2 py-1 text-sm font-black text-[#EDEDF0] text-right outline-none"
            autoFocus onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          />
          <span className="text-xs text-[#686870]">{unit}</span>
          <button onClick={save} className="w-6 h-6 rounded-full bg-[#1DB954] text-[#070709] flex items-center justify-center cursor-pointer"><Check size={12} /></button>
          <button onClick={() => setEditing(false)} className="w-6 h-6 rounded-full bg-[#1E1E26] text-[#686870] flex items-center justify-center cursor-pointer"><X size={12} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-[#EDEDF0]">{value}<span className="text-xs text-[#686870] ml-1">{unit}</span></span>
          <button onClick={() => { setVal(value.toString()); setEditing(true) }}
            className="w-6 h-6 rounded-full bg-[#1E1E26] text-[#686870] hover:text-[#FF2800] flex items-center justify-center transition-colors cursor-pointer">
            <Edit3 size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function ProgressPage() {
  const { stats, dayLogs, updateStats, syncToSupabase } = useStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const today = new Date().toISOString().split('T')[0]
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
  const weightGoal = stats.weight - (bfDiff > 0 ? Math.round(bfDiff * 0.5) : 0)

  const save = (key: keyof typeof stats) => (v: number) => {
    updateStats({ [key]: v })
    setTimeout(() => syncToSupabase(), 100)
  }

  const maxXP = Math.max(...last7.map(d => d.xp), 1)

  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-black tracking-[0.35em] text-[#686870]">YOUR JOURNEY</p>
        <h1 className="text-3xl font-black text-[#EDEDF0] leading-none mt-0.5">GAINS</h1>
      </div>

      {/* Level Card */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4"
           style={{ background: 'linear-gradient(135deg, #FF280015 0%, #111116 60%)' }}>
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
            <div className="h-full bg-gradient-to-r from-[#D42B1A] to-[#FF2800] rounded-full transition-all duration-700"
                 style={{ width: `${xpPct}%` }} />
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
                <div className="w-full rounded-t-sm transition-all duration-500"
                     style={{
                       height: `${h}%`,
                       background: workoutDone ? (isToday ? '#FF2800' : '#FF280066') : '#1E1E26',
                       minHeight: 4,
                     }} />
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

      {/* Body Metrics */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-1">BODY METRICS</div>
        <div className="text-[10px] text-[#686870] mb-3">Tap the edit icon to update</div>

        <StatEditor label="WEIGHT" value={stats.weight} unit="kg" onSave={save('weight')} />
        <StatEditor label="BODY FAT" value={stats.bodyFat} unit="%" onSave={save('bodyFat')} />

        {/* Goal Progress */}
        <div className="mt-3 pt-3 border-t border-[#1E1E26]">
          <div className="flex justify-between text-[10px] mb-2">
            <span className="font-bold text-[#686870]">BF% PROGRESS</span>
            <span className="font-black text-[#1DB954]">Goal: {bodyFatGoal}%</span>
          </div>
          <div className="h-2 bg-[#0D0D10] border border-[#1E1E26] rounded-full overflow-hidden">
            <div className="h-full bg-[#1DB954] rounded-full transition-all duration-700"
                 style={{ width: `${Math.min(((25 - stats.bodyFat) / (25 - bodyFatGoal)) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-[#686870] mt-1">
            <span>START: 22%</span>
            <span>NOW: {stats.bodyFat}%</span>
            <span>GOAL: {bodyFatGoal}%</span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-3">BADGES</div>
        <div className="grid grid-cols-2 gap-2">
          {BADGES.map(badge => {
            const unlocked = stats.badges.includes(badge.id)
            return (
              <div key={badge.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all
                  ${unlocked
                    ? 'bg-[#D4A01711] border-[#D4A01733]'
                    : 'bg-[#0D0D10] border-[#1E1E26] opacity-50'}`}>
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
    </div>
  )
}
