import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import ProfileEditForm from './edit-form'

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
      'id, slug, first_name, last_name, credential, specialty, city, state, years_experience, remote_only, contact_via_email, contact_via_sms, is_public, source, created_at'
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const c = await getPublicCandidate(slug)
  if (!c) {
    return { title: 'Profile', robots: { index: false, follow: false } }
  }
  const loc = [c.city, c.state].filter(Boolean).join(', ')
  const title = `${c.first_name} ${c.last_name}${c.credential ? ', ' + c.credential : ''} — ${c.specialty ?? 'Healthcare'}`
  return {
    title,
    description: `${title} profile on freeresumepost.co. ${loc ? 'Based in ' + loc + '. ' : ''}Open to healthcare job opportunities.`,
    alternates: { canonical: `https://www.freeresumepost.co/profile/${slug}` },
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
  }

  const c = await getPublicCandidate(slug)
  if (!c) notFound()

  const loc = [c.city, c.state].filter(Boolean).join(', ')

  const personJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: `${c.first_name} ${c.last_name}`,
    jobTitle: c.specialty || c.credential || 'Healthcare professional',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
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
            <Link
              href="/upload"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Upload yours →
            </Link>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <div className="rounded-3xl border border-slate-200 p-8 md:p-10 shadow-sm">
            <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase mb-3">
              Open to opportunities
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight mb-2">
              {c.first_name} {c.last_name}
              {c.credential && (
                <span className="text-slate-400 font-normal">, {c.credential}</span>
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
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Email contact OK
                </span>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-500">
              Contact this candidate via freejobpost.co — post a matching role
              and they&apos;ll see it in their dashboard.
            </div>
          </div>
        </div>
      </main>
    </>
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
