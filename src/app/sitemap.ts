import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://freeresumepost.co'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/upload`, changeFrequency: 'weekly', priority: 0.9 },
  ]

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

  return [...staticRoutes, ...profileRoutes]
}
