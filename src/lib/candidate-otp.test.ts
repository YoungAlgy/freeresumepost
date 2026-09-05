import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { verifyCandidateOtp } from './candidate-otp'

const params = {
  email: 'nurse@example.com',
  token: '123456',
  type: 'email' as const,
}

describe('verifyCandidateOtp', () => {
  it('returns success only when the verifier succeeds', async () => {
    const verify = vi.fn(async () => ({ error: null }))

    await expect(verifyCandidateOtp(verify, params)).resolves.toEqual({ ok: true })
    expect(verify).toHaveBeenCalledWith(params)
  })

  it('turns returned auth errors into useful candidate copy', async () => {
    await expect(
      verifyCandidateOtp(
        async () => ({ error: { message: 'Token has expired' } }),
        params,
      ),
    ).resolves.toEqual({
      ok: false,
      error:
        'That code is incorrect or expired. Double-check your email for the latest one, or resend.',
    })
  })

  it('recovers from a thrown verifier error without exposing it', async () => {
    await expect(
      verifyCandidateOtp(async () => {
        throw new Error('browser storage unavailable')
      }, params),
    ).resolves.toEqual({
      ok: false,
      error: 'Something went wrong signing you in. Please try again in a moment.',
    })
  })

  it.each([
    undefined,
    { message: { detail: 'malformed' } },
    { detail: 'missing message' },
  ])('requires the explicit Supabase null acknowledgment: %j', async (error) => {
    await expect(verifyCandidateOtp(async () => ({ error }), params)).resolves.toEqual({
      ok: false,
      error: 'Something went wrong signing you in. Please try again in a moment.',
    })
  })

  it('keeps the email and step controls locked while an OTP request is pending', () => {
    const form = readFileSync(
      resolve(process.cwd(), 'src/app/candidate/login/OtpLoginForm.tsx'),
      'utf8',
    ).replace(/\r\n/g, '\n')
    const emailInput = form.slice(
      form.indexOf('<input\n          type="email"'),
      form.indexOf('/>', form.indexOf('<input\n          type="email"')),
    )

    expect(emailInput).toContain('disabled={loading}')
    expect(form).toMatch(
      /disabled=\{loading\}[\s\S]*?onClick=\{\(\) => \{[\s\S]*?if \(requestPendingRef.current \|\| loading\) return[\s\S]*?setStep\('email'\)/,
    )
  })
})
