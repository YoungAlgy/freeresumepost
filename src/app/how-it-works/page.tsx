import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How it works',
  description: 'How freeresumepost.co works — upload your resume free, get matched to real healthcare openings, no recruiter spam, no resume databases sold.',
  alternates: { canonical: 'https://www.freeresumepost.co/how-it-works' },
  robots: { index: true, follow: true },
}

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">
            freeresumepost<span className="text-slate-400">.co</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium">
            <a href="https://freejobpost.co" className="hover:text-slate-900">For employers</a>
            <Link href="/upload" className="bg-slate-900 text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-slate-700">Upload resume</Link>
          </div>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase mb-3">How it works</p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-slate-900 mb-6">
          Upload once.<br />
          <span className="text-blue-600">Get matched.</span>
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-12">
          freeresumepost.co matches healthcare candidates to real, currently-open jobs. We don&apos;t
          spam you, we don&apos;t sell your data, and we don&apos;t make you re-upload for every application.
          Here&apos;s the actual flow.
        </p>

        <h2 className="text-xl font-semibold mb-4">For candidates</h2>
        <ol className="space-y-5 mb-12">
          <li className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">1</div>
            <div>
              <div className="font-semibold text-slate-900 mb-1">Drop your resume</div>
              <div className="text-slate-600 leading-relaxed">PDF, DOCX, or plain text. Up to 5 MB. Parsed locally in your browser — your file never reaches our servers until you click submit.</div>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">2</div>
            <div>
              <div className="font-semibold text-slate-900 mb-1">Review every field</div>
              <div className="text-slate-600 leading-relaxed">Our parser fills in name, email, phone, credentials, specialty, state, and years of experience. You correct anything wrong before saving.</div>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">3</div>
            <div>
              <div className="font-semibold text-slate-900 mb-1">Pick public or private</div>
              <div className="text-slate-600 leading-relaxed">
                <strong>Public:</strong> first name, last initial, specialty, state, and years of experience are visible at /profile/[your-slug] — discoverable by employers.<br />
                <strong>Private:</strong> only the matching engine sees you. New matches surface on your private profile page (the edit URL we send when you upload); nobody else can find you.
              </div>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">4</div>
            <div>
              <div className="font-semibold text-slate-900 mb-1">Get matched</div>
              <div className="text-slate-600 leading-relaxed">
                Our matching engine scores you against every active job on freejobpost.co (specialty trigram, state, city, credential, experience, salary, certifications). Your top matches appear on your private profile page, refreshed every few hours. You decide whether to apply — never automatic.
              </div>
            </div>
          </li>
        </ol>

        <h2 className="text-xl font-semibold mb-4">For employers</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Employers post jobs at <a href="https://freejobpost.co/post-job" className="underline text-blue-600 hover:text-blue-700">freejobpost.co/post-job</a>. The matching engine surfaces matched candidates to them; candidates apply directly through the job listing. No middlemen, no &quot;unlock this resume&quot; fee.
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
          When a 70%+ match leads to a real placement, the hiring employer pays our fee. The
          candidate-facing platform stays free because the placement-fee model upstream covers the
          infrastructure.
        </p>
        <p className="text-slate-600 leading-relaxed mb-12">
          You can use freeresumepost.co indefinitely without ever being charged anything. Read our{' '}
          <Link href="/privacy" className="underline text-blue-600 hover:text-blue-700">privacy policy</Link> for the specifics on what we collect and don&apos;t.
        </p>

        <h2 className="text-xl font-semibold mt-12 mb-4">FAQ</h2>
        <div className="space-y-6 mb-12">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Is it really free?</h3>
            <p className="text-slate-600">Yes. We don&apos;t charge candidates anything — not for upload, not for matches, not to apply. Hiring employers pay our placement fee when a match converts.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Will my resume be sold to recruiters?</h3>
            <p className="text-slate-600">No. We don&apos;t sell, license, or share your data with third parties. Only verified employers with active job posts on our network can see profiles that match their roles.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">What healthcare roles can I upload as?</h3>
            <p className="text-slate-600">Physicians (MD/DO), Nurse Practitioners, Physician Assistants, Registered Nurses, CRNAs, LPNs, therapists (PT, OT, SLP, AuD), pharmacists (PharmD/RPh), and most allied health roles.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">How fast will I get matched?</h3>
            <p className="text-slate-600">Initial matches typically surface within 24-48 hours of upload. Florida + Texas + California candidates see the highest match volume.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Can I delete my profile later?</h3>
            <p className="text-slate-600">Yes — at any time. Delete from your profile page and we wipe both the resume file and parsed data within 30 days, including from any active employer match queues.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Do I need to make my profile public?</h3>
            <p className="text-slate-600">No. Most candidates keep profiles private. Public profiles get an indexed page on our site, which can help passive job-seeking.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Is my license info verified?</h3>
            <p className="text-slate-600">We cross-reference NPI numbers and state board lookups during the parse step but don&apos;t do full credential verification. Employers verify credentials independently before hiring.</p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl bg-slate-50 p-8 text-center">
          <p className="text-2xl font-semibold mb-3 text-slate-900">Ready when you are</p>
          <Link href="/upload" className="inline-block bg-slate-900 text-white font-semibold px-6 py-3 rounded-full hover:bg-slate-700">
            Upload your resume →
          </Link>
        </div>
      </article>

      {/* FAQPage schema — eligible for FAQ rich results in SERP */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: 'Is it really free?', acceptedAnswer: { '@type': 'Answer', text: "Yes. We don't charge candidates anything — not for upload, not for matches, not to apply. Hiring employers pay our placement fee when a match converts." } },
              { '@type': 'Question', name: 'Will my resume be sold to recruiters?', acceptedAnswer: { '@type': 'Answer', text: "No. We don't sell, license, or share your data with third parties. Only verified employers with active job posts on our network can see profiles that match their roles." } },
              { '@type': 'Question', name: 'What healthcare roles can I upload as?', acceptedAnswer: { '@type': 'Answer', text: 'Physicians (MD/DO), Nurse Practitioners, Physician Assistants, Registered Nurses, CRNAs, LPNs, therapists (PT, OT, SLP, AuD), pharmacists (PharmD/RPh), and most allied health roles.' } },
              { '@type': 'Question', name: 'How fast will I get matched?', acceptedAnswer: { '@type': 'Answer', text: 'Initial matches typically surface within 24-48 hours of upload. Florida + Texas + California candidates see the highest match volume.' } },
              { '@type': 'Question', name: 'Can I delete my profile later?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — at any time. Delete from your profile page and we wipe both the resume file and parsed data within 30 days, including from any active employer match queues.' } },
              { '@type': 'Question', name: 'Do I need to make my profile public?', acceptedAnswer: { '@type': 'Answer', text: "No. Most candidates keep profiles private. Public profiles get an indexed page on our site, which can help passive job-seeking." } },
              { '@type': 'Question', name: 'Is my license info verified?', acceptedAnswer: { '@type': 'Answer', text: "We cross-reference NPI numbers and state board lookups during the parse step but don't do full credential verification. Employers verify credentials independently before hiring." } },
            ],
          }),
        }}
      />
    </main>
  )
}
