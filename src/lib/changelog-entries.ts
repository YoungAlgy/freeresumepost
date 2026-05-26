// Source of truth for the public /changelog page + /changelog/feed.xml.
// Hand-curated; prepend a new entry on every user-visible ship.
// See memory/feedback_changelog_discipline.md for the rule.

export type ChangelogTag =
  | 'new'
  | 'improved'
  | 'fixed'
  | 'reliability'
  | 'security'

export interface ChangelogEntry {
  date: string // YYYY-MM-DD
  title: string
  body: string
  tag: ChangelogTag
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  // ── May 2026 ──────────────────────────────────────────────────────────────
  {
    date: '2026-05-26',
    title: 'Ava Health enrolled in E-Verify',
    body:
      'Ava Health Partners LLC is now an enrolled participant in the federal E-Verify employment authorization system (Company ID 3024987, MOU effective 2026-05-26). The footer now links to the official DHS E-Verify Participation and DOJ Right to Work posters as required by USCIS. Florida SB 1718 requires E-Verify for FL employers with 25+ employees starting July 2024 — we enrolled proactively well below the threshold so the compliance ramp is already in place. Doesn\'t change anything for you as a candidate; it\'s confirmation that any future Ava Health hire goes through federal work-eligibility verification.',
    tag: 'improved',
  },
  {
    date: '2026-05-24',
    title: 'Profile schema + sitemap freshness + AI-discovery + EEO + canonical contact email + onboarding clarity',
    body:
      'Public candidate profiles now emit a knowsAbout array on Person JSON-LD (specialty + credential) — gives Google clearer signal about what each candidate works on, helping AI Overview surfacing for "professionals who specialize in X" queries. Taught the sitemap to honor changelog ship dates as a freshness signal alongside profile updates — so when we ship a user-visible feature here, the homepage lastmod reflects it. Added an llms.txt at the site root so ChatGPT, Claude, and Perplexity can discover the platform structure cleanly. Added a federal Equal Opportunity statement to the footer. Switched the customer-facing contact email to info@avahealth.co (more professional than a personal address; same mailbox underneath). Rewrote the "Show profile publicly" checkbox on the upload form to lead with the benefit ("get found by employers searching Google") and explicitly promise email + phone always stay private — easier to opt in confidently.',
    tag: 'improved',
  },
  {
    date: '2026-05-22',
    title: 'Polish pass: link previews, error pages, page titles',
    body:
      'Six pages were rendering blank or default link-preview cards when shared to LinkedIn / iMessage / Slack — now every page emits the branded Free Resume Post Open Graph card. Added a styled error page that catches transient failures (Supabase timeout, network blip) with a one-click retry. Stopped browser tabs from showing the brand twice (“Free Resume Post — Upload once, get matched | Free Resume Post”) — now just renders once.',
    tag: 'improved',
  },
  {
    date: '2026-05-13',
    title: 'Salary panel on specialty hubs',
    body:
      'Every specialty hub (/specialty/registered-nurse, /specialty/physical-therapist, etc.) now shows a real pay range computed from the live job inventory — 10th–90th percentile bounds with the median called out.',
    tag: 'new',
  },
  {
    date: '2026-05-13',
    title: 'Cross-links to sister jobs site',
    body:
      'Each specialty hub now links straight to the matching freejobpost.co specialty page so you can browse open roles in your field without retyping a search.',
    tag: 'improved',
  },
  {
    date: '2026-05-13',
    title: 'Mobile nav + iOS input fix',
    body:
      'Mobile nav links were hidden on small screens. Fixed on homepage and upload. Also stopped iOS Safari from auto-zooming when you tap the resume-upload form — feels native on iPhone now.',
    tag: 'fixed',
  },
  {
    date: '2026-05-13',
    title: 'Next.js 16.2.4 → 16.2.6 (DoS patch)',
    body:
      'Bumped Next.js to patch a Server-Components DoS vulnerability. No user action required.',
    tag: 'security',
  },
  // ── May 8 batch ───────────────────────────────────────────────────────────
  {
    date: '2026-05-08',
    title: 'Role-buckets section on homepage',
    body:
      'Homepage now shows which specialties have the most open roles right now — click in to filter the live job feed instead of scrolling through everything.',
    tag: 'new',
  },
  {
    date: '2026-05-08',
    title: 'Last-name privacy on public profiles',
    body:
      'Public candidate profiles now show first name + last initial (e.g. "Sarah K.") instead of full name. OG share images match. Anyone with the edit link still sees their full data.',
    tag: 'improved',
  },
  {
    date: '2026-05-08',
    title: 'Specialty preview before upload',
    body:
      'Upload page now shows live role counts by specialty before you commit — so you can see what\'s out there in your field first.',
    tag: 'improved',
  },
  {
    date: '2026-05-08',
    title: 'Custom 404 page',
    body:
      'A real 404 page with helpful links back into the site instead of the framework default.',
    tag: 'improved',
  },
  {
    date: '2026-05-08',
    title: '5 MB client-side file gate',
    body:
      'Resume files are now validated for size on your device before the parser runs. No more waiting on a doomed upload.',
    tag: 'fixed',
  },
  {
    date: '2026-05-07',
    title: 'Bot challenge on upload',
    body:
      'Cloudflare Turnstile now guards the upload form. Invisible for real users; blocks scripted submissions.',
    tag: 'security',
  },
  // ── April ─────────────────────────────────────────────────────────────────
  {
    date: '2026-04-29',
    title: 'Candidate specialty hubs expanded to 38',
    body:
      'Specialty hubs grew from 14 to 38 — added PTA, COTA, phlebotomist, PCT, sleep tech, RDH, MHT, BCBA, cath lab, MRI tech, and more. Each hub is now a real landing page rather than a search filter.',
    tag: 'new',
  },
  {
    date: '2026-04-28',
    title: 'CSP + HSTS security headers',
    body:
      'Added Content Security Policy and HSTS preload headers. Browsers now refuse to load freeresumepost.co over plain HTTP and block mixed-content attacks.',
    tag: 'security',
  },
  {
    date: '2026-04-27',
    title: 'Initial launch',
    body:
      'freeresumepost.co goes live — upload your resume once, get matched to real healthcare openings, no recruiter spam, no resume-database sale. Includes /terms, /privacy, /how-it-works, and the candidate login flow.',
    tag: 'new',
  },
]

/**
 * Returns a slugified anchor ID for an entry — used by both the page (id=)
 * and the RSS feed (guid). Stable across edits to title/body so subscribed
 * readers don't see duplicate items.
 */
export function entryAnchor(entry: ChangelogEntry): string {
  return `${entry.date}-${entry.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`
}
