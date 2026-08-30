import { describe, expect, it } from 'vitest'
import { ORG_PROFILE, buildOrganizationGraph } from './organization-schema'

describe('ORG_PROFILE', () => {
  it('uses the standalone FreeResumePost identity', () => {
    expect(ORG_PROFILE['@id']).toBe('https://www.freeresumepost.co#organization')
    expect(ORG_PROFILE.name).toBe('FreeResumePost')
    expect(ORG_PROFILE.url).toBe('https://www.freeresumepost.co')
    expect(ORG_PROFILE.logo).toBe('https://www.freeresumepost.co/icon-512')
  })

  it('keeps the product brand separate while naming the legal operator', () => {
    expect('sameAs' in ORG_PROFILE).toBe(false)
    expect(ORG_PROFILE.parentOrganization.name).toBe('Ava Health Partners LLC')
    expect(JSON.stringify(ORG_PROFILE)).not.toContain('avahealth.co')
    expect(JSON.stringify(ORG_PROFILE)).not.toContain('freejobpost.co')
  })
})

describe('buildOrganizationGraph', () => {
  it('returns the FreeResumePost Organization and WebSite graph', () => {
    const graph = buildOrganizationGraph()
    expect(graph['@context']).toBe('https://schema.org')
    expect(graph['@graph']).toHaveLength(2)
    expect(graph['@graph'].map((entry) => entry['@type'])).toEqual([
      'Organization',
      'WebSite',
    ])
  })

  it('links the website to the standalone organization', () => {
    const graph = buildOrganizationGraph()
    const website = graph['@graph'][1] as {
      '@id': string
      url: string
      publisher: { '@id': string }
    }
    expect(website['@id']).toBe('https://www.freeresumepost.co#website')
    expect(website.url).toBe('https://www.freeresumepost.co')
    expect(website.publisher).toEqual({
      '@id': 'https://www.freeresumepost.co#organization',
    })
    expect('potentialAction' in website).toBe(false)
  })
})
