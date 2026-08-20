import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { supabase, hourIso } from '@/lib/supabase'
import { formatSalary } from '@/lib/format-salary'
import { bucketizeRoles, type RoleBucket } from '@/lib/role-buckets'
import { CANDIDATE_SPECIALTIES } from '@/lib/specialty-slugs'

export const metadata: Metadata = {
  // `absolute` bypasses the layout template `%s | Ava Health`. Without it the
  // rendered title would be the double-branded "Upload Your Resume, Get Matched
  // | Ava Health | Ava Health".
  title: { absolute: 'Upload Your Resume, Get Matched | Ava Health' },
  description:
    'Upload your resume free and get matched to real healthcare openings. No recruiter spam, no resume databases sold to the highest bidder.',
  alternates: { canonical: 'https://www.freeresumepost.co' },
  openGraph: {
    title: 'Upload Your Resume, Get Matched | Ava Health',
    description:
      'Upload your resume free. We match you to real healthcare openings. No recruiter spam.',
    url: 'https://www.freeresumepost.co',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Upload Your Resume, Get Matched | Ava Health',
    description:
      'Upload your resume free. We match you to real healthcare openings. No recruiter spam.',
    images: ['/opengraph-image'],
  },
}

// ISR: 2026-05-28 bumped 300s → 3600s (1h) in the cost audit. Candidates
// flow in via Flow B / self-upload (not every 5 min), so 1h keeps the live
// preview fresh at a fraction of the regen cost. See freejobpost jobs/[slug].
export const revalidate = 21600

// 2026-07-09 build fix: this page has no param space to shrink — it eagerly
// aggregates the FULL active corpus (a count then up to ~44 parallel .range()
// OFFSET windows over public_jobs). At build time Next prerenders it once, and
// on the now-57K-row table the deep-offset windows blow past the 60s build
// fetch timeout, aborting the whole build. force-dynamic moves that render to
// first-request time; the supabase client already caches every fetch for 1h
// (next.revalidate=3600 in src/lib/supabase.ts), so the output is unchanged and
// only the first visitor per cache window pays the latency, not the build.
export const dynamic = 'force-dynamic'
// 2026-07-23: the shared Postgres moved to Nano compute (see the incident
// note on _fetchHomepageDataUncached below) and the first-hit aggregation
// alone has been observed taking 100s+ there. Default function duration
// isn't enough headroom for that first, cache-populating request to
// actually finish. Raise it; every request after the first is a cache hit.
export const maxDuration = 120

interface PreviewJob {
  slug: string
  title: string
  city: string | null
  state: string | null
  role: string | null
  remote_hybrid: 'remote' | 'hybrid' | 'onsite' | null
  salary_min: number | null
  salary_max: number | null
}

function compactLocation(job: Pick<PreviewJob, 'city' | 'state' | 'remote_hybrid'>): string {
  if (job.remote_hybrid === 'remote') return 'Remote' + (job.state ? ` · ${job.state}` : '')
  return [job.city, job.state].filter(Boolean).join(', ')
}

// Recent-jobs preview for the hero — a single cheap, indexed query (limit 4).
// Kept separate from the specialty-tile aggregation below: this one is fast
// and should never be blocked by that one being slow.
async function _fetchPreviewJobsUncached(): Promise<PreviewJob[]> {
  const nowIso = hourIso()
  const { data } = await supabase
    .from('public_jobs')
    .select('slug, title, city, state, role, remote_hybrid, salary_min, salary_max')
    .eq('status', 'active')
    .is('deleted_at', null)
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false })
    .limit(4)
  return (data ?? []) as PreviewJob[]
}

const _cachedPreviewJobs = unstable_cache(
  _fetchPreviewJobsUncached,
  ['homepage-preview-jobs-v1'],
  { revalidate: 21600 },
)

// The "Browse by specialty" tiles aggregate role-bucket counts + salary
// ranges over the FULL active corpus. Supabase's anon PostgREST caps a query
// at 1,000 rows (pgrst.db_max_rows), so we fetch the corpus as parallel
// .range() windows. 2026-05-29 audit fixed two correctness bugs (keep in sync
// with src/app/upload/page.tsx):
//   (1) windows were ordered by the NON-UNIQUE `updated_at` — it has
//       tie-clusters of hundreds of rows, and Postgres gives no order within a
//       tie, so the same row could land in two windows (or none), corrupting
//       the counts. Now ordered by the unique `id` → clean partitioning.
//   (2) the batch count was a fixed 12 (12,000 rows) while inventory had grown
//       to ~13.7K, silently truncating ~12%. Now count-based so it never
//       under-fetches (capped at MAX_BATCHES as a runaway guard).
//
// 🔴 2026-07-23 INCIDENT FIX (same root cause as freejobpost's sitemap.ts —
// see that file's incident note): this ~44-60 batch aggregation was firing on
// EVERY request, uncached (force-dynamic disables the Data Cache), and used
// to block the WHOLE page. Fine against the old Micro-compute Postgres;
// hung/504'd outright once the shared DB moved to Nano compute -- even after
// wrapping it in unstable_cache (helps repeat hits, not the first) and
// raising maxDuration to 120s, a cold cache miss still blew past that budget.
// Split into its own component behind <Suspense> so this slow, non-critical
// aggregation can never again take the entire page down with it -- the hero,
// upload CTA, and recent-jobs preview render immediately regardless of how
// long (or whether) this resolves.
async function _fetchRoleBucketsUncached(): Promise<RoleBucket[]> {
  const BATCH_SIZE = 1000
  // ~60K-job safety bound (bumped from 40 on 2026-06-21). Active inventory hit
  // ~31,208 = 32 batches, 80% of the old 40K cap. Past 40K the cap would clamp
  // numBatches and the specialty-tile counts would silently UNDERCOUNT (a wrong
  // public stat). Keep in sync with upload/page.tsx + freejobpost active-batch-count.
  const MAX_BATCHES = 60
  const nowIso = hourIso()
  const bucketFields = 'role, title, salary_min, salary_max'

  const { count: activeCount } = await supabase
    .from('public_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('deleted_at', null)
    .gt('expires_at', nowIso)
  const numBatches = Math.min(MAX_BATCHES, Math.max(1, Math.ceil((activeCount ?? 0) / BATCH_SIZE)))

  const baseAgg = () => supabase
    .from('public_jobs')
    .select(bucketFields)
    .eq('status', 'active')
    .is('deleted_at', null)
    .gt('expires_at', nowIso)
    .order('id', { ascending: true })
  const aggBatches = await Promise.all(
    Array.from({ length: numBatches }, (_, i) =>
      baseAgg().range(i * BATCH_SIZE, (i + 1) * BATCH_SIZE - 1)
    )
  )

  const aggJobs = aggBatches.flatMap(
    (b) =>
      (b.data ?? []) as Array<{
        role: string | null
        title: string
        salary_min: number | null
        salary_max: number | null
      }>
  )
  return bucketizeRoles(aggJobs).slice(0, 6)
}

const _cachedRoleBuckets = unstable_cache(
  _fetchRoleBucketsUncached,
  ['homepage-role-buckets-v1'],
  { revalidate: 21600 },
)

async function SpecialtyTiles() {
  // 2026-07-24 EMERGENCY DISABLE: the up-to-60-batch aggregation this pulls
  // from (_cachedRoleBuckets → _fetchRoleBucketsUncached) is genuinely too
  // slow against the Nano-compute Postgres to finish within Vercel's function
  // duration limit -- Suspense doesn't help, since the function must stay
  // alive until every streamed chunk resolves, so a slow chunk still kills
  // the whole request at maxDuration. That was taking the ENTIRE page down
  // (confirmed live via Vercel runtime logs: "Task timed out after 120s" on
  // every request). Disabled outright until the real fix (SQL-side GROUP BY
  // aggregation instead of fetch-then-bucket-in-JS) ships. Do not re-enable
  // by reverting this line alone -- the underlying query is still too slow.
  return null
  // eslint-disable-next-line no-unreachable
  const roleBuckets = await _cachedRoleBuckets()
  if (roleBuckets.length === 0) return null

  return (
    <section className="border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-3">
            Browse by specialty
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-xl mx-auto">
            Concrete demand for your role, before you commit a resume.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {roleBuckets.map((b) => {
            const fmtK = (n: number) =>
              n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`
            const range =
              b.salaryFloor && b.salaryCeiling
                ? b.salaryFloor === b.salaryCeiling
                  ? fmtK(b.salaryFloor)
                  : `${fmtK(b.salaryFloor)}-${fmtK(b.salaryCeiling)}`
                : null
            return (
              <a
                key={b.label}
                href={`https://freejobpost.co/jobs?q=${encodeURIComponent(b.searchKeyword)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-2xl bg-white hover:bg-[#003D5C]/5 transition-colors border border-gray-200 hover:border-[#003D5C]/20 px-5 py-5"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span className="text-base font-semibold text-gray-900 truncate">
                    <span className="mr-1.5" aria-hidden="true">
                      {b.emoji}
                    </span>
                    {b.label}
                  </span>
                  <span className="text-sm font-semibold text-[#003D5C] tabular-nums shrink-0">
                    {b.count}
                  </span>
                </div>
                {range ? (
                  <div className="text-xs text-gray-600 tabular-nums">
                    {range} typical
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">
                    {b.count === 1 ? '1 active role' : `${b.count} active`}
                  </div>
                )}
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default async function Home() {
  const previewJobs = await _cachedPreviewJobs()

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle navy gradient */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-[#003D5C]/5 via-white to-white"
        />
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#003D5C]/5 border border-[#003D5C]/10 px-4 py-1.5 text-xs font-semibold text-[#003D5C] mb-8">
            <span className="w-2 h-2 bg-[#7FBC00] rounded-full" />
            Free for candidates
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.03em] leading-[1.02] text-gray-900 max-w-4xl mx-auto">
            Browse jobs first. <span className="text-[#003D5C]">Upload when ready.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            See real healthcare openings before you commit a resume. When something fits, drop your
            PDF once and we&apos;ll match you to the rest. No recruiter spam, no resume databases
            sold, no re-uploading for every application.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://freejobpost.co/jobs"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-[#7FBC00] text-white font-semibold rounded-lg hover:bg-[#6DA300] transition-colors shadow-sm"
            >
              Browse healthcare jobs →
            </a>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-gray-900 font-semibold rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Upload resume to match
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/candidate/login" className="text-[#003D5C] font-medium hover:underline">
              Sign in
            </Link>
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Employer?{' '}
            <a href="https://freejobpost.co" className="text-[#003D5C] font-medium hover:underline">
              freejobpost.co
            </a>,{' '}
            free job posts, no credit card.
          </p>

          {/* Hero product preview — live data from public_jobs */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-[#003D5C]/5 p-6 text-left">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                <span className="flex items-center gap-2">
                  Live healthcare openings
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7FBC00] inline-block" aria-hidden="true" />
                </span>
                <a href="https://freejobpost.co/jobs" className="text-[#003D5C] hover:text-[#002A40] normal-case tracking-normal font-medium text-[11px]">
                  See all &rarr;
                </a>
              </div>
              {previewJobs.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  No openings to show right now. Browse all jobs on freejobpost.co.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {previewJobs.map((job) => {
                    const salary = formatSalary(job.salary_min, job.salary_max)
                    const loc = compactLocation(job)
                    return (
                      <a
                        key={job.slug}
                        href={`https://freejobpost.co/jobs/${job.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between py-3 -mx-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{job.title}</div>
                          <div className="text-sm text-gray-500 truncate">{loc || 'Multiple locations'}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          {salary && <span className="text-sm font-medium text-gray-700 hidden sm:inline tabular-nums">{salary}</span>}
                          {job.remote_hybrid === 'remote' ? (
                            <span className="inline-flex items-center rounded-full bg-[#7FBC00]/10 text-[#7FBC00] border border-[#7FBC00]/30 px-2.5 py-0.5 text-xs font-semibold">
                              Remote
                            </span>
                          ) : job.remote_hybrid === 'hybrid' ? (
                            <span className="inline-flex items-center rounded-full bg-[#003D5C]/5 text-[#003D5C] border border-[#003D5C]/10 px-2.5 py-0.5 text-xs font-semibold">
                              Hybrid
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-0.5 text-xs font-semibold">
                              Onsite
                            </span>
                          )}
                        </div>
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Browse-by-specialty entry — surfaces concrete role counts at the
         top of funnel so candidates can self-identify a path before deciding
         between Browse vs Upload. Cards deep-link to the filtered /jobs view
         on freejobpost.co. Mirrored from /upload's same-named section.
         Behind Suspense (see SpecialtyTiles above) so this slow, full-corpus
         aggregation can never block the rest of the page from rendering. */}
      <Suspense fallback={null}>
        <SpecialtyTiles />
      </Suspense>

      {/* Specialty hub discovery */}
      <section className="border-t border-gray-100 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-xs font-semibold tracking-wider text-[#003D5C] uppercase mb-3">Browse by specialty</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-4">
            {CANDIDATE_SPECIALTIES.length} healthcare roles, one upload.
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto mb-8">
            NPs, CRNAs, RNs, LPNs, CNAs, therapists (PT/OT/SLP), pharmacists, MAs, RDNs, sonographers, and more. Pick yours and the parser handles the rest.
          </p>
          <Link
            href="/specialty"
            className="inline-flex items-center px-6 py-3 border border-slate-300 rounded-lg text-base font-semibold text-slate-900 hover:bg-[#003D5C] hover:text-white hover:border-[#003D5C] transition-colors"
          >
            See all specialties →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="text-xs font-semibold tracking-wider text-[#003D5C] uppercase mb-3">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-12">
            Common questions.
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Is uploading my resume actually free?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Yes, for candidates, always. We never charge you for upload, matches, or applying. Hiring employers pay our placement fee when a match converts.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Will my resume be sold to recruiters?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">No. We don&apos;t sell, license, or share your data with third parties. Only verified employers with active job posts on freejobpost.co can see profiles that match their roles.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">What healthcare roles can I upload as?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">NPs, CRNAs, RNs, LPNs, CNAs, therapists (PT/OT/SLP/AuD), pharmacists (PharmD/RPh), MAs, sonographers, lab techs, paramedics, and most allied health roles.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">How fast will I get matched?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Initial matches typically surface within a day of upload. Your top matches appear on your private profile page (the edit URL we send on submit). Florida + Texas + California candidates see the highest match volume. Never automatic application.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Can I delete my profile?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Yes, at any time. Email <a href="mailto:info@avahealth.co?subject=Delete%20my%20profile" className="text-[#003D5C] hover:underline">info@avahealth.co</a> with subject "Delete my profile" and we&apos;ll wipe both the resume file and parsed data within 30 days, including from any active employer match queues.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Do I have to make my profile public?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">No. Most candidates keep profiles private. Public profiles get an indexed page on the site (first name + last initial only), which can help passive job-seeking.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Is my license info verified?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">We auto-detect credential tokens (RN, CRNA, PA-C, PharmD, etc.) from your resume text. We don&apos;t do full credential verification. Employers verify independently before hiring.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-gray-100 bg-gradient-to-b from-white to-[#003D5C]/5">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <p className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-6">
            Upload once. Get matched forever.
          </p>
          <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto">
            Free. Always. Takes 30 seconds. You can delete everything whenever.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center px-8 py-4 bg-[#7FBC00] text-white text-base font-semibold rounded-lg hover:bg-[#6DA300] transition-colors shadow-lg shadow-[#003D5C]/10"
          >
            Upload your resume free →
          </Link>
        </div>
      </section>

</main>
  )
}
