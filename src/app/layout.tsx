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
            graph cross-links freejobpost + providers + main avahealth.co. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://avahealth.co#organization',
                  legalName: 'Ava Health Partners LLC',
                  name: 'Ava Health Partners',
                  alternateName: ['Ava Health', 'Ava Health Partners LLC'],
                  url: 'https://avahealth.co',
                  logo: 'https://avahealth.co/logo.png',
                  description: 'Healthcare staffing and recruiting firm connecting physicians, nurses, and therapists with US healthcare employers. Operates freeresumepost.co — a free candidate-resume platform that matches healthcare professionals to open roles without selling resume data.',
                  telephone: '+1-727-777-2545',
                  email: 'hello@avahealth.co',
                  sameAs: [
                    'https://avahealth.co',
                    'https://www.avahealth.co',
                    'https://providers.avahealth.co',
                    'https://app.avahealth.co',
                    'https://freejobpost.co',
                    'https://www.freeresumepost.co',
                  ],
                  address: {
                    '@type': 'PostalAddress',
                    streetAddress: '1314 7th Street South',
                    addressLocality: 'St. Petersburg',
                    addressRegion: 'FL',
                    postalCode: '33701',
                    addressCountry: 'US',
                  },
                  contactPoint: [
                    {
                      '@type': 'ContactPoint',
                      contactType: 'customer service',
                      telephone: '+1-727-777-2545',
                      email: 'hello@avahealth.co',
                      areaServed: 'US',
                      availableLanguage: 'English',
                    },
                  ],
                  openingHoursSpecification: [
                    {
                      '@type': 'OpeningHoursSpecification',
                      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                      opens: '09:00',
                      closes: '17:00',
                    },
                  ],
                  areaServed: { '@type': 'Country', name: 'United States' },
                  industry: 'Staffing and Recruiting',
                  naics: '561311',
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://www.freeresumepost.co#website',
                  url: 'https://www.freeresumepost.co',
                  name: 'Free Resume Post',
                  description: 'Upload your resume free, get matched to real healthcare openings.',
                  publisher: { '@id': 'https://avahealth.co#organization' },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://freejobpost.co/jobs?q={search_term_string}',
                    'query-input': 'required name=search_term_string',
                  },
                },
              ],
            }),
          }}
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
