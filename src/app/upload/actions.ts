'use server'

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type SubmitCandidateInput = {
  email: string
  first_name: string
  last_name: string
  phone: string
  credential: string
  specialty: string
  city: string
  state: string
  years_experience: number | null
  remote_only: boolean
  contact_via_email: boolean
  contact_via_sms: boolean
  is_public: boolean
  // Parsed-profile payload — stored as-is in public_candidates.parsed_profile
  raw_text: string
}

export type SubmitCandidateResult =
  | { success: true; candidate_slug: string; edit_url: string }
  | { success: false; error: string }

export async function submitCandidate(input: SubmitCandidateInput): Promise<SubmitCandidateResult> {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })

  const normalizedEmail = (input.email ?? '').trim().toLowerCase()
  const normalizedState = (input.state ?? '').trim().toUpperCase()

  // Cap parsed_profile payload so we don't balloon the jsonb column
  const rawText = (input.raw_text ?? '').slice(0, 50_000)

  const { data, error } = await sb.rpc('submit_public_candidate_rpc', {
    p_email: normalizedEmail,
    p_first_name: input.first_name,
    p_last_name: input.last_name,
    p_phone: input.phone || null,
    p_credential: input.credential || null,
    p_specialty: input.specialty || null,
    p_city: input.city || null,
    p_state: normalizedState || null,
    p_years_experience: input.years_experience,
    p_remote_only: input.remote_only,
    p_contact_via_email: input.contact_via_email,
    p_contact_via_sms: input.contact_via_sms,
    p_is_public: input.is_public,
    p_resume_url: null, // resume bytes stay client-side in v1
    p_parsed_profile: {
      raw_text: rawText,
      extracted_at: new Date().toISOString(),
      source: 'freeresumepost.upload.v1',
    },
  })

  if (error) {
    console.error('submit_public_candidate_rpc error:', error.message)
    return { success: false, error: 'Unable to submit. Please try again.' }
  }

  const result = data as {
    success: boolean
    error?: string
    code: number
    candidate_id?: string
    candidate_slug?: string
    nonce?: string
  }
  if (!result.success) {
    return { success: false, error: result.error || 'Submission rejected.' }
  }

  const editUrl = `/profile/${result.candidate_slug}?t=${result.nonce}&id=${result.candidate_id}`
  return {
    success: true,
    candidate_slug: result.candidate_slug!,
    edit_url: editUrl,
  }
}
