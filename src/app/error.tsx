'use client'

// Route-segment error boundary. Catches uncaught errors thrown by Server
// Components, async data fetches, etc. within ANY route below /. Without
// this file Next.js falls back to its generic dev/prod error UI which
// looks broken to users. Mirrors the freejobpost.co sister-site
// implementation; styled to match this site's slate-on-white system
// (both sister sites now share the Ava Health navy + lime palette).

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // The `digest` is the hashed server-error id Next.js exposes when a
    // Server Component throws.
    console.error('Route segment error:', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <main className="max-w-3xl mx-auto px-6 py-20 text-center">
      <h1 className="text-6xl font-bold tracking-tight mb-4 text-slate-900">Whoops</h1>
      <h2 className="text-2xl font-semibold text-slate-700 mb-4">
        Something went wrong on our end
      </h2>
      <p className="text-slate-600 mb-2 max-w-md mx-auto">
        This is on us, not you. Most of the time, a quick retry fixes it.
      </p>
      {error.digest ? (
        <p className="text-xs text-slate-400 mb-10 font-mono">
          Error id: {error.digest}
        </p>
      ) : (
        <p className="mb-10" />
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex justify-center items-center bg-[#003D5C] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#002A40] transition-colors"
        >
          Try again
        </button>
        <Link
          href="/upload"
          className="inline-flex justify-center items-center bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold border border-slate-300 hover:bg-slate-100 transition-colors"
        >
          Upload your resume
        </Link>
        <Link
          href="/"
          className="inline-flex justify-center items-center text-slate-600 px-6 py-3 font-semibold hover:underline"
        >
          Home
        </Link>
      </div>

      <div className="text-left border border-slate-200 bg-slate-50 p-6 rounded-lg">
        <h3 className="text-xs font-bold tracking-wider uppercase text-slate-600 mb-3">
          If it keeps happening
        </h3>
        <p className="text-sm text-slate-700">
          Email{' '}
          <a href="mailto:info@avahealth.co" className="underline font-semibold hover:text-slate-900">
            info@avahealth.co
          </a>{' '}
          and include the error id above (if shown). We respond within 24
          hours on weekdays, usually faster.
        </p>
      </div>
    </main>
  )
}
