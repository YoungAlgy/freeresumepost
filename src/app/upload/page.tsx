import type { Metadata } from 'next'
import UploadForm from './upload-form'

export const metadata: Metadata = {
  title: 'Create your private nursing or allied health resume profile',
  description:
    'Upload a PDF or DOCX resume. Review the details before your private FreeResumePost profile is saved.',
  alternates: { canonical: 'https://www.freeresumepost.co/upload' },
  openGraph: {
    title: 'Create Your Private Healthcare Resume Profile | FreeResumePost',
    description:
      'Create a nursing or allied health resume profile. Private by default and free to use.',
    url: 'https://www.freeresumepost.co/upload',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Your Private Healthcare Resume Profile | FreeResumePost',
    description:
      'Create a nursing or allied health resume profile. Private by default and free to use.',
    images: ['/opengraph-image'],
  },
}

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
            FreeResumePost
          </p>
          <h1 className="mt-2 text-4xl font-bold leading-tight tracking-[-0.03em] sm:text-5xl">
            Upload your resume.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            We read the file in your browser first. Your resume uploads only after you review the
            details and tap Save.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            For nurses and allied health professionals. PDF or DOCX. Up to 5 MB.
          </p>
        </div>

        <UploadForm />

        <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <h2 className="font-semibold text-slate-950">After you save</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            You will open a private profile page where you can check your details and update your
            visibility. Public sharing stays off unless you turn it on.
          </p>
        </section>
      </div>
    </main>
  )
}
