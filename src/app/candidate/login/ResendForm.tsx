'use client'

import { useState } from 'react'
import { requestEditLink } from './actions'

// Self-serve edit-link recovery. Before this form, the only recovery for a
// lost/expired edit link was emailing info@avahealth.co and waiting for a
// manual resend — the page copy promised an email no system ever sent.
export default function ResendForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'sending') return
    setState('sending')
    setError('')
    const res = await requestEditLink(email)
    if (res.ok) {
      setState('sent')
    } else {
      setState('error')
      setError(res.error)
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-5 mb-6">
        <h2 className="font-semibold text-slate-900 mb-1">Check your inbox</h2>
        <p className="text-sm text-slate-700">
          If that email has a profile on file, a fresh edit link is on its way from{' '}
          <code className="text-xs bg-white px-1 py-0.5 rounded border">resumes@avahealth.co</code>.
          It works for 7 days. Check spam if you don&apos;t see it in a few minutes.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-slate-50 p-5 mb-6">
      <h2 className="font-semibold text-slate-900 mb-2">Lost your edit link?</h2>
      <p className="text-sm text-slate-700 mb-3">
        Enter the email you uploaded with and we&apos;ll send you a fresh one.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-slate-700 disabled:opacity-60 whitespace-nowrap"
        >
          {state === 'sending' ? 'Sending…' : 'Send link'}
        </button>
      </div>
      {state === 'error' && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <p className="text-xs text-slate-500 mt-3">
        Tip: the original link came from{' '}
        <code className="text-xs bg-white px-1 py-0.5 rounded border">resumes@avahealth.co</code>.
        Worth a quick inbox search (and a look in spam) first.
      </p>
    </form>
  )
}
