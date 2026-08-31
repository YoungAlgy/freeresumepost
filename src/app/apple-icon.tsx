import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
export const revalidate = 604800

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#FFFFFF',
        }}
      >
        <svg width="180" height="180" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="64" rx="12" fill="#FFFFFF" />
          <path d="M16 7h23l11 11v37a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3Z" stroke="#4338CA" strokeWidth="5" strokeLinejoin="round" />
          <path d="M39 8v11h10" stroke="#4338CA" strokeWidth="5" strokeLinejoin="round" />
          <path d="M22 30h18M22 39h12" stroke="#4338CA" strokeWidth="4" strokeLinecap="round" />
          <path d="m34 49 4 4 9-10" stroke="#0D9488" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  )
}
