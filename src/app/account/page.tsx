import type { Metadata } from 'next'
import AccountView from './AccountView'

export const metadata: Metadata = {
  title: 'Your account',
  description: 'View your resume profile, get your secure edit link, or upload a new resume.',
  // Don't index — authed personal page, same as /account/tailor and /candidate/login
  robots: { index: false, follow: false },
}

export default function Page() {
  return <AccountView />
}
