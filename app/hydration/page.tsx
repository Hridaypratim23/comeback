'use client'

import { useState, useEffect } from 'react'
import { useStore, TARGETS } from '@/lib/store'
import { Droplets, Plus, Minus } from 'lucide-react'

const AMOUNTS = [
  { label: '150ml', value: 150 },
  { label: '250ml', value: 250 },
  { label: '500ml', value: 500 },
  { label: '750ml', value: 750 },
]

export default function HydrationPage() {
  const { dayLogs, addWater, getOrCreateToday } = useStore()
  const [mounted, setMounted] = useState(false)
  const [ripple, setRipple] = useState(false)

  useEffect(() => {
    setMounted(true)
    getOrCreateToday()
  }, [getOrCreateToday])

  if (!mounted) return null

  const today = new Date().toLocaleDateString('en-CA')
  const dayLog = dayLogs[today]
  const waterMl = dayLog?.waterMl ?? 0
  const pct = Math.min(waterMl / TARGETS.waterMl, 1)
  const liters = (waterMl / 1000).toFixed(2)
  const remaining = Math.max(TARGETS.waterMl - waterMl, 0)
  const glasses = Math.floor(waterMl / 250)

  const log = (ml: number) => {
    addWater(ml)
    setRipple(true)
    setTimeout(() => setRipple(false), 600)
  }

  const segments = 12
  const filledSegments = Math.round(pct * segments)

  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.35em] text-[#2196F3] uppercase">Hydration</p>
          <h1 className="text-5xl font-black leading-none mt-0.5" style={{ color: pct >= 1 ? '#2196F3' : '#EDEDF0' }}>H₂O</h1>
          <p className="text-[11px] font-bold text-[#686870] mt-1.5">
            {pct >= 1 ? '3L GOAL CRUSHED ✓' : `${(remaining / 1000).toFixed(2)}L remaining`}
          </p>
        </div>
        <div className="text-right pb-1">
          <div className="text-3xl font-black" style={{ color: '#2196F3' }}>{liters}L</div>
          <div className="text-[10px] font-bold text-[#686870]">{Math.round(pct * 100)}% of 3L</div>
        </div>
      </div>

      {/* Big Tank */}
      <div className="flex flex-col items-center py-6">
        <div className="relative w-40 h-56">
          {/* Tank body */}
          <div className="absolute inset-0 rounded-2xl border-2 border-[#2196F333] overflow-hidden"
               style={{ background: '#0D0D10' }}>
            {/* Water fill */}
            <div
              className="absolute bottom-0 left-0 right-0 rounded-b-xl transition-all duration-700"
              style={{
                height: `${pct * 100}%`,
                background: `linear-gradient(180deg, #2196F344 0%, #2196F388 100%)`,
              }}>
              {/* Wave */}
              <div className="absolute top-0 left-0 right-0 h-3 overflow-hidden">
                <div className={`h-3 w-[200%] ${ripple ? 'animate-[wave_0.6s_ease]' : ''}`}
                     style={{ background: 'linear-gradient(90deg, transparent 25%, #2196F355 50%, transparent 75%)' }} />
              </div>
            </div>
            {/* Segment lines */}
            {Array.from({ length: segments - 1 }, (_, i) => (
              <div key={i} className="absolute left-0 right-0 border-t border-[#1E1E26]"
                   style={{ bottom: `${((i + 1) / segments) * 100}%` }} />
            ))}
            {/* Labels */}
            {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map(l => (
              <div key={l} className="absolute right-2 text-[9px] font-bold text-[#2C2C38]"
                   style={{ bottom: `${(l / 3) * 100 - 3}%` }}>{l}L</div>
            ))}
          </div>

          {/* Center readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <Droplets size={24} className={pct > 0.5 ? 'text-[#070709]' : 'text-[#2196F3]'} />
            <div className={`text-2xl font-black leading-none mt-1 ${pct > 0.5 ? 'text-[#070709]' : 'text-[#EDEDF0]'}`}>{liters}L</div>
            <div className={`text-[10px] font-bold ${pct > 0.5 ? 'text-[#070709]' : 'text-[#686870]'}`}>{Math.round(pct * 100)}%</div>
          </div>
        </div>

        {/* Stats below tank */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <div className="text-xl font-black text-[#2196F3]">{glasses}</div>
            <div className="text-[10px] text-[#686870]">glasses</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-[#EDEDF0]">{(remaining / 1000).toFixed(2)}L</div>
            <div className="text-[10px] text-[#686870]">remaining</div>
          </div>
        </div>
      </div>

      {/* ±100ml control */}
      <div className="flex items-center justify-between bg-[#111116] border border-[#1E1E26] rounded-2xl px-4 py-3">
        <button
          onClick={() => log(-100)}
          disabled={waterMl < 100}
          className="w-12 h-12 flex items-center justify-center rounded-xl border border-[#1E1E26] bg-[#0D0D10] text-[#686870] active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed btn-press">
          <Minus size={18} />
        </button>
        <div className="text-center">
          <div className="text-[10px] font-black tracking-widest text-[#686870] mb-0.5">ADJUST</div>
          <div className="text-2xl font-black text-[#2196F3]">{waterMl} ml</div>
        </div>
        <button
          onClick={() => log(100)}
          className="w-12 h-12 flex items-center justify-center rounded-xl border border-[#2196F344] bg-[#2196F318] text-[#2196F3] active:scale-95 transition-all cursor-pointer btn-press">
          <Plus size={18} />
        </button>
      </div>

      {/* Quick Add Buttons */}
      <div>
        <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-3">QUICK ADD</div>
        <div className="grid grid-cols-4 gap-2">
          {AMOUNTS.map(({ label, value }) => (
            <button key={value} onClick={() => log(value)}
              className="py-4 rounded-2xl font-black text-sm text-[#2196F3] active:scale-95 transition-all cursor-pointer btn-press"
              style={{
                background: 'linear-gradient(180deg, rgba(33,150,243,0.1) 0%, #111116 100%)',
                border: '1px solid rgba(33,150,243,0.28)',
                boxShadow: 'inset 0 1.5px 0 rgba(33,150,243,0.2)',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <CustomWaterInput onAdd={log} />

      {/* Progress message */}
      {pct >= 1 && (
        <div className="bg-[#2196F311] border border-[#2196F333] rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">💧</div>
          <div className="font-black text-sm text-[#2196F3]">GOAL CRUSHED</div>
          <div className="text-xs text-[#686870] mt-1">3L down. Stay hydrated all day.</div>
        </div>
      )}
    </div>
  )
}

function CustomWaterInput({ onAdd }: { onAdd: (ml: number) => void }) {
  const [val, setVal] = useState('')
  const submit = () => {
    const n = parseInt(val)
    if (n > 0) { onAdd(n); setVal('') }
  }
  return (
    <div className="flex gap-2">
      <input
        type="number" inputMode="numeric" placeholder="Custom (ml)"
        value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="flex-1 bg-[#111116] border border-[#1E1E26] focus:border-[#2196F3] rounded-xl px-4 py-3 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none transition-colors"
      />
      <button onClick={submit}
        className="px-5 rounded-xl font-black text-sm bg-[#2196F3] text-white hover:bg-[#1A6BB5] transition-colors cursor-pointer btn-press">
        <Plus size={18} />
      </button>
    </div>
  )
}
