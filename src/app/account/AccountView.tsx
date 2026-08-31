'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { resolveResumeUrl } from '@/lib/resume-url'

// Authed candidate account. After the email-code sign-in (OtpLoginForm) the
// candidate lands here. The source-scoped RPC returns only a direct
// FreeResumePost upload for the verified email. Shared CRM candidates cannot
// cross into this account surface.
//
// Client component (needs useEffect/useState for the session-gated load), so
// it can't export `metadata` itself — page.tsx wraps it and carries that,
// same split as /account/tailor.

type Candidate = {
  id: string
  slug: string
  first_name: string | null
  last_name: string | null
  email: string
  specialty: string | null
  credential: string | null
  city: string | null
  state: string | null
  status: string | null
  resume_url: string | null
  is_public: boolean | null
}

export default function AccountView() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      setLoadError(false)
      setResumeError(null)
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      if (!session) {
        router.replace('/candidate/login')
        return
      }
      if (active) setEmail(session.user.email ?? '')
      const { data, error } = await supabaseBrowser.rpc('get_my_freeresumepost_candidate')
      if (!active) return
      if (error) {
        console.error('get_my_freeresumepost_candidate failed:', error.message)
        setLoadError(true)
        setLoading(false)
        return
      }
      const row = Array.isArray(data) ? (data[0] ?? null) : (data ?? null)
      const c = (row as Candidate | null) ?? null
      setCandidate(c)
      setLoading(false)

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

  async function openEditor() {
    if (editLoading) return
    setEditLoading(true)
    setEditError(null)
    const { data, error } = await supabaseBrowser.rpc(
      'issue_my_freeresumepost_edit_token_rpc',
    )
    setEditLoading(false)
    if (error) {
      console.error('issue_my_freeresumepost_edit_token_rpc failed:', error.message)
      setEditError('Could not open the editor. Try again.')
      return
    }
    const result = data as {
      success?: boolean
      candidate_id?: string
      candidate_slug?: string
      nonce?: string
      error?: string
    }
    if (!result?.success || !result.candidate_id || !result.candidate_slug || !result.nonce) {
      setEditError(result?.error || 'Could not open the editor. Try again.')
      return
    }
    router.push(
      `/profile/${encodeURIComponent(result.candidate_slug)}?t=${encodeURIComponent(result.nonce)}&id=${encodeURIComponent(result.candidate_id)}`,
    )
  }

  async function openResume() {
    if (resumeLoading || !candidate?.resume_url) return
    setResumeLoading(true)
    setResumeError(null)

    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      if (!session) {
        router.replace('/candidate/login')
        return
      }
      const url = await resolveResumeUrl(session.access_token, candidate.resume_url)
      window.location.assign(url)
    } catch (error) {
      console.error('resolveResumeUrl failed:', error instanceof Error ? error.message : 'unknown')
      setResumeError('Could not open your resume. Try again.')
    } finally {
      setResumeLoading(false)
    }
  }

  async function signOut() {
    await supabaseBrowser.auth.signOut()
    router.replace('/candidate/login')
  }

  const fullName = candidate
    ? [candidate.first_name, candidate.last_name].filter(Boolean).join(' ').trim()
    : ''

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Your account</p>
          {email && (
            <button onClick={signOut} className="text-sm text-slate-500 hover:text-indigo-700">
              Sign out
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-slate-600 mt-8">Loading your profile&hellip;</p>
        ) : loadError ? (
          <>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-slate-900 mb-3">
              Could not load your profile
            </h1>
            <p className="text-slate-600 mb-8">
              Something went wrong loading your account. Please retry. If it keeps happening, sign out and
              back in.
            </p>
            <button
              onClick={retryLoad}
              className="inline-block rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800"
            >
              Retry
            </button>
          </>
        ) : candidate ? (
          <>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-slate-900 mb-1">
              {fullName || 'Your resume'}
            </h1>
            <p className="text-slate-600 mb-8">Signed in as {email}</p>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 mb-6">
              <dl className="space-y-2 text-sm">
                {candidate.specialty && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Specialty</dt>
                    <dd className="font-medium text-slate-900">{candidate.specialty}</dd>
                  </div>
                )}
                {candidate.credential && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Credential</dt>
                    <dd className="font-medium text-slate-900">{candidate.credential}</dd>
                  </div>
                )}
                {(candidate.city || candidate.state) && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Location</dt>
                    <dd className="font-medium text-slate-900">
                      {[candidate.city, candidate.state].filter(Boolean).join(', ')}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Visibility</dt>
                  <dd className="font-medium text-slate-900">
                    {candidate.is_public ? 'Public link on' : 'Private'}
                  </dd>
                </div>
              </dl>
              {candidate.resume_url && (
                <button
                  type="button"
                  onClick={openResume}
                  disabled={resumeLoading}
                  className="mt-4 min-h-11 text-sm font-medium text-indigo-700 underline hover:text-indigo-800 disabled:opacity-60"
                >
                  {resumeLoading ? 'Opening resume...' : 'View your current resume'}
                </button>
              )}
              {resumeError && <p className="mt-2 text-sm text-red-700" role="alert">{resumeError}</p>}
            </div>

            <Link
              href="/account/tailor"
              className="mb-3 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Tailor my resume to a job posting →
            </Link>

            {editError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {editError}
              </div>
            )}
            <button
              onClick={openEditor}
              disabled={editLoading}
              className="mb-3 w-full rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
            >
              {editLoading ? 'Opening…' : 'Edit profile or replace resume'}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-slate-900 mb-3">
              No resume on file
            </h1>
            <p className="text-slate-600 mb-8">
              We didn&apos;t find a resume for <strong>{email}</strong>. Upload one to create your
              FreeResumePost profile.
            </p>
            <Link
              href="/upload"
              className="inline-block rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800"
            >
              Upload your resume
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
