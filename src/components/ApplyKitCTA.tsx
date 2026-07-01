// Cross-promo bridge: freeresumepost.co candidate traffic → ApplyKit (Algy's
// own product, not an affiliate). Placed right after the candidate lands on
// their profile/edit page post-upload — they already have a resume in hand,
// this is the natural next step before they actually apply anywhere.
//
// First-party, so no approval gate like an affiliate — always renders.
// The outbound link carries UTM params so ApplyKit can attribute signups back
// to this bridge. Cross-domain -> plain <a>.
//
// NOTE: "applykit.vercel.app" is NOT ours — that global vanity alias is
// already taken by an unrelated live product (an ATS at applykit.co). Using
// the real per-deployment URL until Algy picks a permanent domain (possibly
// a rename, given the name collision). Update via NEXT_PUBLIC_APPLYKIT_URL
// once that's decided — don't let this default silently go stale.

const APPLYKIT_URL =
  process.env.NEXT_PUBLIC_APPLYKIT_URL ??
  'https://applykit-f6dm0hhss-youngalgys-projects.vercel.app?utm_source=freeresumepost&utm_medium=referral&utm_campaign=profile_cta'

type Props = {
  /** e.g. "Registered Nurse" — used to make the pitch feel specific, not generic */
  specialtyLabel?: string | null
}

export default function ApplyKitCTA({ specialtyLabel }: Props) {
  const role = (specialtyLabel || '').trim()

  return (
    <aside className="rounded-2xl border border-slate-200 bg-blue-50 p-5 md:p-6 mb-8">
      <p className="text-[11px] font-bold tracking-widest text-[#003D5C] uppercase mb-2">
        Before you apply
      </p>
      <h3 className="text-lg md:text-xl font-black tracking-tight leading-tight mb-2 text-[#003D5C]">
        {role ? `Tailor this resume for a specific ${role} job` : 'Tailor this resume for a specific job'}
      </h3>
      <p className="text-sm text-slate-700 mb-4 leading-relaxed max-w-xl">
        Paste any job posting into ApplyKit along with this resume. It rewrites your bullets to
        match what that job wants, writes a real cover letter, and preps you for the interview.
        First one is free.
      </p>
      <a
        href={APPLYKIT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center bg-[#003D5C] text-white px-5 py-2.5 font-bold rounded-lg hover:bg-[#002a42] transition-colors"
      >
        Tailor my resume free →
      </a>
      <p className="text-[11px] text-slate-500 mt-2.5">Built by the person who runs this site.</p>
    </aside>
  )
}
