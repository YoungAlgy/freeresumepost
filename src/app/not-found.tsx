import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found',
  description:
    'The page you are looking for does not exist. Upload your resume or browse healthcare candidates by specialty.',
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
          That page doesn't exist or got moved. Try one of the links below.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link
            href="/upload"
            className="inline-flex justify-center items-center bg-[#7FBC00] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#6DA300] transition-colors"
          >
            Upload your resume
          </Link>
          <Link
            href="/specialty"
            className="inline-flex justify-center items-center bg-white text-slate-900 px-6 py-3 rounded-lg font-bold border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Browse specialties
          </Link>
          <Link
            href="/"
            className="inline-flex justify-center items-center text-slate-700 px-6 py-3 font-bold hover:underline"
          >
            Home
          </Link>
        </div>

        <div className="text-left rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-4">
            Popular specialties
          </h3>
          <div className="flex flex-wrap gap-2">
            {/* Slugs MUST exist in src/lib/specialty-slugs.ts — three of the
                old entries (family-medicine, psychiatry, cardiology) were
                freejobpost slugs that 404 here (2026-06 audit, F89). */}
            {[
              { label: 'Physician', href: '/specialty/physician' },
              { label: 'LPN / LVN', href: '/specialty/lpn' },
              { label: 'Registered Nurse', href: '/specialty/registered-nurse' },
              { label: 'Nurse Practitioner', href: '/specialty/nurse-practitioner' },
              { label: 'Physician Assistant', href: '/specialty/physician-assistant' },
              { label: 'Physical Therapist', href: '/specialty/physical-therapist' },
              { label: 'How it works', href: '/how-it-works' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm px-3 py-1.5 rounded-full border border-slate-300 bg-white hover:border-[#003D5C]/40 hover:bg-[#003D5C]/5 transition-colors font-medium text-slate-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
