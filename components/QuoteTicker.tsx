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

export default function QuoteTicker() {
  const deck = useRef<string[]>(shuffle(QUOTES))
  const cursor = useRef(0)
  const [quote, setQuote] = useState(deck.current[0])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const tick = () => {
      setVisible(false)
      setTimeout(() => {
        cursor.current++
        if (cursor.current >= deck.current.length) {
          deck.current = shuffle(QUOTES)
          cursor.current = 0
        }
        setQuote(deck.current[cursor.current])
        setVisible(true)
      }, 380)
    }

    const id = setInterval(tick, 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        padding: '11px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.12em',
          lineHeight: 1.5,
          color: '#7A7A8A',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0px)' : 'translateY(4px)',
          transition: 'opacity 0.38s ease, transform 0.38s ease',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {quote}
      </div>
    </div>
  )
}
