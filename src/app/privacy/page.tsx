import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Free Resume Post privacy policy. Your resume is yours; we never sell candidate data. Operated by Ava Health Partners LLC.',
  alternates: { canonical: 'https://freeresumepost.co/privacy' },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">
            freeresumepost<span className="text-slate-400">.co</span>
          </Link>
          <Link href="/upload" className="text-sm font-medium text-blue-600 hover:text-blue-700">Upload resume</Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-600 mb-10">Last updated April 27, 2026</p>

        <div className="space-y-6 text-slate-800 leading-relaxed">
          <p>
            Ava Health Partners LLC operates <strong>freeresumepost.co</strong>. This policy explains
            what data we collect, why, and what we do (and don&apos;t) do with it.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">The short version</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Your resume is parsed locally in your browser before any data reaches our servers.</li>
            <li>You review every extracted field before saving.</li>
            <li>We never sell your contact information or resume content.</li>
            <li>We email you only when a strong job match opens up; never marketing spam.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-2">What we collect</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Profile fields you save: name, email, phone, credential, specialty, city, state, years of experience.</li>
            <li>The raw text of your resume (stored as you saved it; not the original PDF/DOCX file).</li>
            <li>Standard server logs (IP address, user agent) for traffic analytics + abuse prevention.</li>
            <li>Match-engine scores against active jobs on freejobpost.co.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-2">What we don&apos;t collect</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>The original resume file. After parsing in your browser, only the text you approve is sent to us.</li>
            <li>Social Security number, date of birth, financial info — never asked.</li>
            <li>Behavioral tracking data from third-party advertisers.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-2">How we use your data</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Matching:</strong> we score your profile against active jobs and email you when a 70%+ match opens.</li>
            <li><strong>Profile management:</strong> we email you a secure edit link so you can update your profile.</li>
            <li><strong>Aggregated analytics:</strong> we look at usage trends (popular specialties, geographic distribution) — never individually identifiable.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-2">Public vs private profiles</h2>
          <p>
            When you save your profile, you choose whether it&apos;s <strong>public</strong> (discoverable
            by employers searching freejobpost.co for matched candidates) or <strong>private</strong>
            (matching engine surfaces you to employers only when they post a role you match).
          </p>
          <p>
            Public profiles show: first name, last initial, specialty, state, years of experience.
            Public profiles never expose: email, phone, or full last name.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">When you apply for a job</h2>
          <p>
            Clicking &quot;Apply&quot; on a job listing forwards your application contact info (name, email,
            phone, resume URL) directly to that specific employer. Each application is opt-in;
            we don&apos;t auto-apply on your behalf.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">Data retention + deletion</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Your profile stays active until you delete it.</li>
            <li>Inactive profiles (no logins or applications in 18 months) are auto-archived and removed from matching.</li>
            <li>You can request full deletion via the edit link in your verification email or by emailing <a href="mailto:hello@avahealth.co" className="underline text-blue-600 hover:text-blue-700">hello@avahealth.co</a>.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-2">Your rights (CCPA / GDPR)</h2>
          <p>
            California + EU residents: you have the right to access, correct, or delete your data.
            Email <a href="mailto:hello@avahealth.co" className="underline text-blue-600 hover:text-blue-700">hello@avahealth.co</a> with the subject &quot;Privacy request&quot; — we&apos;ll respond within 30 days.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">Cookies</h2>
          <p>
            We use cookies only for: session continuity (the edit-link verification token) and
            basic analytics (Vercel Analytics, page views). No advertising cookies. No cross-site trackers.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">Security</h2>
          <p>
            We use industry-standard encryption in transit (TLS 1.2+) and at rest. Our database is hosted
            on Supabase (SOC 2 Type II) with row-level security on candidate-facing tables.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">Operator</h2>
          <p>
            <strong>Ava Health Partners LLC</strong><br />
            3608 S Belcher Dr<br />
            Tampa, FL 33629<br />
            <a href="mailto:hello@avahealth.co" className="underline text-blue-600 hover:text-blue-700">hello@avahealth.co</a>
          </p>

          <p className="mt-10 text-sm text-slate-600">
            See also: <Link href="/terms" className="underline text-blue-600 hover:text-blue-700">Terms of Use</Link>
          </p>
        </div>
      </article>
    </main>
  )
}
