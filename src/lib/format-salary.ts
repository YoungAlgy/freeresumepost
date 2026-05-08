// Shared salary formatter. Used wherever we render a {min, max} pair in
// human-readable form ($180K–$240K, $200K+, etc.).
//
// Until 2026-05-08 this function lived inline in three places — page.tsx,
// upload/page.tsx, and profile/[slug]/edit-form.tsx — with subtle drift
// (only one of them appended "+" for min-only ranges). Extracted here so
// future tweaks (e.g. hourly vs annual, currency, locale) update one place.
//
// Inputs come straight from the DB (`public_jobs.salary_min/max`) which
// store annual USD amounts as integers, nullable. We treat null/zero as
// "unset" — never render "$0".

export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined
): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`)
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}`
  // When only one side of the range is set, append "+" to signal it's an
  // open-ended floor / ceiling rather than an exact figure. e.g. "$200K+".
  const single = fmt(min ?? max ?? 0)
  if (min && !max) return `${single}+`
  if (!min && max) return single
  return single
}
