import { describe, expect, it } from 'vitest'
import { inspectResumeFile, MAX_RESUME_BYTES } from './resume-file'

describe('inspectResumeFile', () => {
  it('accepts PDF and DOCX files and returns a canonical storage type', () => {
    expect(
      inspectResumeFile({ name: 'resume.PDF', type: 'application/pdf', size: 100 }),
    ).toMatchObject({ ok: true, value: { extension: 'pdf', contentType: 'application/pdf' } })
    expect(
      inspectResumeFile({
        name: 'resume.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 100,
      }),
    ).toMatchObject({ ok: true, value: { extension: 'docx' } })
  })

  it('rejects missing and mismatched MIME types even when the extension looks valid', () => {
    expect(inspectResumeFile({ name: 'resume.pdf', type: '', size: 100 })).toMatchObject({
      ok: false,
    })
    expect(
      inspectResumeFile({
        name: 'resume.pdf',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 100,
      }),
    ).toMatchObject({ ok: false })
    expect(
      inspectResumeFile({ name: 'resume.docx', type: 'application/pdf', size: 100 }),
    ).toMatchObject({ ok: false })
  })

  it('rejects unsupported, empty, and oversized files', () => {
    expect(inspectResumeFile({ name: 'resume.txt', type: 'text/plain', size: 100 })).toMatchObject({
      ok: false,
    })
    expect(inspectResumeFile({ name: 'resume.pdf', type: 'application/pdf', size: 0 })).toMatchObject({
      ok: false,
    })
    expect(
      inspectResumeFile({ name: 'resume.pdf', type: 'application/pdf', size: MAX_RESUME_BYTES + 1 }),
    ).toMatchObject({ ok: false })
  })
})
