const FREE_RESUME_POST_EMAIL_RE = /^[a-z0-9][a-z0-9._%+-]*@freeresumepost\.co$/i

export function parseFreeResumePostSupportEmail(value: string | undefined): string | null {
  const email = value?.trim().toLowerCase() ?? ''
  return FREE_RESUME_POST_EMAIL_RE.test(email) ? email : null
}

export function getFreeResumePostSupportEmail(): string | null {
  return parseFreeResumePostSupportEmail(process.env.FREERESUMEPOST_SUPPORT_EMAIL)
}
