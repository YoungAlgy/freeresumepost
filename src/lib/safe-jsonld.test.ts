import { describe, expect, it } from 'vitest'
import { safeJsonLd } from './safe-jsonld'

// Mirror of freejobpost/src/lib/safe-jsonld.test.ts. Update both in the same
// commit when this file changes.

describe('safeJsonLd', () => {
  it('escapes < to prevent </script> early-close', () => {
    const out = safeJsonLd({ title: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('</script>')
    expect(out).toContain('\\u003c')
  })

  it('escapes > for symmetry with <', () => {
    const out = safeJsonLd({ x: 'a > b' })
    expect(out).not.toContain('>')
    expect(out).toContain('\\u003e')
  })

  it('escapes & to prevent HTML-entity confusion', () => {
    const out = safeJsonLd({ x: 'foo & bar' })
    expect(out).not.toContain('&')
    expect(out).toContain('\\u0026')
  })

  it('escapes U+2028 line separator', () => {
    const ls = String.fromCodePoint(0x2028)
    const out = safeJsonLd({ x: `before${ls}after` })
    expect(out).not.toContain(ls)
    expect(out).toContain('\\u2028')
  })

  it('escapes U+2029 paragraph separator', () => {
    const ps = String.fromCodePoint(0x2029)
    const out = safeJsonLd({ x: `before${ps}after` })
    expect(out).not.toContain(ps)
    expect(out).toContain('\\u2029')
  })

  it('round-trips: JSON.parse(safeJsonLd(x)) === x', () => {
    const original = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Dr. Maya Chen',
      hasCredential: ['MD', 'MPH'],
    }
    expect(JSON.parse(safeJsonLd(original))).toEqual(original)
  })

  it('round-trips even when source contains XSS payload', () => {
    const evil = {
      title: '</script><script>alert(1)</script>',
      desc: 'a < b > c & d',
    }
    expect(JSON.parse(safeJsonLd(evil))).toEqual(evil)
  })
})
