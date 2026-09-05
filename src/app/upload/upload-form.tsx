'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  extractTextFromFile,
  parseFields,
  type ParsedResume,
} from '@/lib/resume-parser'
import {
  submitCandidate,
  type SubmitCandidateInput,
  type SubmitCandidateResult,
  uploadAndAttachResume,
} from './actions'
import TurnstileWidget from '@/components/TurnstileWidget'
import { US_STATES as STATES } from '@/lib/us-states'
import { inspectResumeFile } from '@/lib/resume-file'
import {
  isTurnstileReady,
  turnstileResultStatus,
  type TurnstileStatus,
} from '@/lib/form-verification'

type Phase = 'drop' | 'parsing' | 'review' | 'submitting' | 'done'

export default function UploadForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  // The raw chosen File, kept around so we can upload the actual bytes to the
  // private `resumes` bucket after the candidate reviews the parsed fields.
  const chosenFileRef = useRef<File | null>(null)
  const [phase, setPhase] = useState<Phase>('drop')
  const [dragOver, setDragOver] = useState(false)
  const [parseErr, setParseErr] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [parsed, setParsed] = useState<ParsedResume | null>(null)
  const [pending, startTransition] = useTransition()
  const submittingRef = useRef(false)
  const mountedRef = useRef(true)
  const parseRequestRef = useRef(0)
  // Cloudflare Turnstile token — see TurnstileWidget.tsx. null until challenge passes.
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  // Incrementing key forces TurnstileWidget to remount after a failed submit
  // so the user gets a fresh challenge (Turnstile tokens are single-use).
  const [turnstileKey, setTurnstileKey] = useState(0)
  const turnstileConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  const [turnstileStatus, setTurnstileStatus] = useState<TurnstileStatus>(
    turnstileConfigured ? 'pending' : 'ready',
  )

  // Fields shown in review step (prefilled from parsed, user-editable)
  const [form, setForm] = useState<SubmitCandidateInput>({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    credential: '',
    specialty: '',
    city: '',
    state: '',
    years_experience: null,
    is_public: false,
  })

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      parseRequestRef.current += 1
    }
  }, [])

  async function processFile(file: File) {
    const requestId = ++parseRequestRef.current
    setParseErr(null)
    chosenFileRef.current = null
    setFileName('')
    const inspected = inspectResumeFile(file)
    if (!inspected.ok) {
      setParseErr(inspected.error)
      return
    }
    setFileName(file.name)
    // Hold onto the raw File. We upload the actual bytes to the resumes bucket
    // on submit (not here) so a returning user changing files never leaves a
    // stale upload, and so a storage hiccup can't block the parse/review step.
    chosenFileRef.current = file
    setPhase('parsing')
    try {
      const text = await extractTextFromFile(file)
      if (!mountedRef.current || requestId !== parseRequestRef.current) return
      if (!text || text.length < 50) {
        setParseErr(
          'We couldn\'t read any text from that file. If it\'s a scanned image, try exporting a searchable PDF first.'
        )
        setPhase('drop')
        return
      }
      const p = parseFields(text)
      setParsed(p)
      setForm((prev) => ({
        ...prev,
        email: p.email ?? prev.email,
        first_name: p.firstName ?? prev.first_name,
        last_name: p.lastName ?? prev.last_name,
        phone: p.phone ?? prev.phone,
        credential: p.credentials[0] ?? prev.credential,
        specialty: p.inferredSpecialty ?? prev.specialty,
        state: p.state ?? prev.state,
        city: p.city ?? prev.city,
        years_experience: p.yearsExperience ?? prev.years_experience,
      }))
      setPhase('review')
    } catch (err) {
      if (!mountedRef.current || requestId !== parseRequestRef.current) return
      setParseErr(err instanceof Error ? err.message : 'Unable to parse this file.')
      setPhase('drop')
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function canSubmit(): boolean {
    const botCheckReady = isTurnstileReady(turnstileConfigured, turnstileToken)
    return (
      fileName.length > 0 &&
      botCheckReady &&
      form.email.trim().length > 3 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
      form.first_name.trim().length > 0 &&
      form.last_name.trim().length > 0
    )
  }

  function retryTurnstile() {
    setTurnstileToken(null)
    setTurnstileStatus('pending')
    setTurnstileKey((key) => key + 1)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending || submittingRef.current || !canSubmit()) return
    submittingRef.current = true
    setPhase('submitting')
    startTransition(async () => {
      try {
        let res: SubmitCandidateResult
        try {
          res = await submitCandidate(form, turnstileToken ?? '')
          if (!mountedRef.current) return
          // A partial or malformed response cannot confirm a save or provide
          // the owner credentials needed for the attachment step.
          if (!res || typeof res !== 'object' ||
            (res.success !== true && res.success !== false) ||
            (res.success === false && (typeof res.error !== 'string' || !res.error.trim())) ||
            (res.success === true && (
              typeof res.candidate_id !== 'string' || !res.candidate_id.trim() ||
              typeof res.nonce !== 'string' || !res.nonce.trim() ||
              typeof res.edit_url !== 'string' || !res.edit_url.trim()
            ))) {
            throw new Error('Profile save response was incomplete.')
          }
        } catch (error) {
          console.error(
            'resume profile submission threw:',
            error instanceof Error ? error.message : 'unknown',
          )
          if (!mountedRef.current) return
          setParseErr(
            'We could not confirm the save. Sign in to check your account before trying again.',
          )
          setPhase('review')
          retryTurnstile()
          return
        }
        if (!mountedRef.current) return
        if (res.success === true) {
          let resumeAttached = false
          const file = chosenFileRef.current
          if (file) {
            try {
              const upload = new FormData()
              upload.set('candidate_id', res.candidate_id)
              upload.set('nonce', res.nonce)
              upload.set('file', file)
              const attached = await uploadAndAttachResume(upload)
              if (!mountedRef.current) return
              resumeAttached = attached?.success === true
              if (!resumeAttached) console.error('resume file save was not confirmed')
            } catch (err) {
              if (!mountedRef.current) return
              console.error(
                'resume file upload threw:',
                err instanceof Error ? err.message : 'unknown',
              )
            }
          }
          if (!mountedRef.current) return
          setPhase('done')
          router.push(resumeAttached ? res.edit_url : `${res.edit_url}&resume=missing`)
        } else {
          console.error(
            'resume profile submission failed:',
            res.error,
          )
          setParseErr(res.error)
          setPhase('review')
          // Token is single-use. Clear it and remount the widget so the user
          // solves a fresh challenge before retrying.
          retryTurnstile()
        }
      } finally {
        submittingRef.current = false
      }
    })
  }

  // ---------- Renders ----------
  if (phase === 'drop') {
    return (
      <div>
        {/* Drag-drop zone. The visually-hidden file input is the true interactive
            element; the drop zone is a visual affordance only. A visible "Browse"
            button provides a keyboard-accessible alternative per WCAG 2.5.3. */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          aria-hidden="true"
          className={`rounded-2xl border-2 border-dashed p-12 md:p-16 text-center transition-all ${
            dragOver
              ? 'border-teal-600 bg-teal-50'
              : 'border-slate-300 bg-slate-50/50'
          }`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-700 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="font-semibold text-lg text-slate-900 mb-1">
            Drop your resume here
          </p>
          <p className="text-slate-500 text-sm">
            PDF or DOCX · Up to 5 MB · Read in your browser
          </p>
        </div>
        {/* Keyboard-accessible file picker. visually centered below the drop zone. */}
        <div className="mt-4 flex justify-center">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2">
            <input
              ref={fileInputRef}
              id="resume-file-input"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={onFileChange}
              aria-label="Upload your resume, PDF or DOCX"
            />
            Browse files
          </label>
        </div>
        {parseErr && (
          <p role="alert" className="mt-4 text-sm text-red-600 font-medium">{parseErr}</p>
        )}
        <div className="mt-6 space-y-1 text-sm leading-6 text-slate-500">
          <p>We look for your name, contact details, credentials, specialty, and location.</p>
          <p>
            Your resume is parsed in your browser. The file uploads only after you review your
            information and tap Save.
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'parsing') {
    return (
      <div className="rounded-2xl border border-slate-200 p-12 text-center bg-slate-50">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        <p className="break-all font-semibold text-slate-900">Reading {fileName}…</p>
        <p className="text-sm text-slate-500 mt-1">This runs locally. No uploads yet.</p>
      </div>
    )
  }

  if (phase === 'submitting' || phase === 'done') {
    return (
      <div className="rounded-2xl border border-slate-200 p-12 text-center bg-slate-50">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        <p className="font-semibold text-slate-900">Saving your profile…</p>
      </div>
    )
  }

  // phase === 'review'
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
        <div className="flex items-start gap-3 mb-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
            ✓
          </span>
          <div>
            <p className="font-semibold text-slate-900">
              Extracted {parsed ? parsed.rawText.length.toLocaleString() : 0} characters
              from <span className="break-all font-mono text-sm">{fileName}</span>
            </p>
            <p className="text-sm text-slate-500">
              Review and edit what we found. You&apos;re in control of every field.
            </p>
          </div>
        </div>
      </div>

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
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className={fieldStyle}
              maxLength={100}
            />
          </Field>
          <Field label="Last name" required>
            <input
              type="text"
              required
              autoComplete="family-name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className={fieldStyle}
              maxLength={100}
            />
          </Field>
          <Field label="Email" required hint="Used to reopen your profile">
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={fieldStyle}
              maxLength={254}
            />
          </Field>
          <Field label="Phone" hint="Optional">
            <input
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={fieldStyle}
              maxLength={30}
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">
          Your role
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Credential" hint="RN, NP, CRNA, PT, etc.">
            <input
              type="text"
              value={form.credential}
              onChange={(e) => setForm({ ...form, credential: e.target.value })}
              className={fieldStyle}
              maxLength={20}
            />
          </Field>
          <Field label="Specialty">
            <input
              type="text"
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              className={fieldStyle}
              maxLength={100}
            />
          </Field>
          <Field label="City">
            <input
              type="text"
              autoComplete="address-level2"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={fieldStyle}
              maxLength={100}
            />
          </Field>
          <Field label="State" hint="2-letter">
            <select
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
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
              value={form.years_experience ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
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
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-3 hover:border-indigo-300">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              className="mt-0.5 w-4 h-4"
            />
            <div>
              <p className="font-medium text-slate-900">
                Show my limited profile at a public link
              </p>
              <p className="text-sm text-slate-600 mt-1">
                <strong>Off by default.</strong> When on, your first name, last initial, credential, specialty, city, state, and years of experience appear at
                <span className="font-mono text-xs"> /profile/[your-slug]</span>, a page you can
                share or link from anywhere. It is not indexed by Google. <strong>Email, phone, full last name, and the resume file stay private.</strong> Turn the link off any time from your private profile page.
              </p>
            </div>
          </label>
        </div>
      </section>

      <TurnstileWidget
        key={turnstileKey}
        onSuccess={(token) => {
          const status = turnstileResultStatus(turnstileConfigured, token)
          setTurnstileStatus(status)
          setTurnstileToken(status === 'ready' ? token : null)
        }}
        onError={() => {
          setTurnstileToken(null)
          setTurnstileStatus('failed')
        }}
        onExpired={() => {
          setTurnstileToken(null)
          setTurnstileStatus('expired')
        }}
        action="upload-resume"
      />
      {turnstileConfigured && turnstileStatus !== 'ready' && (
        <div
          role={turnstileStatus === 'pending' ? 'status' : 'alert'}
          aria-live="polite"
          className="text-sm text-slate-600"
        >
          {turnstileStatus === 'pending' && 'Checking verification before you save.'}
          {turnstileStatus === 'failed' && 'Verification did not load. Try again before saving.'}
          {turnstileStatus === 'expired' && 'Verification expired. Try again before saving.'}
          {(turnstileStatus === 'failed' || turnstileStatus === 'expired') && (
            <button
              type="button"
              onClick={retryTurnstile}
              disabled={pending}
              className="mt-2 inline-flex min-h-11 max-w-full items-center text-left font-semibold underline disabled:cursor-not-allowed disabled:opacity-50 sm:ml-2 sm:mt-0"
            >
              Retry verification
            </button>
          )}
        </div>
      )}

      {parseErr && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 font-medium text-sm">
          {parseErr}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            setPhase('drop')
            setParsed(null)
            setFileName('')
            chosenFileRef.current = null
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
          disabled={pending}
          className="text-sm text-slate-500 hover:text-slate-900 underline"
        >
          ← Use a different file
        </button>
        <button
          type="submit"
          disabled={pending || !canSubmit()}
          className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Save my profile
        </button>
      </div>

      <p className="text-xs text-slate-500">
        By saving, you create a FreeResumePost profile and upload the file you reviewed. Your
        profile stays private unless you turn on its public link. See{' '}
        <Link href="/privacy" className="underline hover:text-slate-900">
          privacy
        </Link>
        .
      </p>
    </form>
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
