import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#070709',
        surface: '#0D0D10',
        card: '#111116',
        'card-alt': '#17171D',
        border: '#1E1E26',
        'border-high': '#2C2C38',
        red: '#D42B1A',
        'red-hot': '#FF2800',
        orange: '#C44400',
        'orange-hot': '#FF5500',
        snow: '#EDEDF0',
        grey: '#686870',
        dimmed: '#2A2A32',
        green: '#0D7A3A',
        'green-hot': '#1DB954',
        gold: '#B8860B',
        'gold-hot': '#D4A017',
        blue: '#1A6BB5',
        'blue-hot': '#2196F3',
      },
      letterSpacing: {
        military: '4px',
        wide2: '2px',
        wide3: '3px',
      },
    },
  },
  plugins: [],
}

export default config
