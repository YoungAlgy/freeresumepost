type ActionFailure = {
  ok: false
  error: string
  technicalMessage: string
}

type EditorTokenResponse = {
  success?: unknown
  candidate_id?: unknown
  candidate_slug?: unknown
  nonce?: unknown
  error?: unknown
}

function messageFrom(error: unknown, fallback: string): string {
  return typeof error === 'object' && error !== null &&
    'message' in error && typeof error.message === 'string'
    ? error.message
    : fallback
}

export type EditorTokenResult =
  | {
      ok: true
      candidateId: string
      candidateSlug: string
      nonce: string
    }
  | ActionFailure

export type SignOutResult = { ok: true } | ActionFailure

function technicalMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export async function issueAccountEditorToken(
  issue: () => PromiseLike<{
    data: EditorTokenResponse | null | undefined
    error: unknown
  }>,
): Promise<EditorTokenResult> {
  try {
    const { data, error } = await issue()
    if (error !== null) {
      return {
        ok: false,
        error: 'Could not open the editor. Try again.',
        technicalMessage: messageFrom(error, 'Editor request was incomplete.'),
      }
    }

    const responseError = typeof data?.error === 'string' && data.error.trim()
      ? data.error
      : null
    if (data?.success !== true ||
      typeof data.candidate_id !== 'string' || !data.candidate_id.trim() ||
      typeof data.candidate_slug !== 'string' || !data.candidate_slug.trim() ||
      typeof data.nonce !== 'string' || !data.nonce.trim()) {
      return {
        ok: false,
        error: responseError || 'Could not open the editor. Try again.',
        technicalMessage: responseError || 'Edit-token response was incomplete.',
      }
    }

    return {
      ok: true,
      candidateId: data.candidate_id,
      candidateSlug: data.candidate_slug,
      nonce: data.nonce,
    }
  } catch (error) {
    return {
      ok: false,
      error: 'Could not open the editor. Try again.',
      technicalMessage: technicalMessage(error, 'Editor request threw.'),
    }
  }
}

export async function signOutAccount(
  signOut: () => PromiseLike<{ error: unknown }>,
): Promise<SignOutResult> {
  try {
    const { error } = await signOut()
    if (error !== null) {
      return {
        ok: false,
        error: 'Could not confirm sign out. Try again or refresh this page.',
        technicalMessage: messageFrom(error, 'Sign-out response was incomplete.'),
      }
    }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: 'Could not confirm sign out. Try again or refresh this page.',
      technicalMessage: technicalMessage(error, 'Sign-out request threw.'),
    }
  }
}
