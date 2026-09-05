import Link from 'next/link'
import { Logo } from './Logo'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
        <Link href="/" className="flex items-center gap-1.5" aria-label="FreeResumePost home">
          <Logo size={28} className="shrink-0" />
          <span className="whitespace-nowrap text-sm font-black tracking-[-0.03em] text-[#17324D] sm:text-lg">
            FreeResumePost
          </span>
        </Link>

        <nav aria-label="Main navigation" className="flex shrink-0 items-center gap-2 sm:gap-5">
          <Link
            href="/how-it-works"
            className="hidden text-sm font-medium text-slate-600 hover:text-indigo-700 md:inline"
          >
            How it works
          </Link>
          <Link
            href="/candidate/login"
            className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap text-sm font-medium text-slate-600 hover:text-indigo-700"
          >
            Sign in
          </Link>
          <Link
            href="/upload"
            className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-indigo-700 px-2.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 sm:px-3.5"
          >
            Upload
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default SiteHeader
