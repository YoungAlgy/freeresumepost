import { describe, expect, it } from 'vitest'
import { lowerRole } from './lower-role'

describe('lowerRole', () => {
  it('lowercases plain multi-word role names normally', () => {
    expect(lowerRole('Nurse Practitioner')).toBe('nurse practitioner')
    expect(lowerRole('Registered Nurse')).toBe('registered nurse')
  })

  it('preserves standalone acronyms', () => {
    expect(lowerRole('CRNA')).toBe('CRNA')
  })

  it('preserves an acronym inside a mixed-case name', () => {
    expect(lowerRole('MRI Technologist')).toBe('MRI technologist')
  })

  it('preserves an acronym in parentheses', () => {
    expect(lowerRole('Board Certified Behavior Analyst (BCBA)')).toBe(
      'board certified behavior analyst (BCBA)'
    )
  })

  it('preserves each acronym on either side of a slash', () => {
    expect(lowerRole('LPN / LVN')).toBe('LPN / LVN')
  })

  it('preserves a word containing a digit', () => {
    expect(lowerRole('COVID19 Response Nurse')).toBe('COVID19 response nurse')
  })

  it('lowercases a single lowercase-eligible word', () => {
    expect(lowerRole('Pharmacist')).toBe('pharmacist')
  })
})
