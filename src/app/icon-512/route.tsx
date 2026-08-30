import { ImageResponse } from 'next/og'

// No explicit edge runtime (2026-08-13 fix) -- broke next/og's font loading
// under this OpenNext/Cloudflare deploy, same as opengraph-image.tsx and
// profile/[slug]/opengraph-image.tsx (fixed earlier tonight; this route was
// missed in that pass). Also adding a cache: 100% static content (no params,
// no DB query) with no revalidate re-rendered via Satori on every request.
export const contentType = 'image/png'
export const revalidate = 604800

// FreeResumePost document-and-check mark centered in the maskable safe zone.
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
          background: '#FFFFFF',
        }}
      >
        <svg width="320" height="320" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 7h23l11 11v37a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3Z" stroke="#4338CA" strokeWidth="5" strokeLinejoin="round" />
          <path d="M39 8v11h10" stroke="#4338CA" strokeWidth="5" strokeLinejoin="round" />
          <path d="M22 30h18M22 39h12" stroke="#4338CA" strokeWidth="4" strokeLinecap="round" />
          <path d="m34 49 4 4 9-10" stroke="#0D9488" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { width: 512, height: 512 },
  )
}
