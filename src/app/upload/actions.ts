'use server'

import { headers } from 'next/headers'
import { verifyTurnstileToken } from '@/lib/turnstile'
import {
  normalizeResumeProfile,
  type ResumeProfileInput,
} from '@/lib/profile-input'
import { FREE_RESUME_POST_UPLOAD_SOURCE } from '@/lib/profile-provenance'
import {
  attachUploadedResumeOrCleanUp,
  validateResumeUpload,
} from '@/lib/resume-upload'
import { createServiceRoleClient } from '@/lib/supabase-service'

export type SubmitCandidateInput = ResumeProfileInput

export type SubmitCandidateResult =
  | {
      success: true
      candidate_id: string
      candidate_slug: string
      nonce: string
      edit_url: string
    }
  | { success: false; error: string }

export async function submitCandidate(
  input: SubmitCandidateInput,
  turnstileToken?: string,
): Promise<SubmitCandidateResult> {
  // The service-role client is created only after the bot check succeeds. The
  // database keeps its legacy anon grant for the rolling window, then a second
  // migration removes that grant after this Worker is stable in production.
  const hdrs = await headers()
  const remoteIp =
    hdrs.get('x-forwarded-for')?.split(',')[0].trim() || hdrs.get('x-real-ip') || null
  const turnstile = await verifyTurnstileToken(turnstileToken, remoteIp)
  if (!turnstile.ok) {
    return { success: false, error: turnstile.reason }
  }
  if (!turnstile.configured || turnstile.action !== 'upload-resume') {
    console.error('resume profile Turnstile was missing or returned the wrong action')
    return {
      success: false,
      error: 'Bot verification is temporarily unavailable. Please try again in a moment.',
    }
  }

  const normalized = normalizeResumeProfile(input)
  if (!normalized.ok) return { success: false, error: normalized.error }
  const profile = normalized.value

  let sb
  try {
    sb = createServiceRoleClient()
  } catch (error) {
    console.error(
      'resume profile server configuration error:',
      error instanceof Error ? error.message : 'unknown',
    )
    return { success: false, error: 'Unable to submit. Please try again.' }
  }

  const { data, error } = await sb.rpc('submit_public_candidate_rpc', {
    p_email: profile.email,
    p_first_name: profile.first_name,
    p_last_name: profile.last_name,
    p_phone: profile.phone || null,
    p_credential: profile.credential || null,
    p_specialty: profile.specialty || null,
    p_city: profile.city || null,
    p_state: profile.state || null,
    p_years_experience: profile.years_experience,
    p_remote_only: false,
    p_contact_via_email: false,
    p_contact_via_sms: false,
    p_is_public: profile.is_public,
    // Create the profile first. A second server action validates, stores, and
    // attaches the reviewed file with this profile's nonce.
    p_resume_url: null,
    p_parsed_profile: {
      extracted_at: new Date().toISOString(),
      source: FREE_RESUME_POST_UPLOAD_SOURCE,
    },
  })

  if (error) {
    if (error.code === '23505' || /duplicate key|already exists/i.test(error.message)) {
      try {
        const { data: isDeleted } = await sb.rpc('check_candidate_email_deleted_rpc', {
          p_email: profile.email,
        })
        if (isDeleted === true) {
          return {
            success: false,
            error: 'That profile was deleted and cannot be restored from this form.',
          }
        }
      } catch {
        // Keep the returning-candidate message below if the optional check fails.
      }
      return {
        success: false,
        error:
          'That email is already connected to a saved profile. Sign in to open it, or contact support if you cannot get in.',
      }
    }
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

  if (!result.candidate_id || !result.candidate_slug || !result.nonce) {
    console.error('submit_public_candidate_rpc returned an incomplete success payload')
    return { success: false, error: 'The profile could not be confirmed. Please try again.' }
  }

  const editUrl = `/profile/${result.candidate_slug}?t=${result.nonce}&id=${result.candidate_id}`
  return {
    success: true,
    candidate_id: result.candidate_id,
    candidate_slug: result.candidate_slug,
    nonce: result.nonce,
    edit_url: editUrl,
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const NONCE_RE = /^[0-9a-f]{64}$/i
const RESUME_STORAGE_PATH_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|docx)$/

export type UploadAndAttachResumeResult =
  | { success: true }
  | { success: false; error: string }

export async function uploadAndAttachResume(
  formData: FormData,
): Promise<UploadAndAttachResumeResult> {
  const candidateIdValue = formData.get('candidate_id')
  const nonceValue = formData.get('nonce')
  const fileValue = formData.get('file')
  const candidateId = typeof candidateIdValue === 'string' ? candidateIdValue : ''
  const nonce = typeof nonceValue === 'string' ? nonceValue : ''

  if (
    !UUID_RE.test(candidateId) ||
    !NONCE_RE.test(nonce) ||
    !(fileValue instanceof File)
  ) {
    return { success: false, error: 'The resume file could not be saved.' }
  }

  let sb
  try {
    sb = createServiceRoleClient()
  } catch (error) {
    console.error(
      'resume upload server configuration error:',
      error instanceof Error ? error.message : 'unknown',
    )
    return { success: false, error: 'The resume file could not be saved.' }
  }

  // Authorize the candidate and seven-day nonce before parsing or storing the
  // file. Server Actions are public POST endpoints, so the edit page alone is
  // not an authorization boundary.
  const { data: authorization, error: authorizationError } = await sb.rpc(
    'consume_candidate_edit_rpc',
    {
      p_candidate_id: candidateId,
      p_nonce: nonce,
    },
  )
  if (
    authorizationError ||
    !(authorization as { success?: boolean } | null)?.success
  ) {
    if (authorizationError) {
      console.error('resume upload authorization error:', authorizationError.message)
    }
    return { success: false, error: 'This edit link is invalid or expired.' }
  }

  const validated = await validateResumeUpload(fileValue)
  if (!validated.ok) return { success: false, error: validated.error }

  const resumePath = `${crypto.randomUUID()}.${validated.value.extension}`
  const { error: uploadError } = await sb.storage.from('resumes').upload(
    resumePath,
    validated.value.bytes,
    {
      contentType: validated.value.contentType,
      upsert: false,
    },
  )
  if (uploadError) {
    console.error('resume storage upload error:', uploadError.message)
    return { success: false, error: 'The resume file could not be saved.' }
  }

  let previousResumePath: string | null = null
  let attachmentError: string | null = null

  try {
    const attached = await attachUploadedResumeOrCleanUp({
      attach: async () => {
        const { data, error } = await sb.rpc('attach_freeresumepost_resume_rpc', {
          p_candidate_id: candidateId,
          p_nonce: nonce,
          p_resume_path: resumePath,
        })
        if (error) {
          console.error('attach_freeresumepost_resume_rpc error:', error.message)
          return false
        }
        const result = data as {
          success?: boolean
          error?: string
          previous_resume_path?: string | null
        } | null
        if (result?.success !== true) {
          attachmentError = result?.error || null
          return false
        }
        previousResumePath = result.previous_resume_path ?? null
        return true
      },
      remove: async () => {
        const { error } = await sb.storage.from('resumes').remove([resumePath])
        if (error) {
          console.error('resume cleanup after failed attach error:', error.message)
        }
      },
    })

    if (!attached) {
      return {
        success: false,
        error: attachmentError || 'The profile saved, but the resume file did not.',
      }
    }

    if (
      previousResumePath &&
      previousResumePath !== resumePath &&
      RESUME_STORAGE_PATH_RE.test(previousResumePath)
    ) {
      const { error: previousRemoveError } = await sb.storage
        .from('resumes')
        .remove([previousResumePath])
      if (previousRemoveError) {
        console.error(
          'resume cleanup after replacement error:',
          previousRemoveError.message,
        )
      }
    }
    return { success: true }
  } catch (error) {
    console.error(
      'resume attach or cleanup threw:',
      error instanceof Error ? error.message : 'unknown',
    )
    return { success: false, error: 'The profile saved, but the resume file did not.' }
  }
}
