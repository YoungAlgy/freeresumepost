import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Apple/Stripe-style favicon — single bold "r" on a soft gradient blue,
// matching the freeresumepost.co brand (blue-600 = #2563eb).
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          fontFamily: '"Inter", "Helvetica Neue", "Segoe UI", system-ui, sans-serif',
          fontWeight: 800,
          color: '#fff',
          fontSize: 24,
          letterSpacing: -1,
          borderRadius: 7,
        }}
      >
        r
      </div>
    ),
    { ...size },
  )
}
