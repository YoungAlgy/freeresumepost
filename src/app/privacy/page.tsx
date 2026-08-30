import type { Metadata } from 'next'
import Link from 'next/link'
import { SupportEmailLink } from '@/components/SupportEmailLink'

// Resolve the monitored product mailbox from the Worker environment at request
// time. It is never bundled into client JavaScript and has no cross-brand fallback.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How FreeResumePost handles resume files, profile data, privacy, and deletion requests.',
  alternates: { canonical: 'https://www.freeresumepost.co/privacy' },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <article className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-2 text-4xl font-semibold tracking-tight md:text-5xl">Privacy Policy</h1>
        <p className="mb-10 text-sm text-slate-600">Last updated August 28, 2026</p>

        <div className="space-y-6 leading-relaxed text-slate-800">
          <p>
            Ava Health Partners LLC operates <strong>FreeResumePost</strong>. This policy explains
            how freeresumepost.co handles your information.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">The short version</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Your resume is read in your browser before anything uploads.</li>
            <li>You review the extracted fields before you save.</li>
            <li>The resume file and approved profile data upload after you tap Save.</li>
            <li>Your profile is private by default. A limited public link is optional.</li>
            <li>We do not sell your resume, profile data, or contact information.</li>
          </ul>

          <h2 className="mt-8 mb-2 text-xl font-semibold">What we collect</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Profile fields you save, including your name, email, phone, credential, specialty,
              city, state, experience, and public-link setting.
            </li>
            <li>
              The PDF or DOCX resume file, stored in a private file bucket. If the file upload
              fails, your approved profile may still save without the file.
            </li>
            <li>Basic request logs used for security, abuse prevention, and service reliability.</li>
          </ul>

          <h2 className="mt-8 mb-2 text-xl font-semibold">What we do not collect</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>The full resume text read during the normal upload and review step.</li>
            <li>Social Security numbers, dates of birth, or financial information.</li>
            <li>Behavioral profiles from third-party advertisers.</li>
          </ul>

          <h2 className="mt-8 mb-2 text-xl font-semibold">How we use your data</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Save and display the profile settings you choose.</li>
            <li>Confirm your identity when you reopen or edit your profile.</li>
            <li>Run, protect, troubleshoot, and improve FreeResumePost.</li>
          </ul>
          <p>
            Authorized staff and service providers may access saved data when needed to run,
            secure, and support the service.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">Public and private profiles</h2>
          <p>
            Profiles are private by default. A private profile has no public profile page. You can
            turn on a limited public link and turn it off again from your profile.
          </p>
          <p>
            A public link can show your first name, last initial, credential, specialty, city,
            state, and years of experience. It does not show your email, phone number, full last
            name, or resume file. Public profile pages are marked so search engines should not
            index them, but anyone with the link can view the limited fields.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">No job applications</h2>
          <p>
            FreeResumePost does not post jobs or submit job applications. Uploading a
            resume does not send your information to an employer.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">Optional resume tailoring</h2>
          <p>
            If you choose to run the resume tailoring tool, the resume text and job posting you
            provide are sent to Google Gemini to generate the result. FreeResumePost does not add
            that text or the generated result to your saved profile through this tool. Do not use
            the tool for patient information or other sensitive data.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">Data retention and deletion</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Your profile stays active until you ask us to delete it.</li>
            <li>
              To request deletion, use{' '}
              <SupportEmailLink
                subject="Delete my profile"
                className="text-indigo-700 underline hover:text-indigo-900"
                fallback={<>the operator mailing address below</>}
              />
              . Include the email address on your profile and &quot;Delete my profile&quot; in the subject
              line or letter. We will delete the resume file and saved profile data within 30 days.
            </li>
          </ul>

          <h2 className="mt-8 mb-2 text-xl font-semibold">Your privacy rights</h2>
          <p>
            Depending on where you live, you may have the right to access, correct, or delete your
            personal data. Use{' '}
            <SupportEmailLink
              subject="Privacy request"
              className="text-indigo-700 underline hover:text-indigo-900"
              fallback={<>the operator mailing address below</>}
            />
            . Include &quot;Privacy request&quot; in the subject line or letter. We will respond within 30
            days.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">Cookies</h2>
          <p>
            We use cookies needed for email-verified access and the daily limit on the resume
            tailoring tool. We do not use advertising cookies or cross-site trackers.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">Bot protection</h2>
          <p>
            We use{' '}
            <a
              href="https://www.cloudflare.com/products/turnstile/"
              className="text-indigo-700 underline hover:text-indigo-900"
              rel="noopener noreferrer"
            >
              Cloudflare Turnstile
            </a>{' '}
            on resume uploads and some forms to detect bots and prevent spam. Turnstile may use
            browser signals to assess whether a submission is human. See{' '}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              className="text-indigo-700 underline hover:text-indigo-900"
              rel="noopener noreferrer"
            >
              Cloudflare&apos;s Privacy Policy
            </a>{' '}
            for details.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">Security</h2>
          <p>
            We use encryption in transit and at rest. No online service can promise absolute
            security.
          </p>

          <h2 className="mt-8 mb-2 text-xl font-semibold">Operator</h2>
          <p>
            <strong>Ava Health Partners LLC</strong>
            <br />
            4532 W Kennedy Blvd, Suite 125
            <br />
            Tampa, FL 33609
            <br />
            <SupportEmailLink
              subject="FreeResumePost support"
              className="text-indigo-700 underline hover:text-indigo-900"
              fallback={
                <>No product email is published until a monitored FreeResumePost address is active.</>
              }
            />
          </p>

          <p className="mt-10 text-sm text-slate-600">
            See also:{' '}
            <Link href="/terms" className="text-indigo-700 underline hover:text-indigo-900">
              Terms of Use
            </Link>
          </p>
        </div>
      </article>
    </main>
  )
}
