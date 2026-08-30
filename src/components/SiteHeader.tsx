import Link from 'next/link'
import { Logo } from './Logo'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="FreeResumePost home">
          <Logo size={32} className="shrink-0" />
          <span className="truncate text-base font-bold tracking-tight text-slate-950 sm:text-lg">
            FreeResumePost
          </span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/how-it-works"
            className="hidden text-sm font-medium text-slate-600 hover:text-indigo-700 md:inline"
          >
            How it works
          </Link>
          <Link
            href="/candidate/login"
            className="text-sm font-medium text-slate-600 hover:text-indigo-700"
          >
            Sign in
          </Link>
          <Link
            href="/upload"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            Upload
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default SiteHeader
