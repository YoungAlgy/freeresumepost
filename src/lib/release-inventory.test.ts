import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const inventory = readFileSync(
  resolve(
    process.cwd(),
    'docs/releases/2026-08-29-freeresumepost-inventory.sql',
  ),
  'utf8',
)

describe('FreeResumePost release inventory', () => {
  it('keeps the audit read-only and identifies each generic database role', () => {
    expect(inventory).toContain('BEGIN TRANSACTION READ ONLY;')
    expect(inventory).toContain('FROM information_schema.table_privileges')
    expect(inventory).not.toContain('information_schema.role_table_grants')

    const tablePrivileges = inventory.slice(
      inventory.indexOf('FROM information_schema.table_privileges') - 100,
      inventory.indexOf('FROM information_schema.routine_privileges'),
    )
    const routinePrivileges = inventory.slice(
      inventory.indexOf('FROM information_schema.routine_privileges') - 100,
      inventory.indexOf('FROM pg_policies'),
    )

    expect(tablePrivileges).toContain('grantee,')
    expect(routinePrivileges).toContain('grantee,')
    expect(routinePrivileges).toContain('specific_name,')
    expect(inventory).toContain("grantee IN ('PUBLIC', 'anon', 'authenticated')")
  })
})
