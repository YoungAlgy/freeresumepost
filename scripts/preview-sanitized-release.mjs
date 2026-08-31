import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fullPreflight } from './upload-sanitized-release.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '..')
const stagedWorktree = resolve(repositoryRoot, '.release-build', 'worktree')
const openNextCli = resolve(
  repositoryRoot,
  'node_modules',
  '@opennextjs',
  'cloudflare',
  'dist',
  'cli',
  'index.js',
)
const PRODUCT_AND_CLOUDFLARE_CONFIG_NAMES = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'FREERESUMEPOST_SUPPORT_EMAIL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TURNSTILE_SECRET_KEY',
  'GEMINI_API_KEY',
  'TAILOR_COOKIE_SECRET',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_API_KEY',
  'CLOUDFLARE_EMAIL',
  'CLOUDFLARE_ACCOUNT_ID',
]

function fail(message) {
  throw new Error(message)
}

function localPreviewEnvironment(environment = process.env) {
  const childEnvironment = { ...environment }
  for (const name of PRODUCT_AND_CLOUDFLARE_CONFIG_NAMES) {
    delete childEnvironment[name]
  }
  return childEnvironment
}

async function main() {
  if (process.argv.length !== 2) {
    fail('The sanitized local preview accepts no arguments')
  }
  const before = await fullPreflight()
  const result = spawnSync(process.execPath, [openNextCli, 'preview'], {
    cwd: stagedWorktree,
    env: localPreviewEnvironment(),
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    fail(`The sanitized local preview exited with code ${result.status}`)
  }
  const after = await fullPreflight()
  if (JSON.stringify(before.manifest) !== JSON.stringify(after.manifest)) {
    fail('The release manifest changed during the sanitized local preview')
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) await main()
