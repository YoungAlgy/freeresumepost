'use client'

import { useState, useTransition } from 'react'
import { updateCandidate } from './actions'
import { uploadAndAttachResume } from '@/app/upload/actions'
import { inspectResumeFile } from '@/lib/resume-file'
import { US_STATES as STATES } from '@/lib/us-states'

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
  is_public: boolean
  has_resume: boolean
}


export default function ProfileEditForm({
  candidate,
  nonce,
  initialResumeMissing,
}: {
  candidate: Candidate
  nonce: string
  initialResumeMissing: boolean
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
    is_public: candidate.is_public ?? false,
  })
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [resumePending, setResumePending] = useState(false)
  const [hasResume, setHasResume] = useState(candidate.has_resume)
  const [resumeMessage, setResumeMessage] = useState<string | null>(
    initialResumeMissing
      ? 'Your profile saved, but the resume file did not. Choose the file again below.'
      : null,
  )

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

  async function replaceResume(file: File) {
    if (resumePending) return
    setErr(null)
    setResumeMessage(null)

    const inspected = inspectResumeFile(file)
    if (!inspected.ok) {
      setErr(inspected.error)
      return
    }

    setResumePending(true)
    try {
      const upload = new FormData()
      upload.set('candidate_id', candidate.id)
      upload.set('nonce', nonce)
      upload.set('file', file)
      const attached = await uploadAndAttachResume(upload)
      if (!attached.success) throw new Error(attached.error)

      setHasResume(true)
      setResumeMessage('Resume file saved.')
    } catch (error) {
      console.error(
        'resume replacement failed:',
        error instanceof Error ? error.message : 'unknown',
      )
      setErr('The resume file did not save. Choose it again and retry.')
    } finally {
      setResumePending(false)
    }
  }

  const publicUrl = `https://www.freeresumepost.co/profile/${candidate.slug}`

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-700">
          Your profile
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight mb-2">
          {f.first_name || candidate.first_name} {f.last_name || candidate.last_name}
        </h1>
        <p className="text-slate-500 mb-2">
          {candidate.email}
          {f.is_public ? ' · public profile' : ' · private (not indexed)'}
        </p>
        {(saved ? f.is_public : candidate.is_public) && (
          <p className="text-sm text-slate-500 mb-8">
            Public URL:{' '}
            <a href={publicUrl} className="font-mono text-xs text-indigo-700 hover:underline">
              {publicUrl}
            </a>
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-8 space-y-8">
          <section>
            <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">
              About you
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="First name" required>
                <input
                  type="text"
                  required
                  autoComplete="given-name"
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
                  autoComplete="family-name"
                  value={f.last_name}
                  onChange={(e) => setF({ ...f, last_name: e.target.value })}
                  className={fieldStyle}
                  maxLength={100}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: e.target.value })}
                  className={fieldStyle}
                  maxLength={30}
                />
              </Field>
              <Field label="Email" hint="Locked on this screen">
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
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Resume file
            </h2>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div>
                <p className="font-medium text-slate-900">
                  {hasResume ? 'Resume file on profile' : 'No resume file saved'}
                </p>
                <p className="mt-1 text-sm text-slate-500">PDF or DOCX, up to 5 MB.</p>
              </div>
              <label className="mt-4 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-within:ring-2 focus-within:ring-indigo-600 sm:mt-0 sm:w-auto">
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  disabled={resumePending}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void replaceResume(file)
                    event.target.value = ''
                  }}
                />
                {resumePending ? 'Saving file…' : hasResume ? 'Replace file' : 'Choose file'}
              </label>
            </div>
            {resumeMessage && (
              <p
                role="status"
                aria-live="polite"
                className={`mt-3 rounded-lg border p-3 text-sm ${
                  hasResume
                    ? 'border-teal-200 bg-teal-50 text-teal-800'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                {resumeMessage}
              </p>
            )}
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
                  <option value="">Select state</option>
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
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">
              Profile visibility
            </h2>
            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
                <input
                  type="checkbox"
                  checked={f.is_public}
                  onChange={(e) => setF({ ...f, is_public: e.target.checked })}
                  className="mt-0.5 w-4 h-4"
                />
                <div>
                  <p className="font-medium text-slate-900">Public profile</p>
                  <p className="text-sm text-slate-500">
                    Shows your first name, last initial, credential, specialty, city, state, and
                    years of experience at your public URL. Your email, phone, full last name, and
                    resume file stay private. We tell search engines not to index the page.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {saved && (
            <div role="status" aria-live="polite" className="rounded-xl border border-green-300 bg-green-50 p-4 text-green-800 font-medium text-sm">
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
            <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 font-medium text-sm">
              {err}
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Edit links work for 7 days. Sign in anytime to open your profile and get a fresh link.
              See the <a href="/privacy" className="underline hover:text-slate-900">privacy policy</a> for deletion requests.
            </p>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent'

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
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      {children}
    </label>
  )
}
