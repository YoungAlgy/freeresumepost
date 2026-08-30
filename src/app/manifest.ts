import type { MetadataRoute } from 'next'

// PWA web app manifest. Gives freeresumepost.co an installable identity (name,
// short_name, brand theme color) and points at the dynamically generated brand
// icons (/icon, /apple-icon, /icon-512). Next.js serves this at
// /manifest.webmanifest and auto-injects the <link rel="manifest"> in <head>.
//
// The manifest uses FreeResumePost's indigo theme, matching the favicon and
// apple icon so the PWA splash and install chrome read as one brand. The
// browser-chrome <meta name="theme-color"> is deliberately NOT set here — that
// belongs in layout.tsx's viewport export so the in-flight light/dark theme
// work can make it media-query aware.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FreeResumePost',
    short_name: 'ResumePost',
    description:
      'Post and maintain a nursing or allied health resume profile.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4338CA',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
