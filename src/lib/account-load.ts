export const ACCOUNT_LOAD_TIMEOUT_MS = 15_000

export type AccountSession = {
  user: {
    email?: string | null
  }
}

export type AccountLoadDependencies<TCandidate> = {
  getSession: () => Promise<{
    session: AccountSession | null
    error: { message?: string } | null
  }>
  onSession?: (session: AccountSession) => void
  getCandidate: (
    signal: AbortSignal,
  ) => Promise<{ data: TCandidate | TCandidate[] | null; error: { message?: string } | null }>
}

export type AccountLoadResult<TCandidate> =
  | { kind: 'no-session' }
  | { kind: 'loaded'; email: string; candidate: TCandidate | null }

export class AccountLoadTimeoutError extends Error {
  constructor() {
    super('Account loading timed out.')
    this.name = 'AccountLoadTimeoutError'
  }
}

function abortReason(signal: AbortSignal): Error {
  return signal.reason instanceof Error
    ? signal.reason
    : new Error('Account loading was cancelled.')
}

function errorMessage(error: unknown, fallback: string): string {
  return typeof error === 'object' && error !== null &&
    'message' in error && typeof error.message === 'string' && error.message
    ? error.message
    : fallback
}

function waitForAbort<T>(promise: PromiseLike<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortReason(signal))

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      reject(abortReason(signal))
    }

    signal.addEventListener('abort', onAbort, { once: true })
    Promise.resolve(promise).then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      },
    )
  })
}

async function loadAccountCandidate<TCandidate>(
  dependencies: AccountLoadDependencies<TCandidate>,
  signal: AbortSignal,
): Promise<AccountLoadResult<TCandidate>> {
  const { session, error: sessionError } = await waitForAbort(
    dependencies.getSession(),
    signal,
  )

  if (sessionError !== null) {
    throw new Error(errorMessage(sessionError, 'Account session request failed.'))
  }
  if (!session) return { kind: 'no-session' }
  if (signal.aborted) throw abortReason(signal)
  dependencies.onSession?.(session)
  if (signal.aborted) throw abortReason(signal)

  const { data, error } = await waitForAbort(
    dependencies.getCandidate(signal),
    signal,
  )

  if (error !== null) {
    throw new Error(errorMessage(error, 'Account profile request failed.'))
  }

  const candidate = Array.isArray(data) ? (data[0] ?? null) : (data ?? null)
  return {
    kind: 'loaded',
    email: session.user.email ?? '',
    candidate,
  }
}

export function startAccountLoad<TCandidate>(
  dependencies: AccountLoadDependencies<TCandidate>,
  timeoutMs = ACCOUNT_LOAD_TIMEOUT_MS,
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort(new AccountLoadTimeoutError())
  }, timeoutMs)

  const promise = loadAccountCandidate(dependencies, controller.signal).finally(() => {
    clearTimeout(timeout)
  })

  return {
    promise,
    cancel() {
      clearTimeout(timeout)
      controller.abort(new Error('Account loading was cancelled.'))
    },
  }
}
