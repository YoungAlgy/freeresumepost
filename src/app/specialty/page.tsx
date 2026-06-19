// /specialty — index page listing every candidate-side specialty hub.
// Internal-link density + ranks for "healthcare resume upload" /
// "[specialty] resume" candidate-intent queries.

import Link from 'next/link'
import type { Metadata } from 'next'
import { CANDIDATE_SPECIALTIES } from '@/lib/specialty-slugs'

import { safeJsonLd } from '@/lib/safe-jsonld'
export const metadata: Metadata = {
  title: 'Healthcare resume upload by specialty',
  description: 'Free resume upload for healthcare candidates: physicians, NPs, PAs, RNs, CRNAs, LPNs, therapists, pharmacists, MAs, and more. Get matched, no recruiter spam.',
  alternates: { canonical: 'https://www.freeresumepost.co/specialty' },
  openGraph: {
    title: 'Healthcare resume upload by specialty | freeresumepost.co',
    description: 'Pick your specialty, upload once, get matched.',
    url: 'https://www.freeresumepost.co/specialty',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Healthcare resume upload by specialty | freeresumepost.co',
    description: 'Pick your specialty, upload once, get matched.',
    images: ['/opengraph-image'],
  },
}

export default function CandidateSpecialtyIndexPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">
            Ava Health
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium">
            <a href="https://freejobpost.co/for-employers" className="hidden sm:inline hover:text-slate-900">For employers</a>
            <Link href="/upload" className="bg-[#003D5C] text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-[#002A40]">Upload Resume</Link>
          </div>
        </div>
      </nav>

      <article className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        <nav className="text-xs text-slate-500 mb-4" aria-label="breadcrumb">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          {' / '}
          <span className="text-slate-900 font-medium">Specialties</span>
        </nav>

        <p className="text-xs font-semibold tracking-wider text-[#003D5C] uppercase mb-3">By specialty</p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-slate-900 mb-6">
          Healthcare resume upload<br />
          <span className="text-[#003D5C]">by specialty</span>
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-12 max-w-3xl">
          Pick your specialty to start. The parser handles the rest: credentials, state, experience, salary expectations. Free, private by default, no recruiter spam.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CANDIDATE_SPECIALTIES.map((s) => (
            <Link
              key={s.slug}
              href={`/specialty/${s.slug}`}
              className="block border border-slate-200 rounded-xl p-5 hover:border-slate-900 hover:shadow-sm transition-all"
            >
              <h2 className="font-semibold text-base text-slate-900 mb-1">{s.name}</h2>
              <p className="text-sm text-slate-600 leading-snug">{s.shortDescription}</p>
            </Link>
          ))}
        </div>
      </article>

      {/* Breadcrumb schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.freeresumepost.co' },
              { '@type': 'ListItem', position: 2, name: 'Specialties', item: 'https://www.freeresumepost.co/specialty' },
            ],
          }),
        }}
      />
    </main>
  )
}
