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
      { src: '/icon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Workout',
        short_name: 'WORKOUT',
        description: 'Log today\'s workout',
        url: '/workout',
        icons: [{ src: '/icon.png', sizes: '96x96' }],
      },
      {
        name: 'Nutrition',
        short_name: 'NUTRITION',
        description: 'Log meals and macros',
        url: '/nutrition',
        icons: [{ src: '/icon.png', sizes: '96x96' }],
      },
      {
        name: 'Hydration',
        short_name: 'HYDRATION',
        description: 'Track water intake',
        url: '/hydration',
        icons: [{ src: '/icon.png', sizes: '96x96' }],
      },
    ],
  }
}
