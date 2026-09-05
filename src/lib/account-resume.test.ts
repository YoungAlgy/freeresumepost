import { afterEach, describe, expect, it, vi } from 'vitest'
import { startResumeOpen, RESUME_OPEN_TIMEOUT_MS } from './account-resume'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

const sessionResult = { session: { access_token: 'fixture-token' }, error: null }
const signedUrl = 'https://fixture.invalid/private-resume'
const dependencies = () => ({
  getSession: vi.fn(async () => sessionResult),
  getUrl: vi.fn<(token: string, signal: AbortSignal) => Promise<string>>(async () => signedUrl),
})

afterEach(() => vi.useRealTimers())

describe('private resume opening', () => {
  it('returns a signed destination after one session read and one URL read', async () => {
    vi.useFakeTimers()
    const deps = dependencies()
    await expect(startResumeOpen(deps).promise).resolves.toEqual({ kind: 'ready', url: signedUrl })
    expect(deps.getSession).toHaveBeenCalledOnce()
    expect(deps.getUrl).toHaveBeenCalledOnce()
    expect(deps.getUrl).toHaveBeenCalledWith('fixture-token', expect.any(AbortSignal))
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps a missing session separate from a failed session check', async () => {
    const deps = dependencies()
    await expect(startResumeOpen({ ...deps, getSession: async () => ({ session: null, error: null }) }).promise)
      .resolves.toEqual({ kind: 'no-session' })
    await expect(startResumeOpen({ ...deps, getSession: async () => ({ session: null, error: { message: 'offline' } }) }).promise)
      .rejects.toThrow('Could not check your session')
    expect(deps.getUrl).not.toHaveBeenCalled()
  })

  it('does not resolve a file after an errored session response even if it includes a session', async () => {
    const deps = dependencies()
    await expect(startResumeOpen({ ...deps, getSession: async () => ({ ...sessionResult, error: { message: 'stale' } }) }).promise)
      .rejects.toThrow('Could not check your session')
    expect(deps.getUrl).not.toHaveBeenCalled()
  })

  it.each([undefined, false, 0, ''])('rejects malformed session error acknowledgement %j', async (error) => {
    const deps = dependencies()
    await expect(startResumeOpen({
      ...deps,
      getSession: async () => ({ session: sessionResult.session, error } as never),
    }).promise).rejects.toThrow('Could not check your session')
    expect(deps.getUrl).not.toHaveBeenCalled()
  })

  it('rejects a missing session error acknowledgement before opening a file', async () => {
    const deps = dependencies()
    await expect(startResumeOpen({
      ...deps,
      getSession: async () => ({ session: sessionResult.session } as never),
    }).promise).rejects.toThrow('Could not check your session')
    expect(deps.getUrl).not.toHaveBeenCalled()
  })

  it.each(['session', 'url'] as const)('releases a stalled %s read and rejects late completion', async (stage) => {
    vi.useFakeTimers()
    const session = deferred<typeof sessionResult>()
    const url = deferred<string>()
    const deps = dependencies()
    if (stage === 'session') deps.getSession.mockImplementation(() => session.promise)
    else deps.getUrl.mockImplementation(() => url.promise)
    const request = startResumeOpen(deps)
    const failed = expect(request.promise).rejects.toThrow('timed out')
    await vi.advanceTimersByTimeAsync(RESUME_OPEN_TIMEOUT_MS)
    await failed
    session.resolve(sessionResult)
    url.resolve(signedUrl)
    await Promise.resolve()
    await expect(request.promise).rejects.toThrow('timed out')
    if (stage === 'session') expect(deps.getUrl).not.toHaveBeenCalled()
    else expect(deps.getUrl.mock.calls[0][1].aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('uses a single deadline for the session and URL including its response body', async () => {
    vi.useFakeTimers()
    const session = deferred<typeof sessionResult>()
    const deps = dependencies()
    deps.getSession.mockImplementation(() => session.promise)
    deps.getUrl.mockImplementation(() => new Promise(() => {}))
    const request = startResumeOpen(deps)
    const failed = expect(request.promise).rejects.toThrow('timed out')
    await vi.advanceTimersByTimeAsync(12_000)
    session.resolve(sessionResult)
    await vi.advanceTimersByTimeAsync(2_999)
    expect(deps.getUrl.mock.calls[0][1].aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await failed
    expect(deps.getUrl.mock.calls[0][1].aborted).toBe(true)
  })

  it.each(['session', 'url'] as const)('cancels during %s without accepting a late destination', async (stage) => {
    vi.useFakeTimers()
    const session = deferred<typeof sessionResult>()
    const url = deferred<string>()
    const deps = dependencies()
    if (stage === 'session') deps.getSession.mockImplementation(() => session.promise)
    else deps.getUrl.mockImplementation(() => url.promise)
    const request = startResumeOpen(deps)
    const failed = expect(request.promise).rejects.toThrow('cancelled')
    await Promise.resolve()
    request.cancel()
    await failed
    session.resolve(sessionResult)
    url.resolve(signedUrl)
    await Promise.resolve()
    await expect(request.promise).rejects.toThrow('cancelled')
    if (stage === 'session') expect(deps.getUrl).not.toHaveBeenCalled()
    else expect(deps.getUrl.mock.calls[0][1].aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each(['session', 'url'] as const)('handles a late rejected %s request after cancellation', async (stage) => {
    const session = deferred<typeof sessionResult>()
    const url = deferred<string>()
    const deps = dependencies()
    if (stage === 'session') deps.getSession.mockImplementation(() => session.promise)
    else deps.getUrl.mockImplementation(() => url.promise)
    const request = startResumeOpen(deps)
    const failed = expect(request.promise).rejects.toThrow('cancelled')
    await Promise.resolve()
    request.cancel()
    await failed
    if (stage === 'session') session.reject(new Error('late session rejection'))
    else url.reject(new Error('late URL rejection'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    await expect(request.promise).rejects.toThrow('cancelled')
  })

  it('clears timers when either dependency throws and makes no automatic retry', async () => {
    vi.useFakeTimers()
    for (const stage of ['getSession', 'getUrl'] as const) {
      const deps = dependencies()
      deps[stage].mockImplementation(() => { throw new Error('read failed') })
      await expect(startResumeOpen(deps).promise).rejects.toThrow('read failed')
      expect(deps[stage]).toHaveBeenCalledOnce()
      expect(vi.getTimerCount()).toBe(0)
    }
  })
})
