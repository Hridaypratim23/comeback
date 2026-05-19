import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'COMEBACK',
    short_name: 'COMEBACK',
    description: 'Train. Eat. Rise.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070709',
    theme_color: '#FF2800',
    orientation: 'portrait',
    icons: [
      { src: '/icon.svg', sizes: '48x48', type: 'image/svg+xml' },
      { src: '/icon.svg', sizes: '72x72', type: 'image/svg+xml' },
      { src: '/icon.svg', sizes: '96x96', type: 'image/svg+xml' },
      { src: '/icon.svg', sizes: '128x128', type: 'image/svg+xml' },
      { src: '/icon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'maskable' },
      { src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Workout',
        short_name: 'WORKOUT',
        description: 'Log today\'s workout',
        url: '/workout',
        icons: [{ src: '/icon.svg', sizes: '96x96' }],
      },
      {
        name: 'Nutrition',
        short_name: 'NUTRITION',
        description: 'Log meals and macros',
        url: '/nutrition',
        icons: [{ src: '/icon.svg', sizes: '96x96' }],
      },
      {
        name: 'Hydration',
        short_name: 'HYDRATION',
        description: 'Track water intake',
        url: '/hydration',
        icons: [{ src: '/icon.svg', sizes: '96x96' }],
      },
    ],
  }
}
