import { getAffiliate } from '@/lib/affiliates'

/**
 * Tasteful, FTC-compliant affiliate offer. Renders nothing unless the program's
 * link is configured (so it is safe to place before a program is approved).
 * Matches the freeresumepost clean/blue aesthetic.
 */
export default function AffiliateOffer({
  program,
  className = '',
}: {
  program: string
  className?: string
}) {
  const aff = getAffiliate(program)
  if (!aff) return null

  return (
    <aside
      aria-label="Recommended tool"
      className={`rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-slate-700 flex-1 min-w-[240px]">{aff.label}</span>
        <a
          href={aff.url}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="shrink-0 inline-flex items-center rounded-lg bg-[#7FBC00] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#6DA300]"
        >
          {aff.cta}
        </a>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Affiliate link. We may earn a commission, at no cost to you.
      </p>
    </aside>
  )
}
