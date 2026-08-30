import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'FreeResumePost terms of use. Operated by Ava Health Partners LLC.',
  alternates: { canonical: 'https://www.freeresumepost.co/terms' },
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <article className="mx-auto max-w-3xl px-6 py-12 prose prose-slate">
        <h1 className="not-prose mb-2 text-4xl font-semibold tracking-tight md:text-5xl">
          Terms of Use
        </h1>
        <p className="not-prose mb-10 text-sm text-slate-600">Last updated August 28, 2026</p>

        <div className="space-y-6 leading-relaxed text-slate-800">
          <p>
            <strong>FreeResumePost</strong> is a free resume-posting and profile-management service
            operated by Ava Health Partners LLC (&quot;we,&quot; &quot;us&quot;). By using
            freeresumepost.co, you agree to these terms.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">1. Free to use</h2>
          <p>
            We do not charge you to upload, store, or update your resume profile. We do not sell
            your resume or contact information.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">2. Uploading your resume</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>FreeResumePost accepts PDF and DOCX resume files up to 5 MB.</li>
            <li>Your file is read in your browser so you can review the extracted fields first.</li>
            <li>The file and approved profile data upload after you tap Save.</li>
            <li>
              Your profile is private by default. You can turn on a limited public link that hides
              your email, phone number, full last name, and resume file.
            </li>
            <li>
              You can request deletion by emailing{' '}
              <a
                href="mailto:info@avahealth.co?subject=Delete%20my%20profile"
                className="text-indigo-700 underline hover:text-indigo-900"
              >
                info@avahealth.co
              </a>{' '}
              with the subject &quot;Delete my profile.&quot;
            </li>
          </ul>

          <h2 className="mt-8 mb-2 text-xl font-semibold">3. Profile service</h2>
          <p>
            FreeResumePost stores the resume information you approve and gives you a private way
            to update it. The site does not currently list jobs or submit applications. Uploading
            a resume does not send it to an employer.
          </p>
          <p>
            Authorized staff and service providers may access saved data when needed to operate,
            secure, and support the service.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">4. Profile access</h2>
          <p>
            You do not need a password. We use a secure email code or edit link to confirm access
            to your private profile. Keep those codes and links private.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">5. Resume tailoring tool</h2>
          <p>
            The optional tailoring tool sends the resume text and job posting you provide to
            Google Gemini to generate resume bullets, a cover letter, and interview suggestions.
            Do not submit patient information or other sensitive data. Review every generated
            result before using it. We do not promise that generated content is accurate or fit
            for a specific job.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">6. Accuracy</h2>
          <p>
            You agree that the resume and profile information you submit is yours and is truthful.
            We do not verify credentials. You are responsible for correcting inaccurate data.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">7. Prohibited use</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Uploading a resume that is not yours or that you do not have permission to use.</li>
            <li>Trying to access another person&apos;s private profile or resume file.</li>
            <li>Scraping, disrupting, or abusing the service.</li>
          </ul>

          <h2 className="mt-8 mb-2 text-xl font-semibold">8. Disclaimers</h2>
          <p>
            FreeResumePost is provided &quot;as is.&quot; We do not promise an interview, job offer,
            placement, or response from another person. We are not part of any employment
            relationship that may result from sharing your profile.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">9. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, Ava Health Partners LLC is not liable for
            indirect, incidental, or consequential damages arising from use of FreeResumePost.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">10. Changes</h2>
          <p>
            We may update these terms. The last-updated date above will show the latest revision.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">11. Contact</h2>
          <p>
            Questions?{' '}
            <a
              href="mailto:info@avahealth.co"
              className="text-indigo-700 underline hover:text-indigo-900"
            >
              info@avahealth.co
            </a>
          </p>

          <p className="mt-10 text-sm text-slate-600">
            See also:{' '}
            <Link href="/privacy" className="text-indigo-700 underline hover:text-indigo-900">
              Privacy Policy
            </Link>
          </p>
        </div>
      </article>
    </main>
  )
}
