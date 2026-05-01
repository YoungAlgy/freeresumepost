import Link from 'next/link'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import UploadForm from './upload-form'

export const metadata: Metadata = {
  title: 'Upload your resume — free healthcare job matching',
  description:
    'Drag-drop your PDF resume and get matched to real healthcare jobs. No account, no cold-call recruiters. Your resume stays on your device until you click submit.',
  alternates: { canonical: 'https://www.freeresumepost.co/upload' },
}

// ISR: refresh every 5 min so live counts stay accurate without per-request DB hits.
export const revalidate = 300

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

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`)
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}`
  return fmt(min ?? max ?? 0) + (min && !max ? '+' : '')
}

export default async function UploadPage() {
  // Live signal — pull active job count + 6 most-recent jobs in one render.
  const [countRes, recentRes] = await Promise.all([
    supabase
      .from('public_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('deleted_at', null)
      .gt('expires_at', new Date().toISOString()),
    supabase
      .from('public_jobs')
      .select('slug, title, city, state, role, salary_min, salary_max, remote_hybrid')
      .eq('status', 'active')
      .is('deleted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(6),
  ])
  const activeJobs = countRes.count ?? 0
  const recentJobs = (recentRes.data ?? []) as JobRow[]

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm">
              r
            </span>
            <span className="font-bold text-lg tracking-tight">
              freeresumepost<span className="text-slate-400">.co</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="https://freejobpost.co" className="hover:text-slate-900">
              For employers
            </a>
            <Link href="/" className="hover:text-slate-900">
              How it works
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase mb-3">
          Free forever · No account
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-slate-900 mb-4">
          Upload your resume.
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mb-4 leading-relaxed">
          We parse it locally in your browser — your file never leaves your
          machine until you review and approve what we extracted. Takes 30
          seconds.
        </p>
        <p className="text-sm text-slate-500 mb-6">
          Not ready to upload?{' '}
          <a
            href="https://freejobpost.co/jobs"
            className="text-blue-600 font-medium hover:underline"
          >
            Browse the {activeJobs.toLocaleString()} live healthcare openings first →
          </a>
        </p>

        {/* Live trust strip — gives visitors a real reason to upload now */}
        <div className="grid grid-cols-3 gap-3 mb-10 max-w-2xl">
          <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200/60">
            <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-1">Open roles</div>
            <div className="text-2xl font-semibold text-slate-900 tabular-nums flex items-baseline gap-1.5">
              {activeJobs.toLocaleString()}
              {activeJobs > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" aria-hidden="true" />}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200/60">
            <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-1">Provider network</div>
            <div className="text-2xl font-semibold text-slate-900 tabular-nums">850K+</div>
          </div>
          <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200/60">
            <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-1">Recruiter spam</div>
            <div className="text-2xl font-semibold text-slate-900">Zero</div>
          </div>
        </div>

        <UploadForm />

        {/* What happens next — sets expectations after upload */}
        <div className="mt-14 mb-10">
          <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-4">After you upload</h2>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center mt-0.5">1</div>
              <div>
                <div className="font-medium text-slate-900">We parse your resume locally</div>
                <div className="text-sm text-slate-600 mt-0.5">PDF or DOCX, ~3 seconds in your browser. Your file never reaches our servers until you click submit.</div>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center mt-0.5">2</div>
              <div>
                <div className="font-medium text-slate-900">You review every field</div>
                <div className="text-sm text-slate-600 mt-0.5">Specialty, credentials, state, contact info — fix anything we got wrong before it saves.</div>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center mt-0.5">3</div>
              <div>
                <div className="font-medium text-slate-900">We match you to live openings</div>
                <div className="text-sm text-slate-600 mt-0.5">Our matching engine scores you against every active job. We email you when a 70%+ match opens up — never spam.</div>
              </div>
            </li>
          </ol>
        </div>

        {/* Live jobs preview — most recent active roles, demonstrates real demand */}
        {recentJobs.length > 0 && (
          <div className="mt-14 mb-6 border-t border-slate-200 pt-10">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Recently posted on freejobpost.co</h2>
              <a href="https://freejobpost.co/jobs" className="text-xs font-medium text-blue-600 hover:text-blue-700">
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
                        {job.remote_hybrid === 'remote' && <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Remote</span>}
                        {job.remote_hybrid === 'hybrid' && <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold">Hybrid</span>}
                      </div>
                    </div>
                    {salary && <div className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">{salary}</div>}
                  </a>
                )
              })}
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Upload your resume to apply with one click. We&apos;ll only show you roles that match your specialty + state.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
