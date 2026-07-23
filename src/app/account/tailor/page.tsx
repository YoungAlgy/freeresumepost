import type { Metadata } from 'next'
import TailorForm from './TailorForm'

export const metadata: Metadata = {
  title: 'Tailor your resume',
  description: 'Tailor your resume and cover letter to a specific job posting.',
  // Don't index — authed personal page, same as /account and /candidate/login
  robots: { index: false, follow: false },
}

export default function Page() {
  return <TailorForm />
}
