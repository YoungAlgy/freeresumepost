import type { MetadataRoute } from 'next'

// PWA web app manifest. Gives freeresumepost.co an installable identity (name,
// short_name, brand theme color) and points at the dynamically generated brand
// icons (/icon, /apple-icon, /icon-512). Next.js serves this at
// /manifest.webmanifest and auto-injects the <link rel="manifest"> in <head>.
//
// theme_color = the site --accent blue (#2563eb). The browser-chrome
// <meta name="theme-color"> is deliberately NOT set here — that belongs in
// layout.tsx's viewport export so the in-flight light/dark theme work can make
// it media-query aware. Mirrors freejobpost's manifest so the sister sites
// stay in lockstep.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Free Resume Post',
    short_name: 'Free Resume Post',
    description:
      'Upload your resume free. We match you to real healthcare openings. No recruiter spam.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
