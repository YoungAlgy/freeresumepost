import type { MetadataRoute } from 'next'
import { unstable_cache } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { CANDIDATE_SPECIALTIES } from '@/lib/specialty-slugs'
import { CHANGELOG_ENTRIES } from '@/lib/changelog-entries'

export const revalidate = 21600

// 2026-07-09 build fix: generate the sitemap on-demand, not at build time. A
// route with only `revalidate` set still gets prerendered ONCE during the build,
// and this route's public_candidates fetch reliably exceeded Next's 60s
// build-time fetch timeout (failed all 3 retries and aborted the deploy) even
// after the specialty/homepage build-time DB load was removed. It is a
// build-environment pathology, not an inherent query cost: at request time this
// same query returns in ~0.3s (verified via `next start`). force-dynamic moves
// generation to request time; the supabase client's 1h fetch cache
// (src/lib/supabase.ts) keeps it cached between crawls. Output is unchanged.
export const dynamic = 'force-dynamic'

// Drop thin profiles (no specialty AND no credential): profile/[slug]
// noindexes them, so advertising them in the sitemap would trip GSC's
// "Submitted URL marked noindex" + waste crawl budget. The page stays
// crawlable; it just isn't listed until it's filled in. Mirrors the page's
// own thin gate. 2026-05-28 audit (P3-1).
type ProfileRow = {
  slug: string
  updated_at: string
  specialty: string | null
  credential: string | null
}

// 🔴 2026-07-23 INCIDENT FIX (same root cause as freejobpost's sitemap.ts —
// see that file's incident note): force-dynamic disables the Data Cache, so
// this batched profile fetch ran on every crawl hit, uncached. Fine on the
// old Micro-compute Postgres; started failing once the shared DB moved to
// Nano compute. Wrapped in Next's data cache: one full scan per 6h globally.
async function _fetchSitemapCandidatesUncached(): Promise<ProfileRow[]> {
  // Count active public profiles, then fetch exactly ceil(count/1000) batches.
  // PostgREST's anon role silently caps a single .limit(>1000) at 1,000
  // (db_max_rows) — so the prior bare .limit(5000) would silently drop profile
  // URLs from the sitemap once public-candidate inventory passed 1,000
  // (deindex risk on exactly the indexed-profile surface this site is built
  // on — the same failure mode freejobpost's batched sitemap fixes). Count-
  // based paging (vs freejob's fixed 30-batch fan-out) fits the candidate
  // table: it's small and grows slower than jobs, so a fixed fan-out would
  // fire ~30 mostly-empty queries at the shared DB on every regen. 2026-05-28
  // cross-app drift fix.
  const PROFILE_PAGE = 1000
  const { count: publicCount } = await supabase
    .from('public_candidates')
    .select('slug', { count: 'exact', head: true })
    .eq('is_public', true)
    .eq('status', 'active')
    .is('deleted_at', null)
  const numProfileBatches = Math.max(1, Math.ceil((publicCount ?? 0) / PROFILE_PAGE))
  const profileBatches = await Promise.all(
    Array.from({ length: numProfileBatches }, (_, i) =>
      supabase
        .from('public_candidates')
        .select('slug, updated_at, specialty, credential')
        .eq('is_public', true)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .order('id', { ascending: false }) // unique tiebreaker → stable .range() windows as the table grows
        .range(i * PROFILE_PAGE, (i + 1) * PROFILE_PAGE - 1)
    )
  )
  return profileBatches
    .flatMap((b) => (b.data ?? []) as ProfileRow[])
    .filter((c) => (c.specialty ?? '').trim() || (c.credential ?? '').trim())
}

const _cachedSitemapCandidates = unstable_cache(
  _fetchSitemapCandidatesUncached,
  ['sitemap-candidates-v1'],
  { revalidate: 21600 },
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://www.freeresumepost.co'

  // Pull candidate profiles once, ordered by updated_at DESC. We use the first
  // row's updated_at as the lastmod signal for routes that aggregate the
  // candidate table.
  //
  // Why not `new Date()`? Google's sitemap docs are explicit: if `lastmod`
  // consistently lies (every URL = "today" on every refresh), Google stops
  // trusting all `lastmod` values from the host. Tying signal to real data.
  const candidates = await _cachedSitemapCandidates()
  const newestCandidate = candidates[0]?.updated_at
    ? new Date(candidates[0].updated_at)
    : null

  // Changelog ship date — when we ship a user-visible feature to the site we
  // prepend an entry. Aggregator pages (/, /specialty) legitimately reflect
  // those ships even if no new candidate signed up that day. Use the newest of
  // (most-recent profile update, most-recent changelog ship) so the signal
  // tracks both data freshness AND site freshness without lying about either.
  const newestChangelog = CHANGELOG_ENTRIES.length > 0
    ? new Date(CHANGELOG_ENTRIES[0].date + 'T12:00:00Z')
    : null

  const aggregatorLastMod = [newestCandidate, newestChangelog]
    .filter((d): d is Date => d instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null

  const maxProfileUpdate = aggregatorLastMod

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
    { url: `${base}/changelog`, changeFrequency: 'weekly', priority: 0.4 },
    { url: `${base}/changelog/feed.xml`, changeFrequency: 'weekly', priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    // Federal-compliance disclosure page. Low priority (regulatory, not
    // commercial) but must be crawler-discoverable for E-Verify trust signal.
    { url: `${base}/e-verify`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Specialty hub pages — one per common healthcare specialty so each
  // ranks for "[specialty] resume upload" candidate-intent queries.
  const specialtyRoutes: MetadataRoute.Sitemap = CANDIDATE_SPECIALTIES.map((s) => ({
    url: `${base}/specialty/${s.slug}`,
    ...(maxProfileUpdate ? { lastModified: maxProfileUpdate } : {}),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // 2026-06-02: per-candidate /profile/[slug] URLs are intentionally NOT listed.
  // Public candidate profiles are being pulled out of the public index (the
  // candidate directory is a monetizable asset, not free indexed content — see
  // /profile/[slug], now noindex'd) while the gated/paid-access model is
  // designed. Listing them here would trip GSC "Submitted URL marked noindex".
  // The `candidates` fetch above is retained only for the honest aggregator
  // lastmod signal. Re-add ...profileRoutes if the access model reopens them.
  return [...staticRoutes, ...specialtyRoutes]
}
