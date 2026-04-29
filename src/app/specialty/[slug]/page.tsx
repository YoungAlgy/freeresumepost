// /specialty/[slug] — candidate-side SEO hub. One page per common
// healthcare specialty so each ranks for "[specialty] resume upload" /
// "submit [specialty] resume" / similar candidate-intent queries.

import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CANDIDATE_SPECIALTIES, getCandidateSpecialty } from '@/lib/specialty-slugs'

export const revalidate = 3600

export async function generateStaticParams() {
  return CANDIDATE_SPECIALTIES.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const hub = getCandidateSpecialty(slug)
  if (!hub) return {}
  return {
    title: hub.title,
    description: hub.metaDescription,
    alternates: { canonical: `https://www.freeresumepost.co/specialty/${hub.slug}` },
    openGraph: {
      title: `${hub.title} | freeresumepost.co`,
      description: hub.metaDescription,
      url: `https://www.freeresumepost.co/specialty/${hub.slug}`,
      type: 'website',
    },
  }
}

export default async function CandidateSpecialtyPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const hub = getCandidateSpecialty(slug)
  if (!hub) notFound()

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.freeresumepost.co' },
      { '@type': 'ListItem', position: 2, name: 'Specialties', item: 'https://www.freeresumepost.co/specialty' },
      { '@type': 'ListItem', position: 3, name: hub.name, item: `https://www.freeresumepost.co/specialty/${hub.slug}` },
    ],
  }

  // FAQPage schema for SERP rich-result eligibility
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How do I upload my ${hub.name} resume?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Click "Upload resume" on freeresumepost.co. PDF, DOCX, or plain text up to 5 MB. The parser pre-fills your name, email, ${hub.commonCredentials.slice(0, 3).join(', ')}, specialty, state, and years of experience — you correct anything wrong before saving. Takes about 90 seconds.`,
        },
      },
      {
        '@type': 'Question',
        name: `What ${hub.name} roles can I be matched to?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Common ${hub.name} roles on the platform: ${hub.exampleRoles.join(', ')}. The matching engine scores by specialty, state, city, credential, experience, and salary range — you only get notified when a 70%+ match opens.`,
        },
      },
      {
        '@type': 'Question',
        name: `Is uploading my ${hub.name} resume really free?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. We never charge candidates anything — not for upload, not for matches, not to apply. Hiring employers pay our placement fee when a match converts.',
        },
      },
      {
        '@type': 'Question',
        name: 'Will my resume be sold to recruiters?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "No. We don't sell, license, or share your data with third parties. Only verified employers with active job posts on our network can see profiles that match their roles.",
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="min-h-screen bg-white text-slate-900">
        <nav className="border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-tight">
              freeresumepost<span className="text-slate-400">.co</span>
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium">
              <a href="https://freejobpost.co" className="hover:text-slate-900">For employers</a>
              <Link href="/upload" className="bg-slate-900 text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-slate-700">Upload resume</Link>
            </div>
          </div>
        </nav>

        <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
          <nav className="text-xs text-slate-500 mb-4" aria-label="breadcrumb">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            {' / '}
            <Link href="/specialty" className="hover:text-slate-900">Specialties</Link>
            {' / '}
            <span className="text-slate-900 font-medium">{hub.name}</span>
          </nav>

          <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase mb-3">For {hub.name.toLowerCase()}s</p>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-slate-900 mb-6">
            {hub.name} resume upload<br />
            <span className="text-blue-600">— free, private by default.</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-10">
            {hub.shortDescription} Upload once, get matched, decide whether to apply. We don&apos;t sell your data and you can delete your profile any time.
          </p>

          <div className="border border-slate-200 rounded-2xl bg-slate-50 p-8 mb-12">
            <p className="text-sm font-semibold text-slate-900 mb-2">Drop your {hub.name.toLowerCase()} resume</p>
            <p className="text-sm text-slate-600 mb-4">PDF, DOCX, or text. Up to 5 MB. ~90 seconds end-to-end.</p>
            <Link href="/upload" className="inline-block bg-slate-900 text-white font-semibold px-6 py-3 rounded-full hover:bg-slate-700">
              Upload resume →
            </Link>
          </div>

          <h2 className="text-xl font-semibold mb-4">{hub.name} roles we match to</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Most candidates upload as one of these:
          </p>
          <div className="flex flex-wrap gap-2 mb-12">
            {hub.exampleRoles.map((r) => (
              <span key={r} className="text-sm bg-blue-50 text-blue-900 px-3 py-1 rounded-full font-medium">{r}</span>
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-4">Credentials we recognize</h2>
          <p className="text-slate-600 leading-relaxed mb-2">
            The parser auto-detects these on your resume:
          </p>
          <div className="flex flex-wrap gap-2 mb-12">
            {hub.commonCredentials.map((c) => (
              <span key={c} className="text-sm border border-slate-300 px-3 py-1 rounded-full text-slate-700 font-mono">{c}</span>
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-4">How matching works</h2>
          <ol className="space-y-4 mb-12">
            <li className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">1</div>
              <div>
                <div className="font-semibold text-slate-900 mb-1">Upload</div>
                <div className="text-slate-600 leading-relaxed text-sm">Parser fills your name, contact, credentials ({hub.commonCredentials.slice(0, 3).join(' / ')}), specialty, state, years of experience.</div>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">2</div>
              <div>
                <div className="font-semibold text-slate-900 mb-1">Pick public or private</div>
                <div className="text-slate-600 leading-relaxed text-sm">Public profiles get an indexed page (first name + last initial only). Private profiles only appear in the matching engine — invisible elsewhere.</div>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">3</div>
              <div>
                <div className="font-semibold text-slate-900 mb-1">Get matched</div>
                <div className="text-slate-600 leading-relaxed text-sm">When a 70%+ match opens on freejobpost.co, we email you. You decide whether to apply.</div>
              </div>
            </li>
          </ol>

          <h2 className="text-xl font-semibold mb-4">FAQ</h2>
          <div className="space-y-6 mb-12">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">How do I upload my {hub.name.toLowerCase()} resume?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Click &quot;Upload resume&quot; above. PDF, DOCX, or plain text up to 5 MB. Parser pre-fills the fields, you correct anything wrong before saving.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Is it really free?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Yes — for candidates, always. Hiring employers pay our placement fee.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Will recruiters spam me?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">No. Your profile is only visible to verified employers with active job posts that match your specialty + state. We don&apos;t sell or share data.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Can I delete my profile?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Yes — at any time. We wipe both the resume file and parsed data within 30 days, including from any active employer match queues.</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Other specialties</h2>
          <div className="flex flex-wrap gap-2 mb-12">
            {CANDIDATE_SPECIALTIES.filter((s) => s.slug !== hub.slug).map((s) => (
              <Link
                key={s.slug}
                href={`/specialty/${s.slug}`}
                className="text-sm border border-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-900 hover:text-white hover:border-slate-900"
              >
                {s.name}
              </Link>
            ))}
          </div>

          <div className="border border-slate-200 rounded-2xl bg-slate-50 p-8 text-center">
            <p className="text-2xl font-semibold mb-3 text-slate-900">Ready when you are</p>
            <Link href="/upload" className="inline-block bg-slate-900 text-white font-semibold px-6 py-3 rounded-full hover:bg-slate-700">
              Upload your {hub.name.toLowerCase()} resume →
            </Link>
          </div>
        </article>
      </main>
    </>
  )
}
