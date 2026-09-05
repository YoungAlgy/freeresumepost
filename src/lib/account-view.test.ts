import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const accountView = readFileSync(
  resolve(process.cwd(), 'src/app/account/AccountView.tsx'),
  'utf8',
)

describe('FreeResumePost account profile management', () => {
  it('keeps one clear primary editor action and separates file access from replacement', () => {
    expect(accountView).toContain("{editLoading ? 'Opening…' : 'Edit profile'}")
    expect(accountView).not.toContain('Edit profile or replace resume')
    expect(accountView).toContain("{resumeLoading ? 'Opening resume…' : 'Open resume file'}")
    expect(accountView).toContain("Use Edit profile to {candidate.resume_url ? 'replace it' : 'add one'}.")
  })

  it('shows truthful profile, resume, and public-link empty states', () => {
    expect(accountView).toContain("{candidate.specialty || 'Not added'}")
    expect(accountView).toContain("{candidate.credential || 'Not added'}")
    expect(accountView).toContain(".join(', ') || 'Not added'")
    expect(accountView).toContain("'No resume file is saved with your profile.'")
    expect(accountView).toContain("'A limited public link is turned on for this profile.'")
    expect(accountView).toContain("'Your profile is private and has no public profile page.'")
  })

  it('keeps privacy changes in the editor and describes fields that remain private', () => {
    expect(accountView).toContain('Use Edit profile to manage the public link.')
    expect(accountView).toContain('Your email, phone, full last name, and resume file stay private.')
    expect(accountView).not.toContain('Use Edit profile to change this setting.')
    expect(accountView).not.toContain('type="checkbox"')
  })

  it('allows long private account values to wrap on narrow screens', () => {
    expect(accountView).toContain('break-all text-sm text-slate-600')
    expect(accountView).toContain('min-w-0 break-words text-right')
    expect(accountView).toContain('grid-cols-[minmax(0,1fr)_minmax(0,2fr)]')
    expect(accountView).toContain('<strong className="break-all">{email}</strong>')
  })

  it('keeps the account navigation controls at least 44 pixels tall', () => {
    expect(accountView).toMatch(/className="inline-flex min-h-11 items-center text-sm[^\n]+"\s*>\s*\{signOutLoading/)
    expect(accountView).toMatch(/onClick=\{retryLoad\}[\s\S]+?className="inline-flex min-h-11 items-center rounded-lg/)
    expect(accountView).toContain('className={`mb-3 flex min-h-11 w-full items-center justify-center')
    expect(accountView).toMatch(/href="\/upload"\s+className="inline-flex min-h-11 items-center rounded-lg/)
  })
})
