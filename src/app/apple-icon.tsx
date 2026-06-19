import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// iOS home-screen icon — refined "r" mark on the same Ava navy gradient,
// scaled with iOS's 18-unit corner radius for a native feel.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #003D5C 0%, #002A40 100%)',
          fontFamily: '"Inter", "Helvetica Neue", "Segoe UI", system-ui, sans-serif',
          fontWeight: 800,
          color: '#fff',
          fontSize: 132,
          letterSpacing: -6,
        }}
      >
        r
      </div>
    ),
    { ...size },
  )
}
