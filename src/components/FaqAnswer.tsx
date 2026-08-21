// Renders one FAQ answer string, turning a literal email address into a
// mailto link. The plain-text `text` prop is the exact same string that
// also feeds FAQPage JSON-LD's `acceptedAnswer.text` (see
// src/lib/faq-schema.ts) -- one string drives both the visible paragraph
// and the schema, so they can never drift apart the way a hand-written
// JSX copy alongside a hand-written schema copy could.

type Props = {
  text: string
  className?: string
  linkClassName?: string
  email?: string
  mailtoHref?: string
}

export function FaqAnswer({
  text,
  className,
  linkClassName,
  email = 'info@avahealth.co',
  mailtoHref,
}: Props) {
  const href = mailtoHref ?? `mailto:${email}`
  const idx = text.indexOf(email)
  if (idx === -1) {
    return <p className={className}>{text}</p>
  }
  return (
    <p className={className}>
      {text.slice(0, idx)}
      <a href={href} className={linkClassName}>{email}</a>
      {text.slice(idx + email.length)}
    </p>
  )
}
