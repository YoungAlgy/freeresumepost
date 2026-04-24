import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Resume Post — Upload once, get matched',
  description:
    'Upload your resume free and get matched to real healthcare openings. No recruiter spam, no resume databases sold to the highest bidder. Beta April 2026.',
}

// Dummy match preview — replaced with real data once public_jobs is live.
const PREVIEW_MATCHES = [
  { title: 'Family Medicine Physician', facility: 'Lee Health · Fort Myers, FL', score: 94, pay: '$270K+' },
  { title: 'Hospitalist (Nocturnist)', facility: 'Tulane Medical Center · New Orleans, LA', score: 88, pay: '$340K+' },
  { title: 'Urgent Care PA', facility: 'Banner Health · Phoenix, AZ', score: 82, pay: '$120K–$145K' },
  { title: 'Telemedicine PCP — Remote', facility: 'Ochsner Health · Remote LA', score: 78, pay: '$225K+' },
]

export default function Home() {
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
            Upload once. <span className="text-blue-600">Get matched.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Drop your resume once and we&apos;ll match you to real healthcare openings.
            No recruiter spam, no resume databases sold, no re-uploading for every application.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/upload"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-700 transition-colors shadow-sm"
            >
              Upload your resume →
            </Link>
            <Link
              href="/candidate/login"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-gray-900 font-semibold rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
            >
              I have an account
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            Employer?{' '}
            <a href="https://freejobpost.co" className="text-blue-600 font-medium hover:underline">
              freejobpost.co
            </a>{' '}
            — free job posts, no credit card.
          </p>

          {/* Hero product preview */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-blue-500/5 p-6 text-left">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                <span>Your top matches</span>
                <span className="text-blue-600">updated just now</span>
              </div>
              <div className="divide-y divide-gray-100">
                {PREVIEW_MATCHES.map((m) => (
                  <div key={m.title} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{m.title}</div>
                      <div className="text-sm text-gray-500 truncate">{m.facility}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-sm font-medium text-gray-700 hidden sm:inline">{m.pay}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 text-xs font-semibold">
                        {m.score}% match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
              { n: '3', h: 'Get matched', p: 'New matching jobs surface on your dashboard. Apply with one click.' },
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
    </main>
  )
}
