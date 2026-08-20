import type { Metadata } from 'next'
import Link from 'next/link'

import { safeJsonLd } from '@/lib/safe-jsonld'
export const metadata: Metadata = {
  title: 'How it works',
  description: 'How freeresumepost.co works: upload your resume free, get matched to real healthcare openings, no recruiter spam, no resume databases sold.',
  alternates: { canonical: 'https://www.freeresumepost.co/how-it-works' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'How freeresumepost.co works',
    description:
      'Upload free, get matched to real healthcare openings. No recruiter spam, no resume databases sold.',
    url: 'https://www.freeresumepost.co/how-it-works',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How freeresumepost.co works',
    description:
      'Upload free, get matched to real healthcare openings. No recruiter spam, no resume databases sold.',
    images: ['/opengraph-image'],
  },
}

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <p className="text-xs font-semibold tracking-wider text-[#003D5C] uppercase mb-3">How it works</p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-slate-900 mb-6">
          Upload once.<br />
          <span className="text-[#003D5C]">Get matched.</span>
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-12">
          freeresumepost.co matches healthcare candidates to real, currently-open jobs. We don&apos;t
          spam you and we don&apos;t sell your data. Upload once and you&apos;re done.
          Here&apos;s the actual flow.
        </p>

        <h2 className="text-xl font-semibold mb-4">For candidates</h2>
        <ol className="space-y-5 mb-12">
          <li className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-[#7FBC00] text-white text-sm font-semibold flex items-center justify-center">1</div>
            <div>
              <div className="font-semibold text-slate-900 mb-1">Drop your resume</div>
              <div className="text-slate-600 leading-relaxed">PDF, DOCX, or plain text. Up to 5 MB. Parsed locally in your browser. Your file never reaches our servers until you click submit.</div>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-[#7FBC00] text-white text-sm font-semibold flex items-center justify-center">2</div>
            <div>
              <div className="font-semibold text-slate-900 mb-1">Review every field</div>
              <div className="text-slate-600 leading-relaxed">Our parser fills in name, email, phone, credentials, specialty, state, and years of experience. You correct anything wrong before saving.</div>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-[#7FBC00] text-white text-sm font-semibold flex items-center justify-center">3</div>
            <div>
              <div className="font-semibold text-slate-900 mb-1">Pick public or private</div>
              <div className="text-slate-600 leading-relaxed">
                <strong>Public:</strong> first name, last initial, specialty, state, and years of experience are visible at /profile/[your-slug], discoverable by employers.<br />
                <strong>Private:</strong> only the matching engine sees you. New matches surface on your private profile page (the edit URL we send when you upload). Nobody else can find you.
              </div>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-[#7FBC00] text-white text-sm font-semibold flex items-center justify-center">4</div>
            <div>
              <div className="font-semibold text-slate-900 mb-1">Get matched</div>
              <div className="text-slate-600 leading-relaxed">
                Our matching engine scores you against every active job on freejobpost.co (specialty trigram, state, city, credential, experience, salary, certifications). Your top matches appear on your private profile page, refreshed daily. You decide whether to apply. Never automatic.
              </div>
            </div>
          </li>
        </ol>

        <h2 className="text-xl font-semibold mb-4">For employers</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Employers post jobs at <a href="https://freejobpost.co/post-job" className="underline text-[#003D5C] hover:text-[#002A40]">freejobpost.co/post-job</a>. The matching engine surfaces matched candidates to them. Candidates apply directly through the job listing. No middlemen, no &quot;unlock this resume&quot; fee.
        </p>

        <h2 className="text-xl font-semibold mt-12 mb-4">What you don&apos;t get</h2>
        <ul className="space-y-2 mb-12 text-slate-700">
          <li>· Recruiter cold calls about jobs that don&apos;t match what you do</li>
          <li>· &quot;Quick question&quot; emails from agencies who scraped your contact info</li>
          <li>· Auto-applications submitted on your behalf</li>
          <li>· A resume database we sell to other recruiters</li>
        </ul>

        <h2 className="text-xl font-semibold mt-12 mb-4">Why is this free?</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          freeresumepost.co is operated by Ava Health Partners LLC, a healthcare staffing firm.
          When a match leads to a real placement, the hiring employer pays our fee. The
          candidate-facing platform stays free because the placement-fee model upstream covers the
          infrastructure.
        </p>
        <p className="text-slate-600 leading-relaxed mb-12">
          You can use freeresumepost.co indefinitely without ever being charged anything. Read our{' '}
          <Link href="/privacy" className="underline text-[#003D5C] hover:text-[#002A40]">privacy policy</Link> for the specifics on what we collect and don&apos;t.
        </p>

        <h2 className="text-xl font-semibold mt-12 mb-4">FAQ</h2>
        <div className="space-y-6 mb-12">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Is it really free?</h3>
            <p className="text-slate-600">Yes. We don&apos;t charge candidates anything, not even to apply. Hiring employers pay our placement fee when a match converts.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Will my resume be sold to recruiters?</h3>
            <p className="text-slate-600">No. We don&apos;t sell, license, or share your data with third parties. Only verified employers with active job posts on our network can see profiles that match their roles.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">What healthcare roles can I upload as?</h3>
            <p className="text-slate-600">Nurse Practitioners, CRNAs, Registered Nurses, LPNs, CNAs, therapists (PT, OT, SLP, AuD), pharmacists (PharmD/RPh), and most allied health roles.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">How fast will I get matched?</h3>
            <p className="text-slate-600">Initial matches typically surface within a day of upload. Florida + Texas + California candidates see the highest match volume.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Can I delete my profile later?</h3>
            <p className="text-slate-600">Yes. At any time. Email <a href="mailto:info@avahealth.co" className="underline text-[#003D5C] hover:text-[#002A40]">info@avahealth.co</a> with the subject "Delete my profile" and we&apos;ll wipe both the resume file and parsed data within 30 days, including from any active employer match queues.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Do I need to make my profile public?</h3>
            <p className="text-slate-600">No. Most candidates keep profiles private. Public profiles get an indexed page on our site, which can help passive job-seeking.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Is my license info verified?</h3>
            <p className="text-slate-600">We auto-detect credential tokens (RN, CRNA, LPN, PharmD, etc.) from your resume text. We don&apos;t do full credential verification. Employers verify independently before hiring.</p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl bg-slate-50 p-8 text-center">
          <p className="text-2xl font-semibold mb-3 text-slate-900">Ready when you are</p>
          <Link href="/upload" className="inline-block bg-[#003D5C] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#002A40]">
            Upload Your Resume →
          </Link>
        </div>
      </article>

      {/* BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.freeresumepost.co' },
              { '@type': 'ListItem', position: 2, name: 'How it works', item: 'https://www.freeresumepost.co/how-it-works' },
            ],
          }),
        }}
      />

</main>
  )
}
