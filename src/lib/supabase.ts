import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (dev) ' +
    'or in Vercel project settings (prod).'
  )
}

// IMPORTANT (2026-05-28 audit): this fetch revalidate is a FLOOR on how often
// every DB-backed page regenerates — Next uses the LOWEST of (segment
// revalidate, all fetch revalidates). At 300s the ISR pages (home,
// /specialty/[slug]=6h, sitemap=1h) were silently capped to 5-MIN regen on
// every crawl regardless of their own config — a Vercel-invocation cost driver
// (the same bug fixed on freejobpost; this repo was missed). Raised to 3600
// (1h): 12x fewer regens, ≤1h staleness (fine — candidate/profile data changes
// slowly). /profile/[slug] is force-dynamic so it's unaffected either way.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        next: { revalidate: 3600 },
      } as RequestInit)
    },
  },
})

// Hour-truncated "now" for PostgREST time filters. A raw new-Date ISO string
// changes per render, which changes the request URL, which busts the 1h
// fetch cache above on every render — the homepage, /upload, and all 38
// specialty hubs were re-running their full corpus scans every render
// because of it (2026-06 audit, F52/F54/F55). Mirrors freejobpost's helper.
export function hourIso(): string {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  return d.toISOString()
}
