import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Upload Your Resume, Get Matched | Ava Health'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          padding: '70px',
          fontFamily: '"Inter", "Helvetica Neue", "Segoe UI", system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 26, fontWeight: 700, color: '#003D5C' }}>
          Ava Health
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2.5,
              color: '#003D5C',
              textTransform: 'uppercase',
              marginBottom: 22,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Free forever · No account
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: -2.5,
              color: '#0f172a',
              marginBottom: 12,
            }}
          >
            Upload once.
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: -2.5,
              color: '#7FBC00',
            }}
          >
            Get matched.
          </div>

          <div
            style={{
              marginTop: 36,
              fontSize: 28,
              fontWeight: 500,
              color: '#475569',
              maxWidth: 900,
            }}
          >
            Real healthcare openings. No recruiter spam.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 20,
            color: '#64748b',
            borderTop: '1px solid #e2e8f0',
            paddingTop: 22,
          }}
        >
          <span>Healthcare candidate network · Your data is yours</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>freeresumepost.co</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
