import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: false,
  // Don't advertise the framework (X-Powered-By: Next.js) — freejobpost
  // already suppresses it; keep the pair in lockstep. 2026-06 audit.
  poweredByHeader: false,
  async redirects() {
    return [
      {
        // Modern icons live at /icon (src/app/icon.tsx) and /apple-icon
        // (src/app/apple-icon.tsx) — Next.js auto-generates them. But many
        // crawlers and older browsers still hit /favicon.ico directly. There
        // is no static favicon.ico, so redirect to the canonical generated
        // icon instead of returning a 404. Mirrors freejobpost's redirect so
        // the sister sites stay in lockstep.
        source: '/favicon.ico',
        destination: '/icon',
        permanent: true,
      },
      // ─── Ava Health family cross-links: vanity paths route to the sibling
      // tool so the family reads as one product. All target non-existent
      // freeresume paths → zero risk to real pages. ───
      { source: '/jobs', destination: 'https://freejobpost.co', permanent: true },
      { source: '/job', destination: 'https://freejobpost.co', permanent: true },
      { source: '/post-job', destination: 'https://freejobpost.co', permanent: true },
      { source: '/providers', destination: 'https://providers.avahealth.co', permanent: true },
      { source: '/find-providers', destination: 'https://providers.avahealth.co', permanent: true },
      { source: '/recruiters', destination: 'https://app.avahealth.co', permanent: true },
      { source: '/for-recruiters', destination: 'https://app.avahealth.co', permanent: true },
      { source: '/platform', destination: 'https://app.avahealth.co', permanent: true },
      { source: '/outreach', destination: 'https://app.avahealth.co/outreach', permanent: true },
      { source: '/beacon', destination: 'https://app.avahealth.co/outreach', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        // Hardening — applied to every route. HSTS is set by Vercel.
        // Skips _next/static & _next/image (assets) and api/* (handled per-route).
        source: '/((?!_next/static|_next/image|api).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // challenges.cloudflare.com hosts the Turnstile bot-challenge widget script
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              // challenges.cloudflare.com is also used for the siteverify XHR + the iframe
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
              "frame-src https://challenges.cloudflare.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      // NOTE (2026-06 audit): the old catch-all `X-Robots-Tag: index, follow`
      // header was REMOVED. index,follow is the crawler default, and the
      // header conflicted with pages that noindex dynamically via metadata
      // (every /profile/* page). The explicit noindex header below stays.
      {
        source: '/candidate/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default nextConfig
