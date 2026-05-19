import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const viewport: Viewport = {
  themeColor: '#070709',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'COMEBACK',
  description: 'Train. Eat. Rise.',
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
