'use client'

import { useState, useTransition } from 'react'
import { subscribeJobAlert, type JobAlertResult } from '@/lib/actions/job-alert'
import TurnstileWidget from '@/components/TurnstileWidget'

/**
 * Candidate-side job-alert capture. Framed as the lower-commitment alternative
 * to uploading a resume — captures the email of candidates not ready to upload
 * as a re-contactable CRM lead tagged with specialty intent. Ava Health
 * navy/lime styling.
 */
type Props = {
  defaultSpecialty?: string
  defaultState?: string
  defaultCity?: string
  source: string
  className?: string
}

export default function JobAlertCapture({
  defaultSpecialty,
  defaultState,
  defaultCity,
  source,
  className = '',
}: Props) {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<JobAlertResult | null>(null)
  const [pending, startTransition] = useTransition()
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const locationPart = defaultCity
    ? ` in ${defaultCity}`
    : defaultState
      ? ` in ${defaultState}`
      : ''
  const what = `${defaultSpecialty ? defaultSpecialty : 'healthcare'} jobs${locationPart}`

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!emailValid) return
    startTransition(async () => {
      const r = await subscribeJobAlert(
        {
          email,
          specialty: defaultSpecialty ?? null,
          state: defaultState ?? null,
          city: defaultCity ?? null,
          source,
        },
        turnstileToken ?? '',
      )
      setResult(r)
      if (!r.success) {
        setTurnstileToken(null)
        setTurnstileKey((k) => k + 1)
      }
    })
  }

  if (result?.success) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`border border-slate-200 rounded-2xl bg-[#003D5C]/5 p-6 ${className}`}
      >
        <p className="font-semibold text-slate-900">You're on the list.</p>
        <p className="text-sm text-slate-600 mt-1">
          We'll email <strong>{email}</strong> when new {what} get posted. Unsubscribe anytime.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className={`border border-slate-200 rounded-2xl bg-slate-50 p-6 ${className}`}>
      <p className="text-xs font-semibold tracking-wider text-[#003D5C] uppercase mb-1">
        Not ready to upload?
      </p>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">Get new {what} by email</h3>
      <p className="text-sm text-slate-600 mb-4">
        Free job alerts. New matching roles straight to your inbox. No spam, unsubscribe anytime.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          aria-label="Your email address"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#7FBC00]"
        />
        <button
          type="submit"
          disabled={pending || !emailValid}
          className="inline-flex items-center justify-center bg-[#003D5C] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#002A40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {pending ? 'Subscribing…' : 'Email me jobs →'}
        </button>
      </div>

      <div className="mt-3">
        <TurnstileWidget
          key={turnstileKey}
          onSuccess={setTurnstileToken}
          onError={() => setTurnstileToken(null)}
          onExpired={() => setTurnstileToken(null)}
          action="job-alert-subscribe"
        />
      </div>

      {result && !result.success && (
        <div
          role="alert"
          className="mt-3 border border-red-300 bg-red-50 p-3 text-red-800 text-sm font-medium rounded-xl"
        >
          {result.error}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-3">
        By subscribing you agree to receive job-alert emails. Unsubscribe anytime.{' '}
        <a href="/privacy" className="underline hover:text-[#003D5C]">
          Privacy
        </a>
        .
      </p>
    </form>
  )
}
