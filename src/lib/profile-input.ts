import { US_STATES } from './us-states'

export type ResumeProfileInput = {
  email: string
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

export type NormalizedResumeProfile = ResumeProfileInput

type ValidationResult =
  | { ok: true; value: NormalizedResumeProfile }
  | { ok: false; error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STATE_CODES = new Set<string>(US_STATES)

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeResumeProfile(input: ResumeProfileInput): ValidationResult {
  const email = clean(input?.email).toLowerCase()
  const firstName = clean(input?.first_name)
  const lastName = clean(input?.last_name)
  const phone = clean(input?.phone)
  const credential = clean(input?.credential)
  const specialty = clean(input?.specialty)
  const city = clean(input?.city)
  const state = clean(input?.state).toUpperCase()
  const years = input?.years_experience

  if (!firstName || !lastName) {
    return { ok: false, error: 'First and last name are required.' }
  }
  if (firstName.length > 100 || lastName.length > 100) {
    return { ok: false, error: 'First and last name must be 100 characters or less.' }
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }
  if (phone.length > 30) {
    return { ok: false, error: 'Phone number must be 30 characters or less.' }
  }
  if (credential.length > 20 || specialty.length > 100 || city.length > 100) {
    return { ok: false, error: 'One or more profile fields are too long.' }
  }
  if (state && !STATE_CODES.has(state)) {
    return { ok: false, error: 'Choose a valid U.S. state.' }
  }
  if (
    years !== null &&
    (!Number.isInteger(years) || !Number.isFinite(years) || years < 0 || years > 60)
  ) {
    return { ok: false, error: 'Years of experience must be between 0 and 60.' }
  }

  return {
    ok: true,
    value: {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      credential,
      specialty,
      city,
      state,
      years_experience: years,
      is_public: input?.is_public === true,
    },
  }
}
