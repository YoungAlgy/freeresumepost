import type { Metadata } from 'next'
import Link from 'next/link'
import OtpLoginForm from './OtpLoginForm'

export const metadata: Metadata = {
  title: 'Candidate sign-in',
  description: 'Sign in to manage your freeresumepost.co profile. We send a 6-digit code to your email.',
  alternates: { canonical: 'https://www.freeresumepost.co/candidate/login' },
  // Don't index — auth-adjacent + user-specific destination
  robots: { index: false, follow: false },
}

export default function CandidateLoginPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-lg mx-auto px-6 py-16">
        <p className="text-xs font-semibold tracking-wider text-[#003D5C] uppercase mb-3">Manage your profile</p>
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-slate-900 mb-4">
          Sign in with a code
        </h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          No password. Enter the email you uploaded with and we&apos;ll send a 6-digit code. Sign in to
          view and edit your resume profile anytime.
        </p>

        <OtpLoginForm />

        <div className="rounded-lg border-2 border-dashed border-slate-300 p-5 mb-6">
          <h2 className="font-semibold text-slate-900 mb-2">Never uploaded?</h2>
          <p className="text-sm text-slate-700 mb-3">
            No profile yet? Upload your resume in 30 seconds. No account or password to create.
          </p>
          <Link href="/upload" className="inline-block bg-[#003D5C] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#002A40]">
            Upload your resume →
          </Link>
        </div>

        <p className="text-xs text-slate-500">
          Why a code and no password? Healthcare candidates switch devices and emails often. A one-time
          code keeps your profile reachable from anywhere, with nothing to remember and nothing to leak.
          Your existing edit links still work too.
        </p>
      </div>
    </main>
  )
}
