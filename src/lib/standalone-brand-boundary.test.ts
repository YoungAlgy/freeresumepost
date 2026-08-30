import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('FreeResumePost public brand boundary', () => {
  it('keeps Ava and FreeJobPost out of global product surfaces', () => {
    const globalSurfaces = [
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/app/how-it-works/page.tsx',
      'src/components/SiteHeader.tsx',
      'src/lib/organization-schema.ts',
      'src/app/manifest.ts',
      'public/llms.txt',
    ]

    for (const path of globalSurfaces) {
      const contents = source(path)
      expect(contents, path).not.toMatch(/Ava Health|avahealth\.co/i)
      expect(contents, path).not.toMatch(/freejobpost\.co/i)
      expect(contents, path).not.toMatch(/staffing|placement fee|recruiter/i)
    }
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
