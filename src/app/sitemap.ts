import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { CANDIDATE_SPECIALTIES } from '@/lib/specialty-slugs'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://www.freeresumepost.co'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/upload`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/specialty`, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/how-it-works`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Specialty hub pages — one per common healthcare specialty so each
  // ranks for "[specialty] resume upload" candidate-intent queries
  const specialtyRoutes: MetadataRoute.Sitemap = CANDIDATE_SPECIALTIES.map((s) => ({
    url: `${base}/specialty/${s.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const { data } = await supabase
    .from('public_candidates')
    .select('slug, updated_at')
    .eq('is_public', true)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(5000)

  const profileRoutes: MetadataRoute.Sitemap = (data ?? []).map(
    (c: { slug: string; updated_at: string }) => ({
      url: `${base}/profile/${c.slug}`,
      lastModified: c.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })
  )

  return [...staticRoutes, ...specialtyRoutes, ...profileRoutes]
}
