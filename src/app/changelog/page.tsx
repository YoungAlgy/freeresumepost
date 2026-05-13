import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Changelog',
  description:
    'What\'s new on freeresumepost.co — recent shipped features, fixes, and reliability work. Updated when something user-visible changes.',
  alternates: { canonical: 'https://www.freeresumepost.co/changelog' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Changelog — freeresumepost.co',
    description: 'Recent ships on freeresumepost.co — features, fixes, and reliability work.',
    url: 'https://www.freeresumepost.co/changelog',
    type: 'website',
  },
}

type Tag = 'new' | 'improved' | 'fixed' | 'reliability' | 'security'

interface Entry {
  date: string
  title: string
  body: string
  tag: Tag
}

// Hand-curated, user-visible entries. Only the ones a candidate would actually
// notice ship here. Update on significant ships;
// see memory/feedback_changelog_discipline.md.
const ENTRIES: Entry[] = [
  // ── May 2026 ──────────────────────────────────────────────────────────────
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

const TAG_STYLES: Record<Tag, string> = {
  new: 'bg-blue-600 text-white',
  improved: 'bg-emerald-600 text-white',
  fixed: 'bg-amber-500 text-white',
  reliability: 'bg-slate-700 text-white',
  security: 'bg-red-600 text-white',
}

function groupByMonth(entries: Entry[]): { month: string; entries: Entry[] }[] {
  const groups = new Map<string, Entry[]>()
  for (const e of entries) {
    const d = new Date(e.date + 'T00:00:00Z')
    const key = d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(e)
  }
  return Array.from(groups, ([month, entries]) => ({ month, entries }))
}

export default function ChangelogPage() {
  const grouped = groupByMonth(ENTRIES)
  const lastUpdated = ENTRIES[0]?.date

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm">
              r
            </span>
            <span className="font-bold text-lg tracking-tight">
              freeresumepost<span className="text-slate-400">.co</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 md:gap-6 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900 whitespace-nowrap">Home</Link>
            <Link href="/upload" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 whitespace-nowrap">
              Upload resume
            </Link>
          </div>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase mb-3">
          Changelog
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-slate-900 mb-4">
          What&apos;s new
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-2">
          Recent shipped features, fixes, and reliability work. We update this when
          something user-visible changes — not on every commit.
        </p>
        {lastUpdated && (
          <p className="text-sm text-slate-500 mb-12">
            Last updated <time dateTime={lastUpdated}>{lastUpdated}</time>
          </p>
        )}

        <div className="space-y-12">
          {grouped.map((group) => (
            <section key={group.month}>
              <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-5 pb-2 border-b border-slate-200">
                {group.month}
              </h2>
              <ul className="space-y-6">
                {group.entries.map((e) => (
                  <li key={e.date + e.title} className="flex flex-col md:flex-row md:gap-6">
                    <div className="md:w-24 shrink-0 mb-2 md:mb-0">
                      <time
                        dateTime={e.date}
                        className="text-xs font-semibold text-slate-500 tabular-nums tracking-wider"
                      >
                        {e.date}
                      </time>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-1.5 flex-wrap">
                        <h3 className="text-lg font-semibold leading-tight tracking-tight text-slate-900">
                          {e.title}
                        </h3>
                        <span
                          className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${TAG_STYLES[e.tag]}`}
                        >
                          {e.tag}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{e.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Want to suggest a feature or report a bug? Email{' '}
            <a href="mailto:alex@avahealth.co" className="text-blue-600 font-semibold hover:underline">
              alex@avahealth.co
            </a>
            .
          </p>
        </div>
      </article>
    </main>
  )
}
