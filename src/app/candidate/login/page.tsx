import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Candidate sign-in',
  description: 'Edit your freeresumepost.co profile. We sent you an edit link when you uploaded your resume.',
  alternates: { canonical: 'https://www.freeresumepost.co/candidate/login' },
  // Don't index — auth-adjacent + user-specific destination
  robots: { index: false, follow: false },
}

export default function CandidateLoginPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">
            freeresumepost<span className="text-slate-400">.co</span>
          </Link>
          <Link href="/upload" className="text-sm font-medium text-blue-600 hover:text-blue-700">Upload resume</Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-16">
        <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase mb-3">Edit your profile</p>
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-slate-900 mb-4">
          Sign-in by email link
        </h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          We don&apos;t use passwords. When you uploaded your resume, we emailed you a unique edit link
          you can click anytime to update your profile. The link is valid for 7 days.
        </p>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 mb-6">
          <h2 className="font-semibold text-slate-900 mb-2">Lost your edit link?</h2>
          <ol className="space-y-2 text-sm text-slate-700 list-decimal pl-4">
            <li>Search your inbox for an email from <code className="text-xs bg-white px-1 py-0.5 rounded border">hello@avahealth.co</code> with subject <em>&quot;Edit your freeresumepost.co profile&quot;</em>.</li>
            <li>Check spam / promotions tabs (Gmail loves to filter transactional links).</li>
            <li>If you can&apos;t find it, email <a href="mailto:hello@avahealth.co?subject=Lost%20freeresumepost.co%20edit%20link" className="underline text-blue-600 hover:text-blue-700">hello@avahealth.co</a> from the address you used to upload — we&apos;ll resend within 24 hours.</li>
          </ol>
        </div>

        <div className="rounded-lg border-2 border-dashed border-slate-300 p-5 mb-6">
          <h2 className="font-semibold text-slate-900 mb-2">Never uploaded?</h2>
          <p className="text-sm text-slate-700 mb-3">
            No profile yet? Upload your resume in 30 seconds — no account or password to create.
          </p>
          <Link href="/upload" className="inline-block bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-slate-700">
            Upload your resume →
          </Link>
        </div>

        <p className="text-xs text-slate-500">
          Why no password? Healthcare candidates change emails / phones often. Magic links keep your
          profile reachable from any device, and one-time tokens are more secure than passwords for
          a low-risk profile (no payment info, no PII beyond what you already shared on your resume).
        </p>
      </div>
    </main>
  )
}
