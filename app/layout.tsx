import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'COMEBACK',
  description: 'Train. Eat. Rise.',
  themeColor: '#070709',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[#070709]">
      <body className="bg-[#070709] text-[#EDEDF0] min-h-dvh">
        <main className="max-w-lg mx-auto pb-20 min-h-dvh">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  )
}
