import { inspectResumeFile, type ResumeFileDetails } from './resume-file'

export type ValidatedResumeUpload = ResumeFileDetails & {
  bytes: Uint8Array
}

const PDF_EOF_MARKER = new Uint8Array([0x25, 0x25, 0x45, 0x4f, 0x46])
const ZIP_LOCAL_FILE_HEADER = 0x04034b50
const ZIP_CENTRAL_FILE_HEADER = 0x02014b50
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50
const ZIP_EOCD_MIN_BYTES = 22
const ZIP_MAX_COMMENT_BYTES = 65_535
const REQUIRED_DOCX_PARTS = new Set([
  '[Content_Types].xml',
  '_rels/.rels',
  'word/document.xml',
])

function hasPdfSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  )
}

function hasDocxSignature(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && readUint32Le(bytes, 0) === ZIP_LOCAL_FILE_HEADER
}

function readUint16Le(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 2 > bytes.length) return -1
  return bytes[offset] | (bytes[offset + 1] << 8)
}

function readUint32Le(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > bytes.length) return -1
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0
}

function bytesMatch(bytes: Uint8Array, offset: number, expected: Uint8Array): boolean {
  if (offset < 0 || offset + expected.length > bytes.length) return false
  for (let index = 0; index < expected.length; index += 1) {
    if (bytes[offset + index] !== expected[index]) return false
  }
  return true
}

function isPdfTrailingWhitespace(byte: number): boolean {
  return byte === 0 || byte === 9 || byte === 10 || byte === 12 || byte === 13 || byte === 32
}

export function hasPdfEofMarker(bytes: Uint8Array): boolean {
  const earliest = Math.max(0, bytes.length - 2048)
  for (let offset = bytes.length - PDF_EOF_MARKER.length; offset >= earliest; offset -= 1) {
    if (!bytesMatch(bytes, offset, PDF_EOF_MARKER)) continue

    let onlyWhitespaceAfter = true
    for (let tail = offset + PDF_EOF_MARKER.length; tail < bytes.length; tail += 1) {
      if (!isPdfTrailingWhitespace(bytes[tail])) {
        onlyWhitespaceAfter = false
        break
      }
    }
    if (onlyWhitespaceAfter) return true
  }
  return false
}

function findZipEocd(bytes: Uint8Array): number {
  if (bytes.length < ZIP_EOCD_MIN_BYTES) return -1
  const earliest = Math.max(
    0,
    bytes.length - ZIP_EOCD_MIN_BYTES - ZIP_MAX_COMMENT_BYTES,
  )
  for (let offset = bytes.length - ZIP_EOCD_MIN_BYTES; offset >= earliest; offset -= 1) {
    if (readUint32Le(bytes, offset) === ZIP_END_OF_CENTRAL_DIRECTORY) return offset
  }
  return -1
}

export function hasDocxOoxmlStructure(bytes: Uint8Array): boolean {
  if (!hasDocxSignature(bytes)) return false

  const eocdOffset = findZipEocd(bytes)
  if (eocdOffset < 0) return false

  const diskNumber = readUint16Le(bytes, eocdOffset + 4)
  const centralDirectoryDisk = readUint16Le(bytes, eocdOffset + 6)
  const entriesOnDisk = readUint16Le(bytes, eocdOffset + 8)
  const totalEntries = readUint16Le(bytes, eocdOffset + 10)
  const centralDirectorySize = readUint32Le(bytes, eocdOffset + 12)
  const centralDirectoryOffset = readUint32Le(bytes, eocdOffset + 16)
  const commentLength = readUint16Le(bytes, eocdOffset + 20)

  if (
    diskNumber !== 0 ||
    centralDirectoryDisk !== 0 ||
    totalEntries <= 0 ||
    entriesOnDisk !== totalEntries ||
    commentLength < 0 ||
    eocdOffset + ZIP_EOCD_MIN_BYTES + commentLength !== bytes.length
  ) {
    return false
  }

  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize
  if (
    centralDirectorySize <= 0 ||
    centralDirectoryOffset < 0 ||
    centralDirectoryEnd !== eocdOffset ||
    centralDirectoryEnd > bytes.length
  ) {
    return false
  }

  const foundParts = new Set<string>()
  const decoder = new TextDecoder()
  let offset = centralDirectoryOffset

  for (let entry = 0; entry < totalEntries; entry += 1) {
    if (
      offset + 46 > centralDirectoryEnd ||
      readUint32Le(bytes, offset) !== ZIP_CENTRAL_FILE_HEADER
    ) {
      return false
    }

    const flags = readUint16Le(bytes, offset + 8)
    const compressionMethod = readUint16Le(bytes, offset + 10)
    const compressedSize = readUint32Le(bytes, offset + 20)
    const uncompressedSize = readUint32Le(bytes, offset + 24)
    const fileNameLength = readUint16Le(bytes, offset + 28)
    const extraFieldLength = readUint16Le(bytes, offset + 30)
    const fileCommentLength = readUint16Le(bytes, offset + 32)
    const localHeaderOffset = readUint32Le(bytes, offset + 42)
    const fileNameStart = offset + 46
    const fileNameEnd = fileNameStart + fileNameLength
    const nextEntry = fileNameEnd + extraFieldLength + fileCommentLength

    if (
      fileNameLength <= 0 ||
      nextEntry > centralDirectoryEnd ||
      localHeaderOffset + 30 > centralDirectoryOffset ||
      readUint32Le(bytes, localHeaderOffset) !== ZIP_LOCAL_FILE_HEADER
    ) {
      return false
    }

    const fileName = decoder.decode(bytes.subarray(fileNameStart, fileNameEnd))
    const localNameLength = readUint16Le(bytes, localHeaderOffset + 26)
    const localExtraLength = readUint16Le(bytes, localHeaderOffset + 28)
    const localNameStart = localHeaderOffset + 30
    const localNameEnd = localNameStart + localNameLength
    const fileDataStart = localNameEnd + localExtraLength

    if (
      decoder.decode(bytes.subarray(localNameStart, localNameEnd)) !== fileName ||
      fileDataStart + compressedSize > centralDirectoryOffset
    ) {
      return false
    }

    if (REQUIRED_DOCX_PARTS.has(fileName)) {
      if (
        (flags & 0x0001) !== 0 ||
        (compressionMethod !== 0 && compressionMethod !== 8) ||
        compressedSize <= 0 ||
        uncompressedSize <= 0
      ) {
        return false
      }
      foundParts.add(fileName)
    }

    offset = nextEntry
  }

  return offset === centralDirectoryEnd && foundParts.size === REQUIRED_DOCX_PARTS.size
}

export function hasExpectedResumeSignature(
  bytes: Uint8Array,
  extension: ResumeFileDetails['extension'],
): boolean {
  return extension === 'pdf' ? hasPdfSignature(bytes) : hasDocxSignature(bytes)
}

export async function validateResumeUpload(
  file: File,
): Promise<
  | { ok: true; value: ValidatedResumeUpload }
  | { ok: false; error: string }
> {
  const inspected = inspectResumeFile(file)
  if (!inspected.ok) return inspected

  let bytes: Uint8Array
  try {
    bytes = new Uint8Array(await file.arrayBuffer())
  } catch {
    return { ok: false, error: 'That file could not be read. Choose another resume.' }
  }

  const hasSignature = hasExpectedResumeSignature(bytes, inspected.value.extension)
  const hasStructure =
    inspected.value.extension === 'pdf'
      ? hasPdfEofMarker(bytes)
      : hasDocxOoxmlStructure(bytes)

  if (bytes.length !== file.size || !hasSignature || !hasStructure) {
    return {
      ok: false,
      error: `That ${inspected.value.extension.toUpperCase()} file is damaged or unreadable.`,
    }
  }

  return {
    ok: true,
    value: {
      ...inspected.value,
      bytes,
    },
  }
}

export async function attachUploadedResumeOrCleanUp(input: {
  attach: () => Promise<boolean>
  remove: () => Promise<void>
}): Promise<boolean> {
  let attached = false
  try {
    attached = await input.attach()
    return attached
  } finally {
    if (!attached) await input.remove()
  }
}
