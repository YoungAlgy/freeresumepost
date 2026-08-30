/**
 * Free-use daily limit for /account/tailor — a cost/abuse guard (each use is
 * a real Gemini call), not a monetization mechanism. Keyed to the signed-in
 * candidate's id rather than anonymous. The signed cookie cannot be edited
 * to lower the count, but clearing cookies or changing browsers resets it.
 *
 * KNOWN LIMITATION (2026-08-06 audit): this is a read-cookie → call Gemini →
 * write-cookie flow with no server-side atomic counter, so two concurrent
 * requests from the same candidate (double-click, two tabs) can both read
 * usesToday=N before either writes N+1, letting both through even at the
 * limit — a TOCTOU race. Acceptable for now since this only affects a
 * capped-cost free feature. A real fix needs a shared atomic counter.
 */
import { createHmac } from "crypto";

const SECRET = process.env.TAILOR_COOKIE_SECRET;
export const DAILY_FREE_USES = 10;

/**
 * Whether the cookie-signing secret is configured. Callers should check this
 * BEFORE doing any expensive work (e.g. the Gemini call in
 * account/tailor/actions.ts) and fail with a friendly message — see
 * gemini-tailor.ts's identical apiKey guard for the established pattern.
 * Without this check, a missing secret surfaces as an unhandled
 * crypto.createHmac TypeError deep in hmac() below, potentially AFTER a real
 * (paid) Gemini call has already succeeded and its result thrown away.
 */
export function isTailorCookieSecretConfigured(): boolean {
  return !!SECRET;
}

function hmac(value: string): string {
  if (!SECRET) throw new Error("tailor_cookie_secret_not_configured");
  return createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 16);
}

export const TAILOR_USAGE_COOKIE = "fr_tailor_usage";
const TAILOR_USAGE_COOKIE_MAX_AGE_S = 24 * 60 * 60; // rolls over daily

export interface TailorUsageState {
  candidateId: string;
  usesToday: number;
  day: string; // YYYY-MM-DD, so a new day resets the count
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function signTailorUsageCookie(state: TailorUsageState): string {
  const value = `usage:${state.candidateId}:${Math.max(0, Math.floor(state.usesToday))}:${state.day}`;
  return `${value}.${hmac(value)}`;
}

export function readTailorUsageCookie(
  cookieValue: string | undefined | null,
  candidateId: string
): TailorUsageState {
  const today = todayKey();
  const empty: TailorUsageState = { candidateId, usesToday: 0, day: today };
  if (!cookieValue) return empty;
  const dot = cookieValue.lastIndexOf(".");
  if (dot === -1) return empty;
  const value = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  if (!value.startsWith("usage:")) return empty;
  if (hmac(value) !== sig) return empty;
  const rest = value.slice("usage:".length);
  const parts = rest.split(":");
  if (parts.length !== 3) return empty;
  const [cookieCandidateId, usesTodayRaw, day] = parts;
  // Cookie belongs to a different candidate (e.g. shared browser) — don't
  // leak their count onto this one.
  if (cookieCandidateId !== candidateId) return empty;
  // Different day than the cookie was signed for — the count resets.
  if (day !== today) return empty;
  const usesToday = Number(usesTodayRaw);
  return {
    candidateId,
    usesToday: Number.isFinite(usesToday) && usesToday > 0 ? usesToday : 0,
    day: today,
  };
}

export function hasTailorUseRemaining(state: TailorUsageState): boolean {
  return state.usesToday < DAILY_FREE_USES;
}

/** Cookie options shared by every place that sets fr_tailor_usage. */
export const TAILOR_USAGE_COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: TAILOR_USAGE_COOKIE_MAX_AGE_S,
};
