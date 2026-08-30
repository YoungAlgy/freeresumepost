'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { requestCandidateOtp } from './actions'

// Translate verification errors into copy a candidate can act on instead of
// showing raw Supabase Auth messages.
function friendlyAuthError(raw: string): string {
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

  const cleanEmail = email.trim().toLowerCase()

  async function requestCode(): Promise<boolean> {
    try {
      const result = await requestCandidateOtp(cleanEmail)
      if (!result.accepted) {
        setError(result.error)
        return false
      }
      return true
    } catch {
      setError('Something went wrong sending your code. Please try again in a moment.')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    if (loading || !cleanEmail) return
    setLoading(true)
    setError('')
    if (await requestCode()) setStep('code')
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
          If <strong>{cleanEmail}</strong> belongs to an active FreeResumePost profile, we sent a
          6-digit code. It expires shortly. Check spam if you don&apos;t see it.
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
          className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-center text-lg font-semibold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
        >
          {loading ? 'Verifying…' : 'Verify & sign in'}
        </button>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button
            type="button"
            disabled={loading}
            className="text-slate-600 hover:text-indigo-700 disabled:opacity-60"
            onClick={async () => {
              if (loading) return
              setLoading(true)
              setError('')
              if (await requestCode()) setCode('')
            }}
          >
            Resend code
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            className="text-slate-600 hover:text-indigo-700"
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
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button
          type="submit"
          disabled={loading}
          className="whitespace-nowrap rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send code'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </form>
  )
}
