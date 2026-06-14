import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CHANGELOG_ENTRIES,
  entryAnchor,
  type ChangelogTag,
  type ChangelogEntry,
} from '@/lib/changelog-entries'
import { safeJsonLd } from '@/lib/safe-jsonld'

export const metadata: Metadata = {
  title: 'Changelog',
  description:
    'What\'s new on freeresumepost.co: recent shipped features, fixes, and reliability work. Updated when something user-visible changes.',
  alternates: {
    canonical: 'https://www.freeresumepost.co/changelog',
    types: {
      'application/rss+xml': [
        { url: 'https://www.freeresumepost.co/changelog/feed.xml', title: 'freeresumepost.co Changelog (RSS)' },
      ],
    },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'freeresumepost.co Changelog',
    description: 'Recent ships on freeresumepost.co: features, fixes, and reliability work.',
    url: 'https://www.freeresumepost.co/changelog',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'freeresumepost.co Changelog',
    description: 'Recent ships on freeresumepost.co: features, fixes, and reliability work.',
    images: ['/opengraph-image'],
  },
}

type Tag = ChangelogTag
type Entry = ChangelogEntry


// Entries are the source-of-truth in src/lib/changelog-entries.ts so both
// this page and /changelog/feed.xml read the same array. Update there.
const ENTRIES = CHANGELOG_ENTRIES

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

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.freeresumepost.co' },
      { '@type': 'ListItem', position: 2, name: 'Changelog', item: 'https://www.freeresumepost.co/changelog' },
    ],
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
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
            <Link href="/" className="hidden sm:inline hover:text-slate-900 whitespace-nowrap">Home</Link>
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
          something user-visible changes, not on every commit.
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
                {group.entries.map((e) => {
                  const anchor = entryAnchor(e)
                  return (
                    <li
                      key={e.date + e.title}
                      id={anchor}
                      className="flex flex-col md:flex-row md:gap-6 scroll-mt-20"
                    >
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
                            <a
                              href={`#${anchor}`}
                              className="hover:text-blue-600 focus:text-blue-600"
                              aria-label={`Permalink to ${e.title}`}
                            >
                              {e.title}
                            </a>
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
                  )
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Want to suggest a feature or report a bug? Email{' '}
            <a href="mailto:info@avahealth.co" className="text-blue-600 font-semibold hover:underline">
              info@avahealth.co
            </a>
            .
          </p>
        </div>
      </article>
    </main>
  )
}
