'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'

// Supabase Auth error messages are written for developers, not candidates
// ("Signups not allowed for this instance" is what you get when an email has
// no existing account and this project has new-signup creation disabled at
// the auth level) — translate the ones we actually see into copy a candidate
// can act on instead of showing the raw backend string.
function friendlyAuthError(raw: string): string {
  if (/signups not allowed/i.test(raw)) {
    return "We don't have a resume on file for that email yet. Upload your resume first, then come back and sign in with a code."
  }
  if (/rate limit|too many requests/i.test(raw)) {
    return 'Too many attempts. Wait a minute and try again.'
  }
  if (/token|code/i.test(raw) && /invalid|expired/i.test(raw)) {
    return "That code is incorrect or expired. Double-check your email for the latest one, or resend."
  }
  return "Something went wrong sending your code. Please try again in a moment."
}

// Candidate sign-in by 6-digit email code (Supabase OTP), on the same shared
// auth pool the recruiter CRM uses. Replaces the old emailed magic edit-link as
// the primary way back in. On success we land on /account, which shows the
// candidate their resume and lets them edit it. Existing edit-links from upload
// emails still work — this is an additional, password-free way in.

export default function OtpLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [noAccount, setNoAccount] = useState(false)

  const cleanEmail = email.trim().toLowerCase()

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    if (loading || !cleanEmail) return
    setLoading(true)
    setError('')
    setNoAccount(false)
    const { error } = await supabaseBrowser.auth.signInWithOtp({ email: cleanEmail })
    setLoading(false)
    if (error) {
      setError(friendlyAuthError(error.message))
      setNoAccount(/signups not allowed/i.test(error.message))
      return
    }
    setStep('code')
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    if (loading || code.length !== 6) return
    setLoading(true)
    setError('')
    const { error } = await supabaseBrowser.auth.verifyOtp({
      email: cleanEmail,
      token: code,
      type: 'email',
    })
    if (error) {
      setError(friendlyAuthError(error.message))
      setLoading(false)
      return
    }
    router.push('/account')
  }

  if (step === 'code') {
    return (
      <form onSubmit={verify} className="rounded-lg border border-slate-200 bg-slate-50 p-5 mb-6">
        <h2 className="font-semibold text-slate-900 mb-1">Enter your code</h2>
        <p className="text-sm text-slate-700 mb-4">
          We sent a 6-digit code to <strong>{cleanEmail}</strong>. It expires shortly. Check spam if
          you don&apos;t see it.
        </p>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          aria-label="6-digit sign-in code"
          className="w-full text-center tracking-[0.4em] text-lg font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-[#7FBC00]"
        />
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full bg-[#003D5C] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#002A40] disabled:opacity-60"
        >
          {loading ? 'Verifying…' : 'Verify & sign in'}
        </button>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button
            type="button"
            className="text-slate-600 hover:text-[#003D5C]"
            onClick={async () => {
              setError('')
              const { error } = await supabaseBrowser.auth.signInWithOtp({ email: cleanEmail })
              if (error) {
                setError(friendlyAuthError(error.message))
                return
              }
              setCode('')
            }}
          >
            Resend code
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            className="text-slate-600 hover:text-[#003D5C]"
            onClick={() => {
              setStep('email')
              setCode('')
              setError('')
            }}
          >
            Use a different email
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={sendCode} className="rounded-lg border border-slate-200 bg-slate-50 p-5 mb-6">
      <h2 className="font-semibold text-slate-900 mb-2">Sign in with a code</h2>
      <p className="text-sm text-slate-700 mb-3">
        Enter the email you uploaded with. We&apos;ll send you a 6-digit code. No password.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FBC00]"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#003D5C] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#002A40] disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? 'Sending…' : 'Send code'}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-2">
          {error}
          {noAccount && (
            <>
              {' '}
              <Link href="/upload" className="underline hover:text-red-700">
                Upload your resume
              </Link>
              .
            </>
          )}
        </p>
      )}
    </form>
  )
}
