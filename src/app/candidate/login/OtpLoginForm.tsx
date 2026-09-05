'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { verifyCandidateOtp } from '@/lib/candidate-otp'
import { requestCandidateOtp } from './actions'

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
  const mountedRef = useRef(true)
  const requestPendingRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const cleanEmail = email.trim().toLowerCase()

  async function requestCode(): Promise<boolean> {
    try {
      const result = await requestCandidateOtp(cleanEmail)
      if (!mountedRef.current) return false
      if (result.accepted !== true) {
        setError(result.accepted === false && typeof result.error === 'string' && result.error.trim()
          ? result.error
          : 'We could not confirm the code request. Check your email before trying again.')
        return false
      }
      return true
    } catch {
      if (!mountedRef.current) return false
      setError('Something went wrong sending your code. Please try again in a moment.')
      return false
    } finally {
      requestPendingRef.current = false
      if (mountedRef.current) setLoading(false)
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    if (requestPendingRef.current || loading || !cleanEmail) return
    requestPendingRef.current = true
    setLoading(true)
    setError('')
    if (await requestCode() && mountedRef.current) setStep('code')
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    if (requestPendingRef.current || loading || code.length !== 6) return
    requestPendingRef.current = true
    setLoading(true)
    setError('')
    try {
      const result = await verifyCandidateOtp(
        (params) => supabaseBrowser.auth.verifyOtp(params),
        {
          email: cleanEmail,
          token: code,
          type: 'email',
        },
      )
      if (!mountedRef.current) return
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push('/account')
    } finally {
      requestPendingRef.current = false
      if (mountedRef.current) setLoading(false)
    }
  }

  if (step === 'code') {
    return (
      <form onSubmit={verify} className="rounded-lg border border-slate-200 bg-slate-50 p-5 mb-6">
        <h2 className="font-semibold text-slate-900 mb-1">Enter your code</h2>
        <p className="text-sm text-slate-700 mb-4">
          If <strong className="break-all">{cleanEmail}</strong> belongs to an active FreeResumePost profile, we sent a
          6-digit code. It expires shortly. Check spam if you don&apos;t see it.
        </p>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          disabled={loading}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          aria-label="6-digit sign-in code"
          className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-center text-lg font-semibold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="min-h-11 w-full rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
        >
          {loading ? 'Verifying…' : 'Verify & sign in'}
        </button>
        {error && <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>}
        <div className="flex flex-wrap items-center justify-center gap-x-3 mt-4 text-sm">
          <button
            type="button"
            disabled={loading}
            className="min-h-11 text-slate-600 hover:text-indigo-700 disabled:opacity-60"
            onClick={async () => {
              if (requestPendingRef.current || loading) return
              requestPendingRef.current = true
              setLoading(true)
              setError('')
              if (await requestCode() && mountedRef.current) setCode('')
            }}
          >
            Resend code
          </button>
          <button
            type="button"
            disabled={loading}
            className="min-h-11 text-slate-600 hover:text-indigo-700 disabled:opacity-60"
            onClick={() => {
              if (requestPendingRef.current || loading) return
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
          disabled={loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 whitespace-nowrap rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send code'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>}
    </form>
  )
}
