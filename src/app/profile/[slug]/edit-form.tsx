'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { updateCandidate } from './actions'
import type { CandidateMatch } from './page'

const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID',
  'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS',
  'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK',
  'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV',
  'WI', 'WY', 'DC',
]

type Candidate = {
  id: string
  slug: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  credential: string | null
  specialty: string | null
  city: string | null
  state: string | null
  years_experience: number | null
  remote_only: boolean
  contact_via_email: boolean
  contact_via_sms: boolean
  is_public: boolean
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`)
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}`
  return fmt(min ?? max ?? 0)
}

function jobLocation(m: CandidateMatch): string {
  if (m.job_remote_hybrid === 'remote') {
    return 'Remote' + (m.job_state ? ` · ${m.job_state}` : '')
  }
  return [m.job_city, m.job_state].filter(Boolean).join(', ')
}

export default function ProfileEditForm({
  candidate,
  nonce,
  matches,
}: {
  candidate: Candidate
  nonce: string
  matches: CandidateMatch[]
}) {
  const [f, setF] = useState({
    first_name: candidate.first_name ?? '',
    last_name: candidate.last_name ?? '',
    phone: candidate.phone ?? '',
    credential: candidate.credential ?? '',
    specialty: candidate.specialty ?? '',
    city: candidate.city ?? '',
    state: candidate.state ?? '',
    years_experience: candidate.years_experience ?? null,
    remote_only: candidate.remote_only ?? false,
    contact_via_email: candidate.contact_via_email ?? true,
    contact_via_sms: candidate.contact_via_sms ?? false,
    is_public: candidate.is_public ?? false,
  })
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    setErr(null)
    startTransition(async () => {
      const res = await updateCandidate({
        candidate_id: candidate.id,
        nonce,
        ...f,
      })
      if (res.success) setSaved(true)
      else setErr(res.error)
    })
  }

  const publicUrl = `https://www.freeresumepost.co/profile/${candidate.slug}`

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm">
              r
            </span>
            <span className="font-bold text-lg tracking-tight">
              freeresumepost<span className="text-slate-400">.co</span>
            </span>
          </Link>
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Edit mode
          </p>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase mb-3">
          Your profile
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight mb-2">
          {f.first_name || candidate.first_name} {f.last_name || candidate.last_name}
        </h1>
        <p className="text-slate-500 mb-2">
          {candidate.email}
          {f.is_public ? ' · public profile' : ' · private (not indexed)'}
        </p>
        {f.is_public && (
          <p className="text-sm text-slate-500 mb-8">
            Public URL:{' '}
            <a href={publicUrl} className="font-mono text-xs text-blue-600 hover:underline">
              {publicUrl}
            </a>
          </p>
        )}

        {/* Matches section — top of the page so candidates see jobs first,
           profile editing second. Matches refresh on the marketplace cron. */}
        <section className="mb-12 rounded-2xl border border-slate-200 bg-slate-50/40 p-5 md:p-6">
          <div className="flex items-baseline justify-between mb-4 gap-3">
            <div>
              <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Your top matches
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Live healthcare openings scored against your profile, refreshed every few hours.
              </p>
            </div>
            {matches.length > 0 && (
              <span className="shrink-0 text-xs font-semibold text-slate-500">
                Showing {matches.length} of your top matches
              </span>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <p className="text-sm font-medium text-slate-900 mb-1">
                No matches yet.
              </p>
              <p className="text-sm text-slate-600 mb-4">
                The matching engine runs on a schedule — give it a few hours after upload.
                You can also browse the full board directly while you wait.
              </p>
              <a
                href="https://freejobpost.co/jobs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Browse all healthcare jobs →
              </a>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {matches.map((m) => {
                const sal = formatSalary(m.salary_min, m.salary_max)
                const loc = jobLocation(m)
                const utm = '?utm_source=freeresumepost&utm_medium=match&utm_campaign=candidate_dashboard'
                return (
                  <li key={m.job_id} className="p-4">
                    <a
                      href={`https://freejobpost.co/jobs/${m.job_slug}${utm}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span
                              className={`shrink-0 text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded ${
                                m.score >= 70
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : m.score >= 50
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {m.score}% MATCH
                            </span>
                          </div>
                          <p className="font-semibold text-slate-900 leading-snug group-hover:text-blue-700 line-clamp-2">
                            {m.job_title}
                          </p>
                          <p className="text-sm text-slate-600 mt-0.5 truncate">
                            {loc || '—'}
                            {m.job_specialty && m.job_specialty !== m.job_title && (
                              <span className="text-slate-400"> · {m.job_specialty}</span>
                            )}
                          </p>
                        </div>
                        {sal && (
                          <div className="shrink-0 text-sm font-semibold text-slate-900 tabular-nums">
                            {sal}
                          </div>
                        )}
                      </div>
                    </a>
                  </li>
                )
              })}
            </ul>
          )}

          <p className="text-xs text-slate-500 mt-4">
            Bookmark this page — it&apos;s your only login link, and it&apos;s where new
            matches surface as fresh jobs are posted.
          </p>
        </section>

        <form onSubmit={onSubmit} className="space-y-8">
          <section>
            <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">
              About you
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="First name" required>
                <input
                  type="text"
                  required
                  value={f.first_name}
                  onChange={(e) => setF({ ...f, first_name: e.target.value })}
                  className={fieldStyle}
                  maxLength={100}
                />
              </Field>
              <Field label="Last name" required>
                <input
                  type="text"
                  required
                  value={f.last_name}
                  onChange={(e) => setF({ ...f, last_name: e.target.value })}
                  className={fieldStyle}
                  maxLength={100}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: e.target.value })}
                  className={fieldStyle}
                  maxLength={30}
                />
              </Field>
              <Field label="Email" hint="Can't change this here — email support">
                <input
                  type="email"
                  value={candidate.email}
                  disabled
                  className={`${fieldStyle} bg-slate-50 text-slate-500`}
                />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">
              Your role
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Credential">
                <input
                  type="text"
                  value={f.credential}
                  onChange={(e) => setF({ ...f, credential: e.target.value })}
                  className={fieldStyle}
                  maxLength={20}
                />
              </Field>
              <Field label="Specialty">
                <input
                  type="text"
                  value={f.specialty}
                  onChange={(e) => setF({ ...f, specialty: e.target.value })}
                  className={fieldStyle}
                  maxLength={100}
                />
              </Field>
              <Field label="City">
                <input
                  type="text"
                  value={f.city}
                  onChange={(e) => setF({ ...f, city: e.target.value })}
                  className={fieldStyle}
                  maxLength={100}
                />
              </Field>
              <Field label="State">
                <select
                  value={f.state}
                  onChange={(e) => setF({ ...f, state: e.target.value })}
                  className={fieldStyle}
                >
                  <option value="">—</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Years of experience">
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={f.years_experience ?? ''}
                  onChange={(e) =>
                    setF({
                      ...f,
                      years_experience: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  className={fieldStyle}
                />
              </Field>
              <div className="flex items-center md:items-end">
                <label className="flex items-center gap-2 text-sm pb-2">
                  <input
                    type="checkbox"
                    checked={f.remote_only}
                    onChange={(e) => setF({ ...f, remote_only: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  Remote-only
                </label>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">
              Contact preferences
            </h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={f.contact_via_email}
                  onChange={(e) => setF({ ...f, contact_via_email: e.target.checked })}
                  className="mt-0.5 w-4 h-4"
                />
                <div>
                  <p className="font-medium text-slate-900">Email</p>
                  <p className="text-sm text-slate-500">Employer messages land in your inbox.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={f.contact_via_sms}
                  onChange={(e) => setF({ ...f, contact_via_sms: e.target.checked })}
                  className="mt-0.5 w-4 h-4"
                />
                <div>
                  <p className="font-medium text-slate-900">SMS</p>
                  <p className="text-sm text-slate-500">
                    Interview confirmations + application updates only. No marketing, no cold outreach.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={f.is_public}
                  onChange={(e) => setF({ ...f, is_public: e.target.checked })}
                  className="mt-0.5 w-4 h-4"
                />
                <div>
                  <p className="font-medium text-slate-900">Public profile</p>
                  <p className="text-sm text-slate-500">
                    Show your name + specialty + state at your public URL. Email + phone stay private.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {saved && (
            <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-green-800 font-medium text-sm">
              Saved. {f.is_public && (
                <>
                  Your public profile is live at{' '}
                  <a href={publicUrl} className="underline font-mono">
                    {publicUrl}
                  </a>
                </>
              )}
            </div>
          )}
          {err && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 font-medium text-sm">
              {err}
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Bookmark this URL to edit your profile later — it&apos;s your only login link.
            </p>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center rounded-xl bg-blue-600 text-white px-6 py-3 font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

const fieldStyle =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </label>
  )
}
