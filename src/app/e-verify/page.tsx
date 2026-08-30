import type { Metadata } from 'next'
import { E_VERIFY } from '@/lib/e-verify-config'

export const metadata: Metadata = {
  title: 'E-Verify Participation',
  description:
    'Ava Health Partners LLC, operator of freeresumepost.co, participates in the federal E-Verify employment eligibility verification system.',
  alternates: { canonical: 'https://www.freeresumepost.co/e-verify' },
  robots: { index: true, follow: true },
}

export default function EVerifyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <article className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2">E-Verify Participation</h1>
        <p className="text-sm text-slate-600 mb-8">Ava Health Partners LLC &middot; operator of freeresumepost.co</p>

        {/* Status card — pulls live from src/lib/e-verify-config.ts. */}
        {E_VERIFY.enrolled && E_VERIFY.companyId && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-5 mb-10">
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Company</dt>
                <dd className="font-semibold text-slate-900 mt-1">Ava Health Partners LLC</dd>
              </div>
              <div>
                <dt className="text-slate-500">Company ID</dt>
                <dd className="font-semibold text-slate-900 mt-1">{E_VERIFY.companyId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">MOU effective</dt>
                <dd className="font-semibold text-slate-900 mt-1">{E_VERIFY.mouDate}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="space-y-6 text-slate-800 leading-relaxed">
          <p>
            <strong>Ava Health Partners LLC</strong>, the company that operates freeresumepost.co,
            is an enrolled participant in the federal <strong>E-Verify</strong> employment
            eligibility verification system. E-Verify is run by the U.S. Department of Homeland
            Security in cooperation with the Social Security Administration.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">What E-Verify is</h2>
          <p>
            E-Verify lets participating employers electronically confirm an employee&apos;s
            eligibility to work in the United States by comparing Form I-9 information against
            U.S. government records. Participation is authorized by Title IV, Subtitle A of the
            Illegal Immigration Reform and Immigrant Responsibility Act of 1996 and is free.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">Florida SB 1718 context</h2>
          <p>
            Florida Senate Bill 1718 (effective July 1, 2023, enforcement July 1, 2024) requires
            all private employers in Florida with 25 or more employees to enroll in E-Verify and
            verify each new hire within three business days. We enrolled proactively below the
            threshold to establish compliance posture as the team grows.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">What this means for candidates</h2>
          <p>
            Uploading your resume to freeresumepost.co does not create an employment relationship
            with Ava Health Partners LLC. FreeResumePost is a resume-posting tool. It does not run
            hiring, Form I-9, or employment-eligibility checks for people who use the site. Ava
            Health Partners LLC&apos;s E-Verify participation applies only to people it directly
            hires.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">Anti-discrimination commitment</h2>
          <p>
            Federal law prohibits employers from using E-Verify to discriminate against any
            individual on the basis of national origin, citizenship status, or immigration
            status. We do not pre-screen applicants, selectively verify, or take adverse action
            against an employee with a tentative nonconfirmation until the case becomes a final
            nonconfirmation. If you believe you have been discriminated against you may contact
            the U.S. Department of Justice Immigrant and Employee Rights Section at
            1-800-255-7688 (1-800-237-2515 TDD).
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">Official posters</h2>
          <p>The U.S. government provides official posters all E-Verify employers display:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <a
                href="https://www.e-verify.gov/sites/default/files/everify/posters/EVerifyParticipationPoster.pdf"
                className="text-[#003D5C] hover:text-[#002A40] underline"
              >
                E-Verify Participation poster (English / Spanish)
              </a>
            </li>
            <li>
              <a
                href="https://www.e-verify.gov/sites/default/files/everify/posters/IER_RighttoWorkPoster.pdf"
                className="text-[#003D5C] hover:text-[#002A40] underline"
              >
                Right to Work poster (English / Spanish)
              </a>
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-2">Questions</h2>
          <p>
            Questions about Ava Health&apos;s E-Verify participation:{' '}
            <a href="mailto:info@avahealth.co" className="text-[#003D5C] hover:text-[#002A40] underline">
              info@avahealth.co
            </a>
            . General E-Verify support: 1-888-464-4218 or{' '}
            <a href="https://www.e-verify.gov" className="text-[#003D5C] hover:text-[#002A40] underline">
              e-verify.gov
            </a>
            .
          </p>
        </div>
      </article>
    </main>
  )
}
