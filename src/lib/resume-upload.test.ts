import { describe, expect, it, vi } from 'vitest'
import {
  attachUploadedResumeOrCleanUp,
  hasDocxOoxmlStructure,
  hasExpectedResumeSignature,
  hasPdfEofMarker,
  validateResumeUpload,
} from './resume-upload'

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const encoder = new TextEncoder()

function uint16(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff])
}

function uint32(value: number): Uint8Array {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ])
}

function combine(...chunks: Uint8Array[]): Uint8Array {
  const bytes = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return bytes
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

function createStoredZip(fileNames: string[]): Uint8Array {
  const localFiles: Uint8Array[] = []
  const centralFiles: Uint8Array[] = []
  let localOffset = 0

  for (const fileName of fileNames) {
    const name = encoder.encode(fileName)
    const contents = encoder.encode('<xml/>')
    const local = combine(
      uint32(0x04034b50),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(contents.length),
      uint32(contents.length),
      uint16(name.length),
      uint16(0),
      name,
      contents,
    )
    const central = combine(
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(contents.length),
      uint32(contents.length),
      uint16(name.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(localOffset),
      name,
    )
    localFiles.push(local)
    centralFiles.push(central)
    localOffset += local.length
  }

  const localSection = combine(...localFiles)
  const centralSection = combine(...centralFiles)
  const eocd = combine(
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(fileNames.length),
    uint16(fileNames.length),
    uint32(centralSection.length),
    uint32(localSection.length),
    uint16(0),
  )
  return combine(localSection, centralSection, eocd)
}

describe('resume upload server validation', () => {
  it('recognizes the expected PDF and ZIP signatures', () => {
    expect(hasExpectedResumeSignature(encoder.encode('%PDF-1.7'), 'pdf')).toBe(true)
    expect(hasExpectedResumeSignature(new Uint8Array([0x50, 0x4b, 0x03, 0x04]), 'docx')).toBe(
      true,
    )
    expect(hasExpectedResumeSignature(encoder.encode('plain text'), 'pdf')).toBe(false)
    expect(hasExpectedResumeSignature(encoder.encode('%PDF-1.7'), 'docx')).toBe(false)
  })

  it('requires a final PDF EOF marker', () => {
    expect(hasPdfEofMarker(encoder.encode('%PDF-1.7\nbody\n%%EOF\n'))).toBe(true)
    expect(hasPdfEofMarker(encoder.encode('%PDF-1.7\nbody'))).toBe(false)
    expect(hasPdfEofMarker(encoder.encode('%PDF-1.7\n%%EOF\nappended'))).toBe(false)
  })

  it('requires real DOCX central-directory markers and local entries', () => {
    const docx = createStoredZip([
      '[Content_Types].xml',
      '_rels/.rels',
      'word/document.xml',
    ])
    const genericZip = createStoredZip(['notes.txt'])

    expect(hasDocxOoxmlStructure(docx)).toBe(true)
    expect(hasDocxOoxmlStructure(genericZip)).toBe(false)
  })

  it('accepts a structurally valid PDF or DOCX with an exact MIME match', async () => {
    const pdf = new File([encoder.encode('%PDF-1.7\nbody\n%%EOF\n')], 'resume.pdf', {
      type: 'application/pdf',
    })
    const docxBytes = createStoredZip([
      '[Content_Types].xml',
      '_rels/.rels',
      'word/document.xml',
    ])
    const docx = new File([asArrayBuffer(docxBytes)], 'resume.docx', { type: DOCX_MIME })

    await expect(validateResumeUpload(pdf)).resolves.toMatchObject({
      ok: true,
      value: { extension: 'pdf' },
    })
    await expect(validateResumeUpload(docx)).resolves.toMatchObject({
      ok: true,
      value: { extension: 'docx' },
    })
  })

  it('rejects renamed, type-confused, truncated, and generic ZIP files', async () => {
    const zipNamedPdf = new File(
      [asArrayBuffer(createStoredZip(['notes.txt']))],
      'resume.pdf',
      { type: 'application/pdf' },
    )
    const pdfNamedDocx = new File(
      [encoder.encode('%PDF-1.7\n%%EOF\n')],
      'resume.docx',
      { type: DOCX_MIME },
    )
    const truncatedPdf = new File([encoder.encode('%PDF-1.7\nbody')], 'resume.pdf', {
      type: 'application/pdf',
    })
    const genericZip = new File(
      [asArrayBuffer(createStoredZip(['notes.txt']))],
      'resume.docx',
      { type: DOCX_MIME },
    )

    await expect(validateResumeUpload(zipNamedPdf)).resolves.toMatchObject({ ok: false })
    await expect(validateResumeUpload(pdfNamedDocx)).resolves.toMatchObject({ ok: false })
    await expect(validateResumeUpload(truncatedPdf)).resolves.toMatchObject({ ok: false })
    await expect(validateResumeUpload(genericZip)).resolves.toMatchObject({ ok: false })
  })
})

describe('resume attachment cleanup', () => {
  it('keeps the object after a successful attachment', async () => {
    const remove = vi.fn().mockResolvedValue(undefined)
    await expect(
      attachUploadedResumeOrCleanUp({
        attach: vi.fn().mockResolvedValue(true),
        remove,
      }),
    ).resolves.toBe(true)
    expect(remove).not.toHaveBeenCalled()
  })

  it('deletes the just-uploaded object after a rejected or thrown attachment', async () => {
    const rejectedRemove = vi.fn().mockResolvedValue(undefined)
    await expect(
      attachUploadedResumeOrCleanUp({
        attach: vi.fn().mockResolvedValue(false),
        remove: rejectedRemove,
      }),
    ).resolves.toBe(false)
    expect(rejectedRemove).toHaveBeenCalledOnce()

    const thrownRemove = vi.fn().mockResolvedValue(undefined)
    await expect(
      attachUploadedResumeOrCleanUp({
        attach: vi.fn().mockRejectedValue(new Error('attach failed')),
        remove: thrownRemove,
      }),
    ).rejects.toThrow('attach failed')
    expect(thrownRemove).toHaveBeenCalledOnce()
  })
})
