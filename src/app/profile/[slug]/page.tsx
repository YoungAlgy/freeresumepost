import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { cache } from 'react'
import { supabase } from '@/lib/supabase'
import ProfileEditForm from './edit-form'
import {
  FREE_RESUME_POST_UPLOAD_SOURCE,
  isPublishableFreeResumePostProfile,
} from '@/lib/profile-provenance'

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const NONCE_RE = /^[0-9a-f]{64}$/i

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    t?: string | string[]
    id?: string | string[]
    resume?: string | string[]
  }>
}

export const dynamic = 'force-dynamic'

type Candidate = {
  slug: string
  first_name: string
  last_initial: string | null
  credential: string | null
  specialty: string | null
  city: string | null
  state: string | null
  years_experience: number | null
}

type PublicCandidateRow = Candidate & {
  source: string | null
  is_public: boolean
  status: string | null
  deleted_at: string | null
}

const getPublicCandidate = cache(async (slug: string): Promise<Candidate | null> => {
  if (!SLUG_RE.test(slug)) return null
  const { data } = await supabase
    // public_candidates_directory (2026-08-13): anon has no grant on the base
    // table (by design — it carries email/phone/resume PII); this view bakes
    // in the same is_public/active/not-deleted filter and exposes only the
    // safe columns below. last_initial (generated, public-safe), NOT last_name
    // — anon must never read the full last name (privacy promise). The owner's
    // edit view still gets the full name via the SECURITY DEFINER
    // consume_candidate_edit_rpc.
    .from('public_candidates_directory')
    .select(
      'slug, first_name, last_initial, credential, specialty, city, state, years_experience, source, is_public, status, deleted_at'
    )
    .eq('slug', slug)
    .eq('source', FREE_RESUME_POST_UPLOAD_SOURCE)
    .eq('is_public', true)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle()
  const row = data as unknown as PublicCandidateRow | null
  if (!row || !isPublishableFreeResumePostProfile(row)) return null
  return {
    slug: row.slug,
    first_name: row.first_name,
    last_initial: row.last_initial,
    credential: row.credential,
    specialty: row.specialty,
    city: row.city,
    state: row.state,
    years_experience: row.years_experience,
  }
})

// Fields ProfileEditForm actually reads. Keep this explicit before the data
// crosses the Server Component boundary into the client form.
export type EditableCandidate = {
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

type EditableCandidateRpc = EditableCandidate & { source: string }

async function getEditableCandidate(
  candidateId: string,
  nonce: string
): Promise<{ candidate: EditableCandidate } | null> {
  if (!UUID_RE.test(candidateId) || !NONCE_RE.test(nonce)) return null
  const { data, error } = await supabase.rpc('consume_candidate_edit_rpc', {
    p_candidate_id: candidateId,
    p_nonce: nonce,
  })
  if (error) return null
  const r = data as { success: boolean; candidate?: EditableCandidateRpc }
  if (
    !r.success ||
    !r.candidate ||
    r.candidate.source !== FREE_RESUME_POST_UPLOAD_SOURCE
  ) {
    return null
  }
  // Defense-in-depth: even though consume_candidate_edit_rpc now returns a
  // narrow jsonb_build_object() (2026-08-20 migration), build an explicit
  // safe object here too before it crosses into a Client Component
  // (EditMode -> ProfileEditForm). Next.js serializes every field of a
  // Server-to-Client prop into the RSC flight payload regardless of what
  // the client JSX reads, so if the RPC's shape ever widens again (e.g.
  // reverted back to to_jsonb()) this still stops the extra fields from
  // reaching the browser.
  const c = r.candidate
  const safeCandidate: EditableCandidate = {
    id: c.id,
    slug: c.slug,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
    phone: c.phone ?? null,
    credential: c.credential ?? null,
    specialty: c.specialty ?? null,
    city: c.city ?? null,
    state: c.state ?? null,
    years_experience: c.years_experience ?? null,
    is_public: c.is_public,
    has_resume: c.has_resume === true,
  }
  return { candidate: safeCandidate }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function publicName(firstName: string, lastInitial: string | null): string {
  const initial = lastInitial?.trim()
  return initial ? `${firstName} ${initial}.` : firstName
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const query = await searchParams
  const t = firstParam(query.t)
  const id = firstParam(query.id)
  // Edit-mode links (?t=…&id=…, emailed to the candidate) must NEVER be
  // indexed — that view unlocks the candidate's private PII (email/phone) +
  // private profile data. generateMetadata otherwise computes the public profile's
  // indexable metadata even for a ?t URL, so set noindex authoritatively here
  // (robots.txt disallow + canonical also guard, but this is the real signal).
  if (t || id) {
    return { title: 'Edit your profile', robots: { index: false, follow: false } }
  }
  const c = await getPublicCandidate(slug)
  if (!c) {
    return { title: 'Profile', robots: { index: false, follow: false } }
  }
  const loc = [c.city, c.state].filter(Boolean).join(', ')
  const name = publicName(c.first_name, c.last_initial)
  const title = `${name}${c.credential ? `, ${c.credential}` : ''} | Healthcare resume profile`
  return {
    title,
    description: `${name}'s limited healthcare resume profile.${loc ? ` Based in ${loc}.` : ''}`,
    alternates: { canonical: `https://www.freeresumepost.co/profile/${slug}` },
    robots: { index: false, follow: true },
    openGraph: { title, type: 'profile', url: `https://www.freeresumepost.co/profile/${slug}` },
  }
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { slug } = await params
  const query = await searchParams
  const t = firstParam(query.t)
  const id = firstParam(query.id)
  const resumeMissing = firstParam(query.resume) === 'missing'

  // Treat a partial edit query as invalid too. Falling through to a public
  // page with half of a private link makes recovery unclear and can leak token
  // fragments into logs and analytics.
  if (t || id) {
    if (t && id) {
      const result = await getEditableCandidate(id, t)
      if (result && result.candidate.slug === slug) {
        return (
          <EditMode
            candidate={result.candidate}
            nonce={t}
            resumeMissing={resumeMissing}
          />
        )
      }
    }
    // An edit link was provided but it did not open the owner view. Do not
    // silently fall through to a public profile or a bare 404.
    return <EditLinkInvalid />
  }

  const c = await getPublicCandidate(slug)
  if (!c) notFound()

  const loc = [c.city, c.state].filter(Boolean).join(', ')
  const name = publicName(c.first_name, c.last_initial)

  return (
      <main className="min-h-screen bg-white text-slate-900">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <div className="rounded-3xl border border-slate-200 p-8 md:p-10 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Shared healthcare profile
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight mb-2">
              {name}
              {c.credential && (
                <span className="text-slate-500 font-normal">, {c.credential}</span>
              )}
            </h1>
            {c.specialty && (
              <p className="text-xl text-slate-700 mb-1">{c.specialty}</p>
            )}
            {loc && <p className="text-slate-500">{loc}</p>}

            <div className="mt-6 flex flex-wrap gap-2">
              {c.years_experience !== null && c.years_experience !== undefined && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {c.years_experience}+ yrs experience
                </span>
              )}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-500">
              This limited profile was shared by the person shown. Their email, phone number,
              full last name, and resume file are hidden.
            </div>
          </div>
        </div>
      </main>
  )
}

// Recovery state for an invalid, expired, partial, or wrong-profile edit link.
function EditLinkInvalid() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="rounded-3xl border border-slate-200 p-8 md:p-10 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            This edit link didn&apos;t work
          </h1>
          <p className="text-slate-600 mb-2">
            It may have expired or been copied incorrectly. Your profile is unchanged.
          </p>
          <p className="text-slate-600 mb-6">
            Sign in with your email to open the profile and create a fresh secure link.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/candidate/login"
              className="rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800"
            >
              Sign in to my profile
            </Link>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

// Client component for the edit-mode form
function EditMode({
  candidate,
  nonce,
  resumeMissing,
}: {
  candidate: EditableCandidate
  nonce: string
  resumeMissing: boolean
}) {
  return (
    <ProfileEditForm
      candidate={candidate}
      nonce={nonce}
      initialResumeMissing={resumeMissing}
    />
  )
}
