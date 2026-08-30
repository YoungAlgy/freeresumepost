type Variant = 'full' | 'mono'
type Theme = 'light' | 'dark'

type LogoProps = {
  size?: number
  variant?: Variant
  theme?: Theme
  className?: string
}

export function Logo({
  size = 32,
  variant = 'full',
  theme = 'light',
  className = '',
}: LogoProps) {
  const baseColor = theme === 'dark' ? '#FFFFFF' : '#4338CA'
  const accentColor = variant === 'mono' ? baseColor : '#0D9488'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="FreeResumePost"
      role="img"
    >
      <path
        d="M16 7h23l11 11v37a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3Z"
        stroke={baseColor}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M39 8v11h10" stroke={baseColor} strokeWidth="5" strokeLinejoin="round" />
      <path d="M22 30h18M22 39h12" stroke={baseColor} strokeWidth="4" strokeLinecap="round" />
      <path
        d="m34 49 4 4 9-10"
        stroke={accentColor}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Logo
