'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { requestEditLink } from '../candidate/login/actions'

// Authed candidate account. After the email-code sign-in (OtpLoginForm) the
// candidate lands here. We read their session, look up their resume profile by
// the VERIFIED email via the security-definer get_my_candidate() RPC (which
// gates on auth.email()), and give them their profile plus the secure ways to
// update it. Editing reuses the existing emailed secure edit-link flow, so we
// never expose an in-page editor without the same protection the email link has.

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

export default function AccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [editSent, setEditSent] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
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
      if (active) setEmail(session.user.email ?? '')
      const { data, error } = await supabaseBrowser.rpc('get_my_candidate')
      if (!active) return
      if (error) {
        console.error('get_my_candidate failed:', error.message)
        setLoadError(true)
        setLoading(false)
        return
      }
      const row = Array.isArray(data) ? (data[0] ?? null) : (data ?? null)
      setCandidate((row as Candidate | null) ?? null)
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

  async function sendEditLink() {
    if (!email || editLoading) return
    setEditLoading(true)
    setEditError(null)
    const res = await requestEditLink(email)
    setEditLoading(false)
    if (res.ok) {
      setEditSent(true)
    } else {
      setEditError(res.error)
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
          <p className="text-xs font-semibold tracking-wider text-[#003D5C] uppercase">Your account</p>
          {email && (
            <button onClick={signOut} className="text-sm text-slate-500 hover:text-[#003D5C]">
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
              Something went wrong loading your account. Please retry &mdash; if it keeps happening, sign out and
              back in.
            </p>
            <button
              onClick={retryLoad}
              className="inline-block bg-[#7FBC00] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#6da300]"
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
                    {candidate.is_public ? 'Listed for employers' : 'Hidden'}
                  </dd>
                </div>
              </dl>
              {candidate.resume_url && (
                <a
                  href={candidate.resume_url}
                  target="_blank"
                  rel="noopener"
                  className="inline-block mt-4 text-sm font-medium text-[#003D5C] hover:text-[#002A40] underline"
                >
                  View your current resume &rarr;
                </a>
              )}
            </div>

            <Link
              href="/account/tailor"
              className="block w-full text-center bg-[#003D5C] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#002A40] mb-3"
            >
              Tailor my resume to a job posting →
            </Link>

            {editSent ? (
              <div className="rounded-lg border border-[#7FBC00]/30 bg-[#7FBC00]/10 p-5 mb-3">
                <p className="text-sm text-slate-800">
                  Check <strong>{email}</strong> for a secure link to edit your profile. It expires shortly.
                </p>
              </div>
            ) : (
              <>
                {editError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-3 text-sm text-red-700">
                    {editError}
                  </div>
                )}
                <button
                  onClick={sendEditLink}
                  disabled={editLoading}
                  className="w-full bg-[#7FBC00] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#6da300] disabled:opacity-60 mb-3"
                >
                  {editLoading ? 'Sending…' : 'Email me a link to edit my resume'}
                </button>
              </>
            )}

            <Link
              href="/upload"
              className="block w-full text-center bg-[#003D5C] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#002A40]"
            >
              Upload a new resume
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-slate-900 mb-3">
              No resume on file
            </h1>
            <p className="text-slate-600 mb-8">
              We didn&apos;t find a resume for <strong>{email}</strong>. Upload one in about 30 seconds and
              we&apos;ll match you to real openings.
            </p>
            <Link
              href="/upload"
              className="inline-block bg-[#7FBC00] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#6da300]"
            >
              Upload your resume &rarr;
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
