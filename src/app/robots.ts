import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /profile/[slug] queries with ?t= token are edit-mode and must not be
        // indexed; the page also sets robots: noindex when a token is present.
        disallow: ['/api/', '/profile/*?*'],
      },
    ],
    sitemap: 'https://freeresumepost.co/sitemap.xml',
    host: 'https://freeresumepost.co',
  }
}
