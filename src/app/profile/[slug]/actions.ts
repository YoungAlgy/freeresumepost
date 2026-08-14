'use server'

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type UpdateCandidateInput = {
  candidate_id: string
  nonce: string
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
}

export async function updateCandidate(
  input: UpdateCandidateInput
): Promise<{ success: true } | { success: false; error: string }> {
  // Defense-in-depth validation (mirrors submitCandidate in
  // src/app/upload/actions.ts). The SECURITY DEFINER RPC is the authority,
  // but rejecting a blanked-out name here avoids persisting a junk row.
  // Email isn't part of this input — the edit form renders it disabled and
  // update_public_candidate_rpc never takes a p_email — so there's no email
  // format check to mirror here.
  if (!input.first_name?.trim() || !input.last_name?.trim()) {
    return { success: false, error: 'First and last name are required.' }
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await sb.rpc('update_public_candidate_rpc', {
    p_candidate_id: input.candidate_id,
    p_nonce: input.nonce,
    p_first_name: input.first_name,
    p_last_name: input.last_name,
    p_phone: input.phone || null,
    p_credential: input.credential || null,
    p_specialty: input.specialty || null,
    p_city: input.city || null,
    p_state: input.state || null,
    p_years_experience: input.years_experience,
    p_remote_only: input.remote_only,
    p_contact_via_email: input.contact_via_email,
    p_contact_via_sms: input.contact_via_sms,
    p_is_public: input.is_public,
  })
  if (error) {
    console.error('update_public_candidate_rpc error:', error.message)
    return { success: false, error: 'Unable to save. Please try again.' }
  }
  const r = data as { success: boolean; error?: string }
  if (!r.success) return { success: false, error: r.error || 'Save rejected.' }
  return { success: true }
}
