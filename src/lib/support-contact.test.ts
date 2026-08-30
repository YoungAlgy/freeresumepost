import { describe, expect, it } from 'vitest'
import { parseFreeResumePostSupportEmail } from './support-contact'

describe('parseFreeResumePostSupportEmail', () => {
  it('accepts only an exact FreeResumePost-owned mailbox', () => {
    expect(parseFreeResumePostSupportEmail(' Support@FreeResumePost.co ')).toBe(
      'support@freeresumepost.co',
    )
  })

  it('fails closed when the mailbox is missing or belongs to another brand', () => {
    expect(parseFreeResumePostSupportEmail(undefined)).toBeNull()
    expect(parseFreeResumePostSupportEmail('')).toBeNull()
    expect(parseFreeResumePostSupportEmail('info@avahealth.co')).toBeNull()
    expect(parseFreeResumePostSupportEmail('support@help.freeresumepost.co')).toBeNull()
    expect(parseFreeResumePostSupportEmail('<support>@freeresumepost.co')).toBeNull()
    expect(parseFreeResumePostSupportEmail('support@freeresumepost.co\r\nBcc:test@example.com')).toBeNull()
  })
})
