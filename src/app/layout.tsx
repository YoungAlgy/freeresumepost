import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import './globals.css'

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
  metadataBase: new URL('https://freeresumepost.co'),
  openGraph: {
    siteName: 'Free Resume Post',
    type: 'website',
    locale: 'en_US',
    url: 'https://freeresumepost.co',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Resume Post — Upload once, get matched',
    description: 'Upload your resume free. We match you to real openings.',
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
      </head>
      <body className={inter.className}>
        {children}
        <footer className="max-w-6xl mx-auto px-4 py-8 mt-12 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link href="/upload" className="hover:text-gray-900">
                Upload resume
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/candidate/login" className="hover:text-gray-900">
                Candidate login
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="https://freejobpost.co" className="hover:text-gray-900">
                Employers
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/terms" className="hover:text-gray-900">
                Terms
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/privacy" className="hover:text-gray-900">
                Privacy
              </Link>
            </div>
            <p className="text-xs text-gray-400 text-center md:text-right max-w-md">
              Operated by Ava Health Partners LLC. Your resume is yours — we never sell your data.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
