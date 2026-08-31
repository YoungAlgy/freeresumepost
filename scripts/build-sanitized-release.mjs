import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { init as initModuleLexer, parse as parseModule } from 'es-module-lexer'
import JSON5 from 'json5'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '..')
const releaseRoot = resolve(repositoryRoot, '.release-build')
const worktreeRoot = resolve(releaseRoot, 'worktree')
const rootNodeModules = resolve(repositoryRoot, 'node_modules')
const stagedNodeModules = resolve(worktreeRoot, 'node_modules')
const isolatedToolHome = resolve(releaseRoot, 'tool-home')
const isolatedAppData = resolve(isolatedToolHome, 'appdata')
const expectedProjectRef = 'tsruqbodyrmxqzhvxret'

const buildSafeConfigNames = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'FREERESUMEPOST_SUPPORT_EMAIL',
]

const privateRuntimeConfigNames = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'TURNSTILE_SECRET_KEY',
  'GEMINI_API_KEY',
  'TAILOR_COOKIE_SECRET',
]

const inheritedSystemNames = new Set([
  'CI',
  'COMSPEC',
  'ComSpec',
  'GITHUB_ACTIONS',
  'GITHUB_SHA',
  'NUMBER_OF_PROCESSORS',
  'OS',
  'PATH',
  'PATHEXT',
  'Path',
  'PROCESSOR_ARCHITECTURE',
  'PROGRAMDATA',
  'PROGRAMFILES',
  'ProgramData',
  'ProgramFiles',
  'SystemDrive',
  'SYSTEMDRIVE',
  'SystemRoot',
  'SYSTEMROOT',
  'TEMP',
  'TMP',
  'TMPDIR',
  'WINDIR',
])

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

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function installedPackageVersion(packageName) {
  const packagePath = resolve(
    rootNodeModules,
    ...packageName.split('/'),
    'package.json',
  )
  if (!existsSync(packagePath)) fail(`Missing installed release tool: ${packageName}`)
  return JSON.parse(readFileSync(packagePath, 'utf8')).version
}

function dependencyProvenance(packageLockPath) {
  const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'))
  const packageNames = [
    'next',
    '@opennextjs/cloudflare',
    'wrangler',
    'es-module-lexer',
    'json5',
  ]
  const toolVersions = {}
  for (const packageName of packageNames) {
    const installed = installedPackageVersion(packageName)
    const locked = packageLock.packages?.[`node_modules/${packageName}`]?.version
    if (!locked || installed !== locked) {
      fail(`${packageName} does not match the reviewed package lock`)
    }
    toolVersions[packageName] = installed
  }
  return {
    packageLockSha256: sha256File(packageLockPath),
    toolVersions,
  }
}

function removePreviousReleaseRoot() {
  if (relative(repositoryRoot, releaseRoot) !== '.release-build') {
    fail(`Refusing to clean an unexpected release path: ${releaseRoot}`)
  }
  if (!existsSync(releaseRoot)) return
  if (lstatSync(releaseRoot).isSymbolicLink()) {
    fail(`Refusing to clean a symbolic release root: ${releaseRoot}`)
  }
  if (existsSync(stagedNodeModules) && lstatSync(stagedNodeModules).isSymbolicLink()) {
    unlinkSync(stagedNodeModules)
  }
  rmSync(releaseRoot, { recursive: true, force: true })
}

function trackedFiles() {
  const output = run('git', ['ls-files', '-z', '--cached'], { encoding: 'buffer' })
  return output
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
}

function assertReleaseSourceIsCommitted() {
  const status = run('git', [
    'status',
    '--porcelain=v1',
    '--untracked-files=all',
  ]).trim()
  if (status) {
    fail(
      'Release source is not clean. Commit the reviewed source before building so the artifact maps to one exact Git revision.',
    )
  }
}

function stageTrackedSource() {
  for (const trackedPath of trackedFiles()) {
    const normalized = trackedPath.split('\\').join('/')
    if (/^\.env(?:\.|$)/.test(normalized) && normalized !== '.env.example') {
      fail(`Refusing to stage a tracked environment file: ${normalized}`)
    }
  }
  const destinationPrefix = `${worktreeRoot}${sep}`.split('\\').join('/')
  run('git', ['checkout-index', '--all', `--prefix=${destinationPrefix}`])
}

export function validateBuildSafeConfig(config) {
  const missing = buildSafeConfigNames.filter((name) => !config[name])
  if (missing.length > 0) {
    fail(
      `Missing release-safe build configuration: ${missing.join(', ')}. ` +
        'Pass these public product values in the command environment. Private .env files are never loaded.',
    )
  }
  for (const name of buildSafeConfigNames) {
    if (config[name].includes('<') || config[name].includes('>')) {
      fail(`${name} contains a placeholder instead of a release value`)
    }
  }

  let supabaseUrl
  try {
    supabaseUrl = new URL(config.NEXT_PUBLIC_SUPABASE_URL)
  } catch {
    fail('NEXT_PUBLIC_SUPABASE_URL is not a valid URL')
  }
  if (
    supabaseUrl.origin !== 'https://tsruqbodyrmxqzhvxret.supabase.co' ||
    supabaseUrl.pathname !== '/' ||
    supabaseUrl.search ||
    supabaseUrl.hash ||
    supabaseUrl.username ||
    supabaseUrl.password
  ) {
    fail('NEXT_PUBLIC_SUPABASE_URL must identify the expected Supabase project')
  }
  if (
    config.NEXT_PUBLIC_SUPABASE_ANON_KEY.length < 20 ||
    /\s/.test(config.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ) {
    fail('NEXT_PUBLIC_SUPABASE_ANON_KEY is malformed')
  }
  validateSupabasePublicKey(config.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (
    config.NEXT_PUBLIC_TURNSTILE_SITE_KEY.length < 10 ||
    /\s/.test(config.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  ) {
    fail('NEXT_PUBLIC_TURNSTILE_SITE_KEY is malformed')
  }
  if (
    !/^[a-z0-9][a-z0-9._%+-]*@freeresumepost\.co$/i.test(
      config.FREERESUMEPOST_SUPPORT_EMAIL,
    )
  ) {
    fail('FREERESUMEPOST_SUPPORT_EMAIL must be owned by freeresumepost.co')
  }
  return config
}

function loadBuildSafeConfig() {
  const config = {}
  for (const name of buildSafeConfigNames) {
    if (process.env[name]) config[name] = process.env[name]
  }
  return validateBuildSafeConfig(config)
}

export function validateSupabasePublicKey(value) {
  if (/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(value)) return
  if (value.startsWith('sb_secret_')) {
    fail('NEXT_PUBLIC_SUPABASE_ANON_KEY received a Supabase secret key')
  }

  const segments = value.split('.')
  if (segments.length === 3) {
    try {
      const payload = JSON.parse(
        Buffer.from(segments[1], 'base64url').toString('utf8'),
      )
      if (payload?.role === 'anon' && payload?.ref === expectedProjectRef) return
    } catch {
      // The generic error below keeps the supplied value out of logs.
    }
  }
  fail(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY must be a publishable key or the expected project legacy anon key',
  )
}

export async function verifySupabasePublicKeyForProject(
  value,
  fetchImplementation = globalThis.fetch,
) {
  if (typeof fetchImplementation !== 'function') {
    fail('No fetch implementation is available for the Supabase key check')
  }

  let response
  try {
    response = await fetchImplementation(
      `https://${expectedProjectRef}.supabase.co/auth/v1/settings`,
      {
        method: 'GET',
        headers: { apikey: value },
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      },
    )
  } catch {
    fail('The Supabase public key ownership check could not be completed')
  }
  try {
    if (!response?.ok) {
      fail('NEXT_PUBLIC_SUPABASE_ANON_KEY was not accepted by the expected project')
    }
  } finally {
    await response?.body?.cancel?.()
  }
}

function sanitizedChildEnvironment(config) {
  const environment = {}
  for (const [name, value] of Object.entries(process.env)) {
    if (inheritedSystemNames.has(name) && value) environment[name] = value
  }
  environment.NODE_ENV = 'production'
  environment.NEXT_TELEMETRY_DISABLED = '1'
  environment.HOME = isolatedToolHome
  environment.USERPROFILE = isolatedToolHome
  environment.APPDATA = isolatedAppData
  environment.LOCALAPPDATA = isolatedAppData
  for (const name of buildSafeConfigNames) environment[name] = config[name]
  for (const name of privateRuntimeConfigNames) delete environment[name]
  return environment
}

function walkFiles(directory) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isSymbolicLink()) fail(`Refusing to inspect symbolic artifact path: ${path}`)
    if (entry.isDirectory()) files.push(...walkFiles(path))
    else if (entry.isFile()) files.push(path)
  }
  return files
}

export async function hasDoQueueHandlerExport(source) {
  await initModuleLexer
  const [, exports] = parseModule(source)
  return exports.some((entry) => entry.n === 'DOQueueHandler')
}

export function validateWranglerReleaseConfig(config) {
  const exactKeys = (value, expected) =>
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort()) ===
      JSON.stringify([...expected].sort())
  const invalid = []
  const expectedTopLevelKeys = [
    '$schema',
    'name',
    'main',
    'compatibility_date',
    'compatibility_flags',
    'cache',
    'routes',
    'workers_dev',
    'vars',
    'assets',
    'r2_buckets',
    'd1_databases',
    'durable_objects',
    'migrations',
    'services',
  ]
  if (!exactKeys(config, expectedTopLevelKeys)) invalid.push('top-level keys')
  if (config?.$schema !== 'node_modules/wrangler/config-schema.json') {
    invalid.push('schema')
  }
  if (config?.name !== 'freeresumepost') invalid.push('worker name')
  if (config?.main !== '.open-next/worker.js') invalid.push('worker entrypoint')
  if (config?.compatibility_date !== '2026-07-01') {
    invalid.push('compatibility date')
  }
  const compatibilityFlags = Array.isArray(config?.compatibility_flags)
    ? [...config.compatibility_flags].sort()
    : []
  if (
    JSON.stringify(compatibilityFlags) !==
    JSON.stringify(['global_fetch_strictly_public', 'nodejs_compat'])
  ) {
    invalid.push('compatibility flags')
  }
  if (!exactKeys(config?.cache, ['enabled']) || config.cache.enabled !== true) {
    invalid.push('cache')
  }
  if (config?.workers_dev !== true) invalid.push('workers.dev setting')
  if (
    !exactKeys(config?.vars, ['NEXT_CACHE_DO_QUEUE_REVALIDATION_TIMEOUT_MS']) ||
    config.vars.NEXT_CACHE_DO_QUEUE_REVALIDATION_TIMEOUT_MS !== '3000'
  ) {
    invalid.push('variables')
  }
  if (
    !exactKeys(config?.assets, ['binding', 'directory', 'run_worker_first']) ||
    config?.assets?.binding !== 'ASSETS' ||
    config?.assets?.directory !== '.open-next/assets' ||
    config?.assets?.run_worker_first !== true
  ) {
    invalid.push('assets')
  }
  const r2Bindings = Array.isArray(config?.r2_buckets) ? config.r2_buckets : []
  const r2 = r2Bindings.find(
    (binding) => binding.binding === 'NEXT_INC_CACHE_R2_BUCKET',
  )
  if (
    r2Bindings.length !== 1 ||
    !exactKeys(r2, ['binding', 'bucket_name']) ||
    r2?.bucket_name !== 'freeresumepost-inc-cache'
  ) {
    invalid.push('R2 cache')
  }
  const d1Bindings = Array.isArray(config?.d1_databases) ? config.d1_databases : []
  const d1 = d1Bindings.find(
    (binding) => binding.binding === 'NEXT_TAG_CACHE_D1',
  )
  if (
    d1Bindings.length !== 1 ||
    !exactKeys(d1, ['binding', 'database_id', 'database_name']) ||
    d1?.database_id !== '28d3df97-14ce-449c-a7ae-376c6c66d8f8' ||
    d1?.database_name !== 'freeresumepost-tag-cache'
  ) {
    invalid.push('D1 cache')
  }
  const durableObjectBindings = Array.isArray(config?.durable_objects?.bindings)
    ? config.durable_objects.bindings
    : []
  const durableObject = durableObjectBindings.find(
    (binding) => binding.name === 'NEXT_CACHE_DO_QUEUE',
  )
  const services = Array.isArray(config?.services) ? config.services : []
  const service = services.find(
    (binding) => binding.binding === 'WORKER_SELF_REFERENCE',
  )
  if (
    durableObjectBindings.length !== 1 ||
    !exactKeys(config?.durable_objects, ['bindings']) ||
    !exactKeys(durableObject, ['class_name', 'name']) ||
    durableObject?.class_name !== 'DOQueueHandler'
  ) {
    invalid.push('Durable Object')
  }
  if (
    services.length !== 1 ||
    !exactKeys(service, ['binding', 'service']) ||
    service?.service !== 'freeresumepost'
  ) {
    invalid.push('self service')
  }
  const routes = (Array.isArray(config?.routes) ? config.routes : [])
    .map((route) =>
      exactKeys(route, ['pattern', 'zone_name'])
        ? `${route.pattern}|${route.zone_name}`
        : 'invalid-route-shape',
    )
    .sort()
  if (
    JSON.stringify(routes) !==
    JSON.stringify([
      'freeresumepost.co/*|freeresumepost.co',
      'www.freeresumepost.co/*|freeresumepost.co',
    ])
  ) {
    invalid.push('routes')
  }
  const migrations = Array.isArray(config?.migrations) ? config.migrations : []
  const migration = migrations[0]
  if (
    migrations.length !== 1 ||
    !exactKeys(migration, ['new_sqlite_classes', 'tag']) ||
    migration?.tag !== 'v1' ||
    JSON.stringify(migration?.new_sqlite_classes) !==
      JSON.stringify(['DOQueueHandler'])
  ) {
    invalid.push('Durable Object migration')
  }

  if (invalid.length > 0) {
    fail(`Wrangler release config mismatch: ${invalid.join(', ')}`)
  }
  return true
}

async function inspectArtifact(artifactRoot) {
  const workerPath = resolve(artifactRoot, 'worker.js')
  const assetsRoot = resolve(artifactRoot, 'assets')
  if (!existsSync(workerPath) || !existsSync(assetsRoot)) {
    fail('OpenNext did not produce worker.js and assets')
  }

  const worker = readFileSync(workerPath, 'utf8')
  if (!(await hasDoQueueHandlerExport(worker))) {
    fail('The generated Worker does not export DOQueueHandler')
  }

  const files = walkFiles(artifactRoot)
  const assets = walkFiles(assetsRoot)
  if (files.length < 2 || assets.length < 1) fail('The OpenNext artifact is incomplete')

  const manifestLines = files
    .map((file) => {
      const path = relative(artifactRoot, file).split(sep).join('/')
      const hash = createHash('sha256').update(readFileSync(file)).digest('hex')
      return `${hash}  ${path}`
    })
    .sort((left, right) => left.localeCompare(right, 'en'))
  const artifactManifest = `${manifestLines.join('\n')}\n`
  return {
    artifactRoot,
    fileCount: files.length,
    assetCount: assets.length,
    aggregateSha256: createHash('sha256')
      .update(artifactManifest, 'utf8')
      .digest('hex'),
  }
}

function removeGeneratedDirectory(path, expectedRelativePath) {
  if (relative(repositoryRoot, path) !== expectedRelativePath) {
    fail(`Refusing to remove an unexpected generated path: ${path}`)
  }
  if (!existsSync(path)) return
  if (lstatSync(path).isSymbolicLink()) {
    fail(`Refusing to replace a symbolic generated path: ${path}`)
  }
  rmSync(path, { recursive: true, force: true })
}

async function installVerifiedArtifact(stagedArtifact) {
  const installedRoot = resolve(repositoryRoot, '.open-next')
  const candidateRoot = resolve(repositoryRoot, '.open-next.release-candidate')
  removeGeneratedDirectory(candidateRoot, '.open-next.release-candidate')
  cpSync(stagedArtifact.artifactRoot, candidateRoot, {
    recursive: true,
    force: false,
    errorOnExist: true,
  })

  const candidate = await inspectArtifact(candidateRoot)
  if (
    candidate.aggregateSha256 !== stagedArtifact.aggregateSha256 ||
    candidate.fileCount !== stagedArtifact.fileCount
  ) {
    fail('The staged artifact changed while it was copied for installation')
  }

  removeGeneratedDirectory(installedRoot, '.open-next')
  renameSync(candidateRoot, installedRoot)
  const installed = await inspectArtifact(installedRoot)
  if (
    installed.aggregateSha256 !== stagedArtifact.aggregateSha256 ||
    installed.fileCount !== stagedArtifact.fileCount
  ) {
    fail('The installed release artifact does not match the verified staging artifact')
  }
  return installed
}

async function main() {
  const config = loadBuildSafeConfig()
  await verifySupabasePublicKeyForProject(
    config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
  const childEnvironment = sanitizedChildEnvironment(config)
  assertReleaseSourceIsCommitted()
  const sourceHead = run('git', ['rev-parse', 'HEAD']).trim()
  const sourceTree = run('git', ['rev-parse', 'HEAD^{tree}']).trim()
  removePreviousReleaseRoot()
  mkdirSync(worktreeRoot, { recursive: true })
  mkdirSync(isolatedAppData, { recursive: true })
  stageTrackedSource()
  if (!existsSync(rootNodeModules)) fail('Run npm install before building a release')
  const provenance = dependencyProvenance(
    resolve(worktreeRoot, 'package-lock.json'),
  )
  symlinkSync(
    rootNodeModules,
    stagedNodeModules,
    process.platform === 'win32' ? 'junction' : 'dir',
  )

  const openNextCli = resolve(
    rootNodeModules,
    '@opennextjs',
    'cloudflare',
    'dist',
    'cli',
    'index.js',
  )
  run(process.execPath, [openNextCli, 'build'], {
    cwd: worktreeRoot,
    env: childEnvironment,
    stdio: 'inherit',
  })

  const stagedArtifact = await inspectArtifact(resolve(worktreeRoot, '.open-next'))
  validateWranglerReleaseConfig(
    JSON5.parse(readFileSync(resolve(worktreeRoot, 'wrangler.jsonc'), 'utf8')),
  )
  const wranglerCli = resolve(rootNodeModules, 'wrangler', 'bin', 'wrangler.js')
  run(
    process.execPath,
    [
      wranglerCli,
      'versions',
      'upload',
      '--dry-run',
      '--config',
      resolve(worktreeRoot, 'wrangler.jsonc'),
      '--outdir',
      resolve(releaseRoot, 'wrangler-dry-run'),
    ],
    {
      cwd: worktreeRoot,
      env: childEnvironment,
      stdio: 'inherit',
    },
  )

  assertReleaseSourceIsCommitted()
  if (
    run('git', ['rev-parse', 'HEAD']).trim() !== sourceHead ||
    run('git', ['rev-parse', 'HEAD^{tree}']).trim() !== sourceTree
  ) {
    fail('Release source changed while the sanitized artifact was being built')
  }
  const postBuildProvenance = dependencyProvenance(
    resolve(worktreeRoot, 'package-lock.json'),
  )
  if (JSON.stringify(postBuildProvenance) !== JSON.stringify(provenance)) {
    fail('Release dependency provenance changed while the artifact was being built')
  }
  const stagedArtifactAfterDryRun = await inspectArtifact(
    resolve(worktreeRoot, '.open-next'),
  )
  if (
    stagedArtifactAfterDryRun.aggregateSha256 !== stagedArtifact.aggregateSha256 ||
    stagedArtifactAfterDryRun.fileCount !== stagedArtifact.fileCount ||
    stagedArtifactAfterDryRun.assetCount !== stagedArtifact.assetCount
  ) {
    fail('The staged release artifact changed during the Wrangler dry run')
  }
  const artifact = await installVerifiedArtifact(stagedArtifactAfterDryRun)
  const artifactManifest = walkFiles(artifact.artifactRoot)
    .map((file) => {
      const path = relative(artifact.artifactRoot, file).split(sep).join('/')
      const hash = createHash('sha256').update(readFileSync(file)).digest('hex')
      return `${hash}  ${path}`
    })
    .sort((left, right) => left.localeCompare(right, 'en'))
    .join('\n')
  const preManifestProvenance = dependencyProvenance(
    resolve(worktreeRoot, 'package-lock.json'),
  )
  if (JSON.stringify(preManifestProvenance) !== JSON.stringify(provenance)) {
    fail('Release dependency provenance changed before the manifest was written')
  }
  writeFileSync(
    resolve(releaseRoot, 'open-next.sha256'),
    `${artifactManifest}\n`,
    'utf8',
  )
  const releaseManifest = {
    product: 'FreeResumePost',
    sourceHead,
    sourceTree,
    packageLockSha256: provenance.packageLockSha256,
    toolVersions: provenance.toolVersions,
    artifactRoot: '.open-next',
    fileCount: artifact.fileCount,
    assetCount: artifact.assetCount,
    aggregateSha256: artifact.aggregateSha256,
    buildConfigNames: buildSafeConfigNames,
    excludedPrivateConfigNames: privateRuntimeConfigNames,
    checks: {
      trackedSourceOnly: true,
      environmentFilesExcluded: true,
      privateRuntimeConfigExcluded: true,
      isolatedToolHome: true,
      publicKeyOwnershipVerified: true,
      dependencyLockMatched: true,
      dependencyProvenanceRecheckedAfterBuild: true,
      doQueueHandlerExported: true,
      wranglerDryRunPassed: true,
      stagedArtifactRecheckedAfterDryRun: true,
      installedArtifactMatchesStaging: true,
    },
  }
  writeFileSync(
    resolve(releaseRoot, 'release-manifest.json'),
    `${JSON.stringify(releaseManifest, null, 2)}\n`,
    'utf8',
  )

  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      sourceHead,
      sourceTree,
      artifactRoot: releaseManifest.artifactRoot,
      fileCount: artifact.fileCount,
      assetCount: artifact.assetCount,
      aggregateSha256: artifact.aggregateSha256,
      releaseManifest: resolve(releaseRoot, 'release-manifest.json'),
    })}\n`,
  )
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) await main()
