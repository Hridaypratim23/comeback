'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Dumbbell, Utensils, Droplets, TrendingUp } from 'lucide-react'

const NAV = [
  { href: '/', label: 'HOME', Icon: Home },
  { href: '/workout', label: 'LIFT', Icon: Dumbbell },
  { href: '/nutrition', label: 'FUEL', Icon: Utensils },
  { href: '/hydration', label: 'H₂O', Icon: Droplets },
  { href: '/progress', label: 'GAINS', Icon: TrendingUp },
]

export default function NavBar() {
  const path = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D10] border-t border-[#1E1E26]"
         style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      <div className="flex items-stretch max-w-lg mx-auto">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all duration-150 cursor-pointer
                ${active
                  ? 'text-[#FF2800]'
                  : 'text-[#686870] hover:text-[#EDEDF0]'
                }`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[9px] font-black tracking-widest ${active ? 'text-[#FF2800]' : ''}`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-[#FF2800] rounded-t-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
