import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Resume Post — Upload once, get matched',
  description:
    'Upload your resume free and get matched to real healthcare openings. No recruiter spam, no resume databases sold to the highest bidder. Beta April 2026.',
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center">
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-32">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Beta opening April 2026
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-gray-900">
            Upload once.
            <br />
            <span className="text-blue-700">Get matched.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl leading-relaxed">
            Drop your resume in once. We match you to real healthcare openings — no recruiter
            pitches, no spam, no resume database sold to the highest bidder. Free forever.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-700 text-white font-semibold rounded-md hover:bg-blue-800 transition"
            >
              Upload your resume
            </Link>
            <Link
              href="/candidate/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-md border border-gray-300 hover:border-gray-400 transition"
            >
              I have an account
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Employer?{' '}
            <a
              href="https://freejobpost.co"
              className="text-green-700 font-medium hover:underline"
            >
              freejobpost.co
            </a>{' '}
            — free job posts, no credit card.
          </p>
        </div>
      </section>

      {/* Three promises */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-10">
          <div>
            <div className="text-sm font-bold text-blue-700 mb-2">01</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Your resume, your data
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We never sell your resume to third parties. You control who sees it
              — public profile or private, your call. Delete anytime.
            </p>
          </div>
          <div>
            <div className="text-sm font-bold text-blue-700 mb-2">02</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Matched to real jobs
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Our engine scores you against live openings at freejobpost.co by specialty,
              state, experience, and credential. You see fit, not recycled Indeed listings.
            </p>
          </div>
          <div>
            <div className="text-sm font-bold text-blue-700 mb-2">03</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              One-click apply
            </h2>
            <p className="text-gray-600 leading-relaxed">
              When a job matches, apply with one click using your saved profile.
              No re-uploading the same resume to the next portal&apos;s ATS.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
