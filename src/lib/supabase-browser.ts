'use client'

import { createClient } from '@supabase/supabase-js'

// Browser Supabase client WITH session persistence — used only for candidate
// OTP sign-in (/candidate/login) and the authed /account area.
//
// This is deliberately separate from the server `supabase` client in
// lib/supabase.ts (persistSession:false, used for ISR/data fetching). Keeping
// candidate auth state in its own client means a signed-in candidate's session
// never bleeds into the cached server reads that render the public directory.
//
// Same shared Supabase project + email-OTP setup the recruiter CRM uses, so a
// 6-digit code is delivered with no extra email config. Sign-in is per-site
// (no cross-domain SSO) — the session lives in this origin's localStorage.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabaseBrowser = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})
