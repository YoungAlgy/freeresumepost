import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Ava Health terms of use. Free candidate-resume platform operated by Ava Health Partners LLC.',
  alternates: { canonical: 'https://www.freeresumepost.co/terms' },
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <article className="max-w-3xl mx-auto px-6 py-12 prose prose-slate">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2 not-prose">Terms of Use</h1>
        <p className="text-sm text-slate-600 mb-10 not-prose">Last updated April 27, 2026</p>

        <div className="space-y-6 text-slate-800 leading-relaxed">
          <p>
            Welcome to <strong>freeresumepost.co</strong>, a free candidate-resume platform operated by
            Ava Health Partners LLC (&quot;Ava Health,&quot; &quot;we,&quot; &quot;us&quot;).
            By using freeresumepost.co you agree to these Terms of Use.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">1. Free to use</h2>
          <p>
            freeresumepost.co is free for candidates. We don&apos;t charge to upload, store, or update your profile,
            and we don&apos;t sell your resume to third parties.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">2. Uploading your resume</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Your resume is parsed in your browser before any data reaches our servers.</li>
            <li>You review every extracted field and approve before saving.</li>
            <li>You may make your profile public (discoverable by employers) or private (matching only).</li>
            <li>You may delete your profile at any time by emailing <a href="mailto:info@avahealth.co?subject=Delete%20my%20profile" className="underline text-[#003D5C] hover:text-[#002A40]">info@avahealth.co</a> with subject &quot;Delete my profile&quot;.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-2">3. Matching engine</h2>
          <p>
            Once your profile is saved, our matching engine scores you against active jobs on
            freejobpost.co. Your top matches appear on your private profile page, refreshed daily, when an opening fits your
            specialty + state. Your matches appear on your private profile page. You decide whether
            to apply. Your application goes directly to the posting employer.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">4. Account-free access</h2>
          <p>
            We don&apos;t require you to create a password or account. Profile edits are authorized by a
            secure email link that expires after 7 days.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">5. Honesty + accuracy</h2>
          <p>
            You agree that the information in your resume is truthful. We don&apos;t verify credentials but
            employers may. Misrepresentation can disqualify you and is your responsibility, not ours.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">6. Prohibited use</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Uploading resumes that aren&apos;t yours.</li>
            <li>Scraping the public profile pages at rates that affect performance.</li>
            <li>Using extracted candidate data for unrelated commercial purposes.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-2">7. Disclaimers</h2>
          <p>
            freeresumepost.co is provided &quot;as is.&quot; We don&apos;t guarantee that you&apos;ll be matched,
            interviewed, or hired. We aren&apos;t party to any eventual employment relationship.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">8. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, Ava Health Partners LLC isn&apos;t liable for indirect,
            incidental, or consequential damages arising from use of freeresumepost.co.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">9. Changes</h2>
          <p>
            We may update these terms. The &quot;Last updated&quot; date above will reflect the most recent revision.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">10. Contact</h2>
          <p>
            Questions? <a href="mailto:info@avahealth.co" className="underline text-[#003D5C] hover:text-[#002A40]">info@avahealth.co</a>
          </p>

          <p className="mt-10 text-sm text-slate-600">
            See also: <Link href="/privacy" className="underline text-[#003D5C] hover:text-[#002A40]">Privacy Policy</Link>
          </p>
        </div>
      </article>
    </main>
  )
}
