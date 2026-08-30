'use client'

// Route-segment error boundary. Catches uncaught errors thrown by Server
// Components, async data fetches, etc. within ANY route below /. Without
// this file Next.js falls back to its generic dev/prod error UI which
// looks broken to users. Styled to match FreeResumePost's public shell.

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

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex justify-center items-center text-slate-600 px-6 py-3 font-semibold hover:underline"
        >
          Home
        </Link>
      </div>
    </main>
  )
}
