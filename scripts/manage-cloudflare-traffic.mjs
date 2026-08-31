import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  EXPECTED_CLOUDFLARE_WORKER_NAME,
  pinnedCloudflareEnvironment,
  validateDeploymentPayload,
} from './check-cloudflare-bindings.mjs'
import {
  fullPreflight,
  readCandidateRecord,
} from './upload-sanitized-release.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '..')
const stagedWorktree = resolve(repositoryRoot, '.release-build', 'worktree')
const stagedWranglerConfig = resolve(stagedWorktree, 'wrangler.jsonc')
const wranglerCli = resolve(
  repositoryRoot,
  'node_modules',
  'wrangler',
  'bin',
  'wrangler.js',
)
const bindingCheck = resolve(
  stagedWorktree,
  'scripts',
  'check-cloudflare-bindings.mjs',
)
const WORKER_VERSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RUNTIME_CONFIG_NAMES = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'FREERESUMEPOST_SUPPORT_EMAIL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TURNSTILE_SECRET_KEY',
  'GEMINI_API_KEY',
  'TAILOR_COOKIE_SECRET',
]

function fail(message) {
  throw new Error(message)
}

function cloudflareEnvironment(environment = process.env) {
  const childEnvironment = pinnedCloudflareEnvironment(environment)
  for (const name of RUNTIME_CONFIG_NAMES) delete childEnvironment[name]
  return childEnvironment
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: stagedWorktree,
    env: cloudflareEnvironment(),
    encoding: 'utf8',
    ...options,
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    fail(`${command} ${args.join(' ')} failed with exit code ${result.status}`)
  }
  return result.stdout ?? ''
}

function stagedWorkerArguments(args) {
  return [
    ...args,
    '--name',
    EXPECTED_CLOUDFLARE_WORKER_NAME,
    '--config',
    stagedWranglerConfig,
  ]
}

function runWranglerJson(args) {
  const output = run(process.execPath, [
    wranglerCli,
    ...stagedWorkerArguments([...args, '--json']),
  ])
  try {
    return JSON.parse(output)
  } catch {
    fail('Wrangler returned invalid JSON')
  }
}

function runBindingCheck(args, label) {
  try {
    run(process.execPath, [bindingCheck, ...args], { stdio: 'inherit' })
  } catch {
    fail(`${label} failed`)
  }
}

function normalizeWorkerVersionId(value, label) {
  if (typeof value !== 'string' || !WORKER_VERSION_ID_PATTERN.test(value)) {
    fail(`${label} is not a valid Worker version ID`)
  }
  return value.toLowerCase()
}

function normalizedDeploymentVersions(deployment) {
  return validateDeploymentPayload(deployment)
    .map((version) => ({
      versionId: version.version_id,
      percentage: version.percentage,
    }))
    .sort((left, right) => left.versionId.localeCompare(right.versionId))
}

export function validateDeploymentUnchanged(before, after, context) {
  if (
    typeof before?.id !== 'string' ||
    before.id.length === 0 ||
    before.id !== after?.id ||
    JSON.stringify(normalizedDeploymentVersions(before)) !==
      JSON.stringify(normalizedDeploymentVersions(after))
  ) {
    fail(`Production traffic changed during ${context}`)
  }
}

export function validateTrafficState(
  deployment,
  { phase, currentVersionId, candidateVersionId },
) {
  const current = normalizeWorkerVersionId(
    currentVersionId,
    'Current production version',
  )
  const candidate = normalizeWorkerVersionId(
    candidateVersionId,
    phase.startsWith('rollback')
      ? 'Previous production version'
      : 'Candidate Worker version',
  )
  if (current === candidate) {
    fail('Current and target Worker versions must be different')
  }
  const versions = normalizedDeploymentVersions(deployment)
  let expected
  if (
    phase === 'stage-before' ||
    phase === 'rollback-before' ||
    phase === 'unstage-after'
  ) {
    expected = [{ versionId: current, percentage: 100 }]
  } else if (
    phase === 'stage-after' ||
    phase === 'promote-before' ||
    phase === 'unstage-before'
  ) {
    expected = [
      { versionId: current, percentage: 100 },
      { versionId: candidate, percentage: 0 },
    ].sort((left, right) => left.versionId.localeCompare(right.versionId))
  } else if (phase === 'promote-after' || phase === 'rollback-after') {
    expected = [{ versionId: candidate, percentage: 100 }]
  } else {
    fail('Unknown FreeResumePost traffic validation phase')
  }
  if (JSON.stringify(versions) !== JSON.stringify(expected)) {
    fail(`Cloudflare traffic does not match the ${phase} contract`)
  }
  return versions
}

export function classifyTrafficCommandOutcome(
  deployment,
  { beforePhase, afterPhase, currentVersionId, candidateVersionId },
) {
  try {
    validateTrafficState(deployment, {
      phase: afterPhase,
      currentVersionId,
      candidateVersionId,
    })
    return 'desired'
  } catch {
    try {
      validateTrafficState(deployment, {
        phase: beforePhase,
        currentVersionId,
        candidateVersionId,
      })
      return 'unchanged'
    } catch {
      return 'unknown'
    }
  }
}

const USAGE =
  'Usage: node scripts/manage-cloudflare-traffic.mjs <stage --current UUID --candidate UUID|unstage --current UUID --candidate UUID|promote --current UUID --candidate UUID|rollback --current UUID --previous UUID>'

export function parseTrafficArguments(args) {
  if (!Array.isArray(args)) fail('Traffic command arguments are invalid')
  const command = args[0]
  const targetFlag = command === 'rollback' ? '--previous' : '--candidate'
  if (
    !['stage', 'unstage', 'promote', 'rollback'].includes(command) ||
    args.length !== 5 ||
    args[1] !== '--current' ||
    args[3] !== targetFlag
  ) {
    fail(USAGE)
  }
  const currentVersionId = normalizeWorkerVersionId(
    args[2],
    'Current production version',
  )
  const candidateVersionId = normalizeWorkerVersionId(
    args[4],
    command === 'rollback'
      ? 'Previous production version'
      : 'Candidate Worker version',
  )
  if (currentVersionId === candidateVersionId) {
    fail('Current and target Worker versions must be different')
  }
  return { command, currentVersionId, candidateVersionId }
}

async function runTrafficCommand(releaseCommand) {
  const { command, currentVersionId, candidateVersionId } = releaseCommand
  const initialPreflight = await fullPreflight()
  const recordExpectation =
    command === 'rollback'
      ? {
          currentVersionId: candidateVersionId,
          candidateVersionId: currentVersionId,
        }
      : { currentVersionId, candidateVersionId }
  readCandidateRecord({
    ...recordExpectation,
    manifest: initialPreflight.manifest,
  })

  const beforePhase =
    command === 'stage'
      ? 'stage-before'
      : command === 'promote'
        ? 'promote-before'
        : command === 'unstage'
          ? 'unstage-before'
          : 'rollback-before'
  const afterPhase =
    command === 'stage'
      ? 'stage-after'
      : command === 'promote'
        ? 'promote-after'
        : command === 'unstage'
          ? 'unstage-after'
          : 'rollback-after'

  let versionSpecs
  let message
  if (command === 'stage') {
    versionSpecs = [`${currentVersionId}@100`, `${candidateVersionId}@0`]
    message = 'Stage verified FreeResumePost candidate at zero traffic'
  } else if (command === 'promote') {
    versionSpecs = [`${candidateVersionId}@100`]
    message = 'Promote verified FreeResumePost candidate'
  } else if (command === 'unstage') {
    versionSpecs = [`${currentVersionId}@100`]
    message = 'Remove failed FreeResumePost zero-traffic candidate'
  } else {
    versionSpecs = [`${candidateVersionId}@100`]
    message = 'Rollback to recorded FreeResumePost production version'
  }

  runBindingCheck([], 'Active FreeResumePost binding check')
  runBindingCheck(
    ['--version', candidateVersionId],
    'Target FreeResumePost binding and traffic check',
  )
  const deploymentBefore = runWranglerJson(['deployments', 'status'])
  validateTrafficState(deploymentBefore, {
    phase: beforePhase,
    currentVersionId,
    candidateVersionId,
  })

  const finalPreflight = await fullPreflight()
  if (
    JSON.stringify(finalPreflight.manifest) !==
    JSON.stringify(initialPreflight.manifest)
  ) {
    fail('The release manifest changed during the traffic preflight')
  }
  readCandidateRecord({
    ...recordExpectation,
    manifest: finalPreflight.manifest,
  })
  const deploymentImmediatelyBefore = runWranglerJson(['deployments', 'status'])
  validateDeploymentUnchanged(
    deploymentBefore,
    deploymentImmediatelyBefore,
    'the final traffic preflight',
  )
  validateTrafficState(deploymentImmediatelyBefore, {
    phase: beforePhase,
    currentVersionId,
    candidateVersionId,
  })

  let trafficCommandError = null
  try {
    run(
      process.execPath,
      [
        wranglerCli,
        ...stagedWorkerArguments([
          'versions',
          'deploy',
          ...versionSpecs,
          '--yes',
          '--message',
          message,
        ]),
      ],
      { stdio: 'inherit' },
    )
  } catch (error) {
    trafficCommandError = error
  }

  let deploymentAfter
  try {
    deploymentAfter = runWranglerJson(['deployments', 'status'])
  } catch {
    fail(
      `The FreeResumePost ${command} command ${
        trafficCommandError ? 'failed' : 'returned success'
      }, but live traffic is UNKNOWN because the status check failed. Stop and verify it manually`,
    )
  }
  const outcome = classifyTrafficCommandOutcome(deploymentAfter, {
    beforePhase,
    afterPhase,
    currentVersionId,
    candidateVersionId,
  })
  if (trafficCommandError) {
    if (outcome === 'desired') {
      fail(
        `Wrangler reported that FreeResumePost ${command} failed, but read-only verification shows the requested traffic state was applied. Stop and verify it manually`,
      )
    }
    if (outcome === 'unchanged') {
      fail(
        `FreeResumePost ${command} failed and read-only verification shows traffic stayed unchanged`,
      )
    }
    fail(
      `FreeResumePost ${command} failed and live traffic is UNKNOWN. Stop and verify it manually`,
    )
  }
  if (outcome !== 'desired') {
    fail(
      `FreeResumePost ${command} returned success but did not reach the exact requested traffic state. Live traffic is ${outcome.toUpperCase()}. Stop and verify it manually`,
    )
  }

  runBindingCheck([], 'Post-change active FreeResumePost binding check')
  if (command === 'stage' || command === 'unstage') {
    runBindingCheck(
      ['--version', candidateVersionId],
      'Post-change zero-traffic candidate check',
    )
  }
  const postflight = await fullPreflight()
  if (
    JSON.stringify(postflight.manifest) !==
    JSON.stringify(initialPreflight.manifest)
  ) {
    fail('The release manifest changed during the traffic command')
  }
  process.stdout.write(
    `${JSON.stringify({
      worker: EXPECTED_CLOUDFLARE_WORKER_NAME,
      command,
      outcome,
      versions: normalizedDeploymentVersions(deploymentAfter),
    })}\n`,
  )
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  await runTrafficCommand(parseTrafficArguments(process.argv.slice(2)))
}
