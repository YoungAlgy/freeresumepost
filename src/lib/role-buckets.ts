// Role-bucket aggregation — groups freeform `public_jobs.role` values into
// recognizable candidate-facing categories (NP / RN / CRNA /
// Therapist / Pharmacist / Allied Health) so we can surface specialty-level
// counts + salary ranges on candidate pages.
//
// Used by:
//   - /upload — "Open roles by specialty" preview above the upload CTA
//   - /     — homepage section that helps candidates self-identify a path
//
// Pattern matching is intentionally lenient — we space-pad role + title and
// look for substring tokens so " RN " catches "RN", " RN," catches "RN," at
// end of a clause, etc. Catches more than strict equality without false-
// positiving across roles.

interface JobLike {
  role: string | null
  title: string
  salary_min: number | null
  salary_max: number | null
}

const ROLE_BUCKET_DEFS: ReadonlyArray<{
  label: string
  patterns: readonly string[]
  emoji: string
  searchKeyword: string
}> = [
  {
    label: 'Nurse Practitioner',
    patterns: [' np ', ' np,', 'nurse practitioner', 'np/'],
    emoji: '👩‍⚕️',
    searchKeyword: 'nurse practitioner',
  },
  {
    label: 'Registered Nurse',
    patterns: [' rn ', ' rn,', 'registered nurse', 'rn/'],
    emoji: '👨‍⚕️',
    searchKeyword: 'registered nurse',
  },
  {
    label: 'CRNA',
    patterns: ['crna', 'nurse anesthetist'],
    emoji: '💉',
    searchKeyword: 'CRNA',
  },
  {
    label: 'Therapist',
    patterns: [
      'therapist',
      'physical therapy',
      'occupational therapy',
      ' pt ',
      ' ot ',
      ' slp ',
      'speech-language',
    ],
    emoji: '🤲',
    searchKeyword: 'therapist',
  },
  {
    label: 'Pharmacist',
    patterns: ['pharmacist', 'pharmd'],
    emoji: '💊',
    searchKeyword: 'pharmacist',
  },
  {
    label: 'Allied Health',
    patterns: [
      'technician',
      'tech ',
      'medical assistant',
      ' ma ',
      'ma,',
      'rad tech',
      'phlebot',
      'sonograph',
    ],
    emoji: '🧑‍🔬',
    searchKeyword: 'tech',
  },
] as const

export type RoleBucket = {
  label: string
  emoji: string
  searchKeyword: string
  count: number
  salaryFloor: number | null
  salaryCeiling: number | null
}

/**
 * Bucketizes an array of jobs into role-level groups, with count + observed
 * salary range per bucket. Returns only non-empty buckets, sorted by count
 * descending (highest-volume roles first).
 *
 * Each job is assigned to AT MOST ONE bucket — the first matching bucket in
 * priority order. This avoids inflating Allied Health counts with anything
 * that happens to mention "tech" in the title (a Cardio Tech is bucket
 * Allied Health, not Cardiology — though Cardiology isn't a bucket here).
 */
export function bucketizeRoles(jobs: JobLike[]): RoleBucket[] {
  const buckets: RoleBucket[] = ROLE_BUCKET_DEFS.map((b) => ({
    label: b.label,
    emoji: b.emoji,
    searchKeyword: b.searchKeyword,
    count: 0,
    salaryFloor: null,
    salaryCeiling: null,
  }))
  for (const job of jobs) {
    const haystack = ` ${(job.role || '').toLowerCase()} ${(job.title || '').toLowerCase()} `
    const idx = ROLE_BUCKET_DEFS.findIndex((b) =>
      b.patterns.some((p) => haystack.includes(p))
    )
    if (idx === -1) continue
    const bucket = buckets[idx]
    bucket.count += 1
    // Plausibility floor: skip any salary range that's clearly a placeholder.
    // USAJobs (federal) sometimes lists "$1–$X" or "$0–$X" for jobs whose pay
    // is governed by a GS-grade scale rather than a stated range. Without
    // this guard, the (since-retired) Physician bucket on /upload showed
    // "$1–$550K typical".
    // 10,000 is well below the lowest realistic full-time healthcare salary
    // and high enough to reject the placeholder rows.
    const MIN_PLAUSIBLE_SALARY = 10_000
    if (job.salary_min != null && job.salary_min >= MIN_PLAUSIBLE_SALARY) {
      bucket.salaryFloor =
        bucket.salaryFloor == null
          ? job.salary_min
          : Math.min(bucket.salaryFloor, job.salary_min)
    }
    if (job.salary_max != null && job.salary_max >= MIN_PLAUSIBLE_SALARY) {
      bucket.salaryCeiling =
        bucket.salaryCeiling == null
          ? job.salary_max
          : Math.max(bucket.salaryCeiling, job.salary_max)
    }
  }
  return buckets.filter((b) => b.count > 0).sort((a, b) => b.count - a.count)
}
