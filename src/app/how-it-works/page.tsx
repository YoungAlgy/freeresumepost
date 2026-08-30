import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'See how FreeResumePost turns a nursing or allied health resume into a private profile you can review and update.',
  alternates: { canonical: 'https://www.freeresumepost.co/how-it-works' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'How FreeResumePost Works',
    description:
      'Upload your healthcare resume, review the details, and choose your profile privacy.',
    url: 'https://www.freeresumepost.co/how-it-works',
    type: 'website',
    images: ['/opengraph-image'],
  },
}

const FLOW = [
  {
    title: 'Choose a resume',
    body: 'Add a PDF or DOCX file up to 5 MB. We read it inside your browser.',
  },
  {
    title: 'Check every field',
    body: 'Review your name, credentials, specialty, location, and experience before anything is saved.',
  },
  {
    title: 'Choose your visibility',
    body: 'Profiles start private. A limited public link is available if you want one.',
  },
  {
    title: 'Save and keep your link',
    body: 'Your file uploads when you tap Save. The private profile link lets you return and make changes.',
  },
]

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
          How it works
        </p>
        <h1 className="mt-2 text-4xl font-bold leading-tight tracking-[-0.03em] sm:text-5xl">
          One resume. One profile you control.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          FreeResumePost gives nurses and allied health professionals a quick way to post and
          maintain their resume details.
        </p>

        <ol className="mt-10 space-y-4">
          {FLOW.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">{step.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-12 border-t border-slate-200 pt-10">
          <h2 className="text-2xl font-bold tracking-tight">What a public profile shows</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Your first name, last initial, credential, specialty, city, state, and years of
            experience can appear at a shareable link. Your full last name, email, phone number,
            and resume file stay hidden. Public sharing is off by default.
          </p>
        </section>

        <section className="mt-10 rounded-2xl bg-indigo-50 p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight">Ready to start?</h2>
          <p className="mt-2 leading-7 text-slate-600">
            You will review the extracted details before your profile saves.
          </p>
          <Link
            href="/upload"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            Upload my resume
          </Link>
        </section>
      </article>
    </main>
  )
}
