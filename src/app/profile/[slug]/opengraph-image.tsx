// Per-profile OG image. Pulls the same public fields the page metadata
// already exposes (name + credential + specialty + city/state) and
// composes them into a 1200×630 social card. Same fields, same surface
// area — no new PII is exposed by this route.
//
// Only `is_public=true && status=active` rows render a real card; bad
// slugs or private candidates fall through to a generic site banner.

import { ImageResponse } from 'next/og'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'
export const alt = 'Healthcare candidate on freeresumepost.co'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
// 2026-05-28 cost audit: cache the generated card for 7 days. Profile OG
// content is static per candidate (name/credential/specialty/location
// baked in once), so repeat unfurls + crawler og:image fetches serve from
// cache instead of re-querying public_candidates + re-rendering the PNG.
// Mirrors the freejobpost per-job OG fix. Self-heals on edit/unpublish.
export const revalidate = 604800

const BRAND = '#003D5C'
const ACCENT = '#7FBC00'
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/

type PublicProfile = {
  first_name: string
  last_initial: string | null
  credential: string | null
  specialty: string | null
  city: string | null
  state: string | null
  years_experience: number | null
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
      .from('public_candidates')
      // last_initial (public-safe generated col), NOT last_name — keep the full
      // last name off every anon read path (privacy promise).
      .select('first_name, last_initial, credential, specialty, city, state, years_experience')
      .eq('slug', slug)
      .eq('is_public', true)
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle()

    if (data) {
      const c = data as PublicProfile
      name = `${c.first_name} ${c.last_initial ?? ''}.`.trim() || name
      credential = c.credential || ''
      specialty = c.specialty || ''
      location = [c.city, c.state].filter(Boolean).join(', ')
      years = c.years_experience ? `${c.years_experience}+ yrs experience` : ''
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
          background: `linear-gradient(135deg, ${BRAND} 0%, #002a40 100%)`,
          padding: 80,
          color: 'white',
          fontFamily: '"Inter", system-ui, sans-serif',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, paddingBottom: 20, borderBottom: `4px solid ${ACCENT}`, marginBottom: 56 }}>
          <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>freeresumepost</span>
          <span style={{ fontSize: 26, fontWeight: 400, opacity: 0.7 }}>.co</span>
        </div>

        <div style={{ display: 'flex', alignSelf: 'flex-start', background: ACCENT, color: BRAND, padding: '8px 18px', borderRadius: 999, fontSize: 22, fontWeight: 700, marginBottom: 36, textTransform: 'uppercase', letterSpacing: 1 }}>
          Open to opportunities
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
          <span>Free healthcare candidate directory</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
