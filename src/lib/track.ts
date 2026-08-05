// No-op replacement for @vercel/analytics/server's track(). This app moved to
// Cloudflare Workers (see wrangler.jsonc); Vercel Analytics doesn't collect
// off Vercel, so the real package was just a dead dependency + a wasted
// server-side fetch on every call site. freejobpost hit the same thing during
// its own Cloudflare migration and swapped in an identical local stub — mirrored
// here so the two call sites (upload/actions.ts, lib/actions/job-alert.ts) keep
// working unchanged if a replacement analytics provider gets wired in later.
export async function track(
  _event: string,
  _props?: Record<string, string | number | boolean | null>,
): Promise<void> {}
