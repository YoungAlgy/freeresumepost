import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { supabase, hourIso } from '@/lib/supabase'
import UploadForm from './upload-form'
import AffiliateOffer from '@/components/AffiliateOffer'
import { formatSalary } from '@/lib/format-salary'
import { bucketizeRoles, type RoleBucket } from '@/lib/role-buckets'

export const metadata: Metadata = {
  title: 'Upload your resume free and get matched to healthcare jobs',
  description:
    'Drag-drop your PDF resume and get matched to real healthcare jobs. No account, no cold-call recruiters. Your resume stays on your device until you click submit.',
  alternates: { canonical: 'https://www.freeresumepost.co/upload' },
  openGraph: {
    title: 'Upload your resume free and get matched to healthcare jobs',
    description:
      'Drop your resume once and get matched to real healthcare openings. No account, no recruiter spam.',
    url: 'https://www.freeresumepost.co/upload',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Upload your resume free and get matched to healthcare jobs',
    description:
      'Drop your resume once and get matched to real healthcare openings. No account, no recruiter spam.',
    images: ['/opengraph-image'],
  },
}

// ISR: 2026-05-28 bumped 300s → 3600s (1h) in the cost audit. Low-traffic
// upload landing page — no need to regen every 5 min. See freejobpost.
export const revalidate = 21600

// 2026-07-09 build fix: same shape/failure as the homepage — this page eagerly
// aggregates the FULL active corpus (count + up to ~44 parallel .range() OFFSET
// windows over public_jobs) with no param space to shrink. Building it once at
// deploy time exceeds Next's 60s fetch timeout on the 57K-row table. force-
// dynamic moves the render to first-request time; the supabase client's 1h
// fetch cache (src/lib/supabase.ts) keeps output identical and cost bounded.
export const dynamic = 'force-dynamic'
// 2026-07-23: same Nano-compute incident as the homepage (see its note) —
// the first-hit aggregation alone has been observed taking 100s+. Raise the
// duration budget so that first, cache-populating request can actually
// finish instead of hard-timing out before anyone benefits from the cache.
export const maxDuration = 120

interface JobRow {
  slug: string
  title: string
  city: string | null
  state: string | null
  role: string | null
  salary_min: number | null
  salary_max: number | null
  remote_hybrid: 'remote' | 'hybrid' | 'onsite' | null
}

// Live signal — active job count + 6 most-recent jobs. Both cheap, single,
// indexed queries -- kept separate from the full-corpus role-bucket
// aggregation below, which is NOT cheap and must never block this fast path.
type ActiveJobsAndRecent = {
  activeJobs: number
  recentJobs: JobRow[]
}

async function _fetchActiveJobsAndRecentUncached(): Promise<ActiveJobsAndRecent> {
  const nowIso = hourIso()
  const recentFields = 'slug, title, city, state, role, salary_min, salary_max, remote_hybrid'

  const [{ count: activeCount }, recentRes] = await Promise.all([
    supabase
      .from('public_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('deleted_at', null)
      .gt('expires_at', nowIso),
    supabase
      .from('public_jobs')
      .select(recentFields)
      .eq('status', 'active')
      .is('deleted_at', null)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  return {
    activeJobs: activeCount ?? 0,
    recentJobs: (recentRes.data ?? []) as JobRow[],
  }
}

const _cachedActiveJobsAndRecent = unstable_cache(
  _fetchActiveJobsAndRecentUncached,
  ['upload-page-active-and-recent-v1'],
  { revalidate: 21600 },
)

// The role-bucket tiles aggregate counts + salary ranges over the FULL active
// corpus. Supabase's anon PostgREST caps a query at 1,000 rows, so we fetch
// the corpus as parallel .range() windows. 2026-05-29 audit fixed two bugs
// (mirrored from src/app/page.tsx — keep both in sync):
//   (1) windows ordered by the non-unique `updated_at` (tie-clusters of
//       hundreds) could put a row in two windows or none → corrupt counts;
//       now ordered by the unique `id`.
//   (2) a fixed 12-batch cap (12,000) silently truncated ~12% once inventory
//       passed 13K; now count-based (capped at MAX_BATCHES as a guard).
// Aggregation only reads role/title/salary, so those windows fetch just those
// columns (the recent-jobs preview keeps the full display set).
//
// 🔴 2026-07-23 INCIDENT FIX (same root cause as freejobpost's sitemap.ts and
// this app's own homepage — see page.tsx's incident note): this ~44-60 batch
// aggregation ran on EVERY request, uncached, and used to block the WHOLE
// page. Fine on the old Micro-compute Postgres; hung/504'd outright once the
// shared DB moved to Nano compute -- even after wrapping it in unstable_cache
// (helps repeat hits, not the first) and raising maxDuration to 120s, a cold
// cache miss still blew past that budget. Split into its own component
// behind <Suspense> so this slow, non-critical aggregation can never again
// take the entire page down with it.
async function _fetchRoleBucketsUncached(): Promise<RoleBucket[]> {
  const BATCH_SIZE = 1000
  // ~60K-job safety bound (bumped from 40 on 2026-06-21). Active inventory hit
  // ~31,208 = 32 batches, 80% of the old 40K cap. Past 40K the cap would clamp
  // numBatches and under-fetch the corpus. Keep in sync with page.tsx.
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
  ['upload-page-role-buckets-v1'],
  { revalidate: 21600 },
)

async function SpecialtyTiles({ activeJobs }: { activeJobs: number }) {
  const roleBuckets = await _cachedRoleBuckets()
  if (roleBuckets.length === 0) return null

  return (
    <div className="mt-14 mb-6 border-t border-slate-200 pt-10">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          Open roles by specialty
        </h2>
        <a
          href="https://freejobpost.co/jobs"
          className="text-xs font-medium text-[#003D5C] hover:text-[#002A40]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Browse all {activeJobs.toLocaleString()} →
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
              className="group block rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/60 px-4 py-4"
            >
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <span className="text-sm font-medium text-slate-900 truncate">
                  <span className="mr-1.5" aria-hidden="true">{b.emoji}</span>
                  {b.label}
                </span>
                <span className="text-xs font-semibold text-slate-500 tabular-nums shrink-0">
                  {b.count}
                </span>
              </div>
              {range ? (
                <div className="text-xs text-slate-600 tabular-nums">{range} typical</div>
              ) : (
                <div className="text-xs text-slate-500">{b.count === 1 ? '1 role' : `${b.count} active`}</div>
              )}
            </a>
          )
        })}
      </div>
      <p className="text-xs text-slate-500 mt-4">
        Upload your resume above to be matched with roles in your specialty + state. Or browse openings on freejobpost.co first if you want to see what&apos;s out there.
      </p>
    </div>
  )
}

export default async function UploadPage() {
  const { activeJobs, recentJobs } = await _cachedActiveJobsAndRecent()

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        <p className="text-xs font-semibold tracking-wider text-[#003D5C] uppercase mb-3">
          Free forever. No account
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-slate-900 mb-4">
          Upload your resume.
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mb-4 leading-relaxed">
          We parse it locally in your browser. Your file never leaves your
          machine until you review and approve what we extracted. Takes 30
          seconds.
        </p>
        <p className="text-sm text-slate-500 mb-6">
          Not ready to upload?{' '}
          <a
            href="https://freejobpost.co/jobs"
            className="text-[#003D5C] font-medium hover:underline"
          >
            Browse the {activeJobs.toLocaleString()} live healthcare openings first →
          </a>
        </p>

        {/* Live trust strip — gives visitors a real reason to upload now */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 max-w-2xl">
          <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200/60">
            <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-1">Open roles</div>
            <div className="text-2xl font-semibold text-slate-900 tabular-nums flex items-baseline gap-1.5">
              {activeJobs.toLocaleString()}
              {activeJobs > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#7FBC00] inline-block" aria-hidden="true" />}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200/60">
            <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-1">Provider network</div>
            <div className="text-2xl font-semibold text-slate-900 tabular-nums">1.4M+</div>
          </div>
          <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200/60">
            <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-1">Recruiter spam</div>
            <div className="text-2xl font-semibold text-slate-900">Zero</div>
          </div>
        </div>

        <UploadForm />

        {/* Affiliate offer (live: JobCopilot). The kickresume/rezi slots render
            nothing until their links are configured. */}
        <div className="mt-8">
          <AffiliateOffer program="jobcopilot" />
        </div>

        {/* What happens next — sets expectations after upload */}
        <div className="mt-14 mb-10">
          <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-4">After you upload</h2>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-[#7FBC00] text-white text-xs font-semibold flex items-center justify-center mt-0.5">1</div>
              <div>
                <div className="font-medium text-slate-900">We parse your resume locally</div>
                <div className="text-sm text-slate-600 mt-0.5">PDF or DOCX, ~3 seconds in your browser. Your file never reaches our servers until you click submit.</div>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-[#7FBC00] text-white text-xs font-semibold flex items-center justify-center mt-0.5">2</div>
              <div>
                <div className="font-medium text-slate-900">You review every field</div>
                <div className="text-sm text-slate-600 mt-0.5">Specialty, credentials, state, contact info. Fix anything we got wrong before it saves.</div>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-[#7FBC00] text-white text-xs font-semibold flex items-center justify-center mt-0.5">3</div>
              <div>
                <div className="font-medium text-slate-900">We match you to live openings</div>
                <div className="text-sm text-slate-600 mt-0.5">Our matching engine scores you against every active job. Your top matches appear on your private profile page (the edit URL you get on submit), refreshed daily. No spam, no auto-apply.</div>
              </div>
            </li>
          </ol>
        </div>

        {/* Specialty preview — show role-level counts so candidates see demand
           specific to their specialty BEFORE committing to upload. Highest-
           leverage candidate-side conversion lever per the strategic plan.
           Behind Suspense (see SpecialtyTiles above) so this slow, full-corpus
           aggregation can never block the rest of the page from rendering. */}
        <Suspense fallback={null}>
          <SpecialtyTiles activeJobs={activeJobs} />
        </Suspense>

        {/* Live jobs preview — most recent active roles, demonstrates real demand */}
        {recentJobs.length > 0 && (
          <div className="mt-14 mb-6 border-t border-slate-200 pt-10">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Recently posted on freejobpost.co</h2>
              <a href="https://freejobpost.co/jobs" className="text-xs font-medium text-[#003D5C] hover:text-[#002A40]">
                Browse all {activeJobs.toLocaleString()} →
              </a>
            </div>
            <div className="space-y-2">
              {recentJobs.map((job) => {
                const salary = formatSalary(job.salary_min, job.salary_max)
                const loc = [job.city, job.state].filter(Boolean).join(', ')
                return (
                  <a
                    key={job.slug}
                    href={`https://freejobpost.co/jobs/${job.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-slate-900 truncate">{job.title}</div>
                      <div className="text-xs text-slate-600 truncate mt-0.5">
                        {loc || '—'}
                        {job.remote_hybrid === 'remote' && <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-[#7FBC00]/10 text-[#7FBC00] border border-[#7FBC00]/30 text-[10px] font-semibold">Remote</span>}
                        {job.remote_hybrid === 'hybrid' && <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-[#003D5C]/10 text-[#003D5C] text-[10px] font-semibold">Hybrid</span>}
                      </div>
                    </div>
                    {salary && <div className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">{salary}</div>}
                  </a>
                )
              })}
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Upload your resume to see roles matched to your specialty + state. Apply directly from your matches dashboard.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
