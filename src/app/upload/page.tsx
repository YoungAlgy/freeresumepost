import Link from 'next/link'
import type { Metadata } from 'next'
import UploadForm from './upload-form'

export const metadata: Metadata = {
  title: 'Upload your resume — free healthcare job matching',
  description:
    'Drag-drop your PDF resume and get matched to real healthcare jobs. No account, no cold-call recruiters. Your resume stays on your device until you click submit.',
  alternates: { canonical: 'https://freeresumepost.co/upload' },
}

export default function UploadPage() {
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
        <p className="text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed">
          We parse it locally in your browser — your file never leaves your
          machine until you review and approve what we extracted. Takes 30
          seconds.
        </p>

        <UploadForm />
      </div>
    </main>
  )
}
