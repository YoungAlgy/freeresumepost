import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Query-bearing profile URLs can contain edit tokens. Account routes
        // are private application surfaces and are not crawl targets.
        disallow: ['/profile/*?*', '/account/', '/candidate/'],
      },
    ],
    sitemap: 'https://www.freeresumepost.co/sitemap.xml',
    host: 'https://www.freeresumepost.co',
  }
}
