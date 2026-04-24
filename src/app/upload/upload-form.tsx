'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  extractTextFromFile,
  parseFields,
  type ParsedResume,
} from '@/lib/resume-parser'
import { submitCandidate, type SubmitCandidateInput } from './actions'

const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID',
  'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS',
  'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK',
  'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV',
  'WI', 'WY', 'DC',
]

type Phase = 'drop' | 'parsing' | 'review' | 'submitting' | 'done'

export default function UploadForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('drop')
  const [dragOver, setDragOver] = useState(false)
  const [parseErr, setParseErr] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [parsed, setParsed] = useState<ParsedResume | null>(null)
  const [, startTransition] = useTransition()

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
    remote_only: false,
    contact_via_email: true,
    contact_via_sms: false,
    is_public: false,
    raw_text: '',
  })

  async function processFile(file: File) {
    setParseErr(null)
    setFileName(file.name)
    setPhase('parsing')
    try {
      const text = await extractTextFromFile(file)
      if (!text || text.length < 50) {
        setParseErr(
          'We couldn\u2019t read any text from that file. If it\u2019s a scanned image, try exporting a searchable PDF first.'
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
        raw_text: text,
      }))
      setPhase('review')
    } catch (err) {
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
    return (
      form.email.trim().length > 3 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
      form.first_name.trim().length > 0 &&
      form.last_name.trim().length > 0
    )
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit()) return
    setPhase('submitting')
    startTransition(async () => {
      const res = await submitCandidate(form)
      if (res.success) {
        setPhase('done')
        router.push(res.edit_url)
      } else {
        setParseErr(res.error)
        setPhase('review')
      }
    })
  }

  // ---------- Renders ----------
  if (phase === 'drop') {
    return (
      <div>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 md:p-16 text-center transition-all ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center">
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
            PDF, DOCX, or TXT · Up to 5 MB · Parsed locally in your browser
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
        {parseErr && (
          <p className="mt-4 text-sm text-red-600 font-medium">{parseErr}</p>
        )}
        <div className="mt-6 text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
          <span>· We extract: name, email, phone, credentials, specialty, state</span>
          <span>· We never send your resume file to our servers</span>
          <span>· You review every field before saving</span>
        </div>
      </div>
    )
  }

  if (phase === 'parsing') {
    return (
      <div className="rounded-2xl border border-slate-200 p-12 text-center bg-slate-50">
        <div className="mx-auto mb-4 w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-semibold text-slate-900">Reading {fileName}…</p>
        <p className="text-sm text-slate-500 mt-1">This runs locally — no uploads yet.</p>
      </div>
    )
  }

  if (phase === 'submitting' || phase === 'done') {
    return (
      <div className="rounded-2xl border border-slate-200 p-12 text-center bg-slate-50">
        <div className="mx-auto mb-4 w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-semibold text-slate-900">Saving your profile…</p>
      </div>
    )
  }

  // phase === 'review'
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
        <div className="flex items-start gap-3 mb-2">
          <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
            ✓
          </span>
          <div>
            <p className="font-semibold text-slate-900">
              Extracted {parsed ? parsed.rawText.length.toLocaleString() : 0} characters
              from <span className="font-mono text-sm">{fileName}</span>
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
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className={fieldStyle}
              maxLength={100}
            />
          </Field>
          <Field label="Email" required hint="Employers reach you here">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={fieldStyle}
              maxLength={254}
            />
          </Field>
          <Field label="Phone" hint="Optional but helpful">
            <input
              type="tel"
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
          <Field label="Credential" hint="MD, RN, PA-C, LCSW, etc.">
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
          <div className="flex items-center md:items-end">
            <label className="flex items-center gap-2 text-sm pb-2">
              <input
                type="checkbox"
                checked={form.remote_only}
                onChange={(e) => setForm({ ...form, remote_only: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              Remote-only roles
            </label>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">
          How should employers reach you?
        </h2>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.contact_via_email}
              onChange={(e) => setForm({ ...form, contact_via_email: e.target.checked })}
              className="mt-0.5 w-4 h-4"
            />
            <div>
              <p className="font-medium text-slate-900">Email</p>
              <p className="text-sm text-slate-500">Recommended. Employers reach you at the email above.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.contact_via_sms}
              onChange={(e) => setForm({ ...form, contact_via_sms: e.target.checked })}
              className="mt-0.5 w-4 h-4"
            />
            <div>
              <p className="font-medium text-slate-900">SMS</p>
              <p className="text-sm text-slate-500">
                Explicit opt-in. Only interview confirmations + application updates — no cold outreach, no marketing.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              className="mt-0.5 w-4 h-4"
            />
            <div>
              <p className="font-medium text-slate-900">Show my profile publicly</p>
              <p className="text-sm text-slate-500">
                Off by default. When on, your name + specialty + state show at
                <span className="font-mono text-xs"> /profile/[your-slug]</span>. Email + phone stay private.
              </p>
            </div>
          </label>
        </div>
      </section>

      {parseErr && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 font-medium text-sm">
          {parseErr}
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={() => {
            setPhase('drop')
            setParsed(null)
            setFileName('')
          }}
          className="text-sm text-slate-500 hover:text-slate-900 underline"
        >
          ← Use a different file
        </button>
        <button
          type="submit"
          disabled={!canSubmit()}
          className="inline-flex items-center rounded-xl bg-blue-600 text-white px-6 py-3 font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save profile →
        </button>
      </div>

      <p className="text-xs text-slate-500">
        By saving, you agree your profile can be shown to verified employers on
        freejobpost.co. You can delete or edit it anytime from your unique
        profile URL. See{' '}
        <Link href="/privacy" className="underline hover:text-slate-900">
          privacy
        </Link>
        .
      </p>
    </form>
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
