'use server'

import { createClient } from '@supabase/supabase-js'
import { US_STATES } from '@/lib/us-states'

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
  is_public: boolean
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const NONCE_RE = /^[0-9a-f]{64}$/i
const STATE_CODES = new Set<string>(US_STATES)

export async function updateCandidate(
  input: UpdateCandidateInput
): Promise<{ success: true } | { success: false; error: string }> {
  // Defense-in-depth validation (mirrors submitCandidate in
  // src/app/upload/actions.ts). The SECURITY DEFINER RPC is the authority,
  // but rejecting a blanked-out name here avoids persisting a junk row.
  // Email isn't part of this input — the edit form renders it disabled and
  // update_public_candidate_rpc never takes a p_email — so there's no email
  // format check to mirror here.
  const firstName = input.first_name?.trim()
  const lastName = input.last_name?.trim()
  const phone = input.phone?.trim() || ''
  const credential = input.credential?.trim() || ''
  const specialty = input.specialty?.trim() || ''
  const city = input.city?.trim() || ''
  const state = input.state?.trim().toUpperCase() || ''
  const years = input.years_experience

  if (!UUID_RE.test(input.candidate_id) || !NONCE_RE.test(input.nonce)) {
    return { success: false, error: 'This edit link is invalid or expired.' }
  }
  if (!firstName || !lastName) {
    return { success: false, error: 'First and last name are required.' }
  }
  if (firstName.length > 100 || lastName.length > 100) {
    return { success: false, error: 'First and last name must be 100 characters or less.' }
  }
  if (phone.length > 30 || credential.length > 20 || specialty.length > 100 || city.length > 100) {
    return { success: false, error: 'One or more profile fields are too long.' }
  }
  if (state && !STATE_CODES.has(state)) {
    return { success: false, error: 'Choose a valid U.S. state.' }
  }
  if (years !== null && (!Number.isInteger(years) || years < 0 || years > 60)) {
    return { success: false, error: 'Years of experience must be between 0 and 60.' }
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await sb.rpc('update_public_candidate_rpc', {
    p_candidate_id: input.candidate_id,
    p_nonce: input.nonce,
    p_first_name: firstName,
    p_last_name: lastName,
    p_phone: phone || null,
    p_credential: credential || null,
    p_specialty: specialty || null,
    p_city: city || null,
    p_state: state || null,
    p_years_experience: years,
    p_remote_only: false,
    p_contact_via_email: false,
    p_contact_via_sms: false,
    p_is_public: input.is_public === true,
  })
  if (error) {
    console.error('update_public_candidate_rpc error:', error.message)
    return { success: false, error: 'Unable to save. Please try again.' }
  }
  const r = data as { success: boolean; error?: string }
  if (!r.success) return { success: false, error: r.error || 'Save rejected.' }
  return { success: true }
}
