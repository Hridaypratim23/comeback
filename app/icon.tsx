import { ImageResponse } from 'next/og'

export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#070709',
          borderRadius: 40,
        }}
      >
        <span
          style={{
            fontFamily: 'Arial Black, Arial',
            fontSize: 76,
            fontWeight: 900,
            color: '#FF2800',
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          CB
        </span>
      </div>
    ),
    { ...size }
  )
}
