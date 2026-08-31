import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import JSON5 from 'json5'
import {
  hasDoQueueHandlerExport,
  validateWranglerReleaseConfig,
} from './build-sanitized-release.mjs'
import {
  EXPECTED_CLOUDFLARE_ACCOUNT_ID,
  EXPECTED_CLOUDFLARE_WORKER_NAME,
  candidateTrafficObservation,
  pinnedCloudflareEnvironment,
  validateDeploymentPayload,
  validateDeploymentSnapshotUnchanged,
} from './check-cloudflare-bindings.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '..')
const artifactRoot = resolve(repositoryRoot, '.open-next')
const manifestPath = resolve(repositoryRoot, '.release-build', 'release-manifest.json')
const stagedWorktreeRoot = resolve(repositoryRoot, '.release-build', 'worktree')
const stagedArtifactRoot = resolve(
  stagedWorktreeRoot,
  '.open-next',
)
const nodeModules = resolve(repositoryRoot, 'node_modules')
const packageLockPath = resolve(repositoryRoot, 'package-lock.json')
const stagedPackageLockPath = resolve(
  stagedWorktreeRoot,
  'package-lock.json',
)
const wranglerConfigPath = resolve(repositoryRoot, 'wrangler.jsonc')
const stagedWranglerConfigPath = resolve(
  stagedWorktreeRoot,
  'wrangler.jsonc',
)
const candidateRecordPath = resolve(
  repositoryRoot,
  '.freeresumepost-candidate.json',
)
const wranglerCli = resolve(nodeModules, 'wrangler', 'bin', 'wrangler.js')
const WORKER_VERSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const expectedBuildConfigNames = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'FREERESUMEPOST_SUPPORT_EMAIL',
]
const expectedPrivateConfigNames = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'TURNSTILE_SECRET_KEY',
  'GEMINI_API_KEY',
  'TAILOR_COOKIE_SECRET',
]
const expectedChecks = [
  'trackedSourceOnly',
  'environmentFilesExcluded',
  'privateRuntimeConfigExcluded',
  'isolatedToolHome',
  'publicKeyOwnershipVerified',
  'dependencyLockMatched',
  'dependencyProvenanceRecheckedAfterBuild',
  'doQueueHandlerExported',
  'wranglerDryRunPassed',
  'stagedArtifactRecheckedAfterDryRun',
  'installedArtifactMatchesStaging',
]

function fail(message) {
  throw new Error(message)
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    ...options,
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    fail(`${command} ${args.join(' ')} failed with exit code ${result.status}`)
  }
  return result.stdout ?? ''
}

function runCaptured(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    ...options,
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    fail(`${command} ${args.join(' ')} failed with exit code ${result.status}`)
  }
  return result
}

function uploadCloudflareEnvironment(environment = process.env) {
  const childEnvironment = pinnedCloudflareEnvironment(environment)
  for (const name of [...expectedBuildConfigNames, ...expectedPrivateConfigNames]) {
    delete childEnvironment[name]
  }
  return childEnvironment
}

function stagedWorkerScopedArguments(args) {
  return [
    ...args,
    '--name',
    EXPECTED_CLOUDFLARE_WORKER_NAME,
    '--config',
    stagedWranglerConfigPath,
  ]
}

function runWranglerJson(args, environment) {
  const output = run(
    process.execPath,
    [wranglerCli, ...stagedWorkerScopedArguments([...args, '--json'])],
    { cwd: stagedWorktreeRoot, env: environment },
  )
  try {
    return JSON.parse(output)
  } catch {
    fail('Wrangler returned invalid JSON')
  }
}

function walkFiles(directory) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isSymbolicLink()) fail(`Refusing to upload a symbolic artifact path: ${path}`)
    if (entry.isDirectory()) files.push(...walkFiles(path))
    else if (entry.isFile()) files.push(path)
  }
  return files
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function installedPackageVersion(packageName) {
  const path = resolve(nodeModules, ...packageName.split('/'), 'package.json')
  if (!existsSync(path)) fail(`Missing installed release tool: ${packageName}`)
  return JSON.parse(readFileSync(path, 'utf8')).version
}

function currentToolVersions() {
  return Object.fromEntries(
    [
      'next',
      '@opennextjs/cloudflare',
      'wrangler',
      'es-module-lexer',
      'json5',
    ].map((packageName) => [packageName, installedPackageVersion(packageName)]),
  )
}

async function inspectArtifact(root, label) {
  if (!existsSync(root) || lstatSync(root).isSymbolicLink()) {
    fail(`The ${label} .open-next release artifact is missing or symbolic`)
  }
  const workerPath = resolve(root, 'worker.js')
  const assetsPath = resolve(root, 'assets')
  if (!existsSync(workerPath) || !existsSync(assetsPath)) {
    fail(`The ${label} .open-next artifact is incomplete`)
  }
  if (!(await hasDoQueueHandlerExport(readFileSync(workerPath, 'utf8')))) {
    fail(`The ${label} Worker does not export DOQueueHandler`)
  }

  const files = walkFiles(root)
  const assets = walkFiles(assetsPath)
  if (files.length < 2 || assets.length < 1) {
    fail(`The ${label} .open-next artifact is incomplete`)
  }
  const lines = files
    .map((file) => {
      const path = relative(root, file).split(sep).join('/')
      const hash = createHash('sha256').update(readFileSync(file)).digest('hex')
      return `${hash}  ${path}`
    })
    .sort((left, right) => left.localeCompare(right, 'en'))
  return {
    fileCount: files.length,
    assetCount: assets.length,
    aggregateSha256: createHash('sha256')
      .update(`${lines.join('\n')}\n`, 'utf8')
      .digest('hex'),
  }
}

function assertManifestPolicy(manifest) {
  if (manifest.product !== 'FreeResumePost') fail('Release manifest product mismatch')
  if (manifest.artifactRoot !== '.open-next') {
    fail('Release manifest artifact root mismatch')
  }
  if (
    JSON.stringify(manifest.buildConfigNames) !==
      JSON.stringify(expectedBuildConfigNames) ||
    JSON.stringify(manifest.excludedPrivateConfigNames) !==
      JSON.stringify(expectedPrivateConfigNames)
  ) {
    fail('Release manifest configuration policy mismatch')
  }
  if (
    !manifest.checks ||
    JSON.stringify(Object.keys(manifest.checks).sort()) !==
      JSON.stringify([...expectedChecks].sort()) ||
    expectedChecks.some((name) => manifest.checks[name] !== true)
  ) {
    fail('Release manifest check policy mismatch')
  }
  if (
    !/^[0-9a-f]{40}$/i.test(manifest.sourceHead ?? '') ||
    !/^[0-9a-f]{40}$/i.test(manifest.sourceTree ?? '') ||
    !/^[0-9a-f]{64}$/i.test(manifest.packageLockSha256 ?? '') ||
    !/^[0-9a-f]{64}$/i.test(manifest.aggregateSha256 ?? '') ||
    !Number.isInteger(manifest.fileCount) ||
    manifest.fileCount < 2 ||
    !Number.isInteger(manifest.assetCount) ||
    manifest.assetCount < 1
  ) {
    fail('Release manifest provenance is malformed')
  }
}

function validateWranglerFile(path, label) {
  if (!existsSync(path)) fail(`The ${label} Wrangler release config is missing`)
  let config
  try {
    config = JSON5.parse(readFileSync(path, 'utf8'))
  } catch {
    fail(`The ${label} Wrangler release config is invalid JSONC`)
  }
  validateWranglerReleaseConfig(config)
}

function artifactMatchesManifest(artifact, manifest) {
  return (
    artifact.aggregateSha256 === manifest.aggregateSha256 &&
    artifact.fileCount === manifest.fileCount &&
    artifact.assetCount === manifest.assetCount
  )
}

export async function fullPreflight() {
  if (!existsSync(manifestPath)) {
    fail('Run npm run release:build before uploading')
  }
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch {
    fail('The sanitized release manifest is invalid JSON')
  }
  assertManifestPolicy(manifest)

  const sourceHead = run('git', ['rev-parse', 'HEAD']).trim()
  const sourceTree = run('git', ['rev-parse', 'HEAD^{tree}']).trim()
  const sourceStatus = run('git', [
    'status',
    '--porcelain=v1',
    '--untracked-files=all',
  ]).trim()
  if (sourceStatus) fail('Release source changed after the sanitized artifact was built')
  if (manifest.sourceHead !== sourceHead) fail('Release manifest source revision mismatch')
  if (manifest.sourceTree !== sourceTree) fail('Release manifest source tree mismatch')
  if (
    !existsSync(packageLockPath) ||
    !existsSync(stagedPackageLockPath) ||
    manifest.packageLockSha256 !== sha256File(packageLockPath) ||
    manifest.packageLockSha256 !== sha256File(stagedPackageLockPath)
  ) {
    fail('A package lock changed after the sanitized artifact was built')
  }
  if (JSON.stringify(manifest.toolVersions) !== JSON.stringify(currentToolVersions())) {
    fail('Installed release tools changed after the sanitized artifact was built')
  }

  validateWranglerFile(wranglerConfigPath, 'installed')
  validateWranglerFile(stagedWranglerConfigPath, 'staged')

  const artifact = await inspectArtifact(artifactRoot, 'installed')
  const stagedArtifact = await inspectArtifact(stagedArtifactRoot, 'staged')
  if (
    !artifactMatchesManifest(artifact, manifest) ||
    !artifactMatchesManifest(stagedArtifact, manifest)
  ) {
    fail('A release artifact does not match the sanitized release manifest')
  }
  return { manifest, artifact }
}

export function parseUploadedVersionId(output) {
  const matches = [
    ...String(output).matchAll(
      /Worker Version ID:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi,
    ),
  ].map((match) => match[1].toLowerCase())
  const uniqueMatches = [...new Set(matches)]
  if (uniqueMatches.length !== 1) {
    fail('OpenNext did not return one exact uploaded Worker version ID')
  }
  return uniqueMatches[0]
}

function normalizeWorkerVersionId(value, label) {
  if (typeof value !== 'string' || !WORKER_VERSION_ID_PATTERN.test(value)) {
    fail(`${label} is not a valid Worker version ID`)
  }
  return value.toLowerCase()
}

export function validateSingleActiveDeployment(deployment) {
  const versions = validateDeploymentPayload(deployment)
  if (versions.length !== 1 || versions[0].percentage !== 100) {
    fail('FreeResumePost must have one exact 100 percent production version')
  }
  return versions[0].version_id
}

const candidateRecordKeys = [
  'schemaVersion',
  'accountId',
  'workerName',
  'currentVersionId',
  'candidateVersionId',
  'sourceHead',
  'sourceTree',
  'packageLockSha256',
  'artifactSha256',
]

export function validateCandidateRecord(record, expected) {
  if (
    !record ||
    typeof record !== 'object' ||
    Array.isArray(record) ||
    JSON.stringify(Object.keys(record).sort()) !==
      JSON.stringify([...candidateRecordKeys].sort())
  ) {
    fail('The FreeResumePost candidate record has an invalid shape')
  }
  const exactValues = {
    schemaVersion: 1,
    accountId: EXPECTED_CLOUDFLARE_ACCOUNT_ID,
    workerName: EXPECTED_CLOUDFLARE_WORKER_NAME,
    currentVersionId: normalizeWorkerVersionId(
      expected.currentVersionId,
      'Expected current production version',
    ),
    candidateVersionId: normalizeWorkerVersionId(
      expected.candidateVersionId,
      'Expected candidate Worker version',
    ),
    sourceHead: expected.manifest.sourceHead,
    sourceTree: expected.manifest.sourceTree,
    packageLockSha256: expected.manifest.packageLockSha256,
    artifactSha256: expected.manifest.aggregateSha256,
  }
  for (const [name, value] of Object.entries(exactValues)) {
    if (record[name] !== value) {
      fail(`The FreeResumePost candidate record has the wrong ${name}`)
    }
  }
  if (record.currentVersionId === record.candidateVersionId) {
    fail('The candidate record cannot point at the production version')
  }
  return record
}

export function readCandidateRecord(expected) {
  let record
  try {
    if (lstatSync(candidateRecordPath).isSymbolicLink()) {
      fail('The FreeResumePost candidate record cannot be symbolic')
    }
    record = JSON.parse(readFileSync(candidateRecordPath, 'utf8'))
  } catch (error) {
    if (error instanceof Error && error.message.includes('cannot be symbolic')) {
      throw error
    }
    fail('No valid FreeResumePost candidate record exists. Run npm run cf:upload first')
  }
  return validateCandidateRecord(record, expected)
}

function writeCandidateRecord(record, expected) {
  validateCandidateRecord(record, expected)
  if (existsSync(candidateRecordPath) && lstatSync(candidateRecordPath).isSymbolicLink()) {
    fail('The FreeResumePost candidate record cannot be symbolic')
  }
  writeFileSync(candidateRecordPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
}

async function main() {
  await fullPreflight()
  const bindingCheck = resolve(
    stagedWorktreeRoot,
    'scripts',
    'check-cloudflare-bindings.mjs',
  )
  const cloudflareEnvironment = uploadCloudflareEnvironment()
  run(process.execPath, [bindingCheck], {
    stdio: 'inherit',
    env: cloudflareEnvironment,
  })

  const deploymentBefore = runWranglerJson(
    ['deployments', 'status'],
    cloudflareEnvironment,
  )
  const currentVersionId = validateSingleActiveDeployment(deploymentBefore)

  const uploadPreflight = await fullPreflight()

  const openNextCli = resolve(
    nodeModules,
    '@opennextjs',
    'cloudflare',
    'dist',
    'cli',
    'index.js',
  )
  const upload = runCaptured(
    process.execPath,
    [openNextCli, 'upload', '--strict', '--keep-vars'],
    { cwd: stagedWorktreeRoot, env: cloudflareEnvironment },
  )
  const candidateVersionId = parseUploadedVersionId(
    `${upload.stdout ?? ''}\n${upload.stderr ?? ''}`,
  )
  if (candidateVersionId === currentVersionId) {
    fail('The uploaded version matches the active production version')
  }
  process.stdout.write(
    `${JSON.stringify({ uploadedVersionId: candidateVersionId, traffic: 0 })}\n`,
  )
  run(process.execPath, [bindingCheck, '--version', candidateVersionId], {
    stdio: 'inherit',
    env: cloudflareEnvironment,
  })
  const deploymentAfter = runWranglerJson(
    ['deployments', 'status'],
    cloudflareEnvironment,
  )
  validateDeploymentSnapshotUnchanged(deploymentBefore, deploymentAfter)
  candidateTrafficObservation(deploymentAfter, candidateVersionId)

  const uploadPostflight = await fullPreflight()
  if (
    JSON.stringify(uploadPostflight.manifest) !==
      JSON.stringify(uploadPreflight.manifest) ||
    !artifactMatchesManifest(uploadPostflight.artifact, uploadPreflight.manifest)
  ) {
    fail('The release state changed during upload')
  }

  const record = {
    schemaVersion: 1,
    accountId: EXPECTED_CLOUDFLARE_ACCOUNT_ID,
    workerName: EXPECTED_CLOUDFLARE_WORKER_NAME,
    currentVersionId,
    candidateVersionId,
    sourceHead: uploadPostflight.manifest.sourceHead,
    sourceTree: uploadPostflight.manifest.sourceTree,
    packageLockSha256: uploadPostflight.manifest.packageLockSha256,
    artifactSha256: uploadPostflight.manifest.aggregateSha256,
  }
  writeCandidateRecord(record, {
    currentVersionId,
    candidateVersionId,
    manifest: uploadPostflight.manifest,
  })
  process.stdout.write(`${JSON.stringify(record, null, 2)}\n`)
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) await main()
