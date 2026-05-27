'use client'

import { useState, useRef } from 'react'
import { QUOTES } from '@/constants/quotes'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ~14s for short quotes, up to ~22s for long ones
function duration(text: string) {
  return Math.round(12 + (text.length / 90) * 10)
}

export default function QuoteTicker() {
  const deck = useRef<string[]>(shuffle(QUOTES))
  const cursor = useRef(0)
  const [quote, setQuote] = useState(deck.current[0])

  const advance = () => {
    cursor.current++
    if (cursor.current >= deck.current.length) {
      deck.current = shuffle(QUOTES)
      cursor.current = 0
    }
    setQuote(deck.current[cursor.current])
  }

  return (
    <div style={{ overflow: 'hidden', height: 26, display: 'flex', alignItems: 'center' }}>
      <span
        key={quote}
        onAnimationEnd={advance}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: '#5A5A6A',
          animation: `scroll-quote ${duration(quote)}s linear 1`,
        }}
      >
        {quote}
      </span>
    </div>
  )
}
