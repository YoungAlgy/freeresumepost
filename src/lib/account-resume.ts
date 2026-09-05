export const RESUME_OPEN_TIMEOUT_MS = 15_000

type ResumeOpenDependencies = {
  getSession: () => PromiseLike<{
    session: { access_token: string } | null
    error: { message?: string } | null
  }>
  getUrl: (accessToken: string, signal: AbortSignal) => PromiseLike<string>
}

type ResumeOpenResult = { kind: 'no-session' } | { kind: 'ready'; url: string }

// Only the read used to open a private file is bounded. This never retries,
// changes account state, or starts navigation after the caller has cancelled.
export function startResumeOpen(
  dependencies: ResumeOpenDependencies,
  timeoutMs = RESUME_OPEN_TIMEOUT_MS,
) {
  const controller = new AbortController()
  const { signal } = controller
  let rejectCancelled!: (reason: unknown) => void
  const cancelled = new Promise<never>((_, reject) => {
    rejectCancelled = reject
  })
  const onAbort = () => rejectCancelled(signal.reason)
  signal.addEventListener('abort', onAbort, { once: true })
  const timer = setTimeout(() => {
    controller.abort(new Error('Opening your resume timed out. Try again.'))
  }, timeoutMs)

  const read = async (): Promise<ResumeOpenResult> => {
    const { session, error } = await dependencies.getSession()
    if (signal.aborted) throw signal.reason
    if (error !== null) throw new Error('Could not check your session. Try again.')
    if (!session) return { kind: 'no-session' }
    const url = await dependencies.getUrl(session.access_token, signal)
    if (signal.aborted) throw signal.reason
    return { kind: 'ready', url }
  }

  const promise = Promise.race([read(), cancelled]).finally(() => {
    clearTimeout(timer)
    signal.removeEventListener('abort', onAbort)
  })

  return {
    promise,
    cancel() {
      controller.abort(new Error('Opening your resume was cancelled.'))
    },
  }
}
