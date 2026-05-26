'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Insight } from '@/constants/insights'

const TAG_LABEL: Record<Insight['tag'], string> = {
  COACH:    'YOUR COACH',
  FUEL:     'NUTRITION',
  MOVE:     'TRAINING',
  RECOVER:  'RECOVERY',
  SCIENCE:  'SCIENCE',
  PROGRESS: 'PROGRESS',
}

// 50ms per character of combined title + body + action, min 5s, max 20s
function readingMs(insight: Insight): number {
  const chars = insight.title.length + insight.body.length + (insight.action?.length ?? 0)
  return Math.max(5000, Math.min(20000, chars * 50 + 2000))
}

export default function InsightCard({ insights }: { insights: Insight[] }) {
  const [idx, setIdx]         = useState(0)
  const [visible, setVisible] = useState(true)

  const go = useCallback((dir: 1 | -1) => {
    setVisible(false)
    setTimeout(() => {
      setIdx(i => (i + dir + insights.length) % insights.length)
      setVisible(true)
    }, 160)
  }, [insights.length])

  // Dynamic delay: restarts whenever the active card changes
  useEffect(() => {
    const ms = readingMs(insights[idx % insights.length])
    const id = setTimeout(() => go(1), ms)
    return () => clearTimeout(id)
  }, [idx, go, insights])

  if (!insights.length) return null

  const insight = insights[idx % insights.length]
  const color   = insight.color

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}08 0%, transparent 50%), #0D0D10`,
        border: `1px solid ${color}22`,
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-2 px-3 pt-3 pb-2"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 150ms' }}
      >
        {/* Category pill */}
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: `${color}20` }}
        >
          <span className="text-xs leading-none">{insight.icon}</span>
          <span
            className="text-[8px] font-black tracking-widest leading-none"
            style={{ color }}
          >
            {TAG_LABEL[insight.tag]}
          </span>
        </div>

        {/* Urgent pulsing dot */}
        {insight.urgency === 'high' && (
          <div className="flex-shrink-0 relative w-2 h-2">
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: '#FF2800', opacity: 0.6 }}
            />
            <div className="w-2 h-2 rounded-full bg-[#FF2800]" />
          </div>
        )}

        {/* Counter */}
        <span className="ml-auto text-[8px] font-black text-[#2C2C38] tracking-widest flex-shrink-0">
          {idx + 1}/{insights.length}
        </span>
      </div>

      {/* Content */}
      <div
        className="px-3 pb-2 transition-opacity duration-150"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {/* Title */}
        <p
          className="text-[13px] font-black text-[#EDEDF0] leading-snug mb-2"
        >
          {insight.title}
        </p>

        {/* Body */}
        <p className="text-[11px] leading-[1.65] text-[#8A8A9A]">
          {insight.body}
        </p>

        {/* Action callout */}
        {insight.action && (
          <div
            className="mt-3 rounded-[10px] px-3 py-2.5"
            style={{
              background: `${color}12`,
              border: `1px solid ${color}25`,
            }}
          >
            <div
              className="text-[8px] font-black tracking-widest mb-1"
              style={{ color }}
            >
              ⚡ DO THIS NOW
            </div>
            <p className="text-[11px] leading-[1.55] text-[#EDEDF0]">
              {insight.action}
            </p>
          </div>
        )}
      </div>

      {/* Footer — dot indicators + prev/next */}
      <div className="flex items-center gap-2 px-3 pb-3 pt-1">
        <button
          onClick={() => go(-1)}
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-90 cursor-pointer"
          style={{ background: `${color}15` }}
        >
          <ChevronLeft size={12} style={{ color }} />
        </button>

        {/* Dot indicators */}
        <div className="flex-1 flex items-center justify-center gap-1 overflow-hidden">
          {insights.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i === idx) return
                setVisible(false)
                setTimeout(() => { setIdx(i); setVisible(true) }, 160)
              }}
              className="flex-shrink-0 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                width:  i === idx ? 12 : 5,
                height: 5,
                background: i === idx ? color : `${color}30`,
              }}
            />
          ))}
        </div>

        <button
          onClick={() => go(1)}
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-90 cursor-pointer"
          style={{ background: `${color}15` }}
        >
          <ChevronRight size={12} style={{ color }} />
        </button>
      </div>
    </div>
  )
}
