import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { issueAccountEditorToken, signOutAccount } from './account-actions'

describe('issueAccountEditorToken', () => {
  it('returns a validated owner edit destination', async () => {
    const issue = vi.fn(async () => ({
      data: {
        success: true,
        candidate_id: 'candidate-1',
        candidate_slug: 'jane-rn',
        nonce: 'private-nonce',
      },
      error: null,
    }))

    await expect(issueAccountEditorToken(issue)).resolves.toEqual({
      ok: true,
      candidateId: 'candidate-1',
      candidateSlug: 'jane-rn',
      nonce: 'private-nonce',
    })
    expect(issue).toHaveBeenCalledOnce()
  })

  it('turns returned and thrown failures into retryable UI results', async () => {
    await expect(
      issueAccountEditorToken(async () => ({
        data: null,
        error: { message: 'network unavailable' },
      })),
    ).resolves.toEqual({
      ok: false,
      error: 'Could not open the editor. Try again.',
      technicalMessage: 'network unavailable',
    })

    await expect(
      issueAccountEditorToken(async () => {
        throw new Error('browser request failed')
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Could not open the editor. Try again.',
      technicalMessage: 'browser request failed',
    })
  })

  it('does not accept an incomplete edit-token response', async () => {
    await expect(
      issueAccountEditorToken(async () => ({
        data: { success: true, candidate_id: 'candidate-1' },
        error: null,
      })),
    ).resolves.toEqual({
      ok: false,
      error: 'Could not open the editor. Try again.',
      technicalMessage: 'Edit-token response was incomplete.',
    })
  })

  it.each([
    { success: 'true', candidate_id: 'candidate-1', candidate_slug: 'jane-rn', nonce: 'private-nonce' },
    { success: true, candidate_id: '', candidate_slug: 'jane-rn', nonce: 'private-nonce' },
    { success: true, candidate_id: 'candidate-1', candidate_slug: {}, nonce: 'private-nonce' },
    { success: false, error: { message: 'not safe to render' } },
  ])('keeps malformed editor responses generic: %j', async (data) => {
    await expect(issueAccountEditorToken(async () => ({ data, error: null }))).resolves.toEqual({
      ok: false,
      error: 'Could not open the editor. Try again.',
      technicalMessage: 'Edit-token response was incomplete.',
    })
  })
})

describe('signOutAccount', () => {
  it('reports success only when signOut resolves without an error', async () => {
    const signOut = vi.fn(async () => ({ error: null }))

    await expect(signOutAccount(signOut)).resolves.toEqual({ ok: true })
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('keeps returned and thrown failures on the account screen', async () => {
    await expect(
      signOutAccount(async () => ({ error: { message: 'sign out unavailable' } })),
    ).resolves.toEqual({
      ok: false,
      error: 'Could not confirm sign out. Try again or refresh this page.',
      technicalMessage: 'sign out unavailable',
    })

    await expect(
      signOutAccount(async () => {
        throw new Error('storage unavailable')
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Could not confirm sign out. Try again or refresh this page.',
      technicalMessage: 'storage unavailable',
    })
  })

  it('does not claim sign-out after malformed acknowledgments', async () => {
    await expect(signOutAccount(async () => ({ error: undefined }))).resolves.toEqual({
      ok: false,
      error: 'Could not confirm sign out. Try again or refresh this page.',
      technicalMessage: 'Sign-out response was incomplete.',
    })

    await expect(signOutAccount(async () => ({ error: { message: 123 } }))).resolves.toEqual({
      ok: false,
      error: 'Could not confirm sign out. Try again or refresh this page.',
      technicalMessage: 'Sign-out response was incomplete.',
    })
  })

  it('keeps account actions serialized without changing sign-out scope or adding timeouts', () => {
    const accountView = readFileSync(
      resolve(process.cwd(), 'src/app/account/AccountView.tsx'),
      'utf8',
    )
    const editorStart = accountView.indexOf('async function openEditor()')
    const resumeStart = accountView.indexOf('async function openResume()', editorStart)
    const editor = accountView.slice(editorStart, resumeStart)
    const signOutStart = accountView.indexOf('async function signOut()', resumeStart)
    const renderStart = accountView.indexOf('const fullName', signOutStart)
    const signOut = accountView.slice(signOutStart, renderStart)

    expect(editor).toContain('issueAccountEditorToken')
    expect(editor).toContain(".rpc('issue_my_freeresumepost_edit_token_rpc')")
    expect(editor).toContain('.retry(false)')
    expect(editor).not.toContain('setTimeout')
    expect(editor).not.toContain('abortSignal')
    expect(signOut).toContain('signOutAccount(() => supabaseBrowser.auth.signOut())')
    expect(signOut).not.toContain('scope:')
    expect(signOut).not.toContain('setTimeout')
    expect(accountView).toContain('disabled={loading || accountActionPending}')
    expect(accountView).toContain('disabled={accountActionPending}')
    expect(accountView).toContain('role="alert"')
  })
})
