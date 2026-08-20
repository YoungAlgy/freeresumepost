// Resolves a candidate's resume_url (from get_my_candidate()) to a URL that's
// actually fetchable in the browser.
//
// resume_url is a BARE storage path for every self-upload via /upload (e.g.
// "d2616a4a-....pdf") — the `resumes` bucket is private and storage RLS only
// grants SELECT to internal CRM users, not the candidate themselves, so a
// bare path 404s/403s if rendered or fetched directly. This calls the
// get-resume-url Supabase Edge Function (service-role signed URL, scoped to
// the caller's own resume via the same get_my_candidate() RPC) to turn it
// into a short-lived signed URL. A resume_url that's already an absolute
// URL (e.g. an external link from another intake path) is returned as-is.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function resolveResumeUrl(accessToken: string, resumeUrl: string): Promise<string> {
  if (/^https?:\/\//i.test(resumeUrl)) return resumeUrl

  const res = await fetch(`${SUPABASE_URL}/functions/v1/get-resume-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; url?: string | null; error?: string }
  if (!res.ok || !data.success || !data.url) {
    throw new Error(data.error || `Could not get a link to your resume (${res.status})`)
  }
  return data.url
}
