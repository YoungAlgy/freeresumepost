'use server'

import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { track } from '@/lib/track'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type JobAlertInput = {
  email: string
  specialty: string | null
  state: string | null
  city: string | null
  source: string
}

export type JobAlertResult =
  | { success: true; already_subscribed?: boolean }
  | { success: false; error: string }

/**
 * Candidate-side job-alert subscribe (freeresumepost). Writes the same
 * re-contactable lead into the shared Ava CRM as freejobpost, via the
 * `subscribe_job_alert_rpc` SECURITY DEFINER RPC. Mirrors the freejobpost
 * action: Turnstile (fail-open when unconfigured), email validation, PII-free
 * conversion event. Fulfillment (the matching-jobs digest email) runs off the
 * shared public_job_alert_subscribers table via freejobpost's job-alert-digest
 * cron on Resend. Unsubscribe is handled centrally on freejobpost.co/unsubscribe
 * (shared token).
 */
export async function subscribeJobAlert(
  input: JobAlertInput,
  turnstileToken?: string,
): Promise<JobAlertResult> {
  const hdrs = await headers()
  const remoteIp =
    hdrs.get('x-forwarded-for')?.split(',')[0].trim() || hdrs.get('x-real-ip') || null
  const turnstile = await verifyTurnstileToken(turnstileToken, remoteIp)
  if (!turnstile.ok) {
    return { success: false, error: turnstile.reason }
  }

  const email = (input.email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })

  const { data, error } = await sb.rpc('subscribe_job_alert_rpc', {
    p_email: email,
    p_specialty: input.specialty?.trim() || null,
    p_state: input.state?.trim().toUpperCase() || null,
    p_city: input.city?.trim() || null,
    p_source: input.source?.trim() || null,
  })

  if (error) {
    console.error('subscribe_job_alert_rpc error:', error.message)
    return { success: false, error: 'Unable to subscribe right now. Please try again.' }
  }

  const r = (data ?? {}) as { success?: boolean; error?: string; already_subscribed?: boolean }
  if (r.success === false) {
    return { success: false, error: r.error || 'Unable to subscribe.' }
  }

  try {
    await track('job_alert_subscribed', {
      source: input.source || 'unknown',
      specialty: input.specialty || 'any',
      state: input.state || 'any',
    })
  } catch {
    /* analytics is best-effort */
  }

  return { success: true, already_subscribed: r.already_subscribed }
}
