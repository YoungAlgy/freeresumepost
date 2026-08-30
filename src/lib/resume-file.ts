export const MAX_RESUME_BYTES = 5 * 1024 * 1024

type ResumeFileLike = Pick<File, 'name' | 'size' | 'type'>

export type ResumeFileDetails = {
  extension: 'pdf' | 'docx'
  contentType:
    | 'application/pdf'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

type ResumeFileResult =
  | { ok: true; value: ResumeFileDetails }
  | { ok: false; error: string }

export function inspectResumeFile(file: ResumeFileLike): ResumeFileResult {
  const name = (file.name || '').trim().toLowerCase()
  const type = (file.type || '').trim().toLowerCase()
  const extension = name.endsWith('.pdf')
    ? 'pdf'
    : name.endsWith('.docx')
      ? 'docx'
      : null

  if (!extension) {
    return { ok: false, error: 'Choose a PDF or DOCX resume.' }
  }
  if (file.size <= 0) {
    return { ok: false, error: 'That file is empty. Choose another resume.' }
  }
  if (file.size > MAX_RESUME_BYTES) {
    return {
      ok: false,
      error: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Keep it under 5 MB.`,
    }
  }

  const expectedType =
    extension === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (type !== expectedType) {
    return {
      ok: false,
      error: `The file name and type do not match. Choose a real ${extension.toUpperCase()} file.`,
    }
  }

  return extension === 'pdf'
    ? {
        ok: true,
        value: { extension: 'pdf', contentType: 'application/pdf' },
      }
    : {
        ok: true,
        value: {
          extension: 'docx',
          contentType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      }
}
