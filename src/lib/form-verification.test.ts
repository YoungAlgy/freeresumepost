import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { isTurnstileReady, turnstileResultStatus } from './form-verification'

describe('form verification readiness', () => {
  it('keeps local no-config empty success usable', () => {
    expect(isTurnstileReady(false, null)).toBe(true)
    expect(turnstileResultStatus(false, '')).toBe('ready')
  })

  it('rejects empty configured success and accepts a real configured token', () => {
    expect(isTurnstileReady(true, null)).toBe(false)
    expect(turnstileResultStatus(true, '')).toBe('failed')
    expect(turnstileResultStatus(true, 'verified')).toBe('ready')
  })

  it('wires configured readiness and retry without clearing the resume fields', async () => {
    const source = await readFile(new URL('../app/upload/upload-form.tsx', import.meta.url), 'utf8')
    const retry = source.slice(source.indexOf('function retryTurnstile'), source.indexOf('function onSubmit'))
    expect(source).toContain('isTurnstileReady(turnstileConfigured, turnstileToken)')
    expect(retry).toContain('setTurnstileToken(null)')
    expect(retry).toContain('setTurnstileKey')
    expect(retry).not.toContain('setForm')
  })
})
