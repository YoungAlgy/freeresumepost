import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { CANDIDATE_SPECIALTIES } from '@/lib/specialty-slugs'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://www.freeresumepost.co'
  // Use the sitemap's own revalidate boundary as the lastModified marker
  // for static + hub routes. With revalidate=3600 the marker is accurate to
  // within an hour, which is fine for crawlers that already poll daily.
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/upload`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/specialty`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/how-it-works`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Specialty hub pages — one per common healthcare specialty so each
  // ranks for "[specialty] resume upload" candidate-intent queries
  const specialtyRoutes: MetadataRoute.Sitemap = CANDIDATE_SPECIALTIES.map((s) => ({
    url: `${base}/specialty/${s.slug}`,
    lastModified: now,
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
