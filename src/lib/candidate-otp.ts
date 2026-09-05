export type CandidateOtpParams = {
  email: string
  token: string
  type: 'email'
}

type CandidateOtpResponse = {
  error: unknown
}

export type CandidateOtpResult =
  | { ok: true }
  | { ok: false; error: string }

export function friendlyCandidateOtpError(raw: string): string {
  if (/rate limit|too many requests/i.test(raw)) {
    return 'Too many attempts. Wait a minute and try again.'
  }
  if (/token|code/i.test(raw) && /invalid|expired/i.test(raw)) {
    return "That code is incorrect or expired. Double-check your email for the latest one, or resend."
  }
  return 'Something went wrong signing you in. Please try again in a moment.'
}

export async function verifyCandidateOtp(
  verify: (params: CandidateOtpParams) => PromiseLike<CandidateOtpResponse>,
  params: CandidateOtpParams,
): Promise<CandidateOtpResult> {
  try {
    const { error } = await verify(params)
    if (error === null) return { ok: true }
    if (typeof error === 'object' && error !== null &&
      'message' in error && typeof error.message === 'string') {
      return { ok: false, error: friendlyCandidateOtpError(error.message) }
    }
    return {
      ok: false,
      error: 'Something went wrong signing you in. Please try again in a moment.',
    }
  } catch {
    return {
      ok: false,
      error: 'Something went wrong signing you in. Please try again in a moment.',
    }
  }
}
