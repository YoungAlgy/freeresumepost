import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isValidElement, type ReactNode } from 'react'

// Run actual component handlers with deferred mocks. This small hook driver
// does not model the DOM, React scheduling, or server hydration.
const hooks = vi.hoisted(() => {
  let slots: unknown[] = [], cursor = 0, active = true, late = 0
  let effects: Array<() => void | (() => void)> = [], cleanups: Array<() => void> = []
  let transitions: Promise<unknown>[] = []
  return {
    reset() { slots = []; cursor = 0; active = true; late = 0; effects = []; cleanups = []; transitions = [] },
    begin() { cursor = 0 },
    effects() { const pending = effects; effects = []; for (const effect of pending) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup) } },
    unmount() { active = false; for (const cleanup of cleanups) cleanup(); cleanups = [] },
    late: () => late,
    transitions: () => Promise.all(transitions),
    useState<T>(initial: T | (() => T)) {
      const index = cursor++
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? (initial as () => T)() : initial
      return [slots[index], (value: T | ((previous: T) => T)) => {
        if (!active) late += 1
        slots[index] = typeof value === 'function' ? (value as (previous: T) => T)(slots[index] as T) : value
      }]
    },
    useRef<T>(initial: T) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index] },
    useEffect(effect: () => void | (() => void)) { const index = cursor++; if (!(index in slots)) { slots[index] = true; effects.push(effect) } },
    useTransition() { return [false, (callback: () => Promise<unknown>) => { transitions.push(callback()) }] },
  }
})
const mocks = vi.hoisted(() => ({
  push: vi.fn(), replace: vi.fn(), assign: vi.fn(), getSession: vi.fn(), verifyOtp: vi.fn(), signOut: vi.fn(), rpc: vi.fn(),
  requestOtp: vi.fn(), submit: vi.fn(), attach: vi.fn(), extract: vi.fn(), parse: vi.fn(), resolveResume: vi.fn(),
}))
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(),
  useState: hooks.useState, useRef: hooks.useRef, useEffect: hooks.useEffect, useTransition: hooks.useTransition,
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push, replace: mocks.replace }) }))
vi.mock('@/lib/supabase-browser', () => ({ supabaseBrowser: { auth: { getSession: mocks.getSession, verifyOtp: mocks.verifyOtp, signOut: mocks.signOut }, rpc: mocks.rpc } }))
vi.mock('@/lib/resume-parser', () => ({ extractTextFromFile: mocks.extract, parseFields: mocks.parse }))
vi.mock('@/lib/resume-url', () => ({ resolveResumeUrl: mocks.resolveResume }))
vi.mock('@/components/TurnstileWidget', () => ({ default: () => null }))
vi.mock('../app/upload/actions', () => ({ submitCandidate: mocks.submit, uploadAndAttachResume: mocks.attach }))
vi.mock('../app/candidate/login/actions', () => ({ requestCandidateOtp: mocks.requestOtp }))
import UploadForm from '../app/upload/upload-form'
import OtpLoginForm from '../app/candidate/login/OtpLoginForm'
import AccountView from '../app/account/AccountView'

function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
type Props = Record<string, unknown>
function element(tree: ReactNode, predicate: (type: unknown, props: Props) => boolean): Props {
  const queue = [tree]
  while (queue.length) {
    const next = queue.shift()
    if (Array.isArray(next)) { queue.push(...next); continue }
    if (!isValidElement<Props>(next)) continue
    if (predicate(next.type, next.props)) return next.props
    queue.push(next.props.children as ReactNode)
  }
  throw new Error('Fixture element was not found')
}
function render(component: () => ReactNode) { hooks.begin(); const tree = component(); hooks.effects(); return tree }
function call(props: Props, handler: string, event: unknown = { preventDefault() {} }) {
  return Promise.resolve((props[handler] as (event: unknown) => void | Promise<void>)(event))
}
const form = (tree: ReactNode) => element(tree, (type) => type === 'form')
const input = (tree: ReactNode, label: string) => element(tree, (type, props) => type === 'input' && props['aria-label'] === label)
const button = (tree: ReactNode, text: string) => element(tree, (type, props) => type === 'button' && props.children === text)
const flush = async () => { for (let i = 0; i < 16; i += 1) await Promise.resolve() }
const session = { access_token: 'fixture-token', user: { id: 'fixture-owner', email: 'fixture@example.invalid' } }
const saved = { success: true, candidate_id: 'fixture-id', nonce: 'fixture-nonce', edit_url: '/profile/fixture?t=fixture' }
const fileEvent = (name = 'fixture.pdf') => ({ target: { files: [new File(['%PDF-fixture'], name, { type: 'application/pdf' })] } })
beforeEach(() => {
  hooks.reset()
  vi.resetAllMocks()
  vi.stubGlobal('window', { location: { assign: mocks.assign } })
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
  mocks.getSession.mockResolvedValue({ data: { session }, error: null })
  mocks.requestOtp.mockResolvedValue({ accepted: true })
  mocks.verifyOtp.mockResolvedValue({ data: { session }, error: null })
  mocks.submit.mockResolvedValue(saved)
  mocks.attach.mockResolvedValue({ success: true })
  mocks.extract.mockResolvedValue('Isolated resume parsing fixture. '.repeat(4))
  mocks.parse.mockReturnValue({ rawText: 'Isolated resume parsing fixture. '.repeat(4), email: 'fixture@example.invalid', firstName: 'Local', lastName: 'Fixture', credentials: ['RN'] })
  mocks.resolveResume.mockResolvedValue('https://fixture.invalid/private-resume')
  const rpcResult = { data: { id: 'fixture-id', slug: 'fixture', first_name: 'Local', last_name: 'Fixture', resume_url: 'fixture-path', is_public: false }, error: null }
  mocks.rpc.mockImplementation(() => ({ retry: () => ({ abortSignal: () => Promise.resolve(rpcResult) }) }))
})
afterEach(() => { hooks.unmount(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })
async function codeScreen() {
  let tree = render(OtpLoginForm)
  await call(input(tree, 'Email address'), 'onChange', { target: { value: 'fixture@example.invalid' } })
  tree = render(OtpLoginForm)
  await call(form(tree), 'onSubmit')
  tree = render(OtpLoginForm)
  await call(input(tree, '6-digit sign-in code'), 'onChange', { target: { value: '123456' } })
  return render(OtpLoginForm)
}
async function uploadReview() {
  await call(element(render(UploadForm), (type, props) => type === 'input' && props.type === 'file'), 'onChange', fileEvent())
  await flush()
  return render(UploadForm)
}
async function account() { render(AccountView); await flush(); return render(AccountView) }

describe('actual OTP handlers', () => {
  it.each([{}, { accepted: 'true' }, { accepted: false, error: {} }])('keeps malformed code-request replies off the code screen: %j', async (response) => {
    let tree = render(OtpLoginForm)
    await call(input(tree, 'Email address'), 'onChange', { target: { value: 'fixture@example.invalid' } })
    tree = render(OtpLoginForm)
    mocks.requestOtp.mockResolvedValue(response)
    await call(form(tree), 'onSubmit')
    const next = render(OtpLoginForm)
    expect(input(next, 'Email address')).toBeDefined()
    expect(element(next, (_type, props) => props.role === 'alert').children).toContain('We could not confirm the code request')
    expect(mocks.push).not.toHaveBeenCalled()
  })
  it('suppresses late verification navigation and locks the code while pending', async () => {
    const tree = await codeScreen(), pending = deferred<unknown>()
    mocks.verifyOtp.mockReturnValue(pending.promise)
    const submitted = call(form(tree), 'onSubmit')
    expect(input(render(OtpLoginForm), '6-digit sign-in code').disabled).toBe(true)
    hooks.unmount()
    pending.resolve({ data: { session }, error: null })
    await submitted
    expect(mocks.push).not.toHaveBeenCalled()
    expect(hooks.late()).toBe(0)
  })
  it.each([false, true])('ignores a late code request, rejected=%s', async (rejected) => {
    let tree = render(OtpLoginForm)
    await call(input(tree, 'Email address'), 'onChange', { target: { value: 'fixture@example.invalid' } })
    tree = render(OtpLoginForm)
    const pending = deferred<unknown>()
    mocks.requestOtp.mockReturnValue(pending.promise)
    const submitted = call(form(tree), 'onSubmit')
    hooks.unmount()
    if (rejected) pending.reject(new Error('fixture failure'))
    else pending.resolve({ accepted: true })
    await submitted
    expect(hooks.late()).toBe(0)
  })
  it('blocks same-turn repeat activation and preserves active successful sign-in', async () => {
    const tree = await codeScreen(), pending = deferred<unknown>()
    mocks.verifyOtp.mockReturnValue(pending.promise)
    const first = call(form(tree), 'onSubmit')
    await call(form(tree), 'onSubmit')
    expect(mocks.verifyOtp).toHaveBeenCalledOnce()
    pending.resolve({ data: { session }, error: null })
    await first
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/account')
  })
  it('wraps long addresses and keeps code recovery controls phone-sized', async () => {
    const tree = await codeScreen()
    expect(element(tree, (type) => type === 'strong').className).toBe('break-all')
    for (const text of ['Verify & sign in', 'Resend code', 'Use a different email']) {
      expect(button(tree, text).className).toContain('min-h-11')
    }
  })
})
describe('actual upload handlers', () => {
  it('keeps a long selected filename breakable while parsing and reviewing', async () => {
    const longName = `${'candidate-resume-'.repeat(14)}.pdf`
    const parsing = deferred<string>()
    mocks.extract.mockReturnValue(parsing.promise)

    await call(
      element(render(UploadForm), (type, props) => type === 'input' && props.type === 'file'),
      'onChange',
      fileEvent(longName),
    )
    const parsingTree = render(UploadForm)
    const parsingName = element(
      parsingTree,
      (type, props) => type === 'p' && JSON.stringify(props.children).includes(longName),
    )
    expect(parsingName.className).toContain('break-all')

    parsing.resolve('Isolated resume parsing fixture. '.repeat(4))
    await flush()
    const reviewTree = render(UploadForm)
    const reviewName = element(
      reviewTree,
      (type, props) => type === 'span' && props.children === longName,
    )
    expect(reviewName.className).toContain('break-all')
  })

  it('does not start attachment or navigation after a late profile save', async () => {
    const tree = await uploadReview(), pending = deferred<unknown>()
    mocks.submit.mockReturnValue(pending.promise)
    await call(form(tree), 'onSubmit')
    expect(mocks.submit).toHaveBeenCalledOnce()
    hooks.unmount()
    pending.resolve(saved)
    await hooks.transitions()
    expect(mocks.attach).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
    expect(hooks.late()).toBe(0)
  })
  it('lets an already-started attachment settle without late navigation', async () => {
    const tree = await uploadReview(), pending = deferred<unknown>()
    mocks.attach.mockReturnValue(pending.promise)
    await call(form(tree), 'onSubmit')
    await flush()
    expect(mocks.attach).toHaveBeenCalledOnce()
    hooks.unmount()
    pending.resolve({ success: true })
    await hooks.transitions()
    expect(mocks.push).not.toHaveBeenCalled()
    expect(hooks.late()).toBe(0)
  })
  it('ignores late parsing after unmount', async () => {
    const pending = deferred<string>()
    mocks.extract.mockReturnValue(pending.promise)
    await call(element(render(UploadForm), (type, props) => type === 'input' && props.type === 'file'), 'onChange', fileEvent())
    hooks.unmount()
    pending.resolve('Isolated fixture. '.repeat(8))
    await flush()
    expect(mocks.parse).not.toHaveBeenCalled()
    expect(hooks.late()).toBe(0)
  })
  it.each([null, {}, { success: true }, { ...saved, success: 'true' }, { success: false }, { success: false, error: { details: 'invalid response' } }])('keeps malformed save unconfirmed: %j', async (response) => {
    const tree = await uploadReview()
    mocks.submit.mockResolvedValue(response)
    await call(form(tree), 'onSubmit')
    await hooks.transitions()
    expect(mocks.attach).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
    const alert = element(render(UploadForm), (_type, props) => props.role === 'alert')
    expect(JSON.stringify(alert.children)).toContain('We could not confirm the save')
  })
  it('preserves an active successful save and attachment', async () => {
    const tree = await uploadReview()
    await call(form(tree), 'onSubmit')
    await hooks.transitions()
    expect(mocks.submit).toHaveBeenCalledOnce()
    expect(mocks.attach).toHaveBeenCalledOnce()
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith(saved.edit_url)
  })
})
describe('actual account resume handlers', () => {
  it('aborts resolution on unmount and ignores its late destination', async () => {
    const tree = await account(), pending = deferred<string>()
    mocks.resolveResume.mockReturnValue(pending.promise)
    const opening = call(button(tree, 'Open resume file'), 'onClick')
    await flush()
    expect(mocks.resolveResume).toHaveBeenCalledOnce()
    const signal = mocks.resolveResume.mock.calls[0][2] as AbortSignal
    hooks.unmount()
    expect(signal.aborted).toBe(true)
    pending.resolve('https://fixture.invalid/private-resume')
    await opening
    expect(mocks.assign).not.toHaveBeenCalled()
    expect(hooks.late()).toBe(0)
  })
  it('ignores a late missing session after unmount', async () => {
    const tree = await account(), pending = deferred<unknown>()
    mocks.getSession.mockReturnValue(pending.promise)
    const opening = call(button(tree, 'Open resume file'), 'onClick')
    hooks.unmount()
    pending.resolve({ data: { session: null }, error: null })
    await opening
    expect(mocks.resolveResume).not.toHaveBeenCalled()
    expect(mocks.replace).not.toHaveBeenCalled()
    expect(hooks.late()).toBe(0)
  })
  it('opens an active file and blocks overlapping account actions before a render', async () => {
    const tree = await account(), pending = deferred<string>()
    mocks.resolveResume.mockReturnValue(pending.promise)
    const opening = call(button(tree, 'Open resume file'), 'onClick')
    await call(button(tree, 'Sign out'), 'onClick')
    expect(mocks.signOut).not.toHaveBeenCalled()
    pending.resolve('https://fixture.invalid/private-resume')
    await opening
    expect(mocks.assign).toHaveBeenCalledExactlyOnceWith('https://fixture.invalid/private-resume')
  })
})
