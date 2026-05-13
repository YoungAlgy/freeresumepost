import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { CANDIDATE_SPECIALTIES } from '@/lib/specialty-slugs'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://www.freeresumepost.co'

  // Pull candidate profiles once, ordered by updated_at DESC. We use the first
  // row's updated_at as the lastmod signal for routes that aggregate the
  // candidate table.
  //
  // Why not `new Date()`? Google's sitemap docs are explicit: if `lastmod`
  // consistently lies (every URL = "today" on every refresh), Google stops
  // trusting all `lastmod` values from the host. Tying signal to real data.
  const { data } = await supabase
    .from('public_candidates')
    .select('slug, updated_at')
    .eq('is_public', true)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(5000)

  const candidates = (data ?? []) as { slug: string; updated_at: string }[]
  const maxProfileUpdate = candidates[0]?.updated_at
    ? new Date(candidates[0].updated_at)
    : null

  // Truly static routes (upload/how-it-works/terms/privacy) omit `lastModified`
  // because their content rarely changes — emitting a moving timestamp is the
  // lie pattern. Aggregator routes (/, /specialty) carry maxProfileUpdate if
  // we have any candidate data; otherwise lastmod is omitted.
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      ...(maxProfileUpdate ? { lastModified: maxProfileUpdate } : {}),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${base}/specialty`,
      ...(maxProfileUpdate ? { lastModified: maxProfileUpdate } : {}),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    { url: `${base}/upload`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/how-it-works`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Specialty hub pages — one per common healthcare specialty so each
  // ranks for "[specialty] resume upload" candidate-intent queries.
  const specialtyRoutes: MetadataRoute.Sitemap = CANDIDATE_SPECIALTIES.map((s) => ({
    url: `${base}/specialty/${s.slug}`,
    ...(maxProfileUpdate ? { lastModified: maxProfileUpdate } : {}),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const profileRoutes: MetadataRoute.Sitemap = candidates.map((c) => ({
    url: `${base}/profile/${c.slug}`,
    lastModified: c.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...specialtyRoutes, ...profileRoutes]
}
