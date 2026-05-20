'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.classList.remove('page-reveal')
    void el.offsetWidth
    el.classList.add('page-reveal')
  }, [pathname])

  return (
    <div ref={ref} className="page-reveal">
      {children}
    </div>
  )
}
