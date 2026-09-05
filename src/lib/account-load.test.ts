import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ACCOUNT_LOAD_TIMEOUT_MS,
  AccountLoadTimeoutError,
  startAccountLoad,
  type AccountLoadDependencies,
} from './account-load'

type Candidate = { id: string }

function dependencies(
  overrides: Partial<AccountLoadDependencies<Candidate>> = {},
): AccountLoadDependencies<Candidate> {
  return {
    getSession: async () => ({
      session: { user: { email: 'nurse@example.com' } },
      error: null,
    }),
    getCandidate: async () => ({ data: { id: 'candidate-1' }, error: null }),
    ...overrides,
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('startAccountLoad', () => {
  it('keeps no session separate from a valid account with no candidate', async () => {
    const getCandidate = vi.fn(async () => ({ data: null, error: null }))
    const signedOut = startAccountLoad(
      dependencies({
        getSession: async () => ({ session: null, error: null }),
        getCandidate,
      }),
    )

    await expect(signedOut.promise).resolves.toEqual({ kind: 'no-session' })
    expect(getCandidate).not.toHaveBeenCalled()

    const emptyAccount = startAccountLoad(dependencies({ getCandidate }))
    await expect(emptyAccount.promise).resolves.toEqual({
      kind: 'loaded',
      email: 'nurse@example.com',
      candidate: null,
    })
  })

  it('uses one deadline and does not start the RPC after a late session result', async () => {
    vi.useFakeTimers()
    let resolveSession!: (value: {
      session: { user: { email: string } }
      error: null
    }) => void
    const session = new Promise<{
      session: { user: { email: string } }
      error: null
    }>((resolve) => {
      resolveSession = resolve
    })
    const getCandidate = vi.fn(async () => ({ data: null, error: null }))
    const onSession = vi.fn()
    const request = startAccountLoad(
      dependencies({ getSession: () => session, getCandidate, onSession }),
    )
    const timedOut = expect(request.promise).rejects.toBeInstanceOf(AccountLoadTimeoutError)

    await vi.advanceTimersByTimeAsync(ACCOUNT_LOAD_TIMEOUT_MS)
    await timedOut
    resolveSession({
      session: { user: { email: 'late@example.com' } },
      error: null,
    })
    await Promise.resolve()

    expect(onSession).not.toHaveBeenCalled()
    expect(getCandidate).not.toHaveBeenCalled()
  })

  it('shares one deadline across session lookup and the candidate RPC', async () => {
    vi.useFakeTimers()
    let candidateSignal: AbortSignal | undefined
    const getSession = vi.fn(
      () =>
        new Promise<{
          session: { user: { email: string } }
          error: null
        }>((resolve) => {
          setTimeout(() => {
            resolve({
              session: { user: { email: 'nurse@example.com' } },
              error: null,
            })
          }, 12_000)
        }),
    )
    const getCandidate = vi.fn(async (signal: AbortSignal) => {
      candidateSignal = signal
      return await new Promise<{ data: Candidate | null; error: null }>(() => {})
    })
    const request = startAccountLoad(dependencies({ getSession, getCandidate }))
    const timedOut = expect(request.promise).rejects.toBeInstanceOf(AccountLoadTimeoutError)

    await vi.advanceTimersByTimeAsync(12_000)
    expect(getCandidate).toHaveBeenCalledOnce()
    expect(candidateSignal?.aborted).toBe(false)

    await vi.advanceTimersByTimeAsync(2_999)
    expect(candidateSignal?.aborted).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await timedOut
    expect(candidateSignal?.aborted).toBe(true)
  })

  it('clears the deadline timer after a successful load settles', async () => {
    vi.useFakeTimers()
    const request = startAccountLoad(dependencies())

    await expect(request.promise).resolves.toEqual({
      kind: 'loaded',
      email: 'nurse@example.com',
      candidate: { id: 'candidate-1' },
    })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reports a known session before an RPC failure and rejects session errors', async () => {
    const onSession = vi.fn()
    const failedProfile = startAccountLoad(
      dependencies({
        onSession,
        getCandidate: async () => ({ data: null, error: { message: 'offline' } }),
      }),
    )

    await expect(failedProfile.promise).rejects.toThrow('offline')
    expect(onSession).toHaveBeenCalledWith({
      user: { email: 'nurse@example.com' },
    })

    const getCandidate = vi.fn(async () => ({ data: null, error: null }))
    const failedSession = startAccountLoad(
      dependencies({
        getSession: async () => ({
          session: null,
          error: { message: 'session unavailable' },
        }),
        getCandidate,
        onSession,
      }),
    )
    await expect(failedSession.promise).rejects.toThrow('session unavailable')
    expect(getCandidate).not.toHaveBeenCalled()
    expect(onSession).toHaveBeenCalledTimes(1)
  })

  it.each([undefined, false, 0, ''])('rejects malformed session error acknowledgement %j before the RPC', async (error) => {
    const getCandidate = vi.fn(async () => ({ data: { id: 'candidate-1' }, error: null }))
    await expect(startAccountLoad(dependencies({
      getSession: async () => ({ session: { user: { email: 'nurse@example.com' } }, error } as never),
      getCandidate,
    })).promise).rejects.toThrow('Account session request failed')
    expect(getCandidate).not.toHaveBeenCalled()
  })

  it('rejects a missing session error acknowledgement before the RPC', async () => {
    const getCandidate = vi.fn(async () => ({ data: { id: 'candidate-1' }, error: null }))
    await expect(startAccountLoad(dependencies({
      getSession: async () => ({ session: { user: { email: 'nurse@example.com' } } } as never),
      getCandidate,
    })).promise).rejects.toThrow('Account session request failed')
    expect(getCandidate).not.toHaveBeenCalled()
  })

  it.each([undefined, false, 0, ''])('rejects malformed candidate RPC error acknowledgement %j', async (error) => {
    await expect(startAccountLoad(dependencies({
      getCandidate: async () => ({ data: { id: 'candidate-1' }, error } as never),
    })).promise).rejects.toThrow('Account profile request failed')
  })

  it('forwards cancellation to the candidate RPC and rejects request errors', async () => {
    let receivedSignal: AbortSignal | undefined
    const request = startAccountLoad(
      dependencies({
        getCandidate: async (signal) => {
          receivedSignal = signal
          return await new Promise(() => {})
        },
      }),
    )
    const cancelled = expect(request.promise).rejects.toThrow('cancelled')

    await vi.waitFor(() => expect(receivedSignal).toBeDefined())
    request.cancel()
    await cancelled
    expect(receivedSignal?.aborted).toBe(true)

    const failed = startAccountLoad(
      dependencies({
        getCandidate: async () => ({ data: null, error: { message: 'offline' } }),
      }),
    )
    await expect(failed.promise).rejects.toThrow('offline')
  })

  it('wires session errors, known-session state, retry control, and cancellation into AccountView', () => {
    const accountView = readFileSync(
      resolve(process.cwd(), 'src/app/account/AccountView.tsx'),
      'utf8',
    )

    expect(accountView).toContain('return { session: data.session, error }')
    expect(accountView).toContain('if (active) setEmail(session.user.email')
    expect(accountView).toContain(".rpc('get_my_freeresumepost_candidate')")
    expect(accountView).toContain('.retry(false)')
    expect(accountView).toContain('.abortSignal(signal)')
    expect(accountView).toContain('request.cancel()')
    expect(accountView).toContain('setLoadError(true)')
  })
})
