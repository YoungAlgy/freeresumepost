import Link from 'next/link'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Free Resume Post — Upload once, get matched',
  description:
    'Upload your resume free and get matched to real healthcare openings. No recruiter spam, no resume databases sold to the highest bidder. Beta April 2026.',
}

// ISR refresh every 5 min — keeps the live preview fresh without per-request cost
export const revalidate = 300

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

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`)
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}`
  return fmt(min ?? max ?? 0) + (min && !max ? '+' : '')
}

function compactLocation(job: Pick<PreviewJob, 'city' | 'state' | 'remote_hybrid'>): string {
  if (job.remote_hybrid === 'remote') return 'Remote' + (job.state ? ` · ${job.state}` : '')
  return [job.city, job.state].filter(Boolean).join(', ')
}

export default async function Home() {
  // Pull 4 real recent jobs to anchor the hero preview card. Falls back to
  // dummy data only if the Supabase fetch fails (deploy-time / connectivity).
  const { data: liveJobs } = await supabase
    .from('public_jobs')
    .select('slug, title, city, state, role, remote_hybrid, salary_min, salary_max')
    .eq('status', 'active')
    .is('deleted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(4)

  const previewJobs = (liveJobs ?? []) as PreviewJob[]

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-200/80 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-[17px] tracking-tight text-gray-900">
              freeresumepost<span className="text-blue-600">.co</span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
              BETA
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-[14px] font-medium text-gray-700">
            <Link href="/how-it-works" className="hover:text-gray-900">How it works</Link>
            <a href="https://freejobpost.co" className="hover:text-gray-900">For employers</a>
            <Link href="/candidate/login" className="hover:text-gray-900">Sign in</Link>
            <Link
              href="/upload"
              className="bg-gray-900 text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-gray-700 transition-colors"
            >
              Upload resume
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle blue gradient */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/70 via-white to-white"
        />
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 text-xs font-semibold text-blue-700 mb-8">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Beta opening April 2026
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.03em] leading-[1.02] text-gray-900 max-w-4xl mx-auto">
            Browse jobs first. <span className="text-blue-600">Upload when ready.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            See real healthcare openings before you commit a resume. When something fits, drop your
            PDF once and we&apos;ll match you to the rest. No recruiter spam, no resume databases
            sold, no re-uploading for every application.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://freejobpost.co/jobs"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-700 transition-colors shadow-sm"
            >
              Browse healthcare jobs →
            </a>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-gray-900 font-semibold rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Upload resume to match
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/candidate/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Employer?{' '}
            <a href="https://freejobpost.co" className="text-blue-600 font-medium hover:underline">
              freejobpost.co
            </a>{' '}
            — free job posts, no credit card.
          </p>

          {/* Hero product preview — live data from public_jobs */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-blue-500/5 p-6 text-left">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                <span className="flex items-center gap-2">
                  Live healthcare openings
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" aria-hidden="true" />
                </span>
                <a href="https://freejobpost.co/jobs" className="text-blue-600 hover:text-blue-700 normal-case tracking-normal font-medium text-[11px]">
                  See all &rarr;
                </a>
              </div>
              {previewJobs.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  Live openings load when you upload your resume.
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
                            <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 text-xs font-semibold">
                              Remote
                            </span>
                          ) : job.remote_hybrid === 'hybrid' ? (
                            <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 text-xs font-semibold">
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

      {/* Three promises */}
      <section className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                n: '01',
                h: 'Your resume, your data',
                p: 'We never sell your resume to third parties. Public profile or private — your call. Delete anytime, we honor it.',
              },
              {
                n: '02',
                h: 'Matched to real jobs',
                p: 'We score you against live openings at freejobpost.co by specialty, state, experience, and credential. You see fit, not recycled Indeed listings.',
              },
              {
                n: '03',
                h: 'One-click apply',
                p: 'When a job matches, apply with one click using your saved profile. No re-uploading the same resume for every portal.',
              },
            ].map((item) => (
              <div key={item.n} className="rounded-2xl border border-gray-200 bg-white p-8 hover:shadow-lg hover:shadow-blue-500/5 transition-shadow">
                <div className="text-blue-600 font-semibold text-xs tracking-widest mb-3">{item.n}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.h}</h3>
                <p className="text-gray-600 leading-relaxed">{item.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-xs font-semibold tracking-widest text-gray-500 mb-3 uppercase">How it works</h2>
            <p className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 max-w-2xl mx-auto">
              Three steps. No re-uploads. No spam.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { n: '1', h: 'Upload PDF', p: 'Drop your resume. Any format — PDF, DOCX, whatever.' },
              { n: '2', h: 'We parse', p: 'We auto-extract your specialty, credential, experience, location. Review in 30 seconds.' },
              { n: '3', h: 'Get matched', p: 'Your top matches surface on your private profile page, refreshed every few hours. Apply directly from each listing.' },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-semibold mb-4">
                  {step.n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.h}</h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">{step.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <p className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">
            Built by a working staffing team.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
            Not a resume mill. Not a VC-backed disruption play. A real team that places
            <span className="font-semibold text-gray-900"> physicians, nurses, and therapists every week</span>
            &nbsp;and got tired of Indeed charging both sides.
          </p>
        </div>
      </section>

      {/* Specialty hub discovery */}
      <section className="border-t border-gray-100 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase mb-3">Browse by specialty</p>
          <p className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-4">
            29 healthcare roles, one upload.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto mb-8">
            Physicians, NPs, PAs, RNs, CRNAs, therapists (PT/OT/SLP), pharmacists, MAs, RDNs, sonographers, and more — pick yours and the parser handles the rest.
          </p>
          <Link
            href="/specialty"
            className="inline-flex items-center px-6 py-3 border border-slate-300 rounded-full text-base font-semibold text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
          >
            See all specialties →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase mb-3">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-12">
            Common questions.
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Is uploading my resume actually free?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Yes — for candidates, always. We never charge you for upload, matches, or applying. Hiring employers pay our placement fee when a match converts.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Will my resume be sold to recruiters?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">No. We don&apos;t sell, license, or share your data with third parties. Only verified employers with active job posts on freejobpost.co can see profiles that match their roles.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">What healthcare roles can I upload as?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Physicians (MD/DO), NPs, PAs, RNs, CRNAs, LPNs, therapists (PT/OT/SLP/AuD), pharmacists (PharmD/RPh), MAs, sonographers, lab techs, paramedics, and most allied health roles.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">How fast will I get matched?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Initial matches typically surface within a few hours of upload. Your top matches appear on your private profile page (the edit URL we send on submit). Florida + Texas + California candidates see the highest match volume. Never automatic application.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Can I delete my profile?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Yes — at any time. We wipe both the resume file and parsed data within 30 days, including from any active employer match queues.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Do I have to make my profile public?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">No. Most candidates keep profiles private. Public profiles get an indexed page on the site (first name + last initial only), which can help passive job-seeking.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Is my license info verified?</h3>
              <p className="text-slate-600 leading-relaxed text-sm">We cross-reference NPI numbers and state board lookups during the parse step but don&apos;t do full credential verification. Employers verify credentials independently before hiring.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-gray-100 bg-gradient-to-b from-white to-blue-50/50">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <p className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-6">
            Upload once. Get matched forever.
          </p>
          <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto">
            Free. Always. Takes 30 seconds. You can delete everything whenever.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center px-8 py-4 bg-gray-900 text-white text-base font-semibold rounded-full hover:bg-gray-700 transition-colors shadow-lg shadow-blue-500/10"
          >
            Upload your resume free →
          </Link>
        </div>
      </section>

      {/* FAQPage JSON-LD — eligible for FAQ rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: 'Is uploading my resume actually free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — for candidates, always. We never charge for upload, matches, or applying. Hiring employers pay our placement fee.' } },
              { '@type': 'Question', name: 'Will my resume be sold to recruiters?', acceptedAnswer: { '@type': 'Answer', text: "No. We don't sell, license, or share your data with third parties. Only verified employers with active job posts on freejobpost.co can see profiles that match their roles." } },
              { '@type': 'Question', name: 'What healthcare roles can I upload as?', acceptedAnswer: { '@type': 'Answer', text: 'Physicians (MD/DO), NPs, PAs, RNs, CRNAs, LPNs, therapists (PT/OT/SLP/AuD), pharmacists (PharmD/RPh), MAs, sonographers, lab techs, paramedics, and most allied health roles.' } },
              { '@type': 'Question', name: 'How fast will I get matched?', acceptedAnswer: { '@type': 'Answer', text: 'Initial matches typically surface within a few hours of upload. Your top matches appear on your private profile page (the edit URL we send on submit). Florida + Texas + California candidates see the highest match volume.' } },
              { '@type': 'Question', name: 'Can I delete my profile?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — at any time. We wipe both the resume file and parsed data within 30 days, including from any active employer match queues.' } },
              { '@type': 'Question', name: 'Do I have to make my profile public?', acceptedAnswer: { '@type': 'Answer', text: 'No. Most candidates keep profiles private. Public profiles get an indexed page (first name + last initial only).' } },
              { '@type': 'Question', name: 'Is my license info verified?', acceptedAnswer: { '@type': 'Answer', text: "We cross-reference NPI numbers and state board lookups during the parse step but don't do full credential verification. Employers verify credentials independently." } },
            ],
          }),
        }}
      />
    </main>
  )
}
