'use client'

import { QUOTES } from '@/constants/quotes'

const BRAND = 'COMEBACK'
const SEP = ' · '

// Build a single long string: COMEBACK · quote · COMEBACK · quote ...
// We duplicate it so the CSS loop is seamless.
function buildTickerContent(): Array<{ type: 'brand' | 'quote' | 'sep'; text: string }> {
  const items: Array<{ type: 'brand' | 'quote' | 'sep'; text: string }> = []
  // interleave quotes with brand word
  QUOTES.forEach((q, i) => {
    if (i % 5 === 0) {
      items.push({ type: 'brand', text: BRAND })
      items.push({ type: 'sep', text: SEP })
    }
    items.push({ type: 'quote', text: q })
    items.push({ type: 'sep', text: SEP })
  })
  return items
}

const tickerItems = buildTickerContent()
// Duplicate for seamless loop
const fullItems = [...tickerItems, ...tickerItems]

export default function QuoteTicker() {
  return (
    <div
      className="w-full overflow-hidden border-t border-b"
      style={{
        background: '#0D0D10',
        borderColor: '#1E1E26',
      }}
    >
      <div
        className="flex whitespace-nowrap animate-ticker py-1.5"
        style={{ willChange: 'transform' }}
      >
        {fullItems.map((item, i) => {
          if (item.type === 'brand') {
            return (
              <span
                key={i}
                style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  color: '#FF2800',
                  flexShrink: 0,
                }}
              >
                {item.text}
              </span>
            )
          }
          if (item.type === 'sep') {
            return (
              <span
                key={i}
                style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  color: '#FF2800',
                  flexShrink: 0,
                }}
              >
                {item.text}
              </span>
            )
          }
          return (
            <span
              key={i}
              style={{
                fontSize: '10px',
                fontWeight: 900,
                letterSpacing: '0.2em',
                color: '#686870',
                flexShrink: 0,
              }}
            >
              {item.text}
            </span>
          )
        })}
      </div>
    </div>
  )
}
