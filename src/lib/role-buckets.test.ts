import { describe, expect, it } from 'vitest'
import { bucketizeRoles } from './role-buckets'

const j = (
  role: string | null,
  title: string,
  salary_min: number | null = null,
  salary_max: number | null = null
) => ({ role, title, salary_min, salary_max })

describe('bucketizeRoles', () => {
  it('returns empty array when no jobs match any bucket', () => {
    expect(bucketizeRoles([j('Janitor', 'Hospital Janitor')])).toEqual([])
  })

  it('buckets a Hospital Pharmacist posting under Pharmacist', () => {
    const result = bucketizeRoles([
      j('Hospital Pharmacist', 'Hospital Pharmacist — Tampa'),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Pharmacist')
    expect(result[0].count).toBe(1)
  })

  it('buckets " RN " under Registered Nurse', () => {
    const result = bucketizeRoles([j('RN', 'ICU RN — Day shift')])
    expect(result[0].label).toBe('Registered Nurse')
  })

  it('buckets CRNA correctly even though "RN" is a substring', () => {
    // CRNA must be checked before RN, otherwise " rn " would catch "CRNA".
    // The space-pad pattern " rn " specifically prevents this — verify.
    const result = bucketizeRoles([j('CRNA', 'Anesthesia CRNA — Locum')])
    expect(result[0].label).toBe('CRNA')
    expect(result.find((b) => b.label === 'Registered Nurse')).toBeUndefined()
  })

  it('buckets "occupational therapy" under Therapist', () => {
    const result = bucketizeRoles([j('OT', 'Outpatient Occupational Therapy')])
    expect(result[0].label).toBe('Therapist')
  })

  it('returns buckets sorted by count desc', () => {
    const jobs = [
      j('RN', 'RN A'),
      j('RN', 'RN B'),
      j('RN', 'RN C'),
      j('CRNA', 'CRNA X'),
      j('Pharmacist', 'Pharmacist Y'),
    ]
    const result = bucketizeRoles(jobs)
    expect(result.map((b) => b.label)).toEqual([
      'Registered Nurse',
      'CRNA',
      'Pharmacist',
    ])
    expect(result[0].count).toBe(3)
  })

  it('aggregates salary range across all jobs in a bucket', () => {
    const jobs = [
      j('RN', 'RN A', 70000, 90000),
      j('RN', 'RN B', 80000, 110000),
      j('RN', 'RN C', 60000, 95000),
    ]
    const [rn] = bucketizeRoles(jobs)
    expect(rn.salaryFloor).toBe(60000)
    expect(rn.salaryCeiling).toBe(110000)
  })

  it('ignores zero/negative salaries when computing range', () => {
    const jobs = [
      j('RN', 'RN A', 80000, 90000),
      j('RN', 'RN B', 0, 0), // sham/unset values
      j('RN', 'RN C', -1, 100000), // unrealistic input
    ]
    const [rn] = bucketizeRoles(jobs)
    expect(rn.salaryFloor).toBe(80000)
    expect(rn.salaryCeiling).toBe(100000)
  })

  it('ignores placeholder $1/$X salaries (USAJobs GS-grade entries) when computing range', () => {
    // USAJobs sometimes encodes "pay set by GS-grade table" as a $1
    // MinimumRange in PositionRemuneration. The pre-2026-05-16 floor
    // (`> 0`) accepted that, producing implausible "$1–$550K typical" on the
    // /upload tiles (first caught on a federal Physician posting, before that
    // bucket was retired). The 10K plausibility floor rejects it cleanly.
    const jobs = [
      j('CRNA', 'CRNA A', 250000, 380000),
      j('CRNA', 'CRNA B - GS-scale', 1, 550000), // placeholder min
      j('CRNA', 'CRNA C', 290000, 400000),
    ]
    const [crna] = bucketizeRoles(jobs)
    expect(crna.salaryFloor).toBe(250000)
    expect(crna.salaryCeiling).toBe(550000)
  })

  it('omits empty buckets from output', () => {
    const result = bucketizeRoles([j('RN', 'RN role')])
    expect(result.every((b) => b.count > 0)).toBe(true)
  })

  it('assigns each job to AT MOST ONE bucket (no double-counting)', () => {
    // "Cardio Tech" matches "tech" → Allied Health.
    // It does NOT contain "physician" or " md ", so it shouldn't show up
    // in Physician.
    const result = bucketizeRoles([j('Cardio Tech', 'Cardiac Technician')])
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Allied Health')
  })
})
