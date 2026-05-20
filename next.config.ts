import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // HTML documents must never be served from cache — fixes iOS PWA stale shell
        source: '/((?!_next/static|_next/image|favicon|icon|sw\\.js).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig
