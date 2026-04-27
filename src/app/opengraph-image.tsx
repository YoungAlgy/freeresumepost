import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Free Resume Post — Upload once, get matched to real healthcare jobs'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 26, fontWeight: 700 }}>
          freeresumepost<span style={{ color: '#94a3b8' }}>.co</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#1d4ed8',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '3px 8px',
              borderRadius: 999,
              letterSpacing: 1.5,
            }}
          >
            BETA
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2.5,
              color: '#2563eb',
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
              color: '#2563eb',
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
          <span>850K+ candidate network · Your data is yours</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>freeresumepost.co</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
