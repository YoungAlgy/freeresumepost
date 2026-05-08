import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { verifyTurnstileToken } from './turnstile'

// Mirror of freejobpost/src/lib/turnstile.test.ts. turnstile.ts is byte-
// identical between the two repos; this test file pins the same paths so
// silent drift between sites is caught.

const ORIGINAL_FETCH = globalThis.fetch
const ORIGINAL_SECRET = process.env.TURNSTILE_SECRET_KEY

beforeEach(() => {
  process.env.TURNSTILE_SECRET_KEY = 'test-secret-not-real'
})

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH
  if (ORIGINAL_SECRET == null) {
    delete process.env.TURNSTILE_SECRET_KEY
  } else {
    process.env.TURNSTILE_SECRET_KEY = ORIGINAL_SECRET
  }
  vi.restoreAllMocks()
})

describe('verifyTurnstileToken — fail-open posture', () => {
  it('returns ok:true configured:false when secret is unset', async () => {
    delete process.env.TURNSTILE_SECRET_KEY
    const result = await verifyTurnstileToken('any-token')
    expect(result).toEqual({ ok: true, configured: false })
  })

  it('does not call Cloudflare when fail-open path triggers', async () => {
    delete process.env.TURNSTILE_SECRET_KEY
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    await verifyTurnstileToken('some-token')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('verifyTurnstileToken — input validation', () => {
  it('rejects null/undefined/empty/short tokens without calling Cloudflare', async () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    expect((await verifyTurnstileToken(null)).ok).toBe(false)
    expect((await verifyTurnstileToken(undefined)).ok).toBe(false)
    expect((await verifyTurnstileToken('')).ok).toBe(false)
    expect((await verifyTurnstileToken('short')).ok).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejection surfaces missing-input-response error code', async () => {
    const r = await verifyTurnstileToken(null)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errorCodes).toContain('missing-input-response')
  })
})

describe('verifyTurnstileToken — Cloudflare success path', () => {
  it('returns ok:true with hostname + action on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        hostname: 'www.freeresumepost.co',
        action: 'upload-resume',
      }),
    } as Response)
    const r = await verifyTurnstileToken('a'.repeat(50))
    expect(r).toEqual({
      ok: true,
      configured: true,
      hostname: 'www.freeresumepost.co',
      action: 'upload-resume',
    })
  })
})

describe('verifyTurnstileToken — Cloudflare failure paths', () => {
  it('returns user-friendly reason for timeout-or-duplicate', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: false, 'error-codes': ['timeout-or-duplicate'] }),
    } as Response)
    const r = await verifyTurnstileToken('a'.repeat(50))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/expired|already used/i)
  })

  it('returns server-misconfig reason for invalid-input-secret', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-secret'] }),
    } as Response)
    const r = await verifyTurnstileToken('a'.repeat(50))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/server.*misconfig/i)
  })
})

describe('verifyTurnstileToken — fail-open on infra failure', () => {
  it('returns ok:true on fetch network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNRESET'))
    const r = await verifyTurnstileToken('a'.repeat(50))
    expect(r.ok).toBe(true)
  })

  it('returns ok:true on 5xx HTTP response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as Response)
    const r = await verifyTurnstileToken('a'.repeat(50))
    expect(r.ok).toBe(true)
  })
})
