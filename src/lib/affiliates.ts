/**
 * Affiliate program registry (freeresumepost).
 *
 * A program goes LIVE the moment its `url` is set (either the default below or
 * the NEXT_PUBLIC_AFF_* env var). An empty link makes the offer render NOTHING
 * (getAffiliate returns null), so this is safe to ship before anything is live.
 *
 * Apply links (own-portal = light signup; Impact = heavier media-partner account):
 *   Kickresume   https://www.kickresume.com/en/affiliate-program/   (50%, own network)
 *   Rezi         https://www.rezi.ai/career-affiliate-partner        (30%, own portal)
 *   Resume.io    https://resume.io/affiliates                        (recurring, via Impact)
 *   Coursera     https://www.coursera.org/about/affiliates           (up to 45%, via Impact)
 */
export type Affiliate = {
  key: string
  label: string // one honest line shown to the visitor
  cta: string // button text
  url: string // affiliate link; '' = inactive (renders nothing)
}

const AFFILIATES: Record<string, Affiliate> = {
  jobcopilot: {
    key: 'jobcopilot',
    label: 'Applying to a lot of jobs on your own? JobCopilot fills out the applications you pick.',
    cta: 'Try JobCopilot',
    url:
      process.env.NEXT_PUBLIC_AFF_JOBCOPILOT ??
      'https://jobcopilot.com/?linkId=lp_494205&sourceId=youngalgy&tenantId=jobcopilot',
  },
  kickresume: {
    key: 'kickresume',
    label: 'Want your resume to beat the ATS screen? Build an ATS-ready one with Kickresume.',
    cta: 'Build my resume',
    url: process.env.NEXT_PUBLIC_AFF_KICKRESUME ?? '',
  },
  rezi: {
    key: 'rezi',
    label: 'Tailor your resume to each job and get past the ATS with Rezi.',
    cta: 'Try Rezi',
    url: process.env.NEXT_PUBLIC_AFF_REZI ?? '',
  },
  resumeio: {
    key: 'resumeio',
    label: 'Build a clean, field-tested resume with Resume.io.',
    cta: 'Build my resume',
    url: process.env.NEXT_PUBLIC_AFF_RESUMEIO ?? '',
  },
  coursera: {
    key: 'coursera',
    label: 'Switching fields? Earn a job-ready certificate on Coursera.',
    cta: 'Browse certificates',
    url: process.env.NEXT_PUBLIC_AFF_COURSERA ?? '',
  },
}

/** Returns the program only if its link is configured, else null (renders nothing). */
export function getAffiliate(key: string): Affiliate | null {
  const a = AFFILIATES[key]
  if (!a || !a.url) return null
  return a
}
