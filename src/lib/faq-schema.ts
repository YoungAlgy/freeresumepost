// Shared FAQPage JSON-LD builder. Every page with a visible FAQ section
// (homepage, /how-it-works, each /specialty/[slug] hub) builds its schema
// from the exact same { question, answer } data that drives the on-page
// <h3>/<p> markup -- see each page's FAQ_ITEMS / faqItems constant. Never
// hand-write a second copy of the questions/answers for schema; pass the
// same array through this function instead, so the two can't drift apart.

export type FaqItem = {
  question: string
  answer: string
}

export function buildFaqPageJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
