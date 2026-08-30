// Per-profile OG image. Pulls the same public fields the page metadata
// already exposes (name + credential + specialty + city/state) and
// composes them into a 1200×630 social card. Same fields, same surface
// area — no new PII is exposed by this route.
//
// Only `is_public=true && status=active` rows render a real card; bad
// slugs or private candidates fall through to a generic site banner.

import { ImageResponse } from 'next/og'
import { supabase } from '@/lib/supabase'
import {
  FREE_RESUME_POST_UPLOAD_SOURCE,
  isPublishableFreeResumePostProfile,
} from '@/lib/profile-provenance'

// No explicit edge runtime (2026-08-13 fix) -- see src/app/opengraph-image.tsx
// for why: it broke next/og's font loading under this OpenNext/Cloudflare
// deploy (confirmed live 500 on every request). Matches freejobpost's
// per-job OG route, which has never declared one.
export const alt = 'Healthcare resume profile on FreeResumePost'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
// Profile owners can edit or unpublish at any time. Keep social cards cached
// for one hour so repeat unfurls stay cheap without showing week-old details.
export const revalidate = 3600

const BRAND = '#4338CA'
const ACCENT = '#2DD4BF'
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/

type PublicProfile = {
  first_name: string
  last_initial: string | null
  credential: string | null
  specialty: string | null
  city: string | null
  state: string | null
  years_experience: number | null
  source: string | null
  is_public: boolean
  status: string | null
  deleted_at: string | null
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let name = 'Healthcare professional'
  let specialty = ''
  let location = ''
  let years = ''
  let credential = ''

  if (SLUG_RE.test(slug)) {
    const { data } = await supabase
      // public_candidates_directory (2026-08-13): anon has no grant on the base
      // table. last_initial (public-safe generated col), NOT last_name — keep
      // the full last name off every anon read path (privacy promise).
      .from('public_candidates_directory')
      .select('first_name, last_initial, credential, specialty, city, state, years_experience, source, is_public, status, deleted_at')
      .eq('slug', slug)
      .eq('source', FREE_RESUME_POST_UPLOAD_SOURCE)
      .eq('is_public', true)
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle()

    if (data && isPublishableFreeResumePostProfile(data)) {
      const c = data as PublicProfile
      const initial = c.last_initial?.trim()
      name = `${c.first_name}${initial ? ` ${initial}.` : ''}`.trim() || name
      credential = c.credential || ''
      specialty = c.specialty || ''
      location = [c.city, c.state].filter(Boolean).join(', ')
      years =
        c.years_experience !== null
          ? `${c.years_experience}+ yrs experience`
          : ''
    }
  }

  const subline = [specialty, location].filter(Boolean).join(' · ')

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${BRAND} 0%, #312E81 100%)`,
          padding: 80,
          color: 'white',
          fontFamily: '"Inter", system-ui, sans-serif',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, paddingBottom: 20, borderBottom: `4px solid ${ACCENT}`, marginBottom: 56 }}>
          <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>FreeResumePost</span>
        </div>

        <div style={{ display: 'flex', alignSelf: 'flex-start', background: ACCENT, color: BRAND, padding: '8px 18px', borderRadius: 999, fontSize: 22, fontWeight: 700, marginBottom: 36, textTransform: 'uppercase', letterSpacing: 1 }}>
          Shared healthcare profile
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1, maxHeight: 220, overflow: 'hidden' }}>
          <span>{name}</span>
          {credential ? (
            <span style={{ fontSize: 44, fontWeight: 600, opacity: 0.8 }}>{credential}</span>
          ) : null}
        </div>

        {subline ? (
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 500, marginTop: 18, opacity: 0.95 }}>
            {subline}
          </div>
        ) : null}

        {years ? (
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 400, marginTop: 10, opacity: 0.8 }}>
            {years}
          </div>
        ) : null}

        <div style={{ position: 'absolute', bottom: 80, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 22, opacity: 0.85 }}>
          <span>freeresumepost.co</span>
          <span>Shared healthcare resume profile</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
