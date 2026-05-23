'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Dumbbell, Utensils, Droplets, TrendingUp } from 'lucide-react'

const NAV = [
  { href: '/workout',   label: 'LIFT',  Icon: Dumbbell },
  { href: '/nutrition', label: 'FUEL',  Icon: Utensils },
  { href: '/',          label: 'HOME',  Icon: Home },
  { href: '/hydration', label: 'H₂O',  Icon: Droplets },
  { href: '/progress',  label: 'GAINS', Icon: TrendingUp },
]

export default function NavBar() {
  const path = usePathname()
  const activeIdx = NAV.findIndex(({ href }) =>
    href === '/' ? path === '/' : path.startsWith(href)
  )
  const idx = Math.max(0, activeIdx)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0E]/95 backdrop-blur-2xl border-t border-white/[0.06]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-lg mx-auto px-2 pt-2 pb-1">
        <div className="relative flex items-stretch">

          {/* Sliding pill */}
          <div
            className="absolute inset-y-0 rounded-2xl bg-[#FF2800]"
            style={{
              width: `${100 / NAV.length}%`,
              left: `${(idx / NAV.length) * 100}%`,
              transition: 'left 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 0 22px rgba(255,40,0,0.35), 0 2px 8px rgba(255,40,0,0.25)',
            }}
          />

          {NAV.map(({ href, label, Icon }, i) => {
            const active = i === idx && activeIdx >= 0
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-[3px] py-3 relative z-10"
              >
                <Icon
                  size={active ? 24 : 17}
                  strokeWidth={active ? 2.5 : 1.7}
                  className="transition-all duration-200"
                  style={{ color: active ? '#fff' : '#4A4A5A' }}
                />
                <span
                  className="font-black tracking-[0.14em] transition-all duration-200"
                  style={{
                    fontSize: active ? '9px' : '7px',
                    color: active ? '#fff' : '#4A4A5A',
                  }}
                >
                  {label}
                </span>
              </Link>
            )
          })}

        </div>
      </div>
    </nav>
  )
}
