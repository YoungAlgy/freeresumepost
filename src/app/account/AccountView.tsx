'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { resolveResumeUrl } from '@/lib/resume-url'
import { startAccountLoad } from '@/lib/account-load'
import { startResumeOpen } from '@/lib/account-resume'
import { issueAccountEditorToken, signOutAccount } from '@/lib/account-actions'

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
  const [signOutLoading, setSignOutLoading] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const accountActionRef = useRef(false)
  const resumeRequestRef = useRef<ReturnType<typeof startResumeOpen> | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      resumeRequestRef.current?.cancel()
    }
  }, [])

  useEffect(() => {
    let active = true
    let redirecting = false
    const request = startAccountLoad<Candidate>({
      getSession: async () => {
        const { data, error } = await supabaseBrowser.auth.getSession()
        return { session: data.session, error }
      },
      onSession: (session) => {
        if (active) setEmail(session.user.email ?? '')
      },
      getCandidate: async (signal) => {
        const { data, error } = await supabaseBrowser
          .rpc('get_my_freeresumepost_candidate')
          .retry(false)
          .abortSignal(signal)
        return { data: data as Candidate | Candidate[] | null, error }
      },
    })

    async function load() {
      setLoadError(false)
      setResumeError(null)
      try {
        const result = await request.promise
        if (!active) return
        if (result.kind === 'no-session') {
          redirecting = true
          router.replace('/candidate/login')
          return
        }
        setCandidate(result.candidate)
      } catch (error) {
        if (!active) return
        console.error(
          'get_my_freeresumepost_candidate failed:',
          error instanceof Error ? error.message : 'unknown',
        )
        setLoadError(true)
      } finally {
        if (active && !redirecting) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
      request.cancel()
    }
  }, [router, reloadKey])

  function retryLoad() {
    if (signOutLoading) return
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  async function openEditor() {
    if (accountActionRef.current || editLoading || resumeLoading || signOutLoading) return
    accountActionRef.current = true
    setEditLoading(true)
    setEditError(null)
    setSignOutError(null)
    try {
      const result = await issueAccountEditorToken(async () => {
        const { data, error } = await supabaseBrowser
          .rpc('issue_my_freeresumepost_edit_token_rpc')
          .retry(false)
        return { data, error }
      })
      if (!mountedRef.current) return
      if (!result.ok) {
        console.error('issue_my_freeresumepost_edit_token_rpc failed:', result.technicalMessage)
        setEditError(result.error)
        return
      }
      router.push(
        `/profile/${encodeURIComponent(result.candidateSlug)}?t=${encodeURIComponent(result.nonce)}&id=${encodeURIComponent(result.candidateId)}`,
      )
    } finally {
      accountActionRef.current = false
      if (mountedRef.current) setEditLoading(false)
    }
  }

  async function openResume() {
    if (accountActionRef.current || resumeLoading || editLoading || signOutLoading || !candidate?.resume_url) return
    accountActionRef.current = true
    setResumeLoading(true)
    setResumeError(null)

    const storagePath = candidate.resume_url
    const request = startResumeOpen({
      getSession: async () => {
        const { data, error } = await supabaseBrowser.auth.getSession()
        return { session: data.session, error }
      },
      getUrl: (accessToken, signal) => resolveResumeUrl(accessToken, storagePath, signal),
    })
    resumeRequestRef.current = request

    try {
      const result = await request.promise
      if (!mountedRef.current) return
      if (result.kind === 'no-session') {
        router.replace('/candidate/login')
        return
      }
      window.location.assign(result.url)
    } catch {
      if (!mountedRef.current) return
      setResumeError('Could not open your resume. Try again.')
    } finally {
      resumeRequestRef.current = null
      accountActionRef.current = false
      if (mountedRef.current) setResumeLoading(false)
    }
  }

  async function signOut() {
    if (accountActionRef.current || loading || editLoading || resumeLoading || signOutLoading) return
    accountActionRef.current = true
    setSignOutLoading(true)
    setSignOutError(null)
    setEditError(null)
    try {
      const result = await signOutAccount(() => supabaseBrowser.auth.signOut())
      if (!mountedRef.current) return
      if (!result.ok) {
        console.error('candidate sign out failed:', result.technicalMessage)
        setSignOutError(result.error)
        return
      }
      router.replace('/candidate/login')
    } finally {
      accountActionRef.current = false
      if (mountedRef.current) setSignOutLoading(false)
    }
  }

  const fullName = candidate
    ? [candidate.first_name, candidate.last_name].filter(Boolean).join(' ').trim()
    : ''
  const accountActionPending = editLoading || resumeLoading || signOutLoading

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-lg px-5 py-10 sm:px-6 sm:py-16">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Your account</p>
          {email && (
            <button
              onClick={signOut}
              disabled={loading || accountActionPending}
              className="inline-flex min-h-11 items-center text-sm text-slate-500 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signOutLoading ? 'Signing out...' : 'Sign out'}
            </button>
          )}
        </div>
        {signOutError && (
          <p className="mb-4 text-sm font-medium text-red-700" role="alert">
            {signOutError}
          </p>
        )}

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
              disabled={signOutLoading}
              className="inline-flex min-h-11 items-center rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800"
            >
              Retry
            </button>
          </>
        ) : candidate ? (
          <>
            <h1 className="mb-1 break-words text-3xl font-semibold leading-tight tracking-tight text-slate-900 md:text-4xl">
              {fullName || 'Your profile'}
            </h1>
            <p className="mb-6 break-all text-sm text-slate-600">Signed in as {email}</p>

            {editError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                {editError}
              </div>
            )}
            <button
              onClick={openEditor}
              disabled={accountActionPending}
              className="mb-6 min-h-11 w-full rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
            >
              {editLoading ? 'Opening…' : 'Edit profile'}
            </button>

            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Profile details</h2>
              <dl className="space-y-3 text-sm">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
                  <dt className="text-slate-500">Specialty</dt>
                  <dd className="min-w-0 break-words text-right font-medium text-slate-900">
                    {candidate.specialty || 'Not added'}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
                  <dt className="text-slate-500">Credential</dt>
                  <dd className="min-w-0 break-words text-right font-medium text-slate-900">
                    {candidate.credential || 'Not added'}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="min-w-0 break-words text-right font-medium text-slate-900">
                    {[candidate.city, candidate.state].filter(Boolean).join(', ') || 'Not added'}
                  </dd>
                </div>
              </dl>
            </div>

            <section className="mb-4 rounded-lg border border-slate-200 p-5" aria-labelledby="resume-file-heading">
              <h2 id="resume-file-heading" className="text-base font-semibold text-slate-900">Resume file</h2>
              <p className="mt-1 text-sm text-slate-600">
                {candidate.resume_url
                  ? 'A private resume file is saved with your profile.'
                  : 'No resume file is saved with your profile.'}
              </p>
              <p className="mt-1 text-sm text-slate-500">Use Edit profile to {candidate.resume_url ? 'replace it' : 'add one'}.</p>
              {candidate.resume_url && (
                <button
                  type="button"
                  onClick={openResume}
                  disabled={accountActionPending}
                  className="mt-3 min-h-11 text-sm font-semibold text-indigo-700 underline hover:text-indigo-800 disabled:opacity-60"
                >
                  {resumeLoading ? 'Opening resume…' : 'Open resume file'}
                </button>
              )}
              {resumeError && <p className="mt-2 text-sm text-red-700" role="alert">{resumeError}</p>}
            </section>

            <section className="mb-6 rounded-lg border border-slate-200 p-5" aria-labelledby="public-link-heading">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="public-link-heading" className="text-base font-semibold text-slate-900">Public link</h2>
                <p className="text-sm font-semibold text-slate-900">
                  {candidate.is_public ? 'On' : 'Off'}
                </p>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {candidate.is_public
                  ? 'A limited public link is turned on for this profile.'
                  : 'Your profile is private and has no public profile page.'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Your email, phone, full last name, and resume file stay private.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Use Edit profile to manage the public link.
              </p>
            </section>

            <Link
              href="/account/tailor"
              aria-disabled={accountActionPending}
              tabIndex={accountActionPending ? -1 : undefined}
              onClick={(event) => {
                if (accountActionPending) event.preventDefault()
              }}
              className={`mb-3 flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50 ${accountActionPending ? 'pointer-events-none opacity-60' : ''}`}
            >
              Tailor my resume to a job posting →
            </Link>

          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-slate-900 mb-3">
              No resume on file
            </h1>
            <p className="text-slate-600 mb-8">
              We didn&apos;t find a resume for <strong className="break-all">{email}</strong>. Upload one to create your
              FreeResumePost profile.
            </p>
            <Link
              href="/upload"
              className="inline-flex min-h-11 items-center rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800"
            >
              Upload your resume
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
