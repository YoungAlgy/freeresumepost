import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import ProfileEditForm from './edit-form'

import { safeJsonLd } from '@/lib/safe-jsonld'
import { Logo } from '@/components/Logo'
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ t?: string; id?: string }>
}

export const dynamic = 'force-dynamic'

type Candidate = {
  id: string
  slug: string
  first_name: string
  last_name: string
  last_initial: string | null
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
  source: string | null
  created_at: string
}

export type CandidateMatch = {
  job_id: string
  job_slug: string
  job_title: string
  job_city: string | null
  job_state: string | null
  job_specialty: string | null
  job_remote_hybrid: 'remote' | 'hybrid' | 'onsite' | null
  job_employment_type: string | null
  salary_min: number | null
  salary_max: number | null
  score: number
  reasons: Record<string, unknown> | null
}

async function getPublicCandidate(slug: string): Promise<Candidate | null> {
  if (!SLUG_RE.test(slug)) return null
  const { data } = await supabase
    .from('public_candidates')
    .select(
      // last_initial (generated, public-safe), NOT last_name — anon must never
      // read the full last name (privacy promise). The owner's edit view still
      // gets the full name via the SECURITY DEFINER consume_candidate_edit_rpc.
      'id, slug, first_name, last_initial, credential, specialty, city, state, years_experience, remote_only, contact_via_email, contact_via_sms, is_public, source, created_at'
    )
    .eq('slug', slug)
    .eq('is_public', true)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle()
  return (data as unknown as Candidate) ?? null
}

async function getEditableCandidate(
  candidateId: string,
  nonce: string
): Promise<{ candidate: Candidate; matches: CandidateMatch[] } | null> {
  const { data, error } = await supabase.rpc('consume_candidate_edit_rpc', {
    p_candidate_id: candidateId,
    p_nonce: nonce,
  })
  if (error) return null
  const r = data as { success: boolean; candidate?: Candidate; matches?: CandidateMatch[] }
  if (!r.success || !r.candidate) return null
  return { candidate: r.candidate, matches: r.matches ?? [] }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const { t } = await searchParams
  // Edit-mode links (?t=…&id=…, emailed to the candidate) must NEVER be
  // indexed — that view unlocks the candidate's private PII (email/phone) +
  // job matches. generateMetadata otherwise computes the PUBLIC profile's
  // indexable metadata even for a ?t URL, so set noindex authoritatively here
  // (robots.txt disallow + canonical also guard, but this is the real signal).
  if (t) {
    return { title: 'Edit your profile', robots: { index: false, follow: false } }
  }
  const c = await getPublicCandidate(slug)
  if (!c) {
    return { title: 'Profile', robots: { index: false, follow: false } }
  }
  // 2026-06-02: ALL public candidate profiles are noindex'd. The candidate
  // directory is a monetizable asset, not free indexed content — we're pulling
  // it out of Google while the gated/paid-access model is designed (profiles are
  // also dropped from the sitemap). Edit-mode (?t=) is already noindex,nofollow
  // above. The page still renders (direct links + the owner's edit view work);
  // it's just out of the public index. Reversible: restore the old thin-only
  // gate (`index:false` only when no specialty AND no credential).
  const loc = [c.city, c.state].filter(Boolean).join(', ')
  const lastInitial = c.last_initial ?? ''
  const title = `${c.first_name} ${lastInitial}.${c.credential ? ', ' + c.credential : ''}, ${c.specialty ?? 'Healthcare'}`
  return {
    title,
    description: `${title} profile on freeresumepost.co. ${loc ? 'Based in ' + loc + '. ' : ''}Open to healthcare job opportunities.`,
    alternates: { canonical: `https://www.freeresumepost.co/profile/${slug}` },
    robots: { index: false, follow: true },
    openGraph: { title, type: 'profile', url: `https://www.freeresumepost.co/profile/${slug}` },
  }
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { slug } = await params
  const { t, id } = await searchParams

  // Edit mode — a valid token unlocks the private profile + the candidate's
  // top job matches. Falls through to public view if token invalid.
  if (t && id) {
    const result = await getEditableCandidate(id, t)
    if (result && result.candidate.slug === slug) {
      return <EditMode candidate={result.candidate} nonce={t} matches={result.matches} />
    }
    // L122 fix: an edit link was provided but it didn't open the editor (expired,
    // already used, or slug-mismatched). Don't silently fall through to the public
    // read-only view (or a bare 404 for a private profile) with no explanation —
    // show a clear "this link didn't work" state that points at the real recovery
    // page (/candidate/login, which resends a fresh link).
    return <EditLinkInvalid />
  }

  const c = await getPublicCandidate(slug)
  if (!c) notFound()

  const loc = [c.city, c.state].filter(Boolean).join(', ')

  // knowsAbout array — Schema.org Person property that boosts AI-overview
  // surfacing (SGE pulls candidate.knowsAbout fields into "professionals
  // who specialize in X" answers). Build from specialty + credential since
  // those are the highest-signal terms we have. Filtered to non-null
  // strings + de-duped.
  const knowsAbout = [c.specialty, c.credential]
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .filter((s, i, arr) => arr.indexOf(s) === i)

  const personJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: `${c.first_name} ${c.last_initial ?? ''}.`,
    jobTitle: c.specialty || c.credential || 'Healthcare professional',
    ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
    address: loc
      ? {
          '@type': 'PostalAddress',
          addressLocality: c.city || undefined,
          addressRegion: c.state || undefined,
          addressCountry: 'US',
        }
      : undefined,
    url: `https://www.freeresumepost.co/profile/${c.slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(personJsonLd) }}
      />
      <main className="min-h-screen bg-white text-slate-900">
        <nav className="border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} className="shrink-0" />
              <span className="font-bold text-lg tracking-tight">
                Ava Health
              </span>
            </Link>
            <Link
              href="/upload"
              className="text-sm font-semibold text-[#003D5C] hover:text-[#002A40]"
            >
              Upload yours →
            </Link>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <div className="rounded-3xl border border-slate-200 p-8 md:p-10 shadow-sm">
            <p className="text-xs font-semibold tracking-wider text-[#003D5C] uppercase mb-3">
              Open to opportunities
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight mb-2">
              {c.first_name} {c.last_initial ?? ''}.
              {c.credential && (
                <span className="text-slate-500 font-normal">, {c.credential}</span>
              )}
            </h1>
            {c.specialty && (
              <p className="text-xl text-slate-700 mb-1">{c.specialty}</p>
            )}
            {loc && <p className="text-slate-500">{loc}</p>}

            <div className="mt-6 flex flex-wrap gap-2">
              {c.remote_only && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                  Remote-only
                </span>
              )}
              {c.years_experience !== null && c.years_experience !== undefined && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {c.years_experience}+ yrs experience
                </span>
              )}
              {c.contact_via_email && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#003D5C]/10 text-[#003D5C] border border-[#003D5C]/20">
                  Email contact OK
                </span>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-500">
              Contact this candidate via{' '}
              <a
                href="https://freejobpost.co/post-job"
                className="underline hover:text-[#003D5C]"
              >
                freejobpost.co
              </a>{' '}
              by posting a matching role, and they&apos;ll see it in their dashboard.
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

// L122: shown when a ?t=&id= edit link is present but invalid/expired/used —
// a clear recovery state instead of a silent fall-through to public/404.
function EditLinkInvalid() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} className="shrink-0" />
            <span className="font-bold text-lg tracking-tight">
              Ava Health
            </span>
          </Link>
          <Link
            href="/upload"
            className="text-sm font-semibold text-[#003D5C] hover:text-[#002A40]"
          >
            Upload yours →
          </Link>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="rounded-3xl border border-slate-200 p-8 md:p-10 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            This edit link didn&apos;t work
          </h1>
          <p className="text-slate-600 mb-2">
            It may have expired or already been used. Your profile is still live.
            This just means this particular link can&apos;t open the editor.
          </p>
          <p className="text-slate-600 mb-6">
            Check your email for the most recent edit link we sent you. If you
            can&apos;t find it, we&apos;ll send a fresh one.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/candidate/login"
              className="px-4 py-2.5 rounded-xl bg-[#003D5C] text-white text-sm font-semibold hover:bg-[#002A40]"
            >
              Get a fresh edit link →
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
  matches,
}: {
  candidate: Candidate
  nonce: string
  matches: CandidateMatch[]
}) {
  return <ProfileEditForm candidate={candidate} nonce={nonce} matches={matches} />
}
