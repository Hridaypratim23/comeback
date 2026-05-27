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
        background: '#0A0A0D',
        borderTop: '1px solid #1C1C24',
        borderBottom: '1px solid #1C1C24',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 52,
      }}
    >
      {/* Red accent bar */}
      <div
        style={{
          width: 3,
          alignSelf: 'stretch',
          minHeight: 32,
          background: 'linear-gradient(180deg, #FF2800 0%, #CC2000 100%)',
          borderRadius: 2,
          flexShrink: 0,
        }}
      />

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 8,
            fontWeight: 900,
            letterSpacing: '0.28em',
            color: '#FF2800',
            marginBottom: 4,
            opacity: 0.9,
          }}
        >
          COMEBACK
        </div>

        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.06em',
            lineHeight: 1.45,
            color: '#DDDDE8',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0px)' : 'translateY(5px)',
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

      {/* Subtle dot indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 2,
              height: 2,
              borderRadius: '50%',
              background: i === 1 ? '#FF2800' : '#2A2A35',
            }}
          />
        ))}
      </div>
    </div>
  )
}
