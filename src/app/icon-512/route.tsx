import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'

// 512x512 PWA / maskable app icon. Same bold white "r" on the brand blue
// gradient as /icon and /apple-icon, but full-bleed (no border radius — the
// platform mask supplies the shape) and with the mark kept well inside the
// maskable safe zone so it isn't clipped by Android's circular / squircle
// mask. Referenced from manifest.ts. Uses the site --accent blue (#2563eb).
export function GET() {
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
          fontSize: 300,
          letterSpacing: -8,
        }}
      >
        r
      </div>
    ),
    { width: 512, height: 512 },
  )
}
