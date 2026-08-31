import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { metadata as homeMetadata } from '../app/page'

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('FreeResumePost public brand boundary', () => {
  it('keeps Ava and recruiting-company presentation out of global product surfaces', () => {
    const globalSurfaces = [
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/app/how-it-works/page.tsx',
      'src/app/upload/page.tsx',
      'src/app/candidate/login/page.tsx',
      'src/components/SiteHeader.tsx',
      'src/components/HealthcareToolsNav.tsx',
      'src/lib/organization-schema.ts',
      'src/app/manifest.ts',
      'public/llms.txt',
    ]

    for (const path of globalSurfaces) {
      const contents = source(path)
      expect(contents, path).not.toMatch(/Ava Health|avahealth\.co/i)
      expect(contents, path).not.toMatch(
        /provider staffing|placement fee|matching engine|our recruiters|recruiter matching|\brecruiters?\b|48,696|aggregated jobs|syndicate everywhere/i,
      )
    }
  })

  it('connects FreeJobPost through approved navigation surfaces only', () => {
    const siblingUrl = 'https://freejobpost.co'

    for (const path of [
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/components/HealthcareToolsNav.tsx',
      'public/llms.txt',
    ]) {
      expect(source(path), path).toContain(siblingUrl)
    }

    const switcher = source('src/components/HealthcareToolsNav.tsx')
    expect(switcher).toContain('aria-label="Healthcare hiring tools"')
    expect(switcher).toContain('FreeJobPost')
    expect(switcher).toContain('min-h-11')
    expect(source('src/lib/organization-schema.ts')).not.toContain('freejobpost.co')
  })

  it('pins the standalone resume product metadata and public positioning', () => {
    const layout = source('src/app/layout.tsx')
    const home = source('src/app/page.tsx')
    const manifest = source('src/app/manifest.ts')

    expect(layout).toContain("applicationName: 'FreeResumePost'")
    expect(layout).toContain(
      "metadataBase: new URL('https://www.freeresumepost.co')",
    )
    expect(layout).toContain("siteName: 'FreeResumePost'")
    expect(home).toContain(
      "alternates: { canonical: 'https://www.freeresumepost.co' }",
    )
    expect(homeMetadata.openGraph).toMatchObject({
      siteName: 'FreeResumePost',
      locale: 'en_US',
      type: 'website',
      url: 'https://www.freeresumepost.co',
    })
    expect(home).toContain('Your FreeResumePost profile is kept separate')
    expect(manifest).toContain("name: 'FreeResumePost'")
    expect(manifest).toContain("short_name: 'FreeResumePost'")
    expect(manifest).toContain("src: '/icon.svg'")
    expect(manifest).toContain("src: '/apple-icon'")
    expect(manifest).not.toContain("src: '/icon'")
    expect(manifest).toContain("src: '/icon-512'")
    expect(source('src/app/icon-512/route.tsx')).toContain("contentType = 'image/png'")
    expect(source('src/app/apple-icon.tsx')).toContain("contentType = 'image/png'")
    expect(existsSync(resolve(process.cwd(), 'src/app/apple-icon.svg'))).toBe(false)
    expect(source('next.config.ts')).toContain(
      "has: [{ type: 'host', value: 'freeresumepost.co' }]",
    )
    expect(source('next.config.ts')).toContain(
      "destination: 'https://www.freeresumepost.co/:path*'",
    )
    expect(source('next.config.ts')).toContain("destination: '/icon.svg'")
  })

  it('retires old indexed product surfaces permanently', () => {
    for (const path of [
      'src/app/specialty/page.tsx',
      'src/app/specialty/[slug]/page.tsx',
      'src/app/changelog/page.tsx',
      'src/app/e-verify/page.tsx',
    ]) {
      const contents = source(path)
      expect(contents, path).toContain('permanentRedirect')
      expect(contents, path).not.toMatch(/\bredirect\(/)
    }

    expect(source('src/app/changelog/feed.xml/route.ts')).toContain(', 308)')
  })

  it('has no Ava email fallback in legal or product contact surfaces', () => {
    for (const path of [
      'src/app/privacy/page.tsx',
      'src/app/terms/page.tsx',
      'src/components/SupportEmailLink.tsx',
      'src/lib/support-contact.ts',
      '.env.example',
    ]) {
      expect(source(path), path).not.toContain('info@avahealth.co')
    }

    const supportContract = source('src/lib/support-contact.ts')
    expect(supportContract).toContain('process.env.FREERESUMEPOST_SUPPORT_EMAIL')
    expect(supportContract).not.toContain('NEXT_PUBLIC_')
  })
})
