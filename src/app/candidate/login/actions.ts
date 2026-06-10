'use server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type ResendResult = { ok: true } | { ok: false; error: string }

// Requests a fresh edit link for the given email via the resume-edit-link
// edge fn. The fn is enumeration-safe (always succeeds for well-formed
// emails, send-or-not decided server-side), so this action's success state
// only ever means "request accepted", never "that email has a profile".
export async function requestEditLink(email: string): Promise<ResendResult> {
  const trimmed = (email || '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || trimmed.length > 254) {
    return { ok: false, error: 'Enter a valid email address.' }
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/resume-edit-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email: trimmed }),
    })
    if (!res.ok) {
      console.error('resume-edit-link failed:', res.status)
      return { ok: false, error: 'Something went wrong. Please try again in a minute.' }
    }
    return { ok: true }
  } catch (e) {
    console.error('resume-edit-link fetch error:', e instanceof Error ? e.message : 'unknown')
    return { ok: false, error: 'Something went wrong. Please try again in a minute.' }
  }
}
