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

  const insight  = insights[idx % insights.length]
  const progress = ((idx + 1) / insights.length) * 100

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${insight.color}0D 0%, #0D0D10 60%)`,
        border: `1px solid ${insight.color}28`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-sm leading-none flex-shrink-0"
          style={{ background: `${insight.color}1A` }}
        >
          {insight.icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[8px] font-black tracking-[0.28em]" style={{ color: `${insight.color}88` }}>
            {TAG_LABEL[insight.tag]}
          </span>
          <div
            className="text-[11px] font-black leading-tight truncate"
            style={{ color: insight.color }}
          >
            {insight.title}
          </div>
        </div>
        <span className="text-[8px] font-black text-[#2C2C38] tracking-widest flex-shrink-0">{idx + 1}/{insights.length}</span>
      </div>

      {/* Body */}
      <div
        className="px-3 pb-2 transition-opacity duration-150"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <p className="text-[11px] leading-[1.6] text-[#7A7A8A]">{insight.body}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 pb-3">
        <button
          onClick={() => go(-1)}
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-90 cursor-pointer"
          style={{ background: `${insight.color}15` }}
        >
          <ChevronLeft size={12} style={{ color: insight.color }} />
        </button>
        <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: `${insight.color}18` }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: insight.color }}
          />
        </div>
        <button
          onClick={() => go(1)}
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-90 cursor-pointer"
          style={{ background: `${insight.color}15` }}
        >
          <ChevronRight size={12} style={{ color: insight.color }} />
        </button>
      </div>
    </div>
  )
}
