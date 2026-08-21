import { describe, expect, it } from 'vitest'
import { parseFields } from './resume-parser'

const RESUME = [
  'Sarah Mitchell, RN',
  'sarah.mitchell@example.com',
  '(813) 555-0142',
  'Tampa, FL 33629',
  'Oncology Nurse with 10 years of experience in inpatient care.',
  'Certifications: RN, BSN, CCRN',
].join('\n')

describe('parseFields', () => {
  it('extracts the contact + location + experience fields from a resume', () => {
    const r = parseFields(RESUME)
    expect(r.email).toBe('sarah.mitchell@example.com')
    expect(r.phone).toBe('(813) 555-0142')
    expect(r.firstName).toBe('Sarah')
    expect(r.lastName).toBe('Mitchell') // "RN" is excluded as a credential, not taken as the surname
    expect(r.state).toBe('FL')
    expect(r.city).toBe('Tampa')
    expect(r.yearsExperience).toBe(10)
    expect(r.credentials).toEqual(expect.arrayContaining(['RN', 'BSN', 'CCRN']))
  })

  it('returns nulls / empties for a blank resume', () => {
    const r = parseFields('')
    expect(r.email).toBeNull()
    expect(r.phone).toBeNull()
    expect(r.firstName).toBeNull()
    expect(r.credentials).toEqual([])
    expect(r.inferredSpecialty).toBeNull()
    expect(r.state).toBeNull()
    expect(r.yearsExperience).toBeNull()
  })

  describe('specialty inference', () => {
    it.each([
      ['Family Medicine Physician', 'Family Medicine'],
      ['Psychiatry Nurse Practitioner', 'Psychiatry'],
      ['Cardiology Fellow', 'Cardiology'],
      // These five had a trailing-word-boundary stem bug (the hint never fired
      // because "oncology" etc. have a letter after the stem). Fixed.
      ['Oncology Nurse', 'Oncology'],
      ['Dermatology PA-C', 'Dermatology'],
      ['Radiology Technologist', 'Radiology'],
      ['Gastroenterology RN', 'Gastroenterology'],
      ['Certified Phlebotomist', 'Phlebotomist'],
      // Same stem bug in two multi-alternative groups (each had a working
      // fallback, so the common phrasing still matched). Now fully closed.
      ['Gynecology Fellowship', 'OB/GYN'],
      ['Registered Dental Hygiene credential', 'Dental Hygienist'],
    ])('infers %j as %s', (text, specialty) => {
      expect(parseFields(text).inferredSpecialty).toBe(specialty)
    })

    it('also matches the -ist / -y word forms of the fixed stems', () => {
      expect(parseFields('Board-certified Dermatologist').inferredSpecialty).toBe('Dermatology')
      expect(parseFields('Phlebotomy lead at LabCorp').inferredSpecialty).toBe('Phlebotomist')
    })
  })

  describe('out-of-scope physician/PA credentials', () => {
    // 2026-08-20: MD/DO/PA-C/PA moved to the separate MASC Medical brand.
    // Found live: an MD resume had been auto-tagged with credential "MD" and
    // matched against physician jobs on this nurse-and-allied-health-only site.
    it('does not surface MD/DO/PA-C/PA as a detected credential', () => {
      const r = parseFields(
        ['Jane Smith, MD', 'jane.smith@example.com', 'Internal Medicine Physician'].join('\n')
      )
      expect(r.credentials).not.toContain('MD')
    })

    it('still excludes MD from the surname so it does not misparse as the last name', () => {
      const r = parseFields(['Jane Smith, MD', 'jane.smith@example.com'].join('\n'))
      expect(r.firstName).toBe('Jane')
      expect(r.lastName).toBe('Smith')
    })

    it('does not surface PA-C as a detected credential', () => {
      const r = parseFields(['John Doe, PA-C', 'john.doe@example.com'].join('\n'))
      expect(r.credentials).not.toContain('PA-C')
      expect(r.lastName).toBe('Doe')
    })
  })

  it('parses phone with a leading country code and dashes', () => {
    expect(parseFields('Call +1 813-555-0142 anytime').phone).toContain('813')
  })

  it('caps an absurd years-of-experience value out (only 0..60 accepted)', () => {
    expect(parseFields('99 years of experience').yearsExperience).toBeNull()
    expect(parseFields('8 years of experience').yearsExperience).toBe(8)
  })
})
