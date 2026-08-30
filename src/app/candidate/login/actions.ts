'use server'

import { FREE_RESUME_POST_UPLOAD_SOURCE } from '@/lib/profile-provenance'
import { createServiceRoleClient } from '@/lib/supabase-service'

export type RequestCandidateOtpResult =
  | { accepted: true }
  | { accepted: false; error: string }

// A valid request always gets the same response. The server sends an OTP and
// permits Auth user creation only after it confirms an active, source-scoped
// FreeResumePost profile. This prevents unrelated shared-database emails from
// creating Auth users and keeps profile existence out of the response.
export async function requestCandidateOtp(
  email: string,
): Promise<RequestCandidateOtpResult> {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (
    cleanEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    return { accepted: false, error: 'Enter a valid email address.' }
  }

  try {
    const sb = createServiceRoleClient()
    const { data: profile, error: profileError } = await sb
      .from('public_candidates')
      .select('id')
      .eq('email', cleanEmail)
      .eq('source', FREE_RESUME_POST_UPLOAD_SOURCE)
      .eq('status', 'active')
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle()

    if (profileError) {
      console.error('candidate OTP profile precheck error:', profileError.message)
      return { accepted: true }
    }

    if (profile) {
      const { error } = await sb.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: true },
      })
      if (error) console.error('candidate OTP send error:', error.message)
    }
  } catch (error) {
    console.error(
      'candidate OTP server error:',
      error instanceof Error ? error.message : 'unknown',
    )
  }

  return { accepted: true }
}
