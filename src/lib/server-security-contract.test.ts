import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('FreeResumePost server security contract', () => {
  it('creates the service-role submit client only after Turnstile succeeds', () => {
    const actions = source('src/app/upload/actions.ts')
    const turnstile = actions.indexOf('await verifyTurnstileToken')
    const rejected = actions.indexOf('if (!turnstile.ok)', turnstile)
    const serviceClient = actions.indexOf('sb = createServiceRoleClient()', rejected)

    expect(turnstile).toBeGreaterThan(-1)
    expect(rejected).toBeGreaterThan(turnstile)
    expect(serviceClient).toBeGreaterThan(rejected)
    expect(actions).toContain("!turnstile.configured || turnstile.action !== 'upload-resume'")
    expect(actions).toContain("formData.get('file')")
    expect(actions).toContain('await validateResumeUpload(fileValue)')
    expect(actions).toContain('attachUploadedResumeOrCleanUp')
    expect(actions).toContain('previous_resume_path')
    expect(actions).toContain('.remove([previousResumePath])')
  })

  it('keeps direct private-bucket writes out of both browser forms', () => {
    const uploadForm = source('src/app/upload/upload-form.tsx')
    const editForm = source('src/app/profile/[slug]/edit-form.tsx')

    expect(uploadForm).toContain('uploadAndAttachResume(upload)')
    expect(editForm).toContain('uploadAndAttachResume(upload)')
    expect(uploadForm).not.toContain('.storage')
    expect(editForm).not.toContain('.storage')
  })

  it('prechecks source, status, and deletion before asking Auth to send an OTP', () => {
    const otpAction = source('src/app/candidate/login/actions.ts')
    const sourceCheck = otpAction.indexOf(".eq('source', FREE_RESUME_POST_UPLOAD_SOURCE)")
    const statusCheck = otpAction.indexOf(".eq('status', 'active')", sourceCheck)
    const deletionCheck = otpAction.indexOf(".is('deleted_at', null)", statusCheck)
    const send = otpAction.indexOf('sb.auth.signInWithOtp', deletionCheck)
    const browserForm = source('src/app/candidate/login/OtpLoginForm.tsx')

    expect(sourceCheck).toBeGreaterThan(-1)
    expect(statusCheck).toBeGreaterThan(sourceCheck)
    expect(deletionCheck).toBeGreaterThan(statusCheck)
    expect(send).toBeGreaterThan(deletionCheck)
    expect(otpAction).toContain('return { accepted: true }')
    expect(browserForm).not.toContain('signInWithOtp')
  })

  it('records the shared Auth sender as a standalone release blocker', () => {
    const otpAction = source('src/app/candidate/login/actions.ts')
    const release = source('docs/releases/2026-08-29-standalone-release.md')
    const envExample = source('.env.example')

    expect(otpAction).toContain('sb.auth.signInWithOtp')
    expect(release).toContain(
      'BLOCKED: candidate OTP sender identity is not owned by FreeResumePost yet.',
    )
    expect(release).toContain('src/app/candidate/login/actions.ts')
    expect(release).toContain('Supabase Auth owns the sender name')
    expect(release).toContain('shared Supabase Edge Function named `resume-edit-link`')
    expect(release).toContain('sender is still on `avahealth.co`')
    expect(release).toContain('Capture a real received OTP email before release.')
    expect(envExample).not.toContain('FREERESUMEPOST_FROM_EMAIL')
  })

  it('separates the rolling grants from the post-cutover lockdown', () => {
    const boundary = source(
      'supabase/migrations/20260828010000_freeresumepost_standalone_boundary.sql',
    )
    const lockdown = source(
      'supabase/migrations/20260829020000_freeresumepost_server_only_lockdown.sql',
    )

    const attachGrantStart = boundary.indexOf(
      'REVOKE ALL ON FUNCTION public.attach_freeresumepost_resume_rpc',
    )
    const attachGrantEnd = boundary.indexOf(
      'COMMENT ON FUNCTION public.attach_freeresumepost_resume_rpc',
      attachGrantStart,
    )
    const attachGrant = boundary.slice(attachGrantStart, attachGrantEnd)

    expect(boundary).toMatch(/TO anon, authenticated, service_role;/)
    expect(attachGrant).toContain('TO service_role;')
    expect(attachGrant).not.toMatch(/TO anon|TO authenticated/)
    expect(lockdown).toContain('FROM PUBLIC, anon, authenticated;')
    expect(lockdown).toContain('TO service_role;')
    expect(lockdown).toContain('DROP POLICY IF EXISTS resumes_anon_insert ON storage.objects;')
    expect(lockdown).toContain(
      'DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;',
    )
    expect(lockdown).toContain('CREATE POLICY resumes_internal_insert')
    expect(lockdown).toContain('AND public.is_internal_user()')
  })

  it('pins the upload body limit and same-artifact Cloudflare commands', () => {
    const nextConfig = source('next.config.ts')
    const packageJson = JSON.parse(source('package.json')) as {
      scripts: Record<string, string>
    }

    expect(nextConfig).toContain("serverActions: { bodySizeLimit: '6mb' }")
    expect(packageJson.scripts['cf:build']).toBe('opennextjs-cloudflare build')
    expect(packageJson.scripts['cf:hash']).toBe('node scripts/hash-open-next.mjs')
    expect(packageJson.scripts['cf:preview']).toBe('opennextjs-cloudflare preview')
    expect(packageJson.scripts['cf:upload']).toBe(
      'opennextjs-cloudflare upload --strict --keep-vars',
    )
    expect(packageJson.scripts['cf:deploy']).toBe('wrangler versions deploy')
    expect(packageJson.scripts['cf:upload']).not.toContain('build &&')
    expect(packageJson.scripts['cf:deploy']).not.toContain('build &&')
  })
})
