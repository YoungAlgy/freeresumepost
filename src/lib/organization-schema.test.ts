import { describe, expect, it } from 'vitest'
import { ORG_PROFILE, buildOrganizationGraph } from './organization-schema'

// Mirror of freejobpost/src/lib/organization-schema.test.ts. Update both in
// the same commit when the canonical Org schema changes — the whole point of
// these tests is to catch silent drift between the two sites.

const FRESUME_INPUT = {
  websiteUrl: 'https://www.freeresumepost.co',
  websiteName: 'Free Resume Post',
  websiteDescription: 'Free resume hosting + healthcare job matching.',
  organizationDescription: 'Ava Health Partners operates freeresumepost.co.',
  searchActionTarget: 'https://www.freeresumepost.co/?q={search_term_string}',
} as const

describe('ORG_PROFILE (canonical)', () => {
  it('legalName matches Ava Health Partners LLC', () => {
    expect(ORG_PROFILE.legalName).toBe('Ava Health Partners LLC')
  })

  it('uses the canonical providers.avahealth.co identity', () => {
    expect(ORG_PROFILE['@id']).toBe('https://providers.avahealth.co#organization')
    expect(ORG_PROFILE.url).toBe('https://providers.avahealth.co')
  })

  it('phone is in international E.164 format', () => {
    expect(ORG_PROFILE.telephone).toMatch(/^\+1-\d{3}-\d{3}-\d{4}$/)
  })

  it('postal address has all required fields', () => {
    expect(ORG_PROFILE.address.streetAddress).toBeTruthy()
    expect(ORG_PROFILE.address.addressLocality).toBeTruthy()
    expect(ORG_PROFILE.address.addressRegion).toBeTruthy()
    expect(ORG_PROFILE.address.postalCode).toMatch(/^\d{5}/)
    expect(ORG_PROFILE.address.addressCountry).toBe('US')
  })
})

describe('buildOrganizationGraph', () => {
  it('returns a schema.org @graph with exactly Organization + WebSite', () => {
    const graph = buildOrganizationGraph(FRESUME_INPUT)
    expect(graph['@context']).toBe('https://schema.org')
    expect(graph['@graph']).toHaveLength(2)
    const types = graph['@graph'].map((e) => e['@type'])
    expect(types).toContain('Organization')
    expect(types).toContain('WebSite')
  })

  it('WebSite block uses per-site @id and url for freeresumepost', () => {
    const graph = buildOrganizationGraph(FRESUME_INPUT)
    const website = graph['@graph'].find((e) => e['@type'] === 'WebSite') as {
      '@id': string
      url: string
    }
    expect(website['@id']).toBe('https://www.freeresumepost.co#website')
    expect(website.url).toBe('https://www.freeresumepost.co')
  })

  it('Organization @id is the same as the freejobpost build (cross-site consolidation)', () => {
    const graph = buildOrganizationGraph(FRESUME_INPUT)
    const org = graph['@graph'][0]
    expect(org['@id']).toBe('https://providers.avahealth.co#organization')
  })

  it('sameAs includes both sister-site URLs (so Google links the brands)', () => {
    const graph = buildOrganizationGraph(FRESUME_INPUT)
    const org = graph['@graph'][0] as { sameAs: string[] }
    expect(org.sameAs).toContain('https://freejobpost.co')
    expect(org.sameAs).toContain('https://www.freeresumepost.co')
  })

  it('additionalSameAs is appended without replacing the base list', () => {
    const graph = buildOrganizationGraph({
      ...FRESUME_INPUT,
      additionalSameAs: ['https://twitter.com/freeresumepost'],
    })
    const org = graph['@graph'][0] as { sameAs: string[] }
    expect(org.sameAs).toContain('https://twitter.com/freeresumepost')
    expect(org.sameAs).toContain('https://providers.avahealth.co')
  })
})
