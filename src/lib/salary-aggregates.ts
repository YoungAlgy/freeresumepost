// Plain-HTML salary aggregates for freeresumepost specialty hubs.
//
// Mirrored from freejobpost/src/lib/salary-aggregates.ts (kept in sync —
// both repos query the same `public_jobs` table). Same rules:
//   - Filter to "reasonable" annual salaries ($20K-$1M) before aggregating
//     to drop hourly-misposted-as-annual rows
//   - 10th/90th-percentile bounds (robust to remaining outliers)
//   - Median (not mean) for central tendency
//   - Plain HTML output — no Occupation/EstimatedSalary JSON-LD
//     (deprecated Sept 2025, see freejobpost feedback_seo_dead_schemas.md)

/** Minimum shape needed for aggregation — keeps the helper decoupled from
 *  any specific job row type. */
export type SalaryRow = {
  salary_min: number | null
  salary_max: number | null
}

export type SalaryAggregate = {
  /** Display label for this group (e.g. "Florida") */
  label: string
  /** Number of jobs in this group with both salary_min and salary_max */
  count: number
  /** 10th-percentile salary_min — bottom of the "typical" range. */
  low: number
  /** 90th-percentile salary_max — top of the "typical" range. */
  high: number
  /** Median of midpoints — robust central tendency. */
  avg: number
}

const REASONABLE_MIN = 20_000
const REASONABLE_MAX = 1_000_000

function isReasonableRange(min: number, max: number): boolean {
  if (min < REASONABLE_MIN || max < REASONABLE_MIN) return false
  if (min > REASONABLE_MAX || max > REASONABLE_MAX) return false
  if (max < min) return false
  return true
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0
  if (sortedAsc.length === 1) return sortedAsc[0]
  const idx = (sortedAsc.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sortedAsc[lo]
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo)
}

export function aggregateSalariesByGroup<T extends SalaryRow>(
  jobs: T[],
  getGroup: (job: T) => string | null,
  minPerGroup = 2
): SalaryAggregate[] {
  const buckets = new Map<string, { mins: number[]; maxes: number[]; midpoints: number[] }>()
  for (const j of jobs) {
    if (j.salary_min == null || j.salary_max == null) continue
    if (!isReasonableRange(j.salary_min, j.salary_max)) continue
    const group = getGroup(j)
    if (!group) continue
    if (!buckets.has(group)) {
      buckets.set(group, { mins: [], maxes: [], midpoints: [] })
    }
    const b = buckets.get(group)!
    b.mins.push(j.salary_min)
    b.maxes.push(j.salary_max)
    b.midpoints.push((j.salary_min + j.salary_max) / 2)
  }

  const out: SalaryAggregate[] = []
  for (const [label, b] of buckets.entries()) {
    if (b.mins.length < minPerGroup) continue
    const sortedMins = [...b.mins].sort((a, c) => a - c)
    const sortedMaxes = [...b.maxes].sort((a, c) => a - c)
    const sortedMids = [...b.midpoints].sort((a, c) => a - c)
    out.push({
      label,
      count: b.mins.length,
      low: Math.round(percentile(sortedMins, 0.1)),
      high: Math.round(percentile(sortedMaxes, 0.9)),
      avg: Math.round(percentile(sortedMids, 0.5)),
    })
  }
  return out
}

export function aggregateSalariesOverall<T extends SalaryRow>(jobs: T[]): SalaryAggregate | null {
  const mins: number[] = []
  const maxes: number[] = []
  const midpoints: number[] = []
  for (const j of jobs) {
    if (j.salary_min == null || j.salary_max == null) continue
    if (!isReasonableRange(j.salary_min, j.salary_max)) continue
    mins.push(j.salary_min)
    maxes.push(j.salary_max)
    midpoints.push((j.salary_min + j.salary_max) / 2)
  }
  if (mins.length < 3) return null
  const sortedMins = [...mins].sort((a, c) => a - c)
  const sortedMaxes = [...maxes].sort((a, c) => a - c)
  const sortedMids = [...midpoints].sort((a, c) => a - c)
  return {
    label: 'overall',
    count: mins.length,
    low: Math.round(percentile(sortedMins, 0.1)),
    high: Math.round(percentile(sortedMaxes, 0.9)),
    avg: Math.round(percentile(sortedMids, 0.5)),
  }
}

export function fmtUsdCompact(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `$${m.toFixed(m < 10 ? 2 : 1)}M`
  }
  if (n >= 1_000) {
    return `$${Math.round(n / 1_000)}K`
  }
  return `$${n}`
}
