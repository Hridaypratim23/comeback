'use client'

import { useState, useEffect } from 'react'
import { useStore, TARGETS } from '@/lib/store'
import { QUICK_MEALS } from '@/constants/workouts'
import { Plus, X, Search, Flame, Dumbbell, Zap, Droplet } from 'lucide-react'

function MacroRing({ val, max, color, label, unit = 'g' }: { val: number; max: number; color: string; label: string; unit?: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const pct = Math.min(val / max, 1)
  const offset = circ * (1 - pct)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" className="-rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#1E1E26" strokeWidth="4" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-black text-[#EDEDF0] leading-none">{val}</span>
          <span className="text-[8px] text-[#686870]">{unit}</span>
        </div>
      </div>
      <span className="text-[9px] font-black tracking-widest text-[#686870]">{label}</span>
      <span className="text-[9px] text-[#686870]">/{max}{unit}</span>
    </div>
  )
}

export default function NutritionPage() {
  const { dayLogs, addMeal, removeMeal, getOrCreateToday } = useStore()
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [custom, setCustom] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })

  useEffect(() => {
    setMounted(true)
    getOrCreateToday()
  }, [getOrCreateToday])

  if (!mounted) return null

  const today = new Date().toISOString().split('T')[0]
  const dayLog = dayLogs[today]
  const meals = dayLog?.meals ?? []

  const totalCal = meals.reduce((s, m) => s + m.calories, 0)
  const totalPro = meals.reduce((s, m) => s + m.protein, 0)
  const totalCarb = meals.reduce((s, m) => s + m.carbs, 0)
  const totalFat = meals.reduce((s, m) => s + m.fat, 0)

  const filtered = QUICK_MEALS.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))

  const submitCustom = () => {
    const c = parseInt(custom.calories) || 0
    const p = parseInt(custom.protein) || 0
    const cb = parseInt(custom.carbs) || 0
    const f = parseInt(custom.fat) || 0
    if (!custom.name || c === 0) return
    addMeal({ name: custom.name, calories: c, protein: p, carbs: cb, fat: f })
    setCustom({ name: '', calories: '', protein: '', carbs: '', fat: '' })
    setShowCustom(false)
  }

  const calPct = Math.min((totalCal / TARGETS.calories) * 100, 100)
  const remaining = TARGETS.calories - totalCal

  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-black tracking-[0.35em] text-[#686870]">DAILY FUEL</p>
        <h1 className="text-3xl font-black text-[#EDEDF0] leading-none mt-0.5">NUTRITION</h1>
      </div>

      {/* Calorie Bar */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-4xl font-black text-[#EDEDF0] leading-none">{totalCal}</div>
            <div className="text-[10px] text-[#686870] mt-0.5">/ {TARGETS.calories} kcal</div>
          </div>
          <div className={`text-right ${remaining < 0 ? 'text-[#FF2800]' : 'text-[#686870]'}`}>
            <div className="text-lg font-black">{Math.abs(remaining)}</div>
            <div className="text-[10px]">{remaining < 0 ? 'OVER' : 'LEFT'}</div>
          </div>
        </div>
        <div className="h-3 bg-[#0D0D10] border border-[#1E1E26] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${calPct >= 100 ? 'bg-[#FF2800]' : 'bg-gradient-to-r from-[#1DB954] to-[#D4A017]'}`}
               style={{ width: `${calPct}%` }} />
        </div>
      </div>

      {/* Macro Rings */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-4">MACROS</div>
        <div className="flex justify-around">
          <MacroRing val={totalPro} max={TARGETS.protein} color="#FF2800" label="PROTEIN" />
          <MacroRing val={totalCarb} max={TARGETS.carbs} color="#FF5500" label="CARBS" />
          <MacroRing val={totalFat} max={TARGETS.fat} color="#D4A017" label="FAT" />
        </div>
      </div>

      {/* Today's Meals */}
      {meals.length > 0 && (
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1E1E26]">
            <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">TODAY'S MEALS</span>
          </div>
          <div className="divide-y divide-[#1E1E26]">
            {meals.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-[#EDEDF0] truncate">{m.name}</div>
                  <div className="text-[10px] text-[#686870] mt-0.5">
                    {m.calories}cal · {m.protein}g P · {m.carbs}g C · {m.fat}g F · {m.time}
                  </div>
                </div>
                <button onClick={() => removeMeal(m.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1E1E26] text-[#686870] hover:bg-[#FF280022] hover:text-[#FF2800] transition-all cursor-pointer">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Quick Add */}
      <div className="bg-[#111116] border border-[#1E1E26] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1E1E26] flex items-center gap-2">
          <Search size={14} className="text-[#686870]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search quick meals..."
            className="flex-1 bg-transparent text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none"
          />
        </div>
        <div className="divide-y divide-[#1E1E26] max-h-72 overflow-y-auto">
          {filtered.map(m => (
            <button key={m.name}
              onClick={() => addMeal(m)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#17171D] transition-colors cursor-pointer text-left">
              <div>
                <div className="font-bold text-sm text-[#EDEDF0]">{m.name}</div>
                <div className="text-[10px] text-[#686870]">{m.protein}g P · {m.carbs}g C · {m.fat}g F</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#FF5500]">{m.calories}</span>
                <span className="text-[10px] text-[#686870]">cal</span>
                <Plus size={16} className="text-[#686870]" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Meal */}
      <button
        onClick={() => setShowCustom(s => !s)}
        className="w-full py-3 rounded-xl border border-dashed border-[#2C2C38] text-sm font-black tracking-widest text-[#686870] hover:border-[#FF2800] hover:text-[#FF2800] transition-all cursor-pointer btn-press">
        + CUSTOM MEAL
      </button>

      {showCustom && (
        <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4 space-y-3">
          <div className="text-[10px] font-black tracking-[0.3em] text-[#686870]">CUSTOM ENTRY</div>
          {[
            { key: 'name', placeholder: 'Meal name', type: 'text' },
            { key: 'calories', placeholder: 'Calories (kcal)', type: 'number' },
            { key: 'protein', placeholder: 'Protein (g)', type: 'number' },
            { key: 'carbs', placeholder: 'Carbs (g)', type: 'number' },
            { key: 'fat', placeholder: 'Fat (g)', type: 'number' },
          ].map(({ key, placeholder, type }) => (
            <input key={key} type={type} placeholder={placeholder}
              value={custom[key as keyof typeof custom]}
              onChange={e => setCustom(c => ({ ...c, [key]: e.target.value }))}
              className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF2800] rounded-lg px-3 py-2.5 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none transition-colors"
            />
          ))}
          <button onClick={submitCustom}
            className="w-full py-3 rounded-lg font-black text-sm tracking-widest text-white bg-[#FF2800] hover:bg-[#D42B1A] transition-colors cursor-pointer btn-press">
            ADD MEAL
          </button>
        </div>
      )}
    </div>
  )
}
