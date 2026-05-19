import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'
import AppInit from '@/components/AppInit'

export const viewport: Viewport = {
  themeColor: '#FF2800',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'COMEBACK',
  description: 'Train. Eat. Rise.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'COMEBACK',
  },
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[#070709]">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="COMEBACK" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="bg-[#070709] text-[#EDEDF0] min-h-dvh">
        <AppInit />
        <main className="max-w-lg mx-auto pb-20 min-h-dvh">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  )
}
