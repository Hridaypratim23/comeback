'use client'

import { useState, useEffect, useRef } from 'react'

interface RestTimerProps {
  defaultSeconds?: number
  onDismiss: () => void
}

const PRESETS = [
  { label: '1:00', seconds: 60 },
  { label: '1:30', seconds: 90 },
  { label: '2:00', seconds: 120 },
  { label: '3:00', seconds: 180 },
  { label: '5:00', seconds: 300 },
]

export default function RestTimer({ defaultSeconds = 90, onDismiss }: RestTimerProps) {
  const [total, setTotal] = useState(defaultSeconds)
  const [remaining, setRemaining] = useState(defaultSeconds)
  const [done, setDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start countdown on mount and whenever total changes (preset selected)
  useEffect(() => {
    setDone(false)
    setRemaining(total)
  }, [total])

  useEffect(() => {
    if (done) return
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current!)
          setDone(true)
          if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300])
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [total, done])

  const resetTo = (seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setDone(false)
    setTotal(seconds)
    setRemaining(seconds)
  }

  const mins = Math.floor(remaining / 60).toString().padStart(2, '0')
  const secs = (remaining % 60).toString().padStart(2, '0')

  // Timer color logic
  let timerColor = '#1DB954'
  if (done) timerColor = '#FF2800'
  else if (remaining < 30) timerColor = '#FF2800'
  else if (remaining < 60) timerColor = '#FF5500'

  // SVG ring progress
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? remaining / total : 0
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="bg-[#111116] border border-[#1E1E26] rounded-2xl p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black tracking-[0.35em] text-[#686870]">REST</span>
          <div className="flex gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.seconds}
                onClick={() => resetTo(p.seconds)}
                className={`px-2 py-1 rounded text-[10px] font-black transition-all cursor-pointer ${
                  total === p.seconds
                    ? 'bg-[#FF2800] text-white'
                    : 'bg-[#1E1E26] text-[#686870] hover:bg-[#2C2C38] hover:text-[#EDEDF0]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ring + Countdown */}
        <div className="flex items-center justify-center my-2">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg
              width="128"
              height="128"
              className="-rotate-90 absolute inset-0"
            >
              {/* Background track */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke="#1E1E26"
                strokeWidth="6"
              />
              {/* Progress ring */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke={timerColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
              />
            </svg>
            {/* Countdown text */}
            <div
              className={`text-3xl font-black tabular-nums z-10 transition-all ${done ? 'animate-pulse' : ''}`}
              style={{ color: timerColor }}
            >
              {done ? 'GO!' : `${mins}:${secs}`}
            </div>
          </div>
        </div>

        {/* Done message */}
        {done && (
          <p className="text-center text-xs font-black text-[#FF2800] tracking-widest mb-2 animate-pulse">
            REST COMPLETE — NEXT SET
          </p>
        )}

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-xl font-black text-sm tracking-widest uppercase transition-all cursor-pointer btn-press"
          style={{
            background: done
              ? 'linear-gradient(135deg, #FF2800, #FF2800cc)'
              : '#1E1E26',
            color: done ? 'white' : '#686870',
          }}
        >
          NEXT SET
        </button>
      </div>
    </div>
  )
}
