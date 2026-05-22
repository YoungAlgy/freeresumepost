// /specialty/[slug] — candidate-side SEO hub. One page per common
// healthcare specialty so each ranks for "[specialty] resume upload" /
// "submit [specialty] resume" / similar candidate-intent queries.

import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CANDIDATE_SPECIALTIES, getCandidateSpecialty } from '@/lib/specialty-slugs'
import { supabase } from '@/lib/supabase'
import {
  aggregateSalariesByGroup,
  aggregateSalariesOverall,
  fmtUsdCompact,
} from '@/lib/salary-aggregates'

import { safeJsonLd } from '@/lib/safe-jsonld'

// Slugs that exist on BOTH freeresumepost and freejobpost specialty hubs.
// When the current hub is in this set, the "browse jobs" cross-link points
// to the matching specialty hub on freejobpost instead of a search query.
// Bidirectional authority transfer + tighter user flow.
const BRIDGED_SPECIALTY_SLUGS = new Set([
  'registered-nurse',
  'crna',
  'nurse-practitioner',
  'pharmacist',
  'physician-assistant',
])

export const revalidate = 600

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
      images: ['/opengraph-image'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${hub.title} | freeresumepost.co`,
      description: hub.metaDescription,
      images: ['/opengraph-image'],
    },
  }
}

type MatchingJob = {
  state: string | null
  salary_min: number | null
  salary_max: number | null
}

/**
 * Fetch active jobs on freejobpost.co that match the candidate specialty.
 * Uses an ILIKE search across title/specialty/role with the specialty's
 * display name as the pattern. The salary aggregator's ≥3-data-points
 * minimum ensures we never surface noisy aggregates from sparse matches.
 *
 * Same Supabase project as freejobpost — public_jobs is the canonical
 * job inventory across both sites.
 *
 * Fetches up to NUM_BATCHES × 1,000 = 5,000 matching rows via parallel
 * .range() batches. Bumped from .limit(500) on 2026-05-17: with the
 * USAJobs federal addition pushing inventory past 9,000 active jobs and
 * popular specialties (RN, MD) matching thousands of rows, the prior
 * 500-row cap was producing noisy state aggregates (states with 10+
 * actual matches were averaging across 1-2 rows). 5,000 rows covers
 * even the largest specialties (RN ≈ 3,500 matches) with headroom.
 */
async function fetchMatchingJobs(specialtyName: string): Promise<MatchingJob[]> {
  // Strip a trailing " / X" alias (e.g. "LPN / LVN" → "LPN") for the
  // primary search; the alias is rarely the actual posted title.
  const primary = specialtyName.split(' /')[0].trim()
  if (!primary) return []
  const pattern = `%${primary}%`
  const NUM_BATCHES = 5
  const BATCH_SIZE = 1000
  const nowIso = new Date().toISOString()
  const baseQuery = () => supabase
    .from('public_jobs')
    .select('state, salary_min, salary_max')
    .eq('status', 'active')
    .is('deleted_at', null)
    .gt('expires_at', nowIso)
    .or(`title.ilike.${pattern},specialty.ilike.${pattern},role.ilike.${pattern}`)
  const batches = await Promise.all(
    Array.from({ length: NUM_BATCHES }, (_, i) =>
      baseQuery().range(i * BATCH_SIZE, (i + 1) * BATCH_SIZE - 1)
    )
  )
  return batches.flatMap((b) => (b.data ?? []) as MatchingJob[])
}

export default async function CandidateSpecialtyPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const hub = getCandidateSpecialty(slug)
  if (!hub) notFound()

  // Deep-link to the sister freejobpost specialty hub when the slug bridges
  // both sites. Otherwise fall back to a job search query.
  const jobHubUrl = BRIDGED_SPECIALTY_SLUGS.has(hub.slug)
    ? `https://freejobpost.co/specialty/${hub.slug}`
    : `https://freejobpost.co/jobs?q=${encodeURIComponent(hub.name.split(' /')[0].trim())}`

  // Salary aggregates for this specialty, broken down by state. Targets
  // AI Overview citability for "[specialty] salary by state" queries.
  // Plain HTML output (no Occupation/EstimatedSalary schema — deprecated).
  const matchingJobs = await fetchMatchingJobs(hub.name)
  const salaryOverall = aggregateSalariesOverall(matchingJobs)
  const salaryByState = aggregateSalariesByGroup(
    matchingJobs,
    (j) => j.state?.trim() || null,
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.freeresumepost.co' },
      { '@type': 'ListItem', position: 2, name: 'Specialties', item: 'https://www.freeresumepost.co/specialty' },
      { '@type': 'ListItem', position: 3, name: hub.name, item: `https://www.freeresumepost.co/specialty/${hub.slug}` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      <main className="min-h-screen bg-white text-slate-900">
        <nav className="border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-tight">
              freeresumepost<span className="text-slate-400">.co</span>
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium">
              <a href="https://freejobpost.co/for-employers" className="hover:text-slate-900">For employers</a>
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
            {hub.shortDescription} Upload once, get matched, decide whether to apply. We don&apos;t sell your data — email us any time to delete your profile.
          </p>

          <div className="border border-slate-200 rounded-2xl bg-slate-50 p-8 mb-12">
            <p className="text-sm font-semibold text-slate-900 mb-2">Drop your {hub.name.toLowerCase()} resume</p>
            <p className="text-sm text-slate-600 mb-4">PDF, DOCX, or text. Up to 5 MB. ~90 seconds end-to-end.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/upload" className="inline-block bg-slate-900 text-white font-semibold px-6 py-3 rounded-full hover:bg-slate-700">
                Upload resume →
              </Link>
              <a
                href={jobHubUrl}
                className="inline-block border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-full hover:bg-slate-900 hover:text-white hover:border-slate-900"
              >
                Browse {hub.name} jobs →
              </a>
            </div>
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

          {/* Computed salary panel — aggregated from active job inventory on
              freejobpost.co with published salary ranges. Plain HTML for
              AI Overview citability; no Occupation/EstimatedSalary schema. */}
          {salaryOverall && (
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-3">
                {hub.name} salaries by state
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4 text-sm">
                Based on {salaryOverall.count} active {hub.name.toLowerCase()} role{salaryOverall.count === 1 ? '' : 's'} on freejobpost.co with published salary ranges. Typical pay: {fmtUsdCompact(salaryOverall.low)}–{fmtUsdCompact(salaryOverall.high)} (median {fmtUsdCompact(salaryOverall.avg)} per year).
              </p>
              {salaryByState.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold text-slate-900">State</th>
                        <th scope="col" className="px-4 py-3 font-semibold text-right text-slate-900">Roles</th>
                        <th scope="col" className="px-4 py-3 font-semibold text-right text-slate-900">Typical pay</th>
                        <th scope="col" className="px-4 py-3 font-semibold text-right text-slate-900">Median</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salaryByState.map((row) => (
                        <tr key={row.label}>
                          <td className="px-4 py-3 text-slate-800">{row.label}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.count}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                            {fmtUsdCompact(row.low)}&ndash;{fmtUsdCompact(row.high)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                            {fmtUsdCompact(row.avg)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                Salary ranges are pulled from real published listings on freejobpost.co. Some roles publish a range, others don&apos;t; the table reflects only roles with both a floor and ceiling.
              </p>
            </section>
          )}

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
                <div className="text-slate-600 leading-relaxed text-sm">Your top matches surface on your private profile page (the edit URL we send on submit), refreshed every few hours. You decide whether to apply.</div>
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
              <p className="text-slate-600 text-sm leading-relaxed">Yes — at any time. Email <a href="mailto:alex@avahealth.co?subject=Delete%20my%20profile" className="text-blue-600 hover:underline">alex@avahealth.co</a> with subject &ldquo;Delete my profile&rdquo; and we&apos;ll wipe both the resume file and parsed data within 30 days, including from any active employer match queues.</p>
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
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/upload" className="inline-block bg-slate-900 text-white font-semibold px-6 py-3 rounded-full hover:bg-slate-700">
                Upload your {hub.name.toLowerCase()} resume →
              </Link>
              <a
                href={jobHubUrl}
                className="inline-block border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-full hover:bg-slate-900 hover:text-white hover:border-slate-900"
              >
                Browse {hub.name} jobs
              </a>
            </div>
          </div>
        </article>
      </main>
    </>
  )
}
