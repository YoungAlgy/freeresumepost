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
  // ── June 2026 ────────────────────────────────────
  {
    date: "2026-06-25",
    title: "Your real resume file gets saved now",
    body:
      "When you upload, we now keep the actual file you sent, not just the text we pulled from it. Recruiters can open the real document. If the file save ever hiccups, your upload still goes through on the text alone.",
    tag: "improved",
  },
  {
    date: "2026-06-25",
    title: "More specialties detected from your resume",
    body:
      "The parser was missing some fields when it read a resume, so a few specialties never got picked up. Fixed oncology, dermatology, radiology, gastroenterology, phlebotomy, gynecology, and dental hygiene. If you work in one of these, your resume now lands in the right specialty.",
    tag: "fixed",
  },
  {
    date: "2026-06-21",
    title: "Sign in with an email code",
    body:
      "You can now get back to your profile with a 6-digit code sent to your email instead of waiting on a link. Signing in takes you to a new account page where you can see your profile, re-upload, or request your secure edit link.",
    tag: "new",
  },
  {
    date: "2026-06-19",
    title: "Fresh Ava Health look",
    body:
      "The whole site moved to the Ava Health colors, navy and lime, with a matching logo and a family nav strip up top. Same pages, same links, just a cleaner look. The old 'beta' labels are gone too.",
    tag: "improved",
  },
  {
    date: "2026-06-17",
    title: "Part of the Ava Health family",
    body:
      "This site now shows a 'Part of Ava Health' footer with quick links to the free job board, the provider directory, and the rest of the family. Your resume and your privacy work exactly the same.",
    tag: "improved",
  },
  {
    date: "2026-06-10",
    title: "Resume guides for every specialty",
    body:
      "Every specialty hub now has a plain-English guide to writing a strong resume for that field, from RN to physical therapy to surgical tech. All 38 specialties are covered.",
    tag: "new",
  },
  {
    date: "2026-06-10",
    title: "Better recovery when an edit link expires",
    body:
      "If your profile edit link has expired or already been used, the login page now sends you a fresh one in a click instead of telling you to email us.",
    tag: "improved",
  },
  {
    date: "2026-06-04",
    title: "Friendlier message on a failed upload",
    body:
      "A resume that fails to parse now shows a clear, helpful message with an easy retry, instead of a dead-end 'try again'.",
    tag: "fixed",
  },
  {
    date: "2026-06-02",
    title: "Last names stay private on public profiles",
    body:
      "Public profiles show your first name and last initial only, never your full last name. Tightened so the full name can't leak even by accident.",
    tag: "improved",
  },
  {
    date: "2026-06-02",
    title: "Cleaner mobile header, stale badge gone",
    body:
      "Trimmed the header so it fits on phones, and removed an old 'Beta opening April 2026' badge that was past its date.",
    tag: "fixed",
  },
  {
    date: "2026-06-01",
    title: "Job alerts by email",
    body:
      "Pick the kinds of roles you want and get new matching jobs in your inbox. One-click unsubscribe, and no account needed.",
    tag: "new",
  },
  // ── May 2026 ──────────────────────────────────────────────────────────────
  {
    date: '2026-05-30',
    title: 'More specialty pages link straight to matching jobs',
    body:
      'The "Browse jobs" button on each specialty page now deep-links to the exact matching specialty hub on freejobpost.co for 15 more fields: physical therapy, occupational therapy, speech-language pathology, respiratory therapy, surgical tech, rad tech, dietitian, LPN/LVN, CNA, medical assistant, phlebotomist, dental hygienist, paramedic/EMT, audiologist, and genetic counselor (previously only RN, NP, PA, CRNA, and pharmacist did). So whatever your specialty, one tap takes you straight to that field\'s open roles instead of a generic search.',
    tag: 'improved',
  },
  {
    date: '2026-05-26',
    title: 'Ava Health enrolled in E-Verify',
    body:
      'Ava Health Partners LLC is now an enrolled participant in the federal E-Verify employment authorization system (Company ID 3024987, MOU effective 2026-05-26). Added a small "E-Verify Participant" chip to the footer linking to a new /e-verify page with the full federal-compliance statement, official DHS Participation poster, DOJ Right to Work poster, and Florida SB 1718 context. We enrolled proactively below the FL SB 1718 25-employee threshold so the compliance ramp is in place as the team grows. Doesn\'t change anything for you as a candidate. It\'s confirmation that any future Ava Health hire goes through federal work-eligibility verification.',
    tag: 'improved',
  },
  {
    date: '2026-05-24',
    title: 'Profile schema + sitemap freshness + AI-discovery + EEO + canonical contact email + onboarding clarity',
    body:
      'Public candidate profiles now emit a knowsAbout array on Person JSON-LD (specialty + credential), giving Google clearer signal about what each candidate works on, helping AI Overview surfacing for "professionals who specialize in X" queries. Taught the sitemap to honor changelog ship dates as a freshness signal alongside profile updates, so when we ship a user-visible feature here, the homepage lastmod reflects it. Added an llms.txt at the site root so ChatGPT, Claude, and Perplexity can discover the platform structure cleanly. Added a federal Equal Opportunity statement to the footer. Switched the customer-facing contact email to info@avahealth.co (more professional than a personal address. Same mailbox underneath). Rewrote the "Show profile publicly" checkbox on the upload form to lead with the benefit ("get found by employers searching Google") and explicitly promise email + phone always stay private. Easier to opt in confidently.',
    tag: 'improved',
  },
  {
    date: '2026-05-22',
    title: 'Polish pass: link previews, error pages, page titles',
    body:
      'Six pages were rendering blank or default link-preview cards when shared to LinkedIn / iMessage / Slack. Now every page emits the branded Ava Health Open Graph card. Added a styled error page that catches transient failures (Supabase timeout, network blip) with a one-click retry. Stopped browser tabs from showing the brand twice ("Ava Health: Upload once, get matched | Ava Health"). Now just renders once.',
    tag: 'improved',
  },
  {
    date: '2026-05-13',
    title: 'Salary panel on specialty hubs',
    body:
      'Every specialty hub (/specialty/registered-nurse, /specialty/physical-therapist, etc.) now shows a real pay range computed from the live job inventory: 10th-90th percentile bounds with the median called out.',
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
      'Mobile nav links were hidden on small screens. Fixed on homepage and upload. Also stopped iOS Safari from auto-zooming when you tap the resume-upload form. Feels native on iPhone now.',
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
      'Homepage now shows which specialties have the most open roles right now. Click in to filter the live job feed instead of scrolling through everything.',
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
      'Upload page now shows live role counts by specialty before you commit, so you can see what\'s out there in your field first.',
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
      'Cloudflare Turnstile now guards the upload form. Invisible for real users. Blocks scripted submissions.',
    tag: 'security',
  },
  // ── April ─────────────────────────────────────────────────────────────────
  {
    date: '2026-04-29',
    title: 'Candidate specialty hubs expanded to 38',
    body:
      'Specialty hubs grew from 14 to 38. Added PTA, COTA, phlebotomist, PCT, sleep tech, RDH, MHT, BCBA, cath lab, MRI tech, and more. Each hub is now a real landing page rather than a search filter.',
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
      'freeresumepost.co goes live. Upload your resume once, get matched to real healthcare openings, no recruiter spam, no resume-database sale. Includes /terms, /privacy, /how-it-works, and the candidate login flow.',
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
