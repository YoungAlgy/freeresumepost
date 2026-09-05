import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isFreeResumeStoragePath,
  resolveResumeUrl,
  validateSignedResumeUrl,
} from './resume-url'

const storagePath = 'd2616a4a-1234-4abc-8def-1234567890ab.pdf'
const supabaseUrl = 'https://project.supabase.co'
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

describe('FreeResumePost resume URL boundary', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalSupabaseUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl
    if (originalSupabaseAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseAnonKey
  })

  it('accepts only a root UUID PDF or DOCX storage path', () => {
    expect(isFreeResumeStoragePath(storagePath)).toBe(true)
    expect(isFreeResumeStoragePath(storagePath.replace('.pdf', '.docx'))).toBe(true)

    for (const value of [
      'https://files.example/resume.pdf',
      'folder/' + storagePath,
      '../' + storagePath,
      'resume.pdf',
      storagePath.replace('.pdf', '.txt'),
    ]) {
      expect(isFreeResumeStoragePath(value)).toBe(false)
    }
  })

  it('accepts a signed URL only from the configured Supabase resume bucket path', () => {
    const valid = `${supabaseUrl}/storage/v1/object/sign/resumes/${storagePath}?token=secret`
    expect(validateSignedResumeUrl(valid, supabaseUrl, storagePath)).toBe(valid)

    for (const value of [
      `http://project.supabase.co/storage/v1/object/sign/resumes/${storagePath}?token=secret`,
      `https://project.supabase.co@evil.test/storage/v1/object/sign/resumes/${storagePath}?token=secret`,
      `https://evil.test/storage/v1/object/sign/resumes/${storagePath}?token=secret`,
      `${supabaseUrl}/storage/v1/object/public/resumes/${storagePath}`,
      `${supabaseUrl}/storage/v1/object/sign/resumes/other.pdf?token=secret`,
      `${supabaseUrl}/storage/v1/object/sign/resumes/${storagePath}`,
      `${supabaseUrl}/storage/v1/object/sign/resumes/${storagePath}?token=`,
      `${supabaseUrl}/storage/v1/object/sign/resumes/${storagePath}?token=one&token=two`,
    ]) {
      expect(validateSignedResumeUrl(value, supabaseUrl, storagePath)).toBeNull()
    }
    expect(
      validateSignedResumeUrl(
        `${supabaseUrl}/storage/v1/object/sign/resumes/resume.pdf?token=secret`,
        supabaseUrl,
        'resume.pdf',
      ),
    ).toBeNull()
  })

  it('rejects an absolute stored URL before any network call', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      resolveResumeUrl('access-token', 'https://files.example/resume.pdf'),
    ).rejects.toThrow('stored resume path is invalid')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an unexpected URL returned by the Edge function', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      success: true,
      url: `https://evil.test/${storagePath}`,
    }), { status: 200 })))

    await expect(resolveResumeUrl('access-token', storagePath)).rejects.toThrow(
      'resume service returned an invalid link',
    )
  })

  it('returns a validated signed URL from the configured Edge function', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    const signedUrl = `${supabaseUrl}/storage/v1/object/sign/resumes/${storagePath}?token=signed-token`
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      success: true,
      url: signedUrl,
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveResumeUrl('access-token', storagePath)).resolves.toBe(signedUrl)
    expect(fetchMock).toHaveBeenCalledWith(
      `${supabaseUrl}/functions/v1/get-resume-url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: 'anon-key',
          Authorization: 'Bearer access-token',
        },
      },
    )
  })

  it('passes optional cancellation through to the private URL read', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    const controller = new AbortController()
    const fetchMock = vi.fn((_url: string, options: RequestInit) => new Promise<Response>((_, reject) => {
      options.signal?.addEventListener('abort', () => reject(new Error('cancelled')), { once: true })
    }))
    vi.stubGlobal('fetch', fetchMock)
    const request = resolveResumeUrl('access-token', storagePath, controller.signal)
    const failed = expect(request).rejects.toThrow('cancelled')
    controller.abort()
    await failed
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal)
  })
})
