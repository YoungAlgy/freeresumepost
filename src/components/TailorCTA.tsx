// Cross-promo bridge: point candidates at the native tailoring feature
// (/account/tailor) instead of the old standalone ApplyKit product. Placed
// right after the candidate lands on their profile/edit page post-upload —
// they already have a resume in hand, this is the natural next step before
// they actually apply anywhere.
//
// Formerly linked out to a separate paid product (applykit-beryl.vercel.app).
// That product's tailoring logic now lives here as a free, logged-in feature
// (/account/tailor) that reuses the resume already on file — no re-paste,
// no payment. A visitor without an active session just hits the existing
// sign-in-with-a-code flow first.

type Props = {
  /** e.g. "Registered Nurse" — used to make the pitch feel specific, not generic */
  specialtyLabel?: string | null
}

export default function TailorCTA({ specialtyLabel }: Props) {
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
        Paste any job posting and we&apos;ll rewrite your bullets to match what that job wants, write a
        real cover letter, and prep you for the interview. Free, using the resume already on your account.
      </p>
      <a
        href="/account/tailor"
        className="inline-flex items-center bg-[#003D5C] text-white px-5 py-2.5 font-bold rounded-lg hover:bg-[#002a42] transition-colors"
      >
        Tailor my resume →
      </a>
    </aside>
  )
}
