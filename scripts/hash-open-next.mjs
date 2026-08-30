import { createHash } from 'node:crypto'
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'

const root = resolve('.open-next')
const outputFlag = process.argv.indexOf('--output')
const output = outputFlag >= 0 ? process.argv[outputFlag + 1] : null

if (outputFlag >= 0 && !output) {
  throw new Error('Pass a path after --output.')
}
if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
  throw new Error(`OpenNext artifact is missing: ${root}`)
}

const files = []
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = resolve(directory, entry.name)
    if (entry.isSymbolicLink()) {
      throw new Error(`Refusing to hash symbolic link: ${fullPath}`)
    }
    if (entry.isDirectory()) walk(fullPath)
    else if (entry.isFile()) files.push(fullPath)
  }
}

walk(root)

const lines = files
  .map((file) => {
    const path = relative(root, file).split(sep).join('/')
    const hash = createHash('sha256').update(readFileSync(file)).digest('hex')
    return `${hash}  ${path}`
  })
  .sort((left, right) => left.localeCompare(right, 'en'))

const manifest = `${lines.join('\n')}\n`
const aggregateSha256 = createHash('sha256').update(manifest, 'utf8').digest('hex')

if (output) {
  const outputPath = resolve(output)
  if (outputPath === root || outputPath.startsWith(`${root}${sep}`)) {
    throw new Error('Write the manifest outside .open-next so the artifact stays unchanged.')
  }
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, manifest, 'utf8')
}

process.stdout.write(
  `${JSON.stringify({
    root,
    fileCount: lines.length,
    aggregateSha256,
    manifestPath: output ? resolve(output) : null,
  })}\n`,
)
