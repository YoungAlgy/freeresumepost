import { describe, expect, it } from 'vitest'
import {
  FREE_RESUME_POST_UPLOAD_SOURCE,
  isPublishableFreeResumePostProfile,
} from './profile-provenance'

const directPublicProfile = {
  source: FREE_RESUME_POST_UPLOAD_SOURCE,
  is_public: true,
  status: 'active',
  deleted_at: null,
}

describe('FreeResumePost public profile boundary', () => {
  it('allows an active, public, direct self-upload', () => {
    expect(isPublishableFreeResumePostProfile(directPublicProfile)).toBe(true)
  })

  it.each([
    { ...directPublicProfile, source: 'avahealth_crm_cross_site' },
    { ...directPublicProfile, is_public: false },
    { ...directPublicProfile, status: 'inactive' },
    { ...directPublicProfile, deleted_at: '2026-08-28T00:00:00Z' },
  ])('rejects a profile outside the direct public boundary', (profile) => {
    expect(isPublishableFreeResumePostProfile(profile)).toBe(false)
  })
})
