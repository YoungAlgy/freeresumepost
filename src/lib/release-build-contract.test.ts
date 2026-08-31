import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import JSON5 from 'json5'
import {
  hasDoQueueHandlerExport,
  validateBuildSafeConfig,
  validateSupabasePublicKey,
  validateWranglerReleaseConfig,
  verifySupabasePublicKeyForProject,
} from '../../scripts/build-sanitized-release.mjs'
import {
  candidateTrafficObservation,
  parseRequestedVersion,
  pinnedCloudflareEnvironment,
  validateAccountPayload,
  validateDeploymentPayload,
  validateDeploymentSnapshotUnchanged,
  validateVersionPayload,
  workerScopedArguments,
} from '../../scripts/check-cloudflare-bindings.mjs'
import {
  parseUploadedVersionId,
  validateCandidateRecord,
  validateSingleActiveDeployment,
} from '../../scripts/upload-sanitized-release.mjs'
import {
  classifyTrafficCommandOutcome,
  parseTrafficArguments,
  validateTrafficState,
} from '../../scripts/manage-cloudflare-traffic.mjs'

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('FreeResumePost sanitized release contract', () => {
  it('builds from tracked source in an env-free staging worktree', () => {
    const script = source('scripts/build-sanitized-release.mjs')
    const packageJson = JSON.parse(source('package.json')) as {
      scripts: Record<string, string>
    }
    const gitignore = source('.gitignore')
    const eslintConfig = source('eslint.config.mjs')
    const tsconfig = JSON.parse(source('tsconfig.json')) as { exclude: string[] }
    const vitestConfig = source('vitest.config.ts')

    expect(packageJson.scripts['release:build']).toBe(
      'node scripts/build-sanitized-release.mjs',
    )
    expect(gitignore).toContain('.release-build/')
    expect(gitignore).toContain('.open-next.release-candidate/')
    expect(eslintConfig).toContain('".release-build/**"')
    expect(tsconfig.exclude).toContain('.release-build')
    expect(vitestConfig).toContain("'.release-build/**'")
    expect(script).toContain("run('git', ['ls-files', '-z', '--cached']")
    expect(script).toContain("'checkout-index', '--all'")
    expect(script).toContain("resolve(worktreeRoot, 'package-lock.json')")
    expect(script).not.toContain('copyFileSync(source, destination)')
    expect(script).toContain("normalized !== '.env.example'")
    expect(script).toContain('Private .env files are never loaded.')
    expect(script).not.toContain("readFileSync(resolve(repositoryRoot, '.env")
    expect(script).not.toContain('parseSelectedConfigFile')
    expect(script).toContain("'--porcelain=v1'")
    expect(script).toContain(
      'Commit the reviewed source before building so the artifact maps to one exact Git revision.',
    )
    expect(script).toContain('environmentFilesExcluded: true')
    expect(script).toContain("run('git', ['rev-parse', 'HEAD^{tree}'])")
    expect(script).toContain('packageLockSha256')
    expect(script).toContain('toolVersions')
    expect(script).toContain('dependencyLockMatched: true')
    expect(script).toContain('isolatedToolHome: true')
    expect(script).toContain('publicKeyOwnershipVerified: true')
    expect(script).toContain('environment.HOME = isolatedToolHome')
    expect(script).not.toContain("'HOME',")
    expect(script).not.toContain('...process.env')
  })

  it('passes only public product config into the build and excludes runtime secrets', () => {
    const script = source('scripts/build-sanitized-release.mjs')

    expect(script).toContain("'NEXT_PUBLIC_SUPABASE_URL'")
    expect(script).toContain("'NEXT_PUBLIC_SUPABASE_ANON_KEY'")
    expect(script).toContain("'NEXT_PUBLIC_TURNSTILE_SITE_KEY'")
    expect(script).toContain("'FREERESUMEPOST_SUPPORT_EMAIL'")
    expect(script).toContain("'SUPABASE_SERVICE_ROLE_KEY'")
    expect(script).toContain("'TURNSTILE_SECRET_KEY'")
    expect(script).toContain("'GEMINI_API_KEY'")
    expect(script).toContain("'TAILOR_COOKIE_SECRET'")
    expect(script).toContain('delete environment[name]')
    expect(script).not.toContain('SUPABASE_SERVICE_ROLE_KEY: process.env')
  })

  it('rejects a public build configuration for any other Supabase project', () => {
    const base = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://tsruqbodyrmxqzhvxret.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        'sb_publishable_1234567890abcdefghijklmnop',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'public-site-key',
      FREERESUMEPOST_SUPPORT_EMAIL: 'owner@freeresumepost.co',
    }

    expect(validateBuildSafeConfig({ ...base })).toEqual(base)
    expect(() =>
      validateBuildSafeConfig({
        ...base,
        NEXT_PUBLIC_SUPABASE_URL: 'https://another-project.supabase.co',
      }),
    ).toThrow('must identify the expected Supabase project')
  })

  it('accepts public Supabase keys and rejects elevated or cross-project legacy keys', () => {
    const legacy = (payload: Record<string, string>) =>
      `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`

    expect(() =>
      validateSupabasePublicKey('sb_publishable_1234567890abcdefghijklmnop'),
    ).not.toThrow()
    expect(() =>
      validateSupabasePublicKey(['sb', 'secret', '1234567890abcdefghijklmnop'].join('_')),
    ).toThrow('received a Supabase secret key')
    expect(() =>
      validateSupabasePublicKey(
        legacy({ role: 'service_role', ref: 'tsruqbodyrmxqzhvxret' }),
      ),
    ).toThrow('expected project legacy anon key')
    expect(() =>
      validateSupabasePublicKey(
        legacy({ role: 'anon', ref: 'anotherprojectref000' }),
      ),
    ).toThrow('expected project legacy anon key')
    expect(() =>
      validateSupabasePublicKey(
        legacy({ role: 'anon', ref: 'tsruqbodyrmxqzhvxret' }),
      ),
    ).not.toThrow()
  })

  it('proves the public key against the exact project without logging its value', async () => {
    const publicKey = 'sb_publishable_1234567890abcdefghijklmnop'
    let requestedUrl = ''
    let requestedHeaders: Record<string, string> = {}
    await expect(
      verifySupabasePublicKeyForProject(
        publicKey,
        async (input, options) => {
          requestedUrl = String(input)
          requestedHeaders = Object.fromEntries(new Headers(options?.headers))
          return new Response(null, { status: 200 })
        },
      ),
    ).resolves.toBeUndefined()
    expect(requestedUrl).toBe(
      'https://tsruqbodyrmxqzhvxret.supabase.co/auth/v1/settings',
    )
    expect(requestedHeaders).toEqual({ apikey: publicKey })

    await expect(
      verifySupabasePublicKeyForProject(
        publicKey,
        async () => new Response(null, { status: 401 }),
      ),
    ).rejects.toThrow('was not accepted by the expected project')
    await expect(
      verifySupabasePublicKeyForProject(publicKey, async () => {
        throw new Error('network unavailable')
      }),
    ).rejects.toThrow('ownership check could not be completed')
  })

  it('requires the Worker export, exact config, artifact hashes, and a Wrangler dry run', () => {
    const script = source('scripts/build-sanitized-release.mjs')

    expect(script).toContain("resolve(artifactRoot, 'worker.js')")
    expect(script).toContain('hasDoQueueHandlerExport(worker)')
    expect(script).toContain('validateWranglerReleaseConfig(')
    expect(script).toContain("'--dry-run'")
    expect(script).toContain("'open-next.sha256'")
    expect(script).toContain('wranglerDryRunPassed: true')
    expect(script).toContain('installVerifiedArtifact(stagedArtifactAfterDryRun)')
    expect(script).toContain('installedArtifactMatchesStaging: true')
    expect(script).toContain('postBuildProvenance = dependencyProvenance(')
    expect(script).toContain('preManifestProvenance = dependencyProvenance(')
    expect(script).toContain('stagedArtifactAfterDryRun = await inspectArtifact(')
    expect(script).toContain('dependencyProvenanceRecheckedAfterBuild: true')
    expect(script).toContain('stagedArtifactRecheckedAfterDryRun: true')
  })

  it('parses real ESM exports and rejects comments, strings, and renamed exports', async () => {
    await expect(
      hasDoQueueHandlerExport('export class DOQueueHandler {}'),
    ).resolves.toBe(true)
    await expect(
      hasDoQueueHandlerExport('// export { DOQueueHandler }'),
    ).resolves.toBe(false)
    await expect(
      hasDoQueueHandlerExport('const note = "export { DOQueueHandler }"'),
    ).resolves.toBe(false)
    await expect(
      hasDoQueueHandlerExport(
        'const DOQueueHandler = {}; export { DOQueueHandler as Other }',
      ),
    ).resolves.toBe(false)
  })

  it('validates exact local Wrangler resource identities before the dry run', () => {
    const config = JSON5.parse(source('wrangler.jsonc'))
    expect(validateWranglerReleaseConfig(config)).toBe(true)

    const wrongBucket = structuredClone(config)
    wrongBucket.r2_buckets[0].bucket_name = 'wrong-bucket'
    expect(() => validateWranglerReleaseConfig(wrongBucket)).toThrow(
      'Wrangler release config mismatch: R2 cache',
    )

    const plaintextSecret = structuredClone(config)
    plaintextSecret.vars.SUPABASE_SERVICE_ROLE_KEY = 'must-never-be-plaintext'
    expect(() => validateWranglerReleaseConfig(plaintextSecret)).toThrow(
      'Wrangler release config mismatch: variables',
    )

    const assetBypass = structuredClone(config)
    assetBypass.assets.run_worker_first = false
    expect(() => validateWranglerReleaseConfig(assetBypass)).toThrow(
      'Wrangler release config mismatch: assets',
    )

    const destructiveMigration = structuredClone(config)
    destructiveMigration.migrations.push({
      tag: 'v2',
      deleted_classes: ['DOQueueHandler'],
    })
    expect(() => validateWranglerReleaseConfig(destructiveMigration)).toThrow(
      'Wrangler release config mismatch: Durable Object migration',
    )

    const crossScriptDurableObject = structuredClone(config)
    crossScriptDurableObject.durable_objects.bindings[0].script_name = 'other-worker'
    expect(() => validateWranglerReleaseConfig(crossScriptDurableObject)).toThrow(
      'Wrangler release config mismatch: Durable Object',
    )

    const crossEnvironmentService = structuredClone(config)
    crossEnvironmentService.services[0].environment = 'preview'
    expect(() => validateWranglerReleaseConfig(crossEnvironmentService)).toThrow(
      'Wrangler release config mismatch: self service',
    )

    const unexpectedBindingSection = structuredClone(config)
    unexpectedBindingSection.kv_namespaces = []
    expect(() => validateWranglerReleaseConfig(unexpectedBindingSection)).toThrow(
      'Wrangler release config mismatch: top-level keys',
    )
  })

  it('allows upload only when root .open-next matches the clean release manifest', () => {
    const uploader = source('scripts/upload-sanitized-release.mjs')
    const preview = source('scripts/preview-sanitized-release.mjs')
    const packageJson = JSON.parse(source('package.json')) as {
      scripts: Record<string, string>
    }

    expect(packageJson.scripts['cf:upload']).toBe(
      'node scripts/upload-sanitized-release.mjs',
    )
    expect(packageJson.scripts['cf:preview']).toBe(
      'node scripts/preview-sanitized-release.mjs',
    )
    expect(preview).toContain("'.release-build', 'worktree'")
    expect(preview).toContain("[openNextCli, 'preview']")
    expect(preview).toContain("'CLOUDFLARE_API_TOKEN'")
    expect(preview).toContain('delete childEnvironment[name]')
    expect(preview).not.toContain("'--remote'")
    expect(uploader).toContain("'.release-build', 'release-manifest.json'")
    expect(uploader).toContain("resolve(repositoryRoot, '.open-next')")
    expect(uploader).toContain('manifest.sourceHead !== sourceHead')
    expect(uploader).toContain('manifest.sourceTree !== sourceTree')
    expect(uploader).toContain('manifest.packageLockSha256')
    expect(uploader).toContain('manifest.toolVersions')
    expect(uploader).toContain('stagedPackageLockPath')
    expect(uploader).toContain('stagedArtifactRoot')
    expect(uploader).toContain('stagedWorktreeRoot')
    expect(uploader).toContain("'scripts',\n    'check-cloudflare-bindings.mjs'")
    expect(uploader).toContain('validateWranglerReleaseConfig(config)')
    expect(uploader).toContain(
      'artifact.aggregateSha256 === manifest.aggregateSha256',
    )
    expect(uploader).toContain('pinnedCloudflareEnvironment(environment)')
    expect(uploader).toContain("[bindingCheck, '--version', candidateVersionId]")
    expect(uploader).toContain("'upload', '--strict', '--keep-vars'")
    expect(uploader.match(/await fullPreflight\(\)/g)).toHaveLength(3)
    const firstPreflight = uploader.indexOf('await fullPreflight()')
    const bindingPreflight = uploader.indexOf(
      'run(process.execPath, [bindingCheck], {',
    )
    const uploadPreflight = uploader.indexOf(
      'const uploadPreflight = await fullPreflight()',
    )
    const upload = uploader.indexOf("[openNextCli, 'upload', '--strict', '--keep-vars']")
    expect(firstPreflight).toBeLessThan(bindingPreflight)
    expect(bindingPreflight).toBeLessThan(uploadPreflight)
    expect(uploadPreflight).toBeLessThan(upload)
    expect(uploader).toContain('const uploadPostflight = await fullPreflight()')
    expect(uploader).toContain(
      'validateDeploymentSnapshotUnchanged(deploymentBefore, deploymentAfter)',
    )
    expect(uploader).toContain('writeCandidateRecord(record')
    expect(uploader).not.toContain("'build'")
  })

  it('fails the remote preflight when a required binding is absent or mistyped', () => {
    const script = source('scripts/check-cloudflare-bindings.mjs')
    const packageJson = JSON.parse(source('package.json')) as {
      scripts: Record<string, string>
    }

    expect(packageJson.scripts['release:bindings']).toBe(
      'node scripts/check-cloudflare-bindings.mjs',
    )
    expect(script).toContain("'SUPABASE_SERVICE_ROLE_KEY'")
    expect(script).toContain("'FREERESUMEPOST_SUPPORT_EMAIL'")
    expect(script).toContain("new Set(['plain_text'])")
    expect(script).toContain("binding.class_name === 'DOQueueHandler'")
    expect(script).toContain("binding.bucket_name === 'freeresumepost-inc-cache'")
    expect(script).toContain(
      "binding.database_id === '28d3df97-14ce-449c-a7ae-376c6c66d8f8'",
    )
    expect(script).toContain("binding.service === 'freeresumepost'")
    expect(script).toContain('checkCloudflareBindings(process.argv.slice(2))')
    expect(script).toContain("mode = 'candidate-version'")
    expect(script).toContain("runWranglerImpl(['whoami', '--json'])")
    expect(script).toContain("'--name',")
    expect(script).toContain('validateDeploymentSnapshotUnchanged(')
    expect(script).toContain('!requiredBindings.has(name)')
    expect(script).toContain('version?.id === expectedVersionId')
    expect(script).toContain('wrongValue')
    expect(script).toContain('if (report.failures.length > 0) process.exitCode = 1')
  })

  it('rejects every ambiguous candidate-version argument form', () => {
    const versionId = '11111111-2222-4333-8444-555555555555'
    expect(parseRequestedVersion([])).toBeNull()
    expect(parseRequestedVersion(['--version', versionId])).toBe(versionId)

    for (const args of [
      [`--version=${versionId}`],
      ['--versoin', versionId],
      [versionId],
      ['--version', versionId, 'extra'],
      ['--version', versionId, '--version', versionId],
      ['--version'],
    ]) {
      expect(() => parseRequestedVersion(args)).toThrow(
        'Use no arguments, or exactly --version <Worker version ID>',
      )
    }
    expect(() => parseRequestedVersion(['--version', 'not-a-uuid'])).toThrow(
      'The requested Worker version ID is malformed',
    )
  })

  it('checks the exact candidate ID and non-secret binding resources', () => {
    const versionId = '11111111-2222-4333-8444-555555555555'
    const bindings = [
      { name: 'ASSETS', type: 'assets' },
      { name: 'GEMINI_API_KEY', type: 'secret_text' },
      {
        name: 'NEXT_CACHE_DO_QUEUE',
        type: 'durable_object_namespace',
        class_name: 'DOQueueHandler',
      },
      {
        name: 'NEXT_CACHE_DO_QUEUE_REVALIDATION_TIMEOUT_MS',
        type: 'plain_text',
        text: '3000',
      },
      {
        name: 'NEXT_INC_CACHE_R2_BUCKET',
        type: 'r2_bucket',
        bucket_name: 'freeresumepost-inc-cache',
      },
      {
        name: 'NEXT_PUBLIC_APP_URL',
        type: 'plain_text',
        text: 'https://www.freeresumepost.co',
      },
      { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', type: 'secret_text' },
      { name: 'NEXT_PUBLIC_SUPABASE_URL', type: 'secret_text' },
      { name: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', type: 'secret_text' },
      {
        name: 'NEXT_TAG_CACHE_D1',
        type: 'd1',
        database_id: '28d3df97-14ce-449c-a7ae-376c6c66d8f8',
      },
      { name: 'SUPABASE_SERVICE_ROLE_KEY', type: 'secret_text' },
      { name: 'TAILOR_COOKIE_SECRET', type: 'secret_text' },
      { name: 'TURNSTILE_SECRET_KEY', type: 'secret_text' },
      {
        name: 'FREERESUMEPOST_SUPPORT_EMAIL',
        type: 'plain_text',
        text: 'owner@freeresumepost.co',
      },
      {
        name: 'WORKER_SELF_REFERENCE',
        type: 'service',
        service: 'freeresumepost',
      },
    ]
    const valid = validateVersionPayload(
      { id: versionId, resources: { bindings } },
      versionId,
    )
    expect(valid.versionIdMatches).toBe(true)
    expect(valid.missing).toEqual([])
    expect(valid.wrongType).toEqual([])
    expect(valid.wrongValue).toEqual([])
    expect(valid.unexpected).toEqual([])

    const productionServiceTarget = validateVersionPayload(
      {
        id: versionId,
        resources: {
          bindings: bindings.map((binding) =>
            binding.name === 'WORKER_SELF_REFERENCE'
              ? { ...binding, environment: 'production' }
              : binding,
          ),
        },
      },
      versionId,
    )
    expect(productionServiceTarget.wrongValue).toEqual([])

    const wrongResource = validateVersionPayload(
      {
        id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        resources: {
          bindings: bindings.map((binding) =>
            binding.name === 'NEXT_INC_CACHE_R2_BUCKET'
              ? { ...binding, bucket_name: 'wrong-bucket' }
              : binding,
          ),
        },
      },
      versionId,
    )
    expect(wrongResource.versionIdMatches).toBe(false)
    expect(wrongResource.wrongValue).toContain('NEXT_INC_CACHE_R2_BUCKET')

    const crossScriptDurableObject = validateVersionPayload(
      {
        id: versionId,
        resources: {
          bindings: bindings.map((binding) =>
            binding.name === 'NEXT_CACHE_DO_QUEUE'
              ? { ...binding, script_name: 'other-worker' }
              : binding,
          ),
        },
      },
      versionId,
    )
    expect(crossScriptDurableObject.wrongValue).toContain('NEXT_CACHE_DO_QUEUE')

    const crossEnvironmentService = validateVersionPayload(
      {
        id: versionId,
        resources: {
          bindings: bindings.map((binding) =>
            binding.name === 'WORKER_SELF_REFERENCE'
              ? { ...binding, environment: 'preview' }
              : binding,
          ),
        },
      },
      versionId,
    )
    expect(crossEnvironmentService.wrongValue).toContain('WORKER_SELF_REFERENCE')
  })

  it('pins the Cloudflare account, Worker, config, and stable traffic snapshot', () => {
    const versionId = '11111111-2222-4333-8444-555555555555'
    const deployment = {
      id: 'deployment-one',
      versions: [{ version_id: versionId, percentage: 100 }],
    }

    expect(
      pinnedCloudflareEnvironment({ CLOUDFLARE_API_TOKEN: 'test-token' }),
    ).toMatchObject({
      CLOUDFLARE_API_TOKEN: 'test-token',
      CLOUDFLARE_ACCOUNT_ID: 'faf641f1b778a8e0bd365c5141da649d',
    })
    expect(() =>
      pinnedCloudflareEnvironment({ CLOUDFLARE_ACCOUNT_ID: 'wrong-account' }),
    ).toThrow('does not match the FreeResumePost account')
    expect(workerScopedArguments(['deployments', 'status', '--json'])).toEqual(
      expect.arrayContaining(['--name', 'freeresumepost', '--config']),
    )
    expect(
      validateAccountPayload({
        loggedIn: true,
        accounts: [{ id: 'faf641f1b778a8e0bd365c5141da649d' }],
      }),
    ).toBe(true)
    expect(
      validateAccountPayload({
        loggedIn: true,
        accounts: [{ id: 'another-account' }],
      }),
    ).toBe(false)
    expect(validateDeploymentPayload(deployment)).toEqual(deployment.versions)
    expect(validateSingleActiveDeployment(deployment)).toBe(versionId)
    expect(() =>
      validateDeploymentSnapshotUnchanged(deployment, {
        ...deployment,
        id: 'deployment-two',
      }),
    ).toThrow('Cloudflare deployment changed during the binding check')
    expect(
      candidateTrafficObservation(deployment, 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'),
    ).toMatchObject({ percentage: null })
    expect(() => candidateTrafficObservation(deployment, versionId)).toThrow(
      'is receiving traffic',
    )
  })

  it('ties one exact uploaded candidate to the reviewed source and artifact', () => {
    const currentVersionId = '11111111-2222-4333-8444-555555555555'
    const candidateVersionId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    expect(
      parseUploadedVersionId(
        `Uploaded Worker Version ID: ${candidateVersionId}\n`,
      ),
    ).toBe(candidateVersionId)
    expect(() => parseUploadedVersionId('upload complete')).toThrow(
      'did not return one exact uploaded Worker version ID',
    )

    const manifest = {
      sourceHead: '1'.repeat(40),
      sourceTree: '2'.repeat(40),
      packageLockSha256: '3'.repeat(64),
      aggregateSha256: '4'.repeat(64),
    }
    const record = {
      schemaVersion: 1,
      accountId: 'faf641f1b778a8e0bd365c5141da649d',
      workerName: 'freeresumepost',
      currentVersionId,
      candidateVersionId,
      sourceHead: manifest.sourceHead,
      sourceTree: manifest.sourceTree,
      packageLockSha256: manifest.packageLockSha256,
      artifactSha256: manifest.aggregateSha256,
    }
    expect(
      validateCandidateRecord(record, {
        currentVersionId,
        candidateVersionId,
        manifest,
      }),
    ).toEqual(record)
    expect(() =>
      validateCandidateRecord(
        { ...record, artifactSha256: '5'.repeat(64) },
        { currentVersionId, candidateVersionId, manifest },
      ),
    ).toThrow('wrong artifactSha256')
  })

  it('accepts only exact traffic commands and validates every rollout state', () => {
    const trafficScript = source('scripts/manage-cloudflare-traffic.mjs')
    const packageJson = JSON.parse(source('package.json')) as {
      scripts: Record<string, string>
    }
    const currentVersionId = '11111111-2222-4333-8444-555555555555'
    const candidateVersionId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    const oneHundred = (versionId: string) => ({
      id: 'deployment-one',
      versions: [{ version_id: versionId, percentage: 100 }],
    })
    const staged = {
      id: 'deployment-two',
      versions: [
        { version_id: currentVersionId, percentage: 100 },
        { version_id: candidateVersionId, percentage: 0 },
      ],
    }

    expect(packageJson.scripts['cf:deploy']).toBeUndefined()
    expect(packageJson.scripts['cf:stage']).toContain(
      'manage-cloudflare-traffic.mjs stage',
    )
    expect(packageJson.scripts['cf:unstage']).toContain(
      'manage-cloudflare-traffic.mjs unstage',
    )
    expect(packageJson.scripts['cf:promote']).toContain(
      'manage-cloudflare-traffic.mjs promote',
    )
    expect(packageJson.scripts['cf:rollback']).toContain(
      'manage-cloudflare-traffic.mjs rollback',
    )
    expect(trafficScript).toContain("'versions',")
    expect(trafficScript).toContain("'deploy',")
    expect(trafficScript).toContain('stagedWorkerArguments([')
    expect(trafficScript).toContain("'.release-build', 'worktree'")
    expect(trafficScript).toContain('readCandidateRecord({')
    expect(trafficScript).toContain('const deploymentImmediatelyBefore')

    expect(
      parseTrafficArguments([
        'stage',
        '--current',
        currentVersionId,
        '--candidate',
        candidateVersionId,
      ]),
    ).toEqual({ command: 'stage', currentVersionId, candidateVersionId })
    expect(
      parseTrafficArguments([
        'rollback',
        '--current',
        candidateVersionId,
        '--previous',
        currentVersionId,
      ]),
    ).toEqual({
      command: 'rollback',
      currentVersionId: candidateVersionId,
      candidateVersionId: currentVersionId,
    })
    for (const args of [
      ['stage', '--current', currentVersionId, '--candidate'],
      ['stage', '--candidate', candidateVersionId, '--current', currentVersionId],
      ['stage', '--current', currentVersionId, '--candidate', candidateVersionId, 'extra'],
      ['promote', '--current', currentVersionId, '--previous', candidateVersionId],
      ['deploy', '--current', currentVersionId, '--candidate', candidateVersionId],
    ]) {
      expect(() => parseTrafficArguments(args)).toThrow('Usage:')
    }

    expect(
      validateTrafficState(oneHundred(currentVersionId), {
        phase: 'stage-before',
        currentVersionId,
        candidateVersionId,
      }),
    ).toHaveLength(1)
    expect(
      validateTrafficState(staged, {
        phase: 'stage-after',
        currentVersionId,
        candidateVersionId,
      }),
    ).toHaveLength(2)
    expect(
      classifyTrafficCommandOutcome(staged, {
        beforePhase: 'stage-before',
        afterPhase: 'stage-after',
        currentVersionId,
        candidateVersionId,
      }),
    ).toBe('desired')
    expect(
      classifyTrafficCommandOutcome(oneHundred(currentVersionId), {
        beforePhase: 'stage-before',
        afterPhase: 'stage-after',
        currentVersionId,
        candidateVersionId,
      }),
    ).toBe('unchanged')
    expect(
      validateTrafficState(oneHundred(candidateVersionId), {
        phase: 'promote-after',
        currentVersionId,
        candidateVersionId,
      }),
    ).toHaveLength(1)
    expect(() =>
      validateTrafficState(
        {
          id: 'deployment-three',
          versions: [
            { version_id: currentVersionId, percentage: 99 },
            { version_id: candidateVersionId, percentage: 1 },
          ],
        },
        { phase: 'stage-after', currentVersionId, candidateVersionId },
      ),
    ).toThrow('does not match the stage-after contract')
  })
})
