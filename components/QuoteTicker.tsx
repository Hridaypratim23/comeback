'use client'

import { useState, useEffect, useRef } from 'react'
import { QUOTES } from '@/constants/quotes'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getDuration(text: string) {
  return Math.round(12 + (text.length / 90) * 10)
}

export default function QuoteTicker() {
  const deck = useRef<string[]>([])
  const cursor = useRef(0)
  const generation = useRef(0)
  const [entry, setEntry] = useState<{ quote: string; gen: number } | null>(null)

  useEffect(() => {
    deck.current = shuffle(QUOTES)
    cursor.current = 0
    setEntry({ quote: deck.current[0], gen: 0 })
  }, [])

  const advance = () => {
    cursor.current++
    if (cursor.current >= deck.current.length) {
      deck.current = shuffle(QUOTES)
      cursor.current = 0
    }
    generation.current++
    setEntry({ quote: deck.current[cursor.current], gen: generation.current })
  }

  if (!entry) return <div style={{ height: 26 }} />

  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: 26 }}>
      <span
        key={entry.gen}
        onAnimationEnd={advance}
        style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          whiteSpace: 'nowrap',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: '#5A5A6A',
          animation: `scroll-quote ${getDuration(entry.quote)}s linear 1`,
        }}
      >
        {entry.quote}
      </span>
    </div>
  )
}
