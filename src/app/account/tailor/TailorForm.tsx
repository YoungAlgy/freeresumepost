'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { extractTextFromUrl } from '@/lib/resume-parser'
import { tailorForCandidate, type TailorActionResult } from './actions'
import type { TailorResult } from '@/lib/gemini-tailor'

type Candidate = {
  id: string
  first_name: string | null
  resume_url: string | null
}

type ResumeSource = 'loading' | 'loaded' | 'manual' | 'none'

export default function TailorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [resumeSource, setResumeSource] = useState<ResumeSource>('loading')
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [result, setResult] = useState<TailorResult | null>(null)
  const [usesRemainingToday, setUsesRemainingToday] = useState<number | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      setLoadError(false)
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      if (!session) {
        router.replace('/candidate/login')
        return
      }
      const { data, error } = await supabaseBrowser.rpc('get_my_candidate')
      if (!active) return
      if (error) {
        console.error('get_my_candidate failed:', error.message)
        setLoadError(true)
        setLoading(false)
        return
      }
      const row = (Array.isArray(data) ? data[0] : data) as Candidate | null
      setCandidate(row ?? null)

      if (!row?.resume_url) {
        setResumeSource(row ? 'manual' : 'none')
        setLoading(false)
        return
      }

      try {
        const text = await extractTextFromUrl(row.resume_url)
        if (!active) return
        setResumeText(text)
        setResumeSource('loaded')
      } catch (e) {
        console.error('resume auto-load failed:', e instanceof Error ? e.message : 'unknown')
        if (!active) return
        setResumeSource('manual')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [router, reloadKey])

  function retryLoad() {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  async function copy(key: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500)
  }

  async function handleSubmit() {
    if (submitting) return
    setErrorMsg(null)
    setRateLimited(false)

    const { data: { session } } = await supabaseBrowser.auth.getSession()
    if (!session) {
      router.replace('/candidate/login')
      return
    }

    setSubmitting(true)
    let res: TailorActionResult
    try {
      res = await tailorForCandidate(session.access_token, jobDescription, resumeText)
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }
    setSubmitting(false)

    if (!res.ok) {
      if (res.code === 'rate_limited') setRateLimited(true)
      setErrorMsg(res.error)
      return
    }
    setResult(res.result)
    setUsesRemainingToday(res.usesRemainingToday)
  }

  const canSubmit = resumeText.trim().length >= 30 && jobDescription.trim().length >= 30 && !submitting

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-xs font-semibold tracking-wider text-[#003D5C] uppercase mb-2">Your account</p>
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-slate-900 mb-3">
          Tailor your resume to a job
        </h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Paste a job posting below. We&apos;ll rewrite your bullets to match what it wants, write you a
          real cover letter, and prep you for the interview &mdash; using the resume already on your account.
        </p>

        {loading ? (
          <p className="text-slate-600">Loading your profile&hellip;</p>
        ) : loadError ? (
          <div className="rounded-lg border-2 border-dashed border-slate-300 p-5">
            <h2 className="font-semibold text-slate-900 mb-2">Could not load your profile</h2>
            <p className="text-sm text-slate-700 mb-3">
              Something went wrong loading your account. Please retry &mdash; if it keeps happening, sign out and
              back in.
            </p>
            <button
              onClick={retryLoad}
              className="inline-block bg-[#7FBC00] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#6da300]"
            >
              Retry
            </button>
          </div>
        ) : resumeSource === 'none' ? (
          <div className="rounded-lg border-2 border-dashed border-slate-300 p-5">
            <h2 className="font-semibold text-slate-900 mb-2">No resume on file yet</h2>
            <p className="text-sm text-slate-700 mb-3">Upload one in about 30 seconds, then come back here.</p>
            <Link href="/upload" className="inline-block bg-[#7FBC00] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#6da300]">
              Upload your resume →
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Job posting</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job posting here..."
                rows={8}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003D5C]/30 focus:border-[#003D5C]"
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Your resume</label>
                {resumeSource === 'loaded' && (
                  <span className="text-xs text-[#7FBC00] font-medium">✓ Using the resume on your account</span>
                )}
              </div>
              {resumeSource === 'manual' && (
                <p className="text-xs text-slate-500 mb-1.5">
                  Couldn&apos;t load your resume file automatically — paste the text below instead.
                </p>
              )}
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                rows={8}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003D5C]/30 focus:border-[#003D5C]"
              />
            </div>

            {errorMsg && (
              <div className={`rounded-lg border p-4 mb-4 text-sm ${rateLimited ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full bg-[#003D5C] text-white text-sm font-semibold px-4 py-3 rounded-lg hover:bg-[#002A40] disabled:opacity-50"
            >
              {submitting ? 'Tailoring…' : 'Tailor my application'}
            </button>
            {usesRemainingToday !== null && (
              <p className="text-xs text-slate-500 text-center mt-2">
                {usesRemainingToday} more free tailorings today
              </p>
            )}
          </>
        )}

        {result && (
          <div className="mt-12 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-slate-900">Tailored resume bullets</h2>
                <button onClick={() => copy('bullets', result.tailoredBullets.map((b) => `• ${b}`).join('\n'))} className="text-xs text-[#003D5C] hover:underline">
                  {copiedKey === 'bullets' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-800 bg-slate-50 rounded-lg border border-slate-200 p-4">
                {result.tailoredBullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-slate-900">Cover letter</h2>
                <button onClick={() => copy('cover', result.coverLetter)} className="text-xs text-[#003D5C] hover:underline">
                  {copiedKey === 'cover' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-slate-800 bg-slate-50 rounded-lg border border-slate-200 p-4 whitespace-pre-wrap leading-relaxed">
                {result.coverLetter}
              </p>
            </section>

            {result.keywordsToAdd.length > 0 && (
              <section>
                <h2 className="font-semibold text-slate-900 mb-2">Keywords this job wants that your resume is missing</h2>
                <div className="flex flex-wrap gap-2">
                  {result.keywordsToAdd.map((k, i) => (
                    <span key={i} className="text-xs font-medium bg-[#7FBC00]/10 text-[#4d7300] px-2.5 py-1 rounded-full">
                      {k}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="font-semibold text-slate-900 mb-2">Interview prep</h2>
              <div className="space-y-3">
                {result.interviewPrep.map((q, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-medium text-slate-900 mb-1">{q.question}</p>
                    <p className="text-sm text-slate-600">{q.tip}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
