import type { ReactNode } from 'react'
import { getFreeResumePostSupportEmail } from '@/lib/support-contact'

type SupportEmailLinkProps = {
  subject: string
  fallback: ReactNode
  className?: string
}

export function SupportEmailLink({
  subject,
  fallback,
  className,
}: SupportEmailLinkProps) {
  const email = getFreeResumePostSupportEmail()
  if (!email) return <>{fallback}</>

  return (
    <a
      href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}
      className={className}
    >
      {email}
    </a>
  )
}
