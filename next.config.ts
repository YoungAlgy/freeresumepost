import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const nextConfig: NextConfig = {
  trailingSlash: false,
  // Do not advertise the framework in production responses.
  poweredByHeader: false,
  experimental: {
    // The file itself is capped at 5 MB in both client and server validation.
    // Leave room here for multipart field and boundary overhead.
    serverActions: { bodySizeLimit: '6mb' },
  },
  async redirects() {
    return [
      {
        // Next.js generates the modern icon routes, while some browsers still
        // request /favicon.ico directly.
        source: '/favicon.ico',
        destination: '/icon',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        // Hardening applied to application routes. Static assets and API
        // routes keep their own framework-generated headers.
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
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
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
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
      {
        source: '/account/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
      {
        // Edit tokens live in the profile query string. A no-referrer policy
        // keeps them out of navigation logs and third-party requests.
        source: '/profile/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, follow' },
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
    ]
  },
}

initOpenNextCloudflareForDev()

export default nextConfig
