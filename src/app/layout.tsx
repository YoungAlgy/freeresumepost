import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { buildOrganizationGraph } from '@/lib/organization-schema'

import { safeJsonLd } from '@/lib/safe-jsonld'
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: {
    template: '%s | Free Resume Post',
    default: 'Free Resume Post — Upload once, get matched to real healthcare jobs',
  },
  description:
    'Upload your resume for free and get matched to healthcare openings. No recruiter pitches, no resume databases sold to spammers. Built by a real staffing team.',
  metadataBase: new URL('https://www.freeresumepost.co'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    siteName: 'Free Resume Post',
    type: 'website',
    locale: 'en_US',
    url: 'https://www.freeresumepost.co',
    title: 'Free Resume Post — Upload once, get matched',
    description: 'Upload your resume free. We match you to real healthcare openings. No recruiter spam.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Resume Post — Upload once, get matched',
    description: 'Upload your resume free. We match you to real openings.',
    site: '@avahealth',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'business',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://tsruqbodyrmxqzhvxret.supabase.co"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://tsruqbodyrmxqzhvxret.supabase.co"
        />
        {/* Organization + WebSite schema. Google uses these to surface the
            sitelinks searchbox and understand brand hierarchy. The sameAs
            graph cross-links freejobpost + providers + main avahealth.co.
            Schema source: src/lib/organization-schema.ts (mirrored to freejobpost). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(
              buildOrganizationGraph({
                websiteUrl: 'https://www.freeresumepost.co',
                websiteName: 'Free Resume Post',
                websiteDescription:
                  'Upload your resume free, get matched to real healthcare openings.',
                organizationDescription:
                  'Healthcare staffing and recruiting firm connecting physicians, nurses, and therapists with US healthcare employers. Operates freeresumepost.co — a free candidate-resume platform that matches healthcare professionals to open roles without selling resume data.',
                searchActionTarget: 'https://freejobpost.co/jobs?q={search_term_string}',
              })
            ),
          }}
        />
      </head>
      <body className={inter.className}>
        {/* Skip-nav: keyboard users can jump past the nav directly to the main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:text-sm focus:font-bold focus:rounded"
        >
          Skip to main content
        </a>
        <div id="main-content">
          {children}
        </div>
        <footer className="max-w-6xl mx-auto px-4 py-8 mt-12 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link href="/upload" className="hover:text-gray-900">
                Upload resume
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/specialty" className="hover:text-gray-900">
                By specialty
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/how-it-works" className="hover:text-gray-900">
                How it works
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/candidate/login" className="hover:text-gray-900">
                Candidate login
              </Link>
              <span className="text-gray-300">|</span>
              <a href="https://freejobpost.co/for-employers" className="hover:text-gray-900">
                Employers
              </a>
              <span className="text-gray-300">|</span>
              <Link href="/terms" className="hover:text-gray-900">
                Terms
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/privacy" className="hover:text-gray-900">
                Privacy
              </Link>
            </div>
            <p className="text-xs text-gray-500 text-center md:text-right max-w-md">
              Operated by{' '}
              <Link href="https://avahealth.co" className="underline hover:text-gray-900">
                Ava Health Partners LLC
              </Link>
              . Your resume is yours — we never sell your data.
              <br />
              4532 W Kennedy Blvd, Suite 125, Tampa, FL 33609 · (813) 531-8049 · info@avahealth.co
            </p>
          </div>
        </footer>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
