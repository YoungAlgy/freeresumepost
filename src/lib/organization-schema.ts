const SITE_URL = 'https://www.freeresumepost.co'

export const ORG_PROFILE = {
  '@type': 'Organization' as const,
  '@id': `${SITE_URL}#organization`,
  name: 'FreeResumePost',
  alternateName: ['Free Resume Post', 'freeresumepost.co'],
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512`,
  description:
    'A resume-posting and profile-management service for nurses and allied health professionals.',
  areaServed: { '@type': 'Country', name: 'United States' },
  industry: 'Resume services',
} as const

export function buildOrganizationGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      ORG_PROFILE,
      {
        '@type': 'WebSite' as const,
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: 'FreeResumePost',
        description:
          'A resume-posting tool for nurses and allied health professionals.',
        publisher: { '@id': ORG_PROFILE['@id'] },
      },
    ],
  }
}
