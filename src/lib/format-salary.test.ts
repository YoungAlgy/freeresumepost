import { describe, expect, it } from 'vitest'
import { formatSalary } from './format-salary'

describe('formatSalary', () => {
  it('returns null when both bounds are missing or zero-falsey', () => {
    expect(formatSalary(null, null)).toBe(null)
    expect(formatSalary(undefined, undefined)).toBe(null)
    expect(formatSalary(0, 0)).toBe(null)
    expect(formatSalary(null, 0)).toBe(null)
  })

  it('formats a true range as $XK-$YK', () => {
    expect(formatSalary(180000, 240000)).toBe('$180K-$240K')
    expect(formatSalary(75000, 95000)).toBe('$75K-$95K')
  })

  it('uses K-shorthand for amounts >= 1000 and dollar-direct for smaller', () => {
    expect(formatSalary(80000, null)).toMatch(/^\$80K/)
    expect(formatSalary(500, null)).toMatch(/^\$500/)
  })

  it('appends "+" suffix when only the minimum is set (open-ended floor)', () => {
    expect(formatSalary(200000, null)).toBe('$200K+')
    expect(formatSalary(150000, undefined)).toBe('$150K+')
    expect(formatSalary(150000, 0)).toBe('$150K+')
  })

  it('does not append "+" when only the maximum is set (open-ended ceiling)', () => {
    // A ceiling-only range like "up to $200K" reads weird with "+", which
    // would imply "at least $200K" — opposite meaning. Bare value preserves
    // the "up to" framing from context.
    expect(formatSalary(null, 200000)).toBe('$200K')
    expect(formatSalary(0, 150000)).toBe('$150K')
  })

  it('returns a single value when min === max', () => {
    expect(formatSalary(180000, 180000)).toBe('$180K')
  })

  it('rounds to nearest K (180500 → $181K, 179999 → $180K)', () => {
    expect(formatSalary(180500, 180500)).toBe('$181K')
    expect(formatSalary(179999, 179999)).toBe('$180K')
  })
})
