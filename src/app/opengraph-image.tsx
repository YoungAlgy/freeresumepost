import { ImageResponse } from 'next/og'

// No explicit edge runtime (2026-08-13 fix, matches freejobpost's per-job OG
// route, which has never declared one): under this OpenNext/Cloudflare
// deploy, `runtime = 'edge'` broke next/og's font loading here with
// "TypeError: Cannot read properties of undefined (reading 'default')" on
// every request (confirmed live, both of this app's OG routes). The default
// (Node-compat) runtime renders fine.
export const alt = 'Your healthcare resume, private by default | FreeResumePost'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
// 2026-08-13 audit: 100% static content (no params, no DB query) with no
// revalidate, so it re-rendered via Satori on every single request instead
// of serving a cached PNG -- same gap found and fixed on freejobpost's
// equivalent route.
export const revalidate = 604800

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 26, fontWeight: 700, color: '#4338CA' }}>
          FreeResumePost
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2.5,
              color: '#4338CA',
              textTransform: 'uppercase',
              marginBottom: 22,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Nursing and allied health
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
            Your healthcare resume.
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: -2.5,
              color: '#0D9488',
            }}
          >
            Private by default.
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
            Review the details before you save.
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
          <span>Upload, review, and save your profile</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>freeresumepost.co</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
