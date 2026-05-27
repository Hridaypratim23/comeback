'use client'

import { useEffect, useRef, useState } from 'react'
import { QUOTES } from '@/constants/quotes'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const SEP = '  ·  '

export default function QuoteTicker() {
  const [items, setItems] = useState<Array<{ type: 'q' | 's'; text: string }>>([])
  const [duration, setDuration] = useState(0)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const half = shuffle(QUOTES).flatMap(q => [
      { type: 'q' as const, text: q },
      { type: 's' as const, text: SEP },
    ])
    setItems([...half, ...half])
  }, [])

  useEffect(() => {
    if (!items.length) return
    // Measure after layout then set speed-based duration
    const id = requestAnimationFrame(() => {
      if (innerRef.current) {
        const halfW = innerRef.current.scrollWidth / 2
        setDuration(Math.round(halfW / 180)) // 180 px/s
      }
    })
    return () => cancelAnimationFrame(id)
  }, [items])

  if (!items.length) return <div style={{ height: 28 }} />

  return (
    <div style={{ overflow: 'hidden', height: 28 }}>
      <div
        ref={innerRef}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: '100%',
          whiteSpace: 'nowrap',
          willChange: 'transform',
          animation: duration ? `ticker ${duration}s linear infinite` : 'none',
        }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: item.type === 's' ? '#30303C' : '#9A9AB0',
              flexShrink: 0,
            }}
          >
            {item.text}
          </span>
        ))}
      </div>
    </div>
  )
}
