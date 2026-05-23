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

  useEffect(() => {
    const id = setInterval(() => go(1), 14000)
    return () => clearInterval(id)
  }, [go])

  if (!insights.length) return null

  const insight = insights[idx % insights.length]
  const progress = ((idx + 1) / insights.length) * 100

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${insight.color}10 0%, #0D0D10 50%)`,
        border: `1px solid ${insight.color}30`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base leading-none flex-shrink-0"
            style={{ background: `${insight.color}20` }}
          >
            {insight.icon}
          </div>
          <div>
            <div className="text-[8px] font-black tracking-[0.3em] mb-0.5" style={{ color: `${insight.color}99` }}>
              {TAG_LABEL[insight.tag]}
            </div>
            <div className="text-[13px] font-black leading-tight text-[#EDEDF0]">
              {insight.title}
            </div>
          </div>
        </div>
        <span className="text-[9px] font-black text-[#2C2C38] tracking-widest flex-shrink-0 ml-2">
          {idx + 1}/{insights.length}
        </span>
      </div>

      {/* Divider */}
      <div className="mx-4" style={{ height: 1, background: `${insight.color}18` }} />

      {/* Body */}
      <div
        className="px-4 pt-3 pb-4 transition-opacity duration-150"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <p className="text-[12.5px] leading-[1.65] font-medium" style={{ color: '#8A8A9A' }}>
          {insight.body}
        </p>
      </div>

      {/* Footer: progress bar + nav */}
      <div className="px-4 pb-4 flex items-center gap-3">
        <button
          onClick={() => go(-1)}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 cursor-pointer"
          style={{ background: `${insight.color}18`, border: `1px solid ${insight.color}25` }}
        >
          <ChevronLeft size={15} style={{ color: insight.color }} />
        </button>

        {/* Thin progress bar */}
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: `${insight.color}18` }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: insight.color }}
          />
        </div>

        <button
          onClick={() => go(1)}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 cursor-pointer"
          style={{ background: `${insight.color}18`, border: `1px solid ${insight.color}25` }}
        >
          <ChevronRight size={15} style={{ color: insight.color }} />
        </button>
      </div>
    </div>
  )
}
