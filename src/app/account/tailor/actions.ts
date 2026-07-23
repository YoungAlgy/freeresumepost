'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { tailorApplication, type TailorResult } from '@/lib/gemini-tailor'
import {
  readTailorUsageCookie,
  signTailorUsageCookie,
  hasTailorUseRemaining,
  TAILOR_USAGE_COOKIE,
  TAILOR_USAGE_COOKIE_OPTS,
  DAILY_FREE_USES,
} from '@/lib/tailor-entitlement'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type TailorActionResult =
  | { ok: true; result: TailorResult; usesRemainingToday: number }
  | { ok: false; error: string; code: 'unauthenticated' | 'no_candidate' | 'rate_limited' | 'bad_input' | 'tailor_failed' }

// accessToken comes from the browser's active Supabase session
// (supabaseBrowser.auth.getSession()) — a server action has no cookie-based
// session of its own to read, so the client passes its token explicitly.
export async function tailorForCandidate(
  accessToken: string,
  jobDescription: string,
  resumeText: string
): Promise<TailorActionResult> {
  if (!accessToken) return { ok: false, error: 'Please sign in again.', code: 'unauthenticated' }

  const jd = (jobDescription || '').trim()
  const rt = (resumeText || '').trim()
  if (jd.length < 30 || rt.length < 30) {
    return { ok: false, error: 'Add both the job posting and your resume text.', code: 'bad_input' }
  }

  // Scoped client: every call below runs as this specific authenticated
  // candidate (same RLS/security-definer gating as the browser client).
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  const { data: userData, error: userErr } = await sb.auth.getUser(accessToken)
  if (userErr || !userData?.user) {
    return { ok: false, error: 'Your session expired. Please sign in again.', code: 'unauthenticated' }
  }

  const { data: candidateData, error: candidateErr } = await sb.rpc('get_my_candidate')
  if (candidateErr) {
    console.error('get_my_candidate error:', candidateErr.message)
    return { ok: false, error: 'Could not load your profile. Please try again.', code: 'no_candidate' }
  }
  const candidate = (Array.isArray(candidateData) ? candidateData[0] : candidateData) as { id: string } | null
  if (!candidate?.id) {
    return { ok: false, error: 'Upload your resume first, then come back to tailor it.', code: 'no_candidate' }
  }

  const cookieStore = await cookies()
  const usageState = readTailorUsageCookie(cookieStore.get(TAILOR_USAGE_COOKIE)?.value, candidate.id)
  if (!hasTailorUseRemaining(usageState)) {
    return {
      ok: false,
      error: `You've used all ${DAILY_FREE_USES} free tailorings for today. Come back tomorrow for more.`,
      code: 'rate_limited',
    }
  }

  let result: TailorResult
  try {
    result = await tailorApplication({ jobDescription: jd, resumeText: rt })
  } catch (e) {
    console.error('tailorApplication failed:', e instanceof Error ? e.message : 'unknown')
    return { ok: false, error: 'Something went wrong generating your tailored application. Please try again.', code: 'tailor_failed' }
  }

  const newUsesToday = usageState.usesToday + 1
  cookieStore.set(
    TAILOR_USAGE_COOKIE,
    signTailorUsageCookie({ candidateId: candidate.id, usesToday: newUsesToday, day: usageState.day }),
    TAILOR_USAGE_COOKIE_OPTS
  )

  return { ok: true, result, usesRemainingToday: Math.max(0, DAILY_FREE_USES - newUsesToday) }
}
