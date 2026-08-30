import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Post Your Nursing or Allied Health Resume Free | FreeResumePost' },
  description:
    'Upload, review, and save a nursing or allied health resume profile. Your profile stays private unless you choose to share a limited public link.',
  alternates: { canonical: 'https://www.freeresumepost.co' },
  openGraph: {
    title: 'Post Your Healthcare Resume Free | FreeResumePost',
    description:
      'A simple resume profile for nurses and allied health professionals. Private by default.',
    url: 'https://www.freeresumepost.co',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Post Your Healthcare Resume Free | FreeResumePost',
    description:
      'A simple resume profile for nurses and allied health professionals. Private by default.',
    images: ['/opengraph-image'],
  },
}

const STEPS = [
  {
    label: 'Choose your file',
    detail: 'Add a PDF or DOCX resume up to 5 MB.',
  },
  {
    label: 'Review the details',
    detail: 'We read the file in your browser and fill the form for you.',
  },
  {
    label: 'Set your privacy',
    detail: 'Keep the profile private or turn on a limited public link.',
  },
  {
    label: 'Save your profile',
    detail: 'Your file uploads after you review the details and tap Save.',
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
            Post your healthcare resume in minutes.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Upload your resume, check the details we find, and save one profile you can update.
            Public sharing is optional.
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
            Already posted?{' '}
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
            Your resume stays in your hands.
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            Nothing is saved while we read your file. You see and edit every field before the
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
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-14 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:items-center sm:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
              Built for healthcare
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Focused on nurses and allied health.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              FreeResumePost is for RNs, LPNs, CNAs, therapists, imaging techs, lab
              professionals, medical assistants, and other allied health workers.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
            <p className="font-semibold text-slate-950">Private by default</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your public link starts off. If you turn it on, it shows limited work details.
              Your email, phone number, last name, and resume file stay hidden.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-6 sm:py-24">
        <h2 className="text-3xl font-bold tracking-tight text-slate-950">
          Ready to post your resume?
        </h2>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
          Start with your file. You will review everything before it saves.
        </p>
        <Link
          href="/upload"
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          Upload my resume
        </Link>
      </section>
    </main>
  )
}
