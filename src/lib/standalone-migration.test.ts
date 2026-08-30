import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260828010000_freeresumepost_standalone_boundary.sql',
)
const migration = readFileSync(migrationPath, 'utf8')

describe('FreeResumePost standalone release migration', () => {
  it('keeps the legacy upload-first path without weakening path or object validation', () => {
    const compatibilityStart = migration.indexOf("v_resume_path := nullif(p_resume_url, '')")
    const validationStart = migration.indexOf("v_resume_path !~ '^[0-9a-f]{8}")
    const objectCheck = migration.indexOf('FROM storage.objects o', validationStart)
    const insertStart = migration.indexOf('INSERT INTO public.public_candidates')
    const storedPath = migration.indexOf('    v_resume_path,', insertStart)

    expect(compatibilityStart).toBeGreaterThan(-1)
    expect(validationStart).toBeGreaterThan(compatibilityStart)
    expect(objectCheck).toBeGreaterThan(validationStart)
    expect(insertStart).toBeGreaterThan(objectCheck)
    expect(storedPath).toBeGreaterThan(insertStart)
    expect(migration).toContain("WHEN v_resume_path ~ '\\.pdf$' THEN 'application/pdf'")
    expect(migration).toContain(
      "WHEN v_resume_path ~ '\\.docx$' THEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
    )
    expect(migration).not.toMatch(/v_resume_path[^\n]*\(pdf\|doc\|docx\)/)
  })

  it('keeps the profile-first attachment RPC under the same storage contract', () => {
    const attachStart = migration.indexOf(
      'CREATE OR REPLACE FUNCTION public.attach_freeresumepost_resume_rpc',
    )
    const attachEnd = migration.indexOf(
      'COMMENT ON FUNCTION public.attach_freeresumepost_resume_rpc',
      attachStart,
    )
    const attachFunction = migration.slice(attachStart, attachEnd)

    expect(attachStart).toBeGreaterThan(-1)
    expect(attachFunction).toContain('FROM storage.objects o')
    expect(attachFunction).toContain("o.bucket_id = 'resumes'")
    expect(attachFunction).toContain("source = 'freeresumepost.upload.v1'")
    expect(attachFunction).toContain("status = 'active'")
    expect(attachFunction).toContain('deleted_at IS NULL')
    expect(attachFunction).toContain("n.type = 'candidate_edit_token'")
    expect(attachFunction).toContain('FOR UPDATE')
    expect(attachFunction).toContain('freeresumepost_resume_window_started_at')
    expect(attachFunction).toContain('freeresumepost_resume_window_count')
    expect(attachFunction).toContain('greatest(v_attachment_count, 0)')
    expect(attachFunction).toContain('v_window_started_at > now()')
    expect(attachFunction).toContain('v_attachment_count >= 5')
    expect(attachFunction).toContain("'previous_resume_path', v_previous_resume_path")

    const attachGrant = migration.slice(
      migration.indexOf(
        'REVOKE ALL ON FUNCTION public.attach_freeresumepost_resume_rpc',
        attachStart,
      ),
      migration.indexOf(
        'COMMENT ON FUNCTION public.attach_freeresumepost_resume_rpc',
        attachStart,
      ),
    )
    expect(attachGrant).toContain('TO service_role;')
    expect(attachGrant).not.toMatch(/TO anon|TO authenticated/)
  })

  it('removes untrusted historical attachment counters during proven backfill', () => {
    const backfillEnd = migration.indexOf('-- Keep the legacy signature')
    const backfill = migration.slice(0, backfillEnd)

    expect(backfill).toContain("- 'freeresumepost_resume_window_started_at'")
    expect(backfill).toContain("- 'freeresumepost_resume_window_count'")
    expect(backfill).toContain(
      "OR parsed_profile ? 'freeresumepost_resume_window_count'",
    )
  })

  it('keeps the old edit UI callable while returning no recruiter behavior', () => {
    const consumeStart = migration.indexOf(
      'CREATE OR REPLACE FUNCTION public.consume_candidate_edit_rpc',
    )
    const consumeEnd = migration.indexOf(
      'COMMENT ON FUNCTION public.consume_candidate_edit_rpc',
      consumeStart,
    )
    const consumeFunction = migration.slice(consumeStart, consumeEnd)

    expect(consumeStart).toBeGreaterThan(-1)
    expect(consumeFunction).toContain("'remote_only', false")
    expect(consumeFunction).toContain("'contact_via_email', false")
    expect(consumeFunction).toContain("'contact_via_sms', false")
    expect(consumeFunction).toContain("'matches', '[]'::jsonb")
    expect(consumeFunction).not.toContain('FROM public.public_matches')
    expect(consumeFunction).not.toContain('JOIN public.public_jobs')
    expect(consumeFunction).not.toContain("'resume_url', v_candidate.resume_url")
  })

  it('keeps legacy update arguments but forces retired fields off', () => {
    const updateStart = migration.indexOf(
      'CREATE OR REPLACE FUNCTION public.update_public_candidate_rpc',
    )
    const updateEnd = migration.indexOf(
      'COMMENT ON FUNCTION public.update_public_candidate_rpc',
      updateStart,
    )
    const updateFunction = migration.slice(updateStart, updateEnd)

    expect(updateFunction).toContain('p_remote_only boolean')
    expect(updateFunction).toContain('p_contact_via_email boolean')
    expect(updateFunction).toContain('p_contact_via_sms boolean')
    expect(updateFunction).toContain('remote_only = false')
    expect(updateFunction).toContain('contact_via_email = false')
    expect(updateFunction).toContain('contact_via_sms = false')
    expect(updateFunction).toContain("source = 'freeresumepost.upload.v1'")
  })

  it('retires the matching cron from Ava health checks before unscheduling it', () => {
    const monitorUpdate = migration.indexOf(
      "SELECT pg_get_functiondef('public.cron_health_check()'::regprocedure)",
    )
    const unschedule = migration.indexOf("EXECUTE 'SELECT cron.unschedule($1)'")
    const finalAssertion = migration.lastIndexOf(
      "pg_get_functiondef('public.cron_health_check()'::regprocedure)",
    )

    expect(monitorUpdate).toBeGreaterThan(-1)
    expect(unschedule).toBeGreaterThan(monitorUpdate)
    expect(finalAssertion).toBeGreaterThan(unschedule)
    expect(migration).toContain(
      "IF position('refresh-marketplace-matches' IN v_definition) > 0 THEN",
    )
  })

  it('issues recovery links through one locked service-only claim', () => {
    const claimStart = migration.indexOf(
      'CREATE OR REPLACE FUNCTION public.issue_freeresumepost_recovery_link_rpc',
    )
    const claimEnd = migration.indexOf(
      'COMMENT ON FUNCTION public.issue_freeresumepost_recovery_link_rpc',
      claimStart,
    )
    const claim = migration.slice(claimStart, claimEnd)

    expect(claimStart).toBeGreaterThan(-1)
    expect(claim).toContain("c.source = 'freeresumepost.upload.v1'")
    expect(claim).toContain("c.status = 'active'")
    expect(claim).toContain('c.deleted_at IS NULL')
    expect(claim).toContain('FOR UPDATE')
    expect(claim).toContain('v_recent_count >= 6')
    expect(claim.indexOf('FOR UPDATE')).toBeLessThan(
      claim.indexOf('SELECT count(*) INTO v_recent_count'),
    )
    expect(claim.indexOf('SELECT count(*) INTO v_recent_count')).toBeLessThan(
      claim.indexOf('INSERT INTO public.marketplace_notifications'),
    )
    expect(claim).toContain(
      'GRANT EXECUTE ON FUNCTION public.issue_freeresumepost_recovery_link_rpc(text) TO service_role;',
    )
    expect(claim).not.toMatch(/TO anon|TO authenticated/)
  })
})
