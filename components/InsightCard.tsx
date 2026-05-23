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
    }, 180)
  }, [insights.length])

  useEffect(() => {
    const id = setInterval(() => go(1), 14000)
    return () => clearInterval(id)
  }, [go])

  if (!insights.length) return null

  const insight = insights[idx % insights.length]

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#0D0D10', border: `1px solid ${insight.color}33` }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: `${insight.color}12`, borderBottom: `1px solid ${insight.color}22` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{insight.icon}</span>
          <span
            className="text-[9px] font-black tracking-[0.3em]"
            style={{ color: insight.color }}
          >
            {TAG_LABEL[insight.tag]}
          </span>
        </div>
        <span className="text-[9px] font-bold text-[#2C2C38] tracking-widest">
          {idx + 1} / {insights.length}
        </span>
      </div>

      {/* Content */}
      <div
        className="px-4 pt-3 pb-3 transition-opacity duration-180"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div
          className="text-[12px] font-black tracking-wide leading-snug mb-2"
          style={{ color: insight.color }}
        >
          {insight.title}
        </div>
        <p className="text-[12px] text-[#9090A0] leading-relaxed">
          {insight.body}
        </p>
      </div>

      {/* Navigation */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderTop: `1px solid ${insight.color}18` }}
      >
        <button
          onClick={() => go(-1)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          style={{ background: `${insight.color}15` }}
        >
          <ChevronLeft size={14} style={{ color: insight.color }} />
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {insights.map((ins, i) => (
            <button
              key={i}
              onClick={() => {
                if (i === idx) return
                setVisible(false)
                setTimeout(() => { setIdx(i); setVisible(true) }, 180)
              }}
              className="rounded-full transition-all duration-300 cursor-pointer"
              style={{
                width:      i === idx ? 16 : 5,
                height:     5,
                background: i === idx ? insight.color : '#2C2C38',
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        <button
          onClick={() => go(1)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          style={{ background: `${insight.color}15` }}
        >
          <ChevronRight size={14} style={{ color: insight.color }} />
        </button>
      </div>
    </div>
  )
}
