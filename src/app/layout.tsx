import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/SiteHeader'
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
    template: '%s | FreeResumePost',
    default: 'Post Your Healthcare Resume Free | FreeResumePost',
  },
  description:
    'A simple resume-posting tool for nurses and allied health professionals. Private by default.',
  metadataBase: new URL('https://www.freeresumepost.co'),
  openGraph: {
    siteName: 'FreeResumePost',
    type: 'website',
    locale: 'en_US',
    url: 'https://www.freeresumepost.co',
    title: 'Post Your Healthcare Resume Free | FreeResumePost',
    description:
      'A simple resume-posting tool for nurses and allied health professionals. Private by default.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Post Your Healthcare Resume Free | FreeResumePost',
    description:
      'A simple resume-posting tool for nurses and allied health professionals. Private by default.',
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
  verification: {
    google: [
      'SFRvinmueg87J1kMFBhvpABzmM1c13pLPCTRYjrRlVI',
      'osvOXjbhKGQXgOtQTzcqAz_G84Jsleaiaxwg-iM3X4Q',
    ],
    other: { 'msvalidate.01': 'AC806718B7170AF0A71011FC59BD9A88' },
  },
  category: 'business',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(buildOrganizationGraph()),
          }}
        />
      </head>
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-700 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          Skip to main content
        </a>
        <SiteHeader />
        <div id="main-content">{children}</div>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
            <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-3">
              <Link href="/upload" className="hover:text-indigo-700">
                Upload resume
              </Link>
              <Link href="/how-it-works" className="hover:text-indigo-700">
                How it works
              </Link>
              <Link href="/candidate/login" className="hover:text-indigo-700">
                Open profile
              </Link>
              <Link href="/terms" className="hover:text-indigo-700">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-indigo-700">
                Privacy
              </Link>
            </nav>
            <div className="text-xs md:text-right">
              <p>&copy; {new Date().getFullYear()} FreeResumePost.</p>
              <p>For nursing and allied health professionals.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
