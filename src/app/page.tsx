import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Your Healthcare Resume, Private by Default | FreeResumePost' },
  description:
    'Create a private nursing or allied health resume profile. Review every detail before you save, then choose if you want a limited public link.',
  alternates: { canonical: 'https://www.freeresumepost.co' },
  openGraph: {
    siteName: 'FreeResumePost',
    locale: 'en_US',
    title: 'Your Healthcare Resume, Private by Default | FreeResumePost',
    description:
      'A simple resume profile for nurses and allied health professionals. Private by default.',
    url: 'https://www.freeresumepost.co',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Healthcare Resume, Private by Default | FreeResumePost',
    description:
      'A simple resume profile for nurses and allied health professionals. Private by default.',
    images: ['/opengraph-image'],
  },
}

const STEPS = [
  {
    label: 'Choose and read your file',
    detail: 'Add a PDF or DOCX resume up to 5 MB. We read it in your browser first.',
  },
  {
    label: 'Review, choose privacy, and save',
    detail: 'Check the details we find, choose a limited public link only if you want one, then tap Save.',
  },
]

export default function Home() {
  return (
    <main className="bg-white text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_38%),linear-gradient(to_bottom,_#eef2ff,_#ffffff_70%)]"
        />
        <div className="mx-auto max-w-5xl px-5 py-16 text-center sm:px-6 sm:py-24">
          <p className="mx-auto mb-5 inline-flex rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-800">
            Nursing and allied health resumes
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-6xl">
            Your healthcare resume. Private by default.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            For nurses and allied health professionals. Upload a PDF or DOCX, review every detail,
            and save one profile you can update.
          </p>
          <div className="mt-8">
            <Link
              href="/upload"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-700 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              Upload my resume
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Already have a profile?{' '}
            <Link href="/candidate/login" className="font-semibold text-indigo-700 hover:underline">
              Open your profile
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
            One short flow
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Review it before anything saves.
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            The file is read in your browser first. You see and edit every field before your
            profile is created.
          </p>
        </div>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <li key={step.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-950">{step.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{step.detail}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">
          Your profile starts private. If you turn on a limited public link, your email, phone
          number, full last name, and resume file stay hidden.
        </p>
      </section>

      <section aria-labelledby="job-tool" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-5xl gap-6 px-5 py-14 sm:px-6 sm:py-16 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#276749]">
              Ready to search
            </p>
            <h2 id="job-tool" className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Browse healthcare jobs posted by employers.
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              FreeJobPost lists nursing and allied health roles posted directly by employers.
              Your FreeResumePost profile stays separate. Visiting jobs does not send your resume
              or submit an application.
            </p>
          </div>
          <a
            href="https://freejobpost.co/jobs"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#276749] px-5 py-3 font-semibold text-[#276749] transition-colors hover:bg-[#F0FDF4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#276749] focus-visible:ring-offset-2 md:w-auto"
          >
            Browse FreeJobPost
          </a>
        </div>
      </section>
    </main>
  )
}
