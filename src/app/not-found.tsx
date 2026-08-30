import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist. Upload or manage your resume.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl font-black tracking-tight text-slate-900 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-bold text-slate-700 mb-4">Page not found</h2>
        <p className="text-slate-600 mb-10 max-w-md mx-auto">
          That page doesn&apos;t exist or got moved. Try one of the links below.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-700 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-800"
          >
            Upload your resume
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex justify-center items-center bg-white text-slate-900 px-6 py-3 rounded-lg font-bold border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            How it works
          </Link>
          <Link
            href="/"
            className="inline-flex justify-center items-center text-slate-700 px-6 py-3 font-bold hover:underline"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  )
}
