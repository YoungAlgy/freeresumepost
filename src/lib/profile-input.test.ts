import { describe, expect, it } from 'vitest'
import { normalizeResumeProfile, type ResumeProfileInput } from './profile-input'

const valid: ResumeProfileInput = {
  email: ' Nurse@Example.com ',
  first_name: ' Jane ',
  last_name: ' Doe ',
  phone: '',
  credential: ' RN ',
  specialty: ' ICU ',
  city: ' Tampa ',
  state: 'fl',
  years_experience: 8,
  is_public: false,
}

describe('normalizeResumeProfile', () => {
  it('normalizes fields before they reach the database RPC', () => {
    const result = normalizeResumeProfile(valid)
    expect(result).toEqual({
      ok: true,
      value: {
        ...valid,
        email: 'nurse@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        credential: 'RN',
        specialty: 'ICU',
        city: 'Tampa',
        state: 'FL',
      },
    })
  })

  it.each([
    [{ ...valid, email: 'bad-email' }, 'Please enter a valid email address.'],
    [{ ...valid, first_name: '' }, 'First and last name are required.'],
    [{ ...valid, state: 'ZZ' }, 'Choose a valid U.S. state.'],
    [{ ...valid, years_experience: 61 }, 'Years of experience must be between 0 and 60.'],
    [{ ...valid, years_experience: 1.5 }, 'Years of experience must be between 0 and 60.'],
  ])('rejects malformed server-action input', (input, message) => {
    expect(normalizeResumeProfile(input)).toEqual({ ok: false, error: message })
  })
})
