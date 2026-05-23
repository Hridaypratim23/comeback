'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Insight } from '@/constants/insights'

export default function InsightCard({ insights }: { insights: Insight[] }) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  const go = useCallback((dir: 1 | -1) => {
    setVisible(false)
    setTimeout(() => {
      setIdx(i => (i + dir + insights.length) % insights.length)
      setVisible(true)
    }, 200)
  }, [insights.length])

  useEffect(() => {
    const id = setInterval(() => go(1), 12000)
    return () => clearInterval(id)
  }, [go])

  if (!insights.length) return null

  const insight = insights[idx % insights.length]

  return (
    <div
      className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4 cursor-pointer select-none"
      onClick={() => go(1)}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className="text-[8px] font-black tracking-[0.25em] px-2 py-0.5 rounded-full"
            style={{
              color: insight.color,
              background: `${insight.color}1A`,
              border: `1px solid ${insight.color}44`,
            }}
          >
            {insight.tag}
          </span>
          <span className="text-base leading-none">{insight.icon}</span>
        </div>
        <span className="text-[9px] font-black text-[#2C2C38] tracking-widest">
          {idx + 1} / {insights.length}
        </span>
      </div>

      {/* Content */}
      <div
        className="transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div
          className="text-[11px] font-black tracking-wider mb-1.5 leading-snug"
          style={{ color: insight.color }}
        >
          {insight.title}
        </div>
        <p className="text-[11px] text-[#686870] leading-relaxed">
          {insight.body}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1 mt-3">
        {insights.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width:      i === idx ? 14 : 4,
              height:     4,
              background: i === idx ? insight.color : '#1E1E26',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}
