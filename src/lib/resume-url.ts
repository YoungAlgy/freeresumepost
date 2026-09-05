// Resolves a candidate's source-scoped resume_url to a URL that's
// actually fetchable in the browser.
//
// resume_url is a BARE storage path for every self-upload via /upload (e.g.
// "d2616a4a-....pdf") — the `resumes` bucket is private and storage RLS only
// grants SELECT to internal CRM users, not the candidate themselves, so a
// bare path 404s/403s if rendered or fetched directly. This calls the
// get-resume-url Supabase Edge Function to turn it into a short-lived signed
// URL. Callers first source-check the profile through the FreeResumePost RPC.
// Source-scoped FreeResumePost uploads use one root-level UUID filename. An
// absolute or nested value is legacy data and is never opened or fetched by the
// browser.

const BARE_STORAGE_PATH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|docx)$/

export function isFreeResumeStoragePath(value: string): boolean {
  return BARE_STORAGE_PATH.test(value)
}

export function validateSignedResumeUrl(
  value: string,
  supabaseUrl: string,
  storagePath: string,
): string | null {
  if (!isFreeResumeStoragePath(storagePath)) return null

  try {
    const signed = new URL(value)
    const supabase = new URL(supabaseUrl)
    const prefix = '/storage/v1/object/sign/resumes/'
    if (signed.protocol !== 'https:') return null
    if (signed.username || signed.password) return null
    if (signed.origin !== supabase.origin) return null
    if (!signed.pathname.startsWith(prefix)) return null
    const tokens = signed.searchParams.getAll('token')
    if (tokens.length !== 1 || !tokens[0].trim()) return null

    const encodedPath = signed.pathname.slice(prefix.length)
    if (decodeURIComponent(encodedPath) !== storagePath) return null
    return signed.toString()
  } catch {
    return null
  }
}

export async function resolveResumeUrl(
  accessToken: string,
  resumeUrl: string,
  signal?: AbortSignal,
): Promise<string> {
  if (!isFreeResumeStoragePath(resumeUrl)) {
    throw new Error('The stored resume path is invalid. Replace the resume from your profile.')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Resume storage is not configured.')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/get-resume-url`, {
    method: 'POST',
    ...(signal ? { signal } : {}),
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; url?: string | null; error?: string }
  if (!res.ok || !data.success || !data.url) {
    throw new Error(data.error || `Could not get a link to your resume (${res.status})`)
  }

  const signedUrl = validateSignedResumeUrl(data.url, supabaseUrl, resumeUrl)
  if (!signedUrl) {
    throw new Error('The resume service returned an invalid link.')
  }
  return signedUrl
}
