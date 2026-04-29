// Candidate-side specialty hubs — one per common healthcare specialty so
// each page ranks for "[specialty] resume upload" / "[specialty] jobs"
// candidate-intent queries. Mirrors freejobpost.co/specialty/* but framed
// from the candidate POV ("upload your resume here").

export type CandidateSpecialty = {
  slug: string
  // Display name for the specialty ("Cardiology", "CRNA", "ER Nursing")
  name: string
  // Page title for the hub (under 60 chars for SERP)
  title: string
  // Meta description (150-160 chars)
  metaDescription: string
  // Hero subhead (one-sentence value prop framed for the candidate)
  shortDescription: string
  // Common credentials in this specialty (for body copy + structured data)
  commonCredentials: string[]
  // Common roles candidates upload as (for "what counts as [specialty]" copy)
  exampleRoles: string[]
}

export const CANDIDATE_SPECIALTIES: CandidateSpecialty[] = [
  {
    slug: 'physician',
    name: 'Physician',
    title: 'Physician resume upload',
    metaDescription: 'Free physician resume upload. MD, DO, internal medicine, family practice, hospitalist, and specialty physicians get matched to real US openings.',
    shortDescription: 'Upload once and get matched to physician openings across the US — no recruiter spam, no resume databases sold.',
    commonCredentials: ['MD', 'DO'],
    exampleRoles: ['Internal Medicine', 'Family Medicine', 'Hospitalist', 'Pediatrician', 'OB/GYN', 'Cardiologist', 'Orthopedic Surgeon', 'Anesthesiologist'],
  },
  {
    slug: 'nurse-practitioner',
    name: 'Nurse Practitioner',
    title: 'Nurse Practitioner resume upload',
    metaDescription: 'Free NP resume upload. FNP, AGNP, PMHNP, ACNP, and acute care NPs matched to real US openings — primary care, hospitalist, psych, ER, specialty.',
    shortDescription: 'NP openings across primary care, hospitalist, psych, ER, and specialty practice nationwide.',
    commonCredentials: ['NP', 'FNP', 'FNP-BC', 'AGNP', 'PMHNP', 'ACNP', 'WHNP', 'NNP'],
    exampleRoles: ['Primary Care NP', 'Hospitalist NP', 'Psych NP', 'ER NP', 'Cardiology NP', 'Oncology NP'],
  },
  {
    slug: 'physician-assistant',
    name: 'Physician Assistant',
    title: 'Physician Assistant resume upload',
    metaDescription: 'Free PA resume upload. PA-C and certified PAs matched to surgical, EM, primary care, hospitalist, and specialty openings across the US.',
    shortDescription: 'PA roles in surgery, EM, primary care, hospitalist medicine, and every major specialty.',
    commonCredentials: ['PA-C', 'PA'],
    exampleRoles: ['Surgical PA', 'ER PA', 'Hospitalist PA', 'Orthopedic PA', 'Cardiothoracic PA', 'Dermatology PA'],
  },
  {
    slug: 'registered-nurse',
    name: 'Registered Nurse',
    title: 'RN resume upload',
    metaDescription: 'Free RN resume upload. ICU, ER, OR, L&D, med-surg, telemetry RNs matched to real US openings — permanent, travel, and contract roles.',
    shortDescription: 'RN openings across ICU, ER, OR, L&D, med-surg, telemetry, and every nursing specialty.',
    commonCredentials: ['RN', 'BSN', 'MSN'],
    exampleRoles: ['ICU RN', 'ER RN', 'OR RN', 'L&D RN', 'Med-Surg RN', 'Telemetry RN', 'PACU RN', 'NICU RN'],
  },
  {
    slug: 'crna',
    name: 'CRNA',
    title: 'CRNA resume upload',
    metaDescription: 'Free CRNA resume upload. Certified Registered Nurse Anesthetists matched to permanent + locum openings across the US, all major Florida + Texas markets.',
    shortDescription: 'CRNA openings — permanent, W-2, and locum — across hospital systems and surgical centers.',
    commonCredentials: ['CRNA', 'APRN'],
    exampleRoles: ['Hospital CRNA', 'Surgery Center CRNA', 'OB CRNA', 'Pain Management CRNA', 'Locum CRNA'],
  },
  {
    slug: 'lpn',
    name: 'LPN / LVN',
    title: 'LPN / LVN resume upload',
    metaDescription: 'Free LPN and LVN resume upload. Licensed Practical / Vocational Nurses matched to long-term care, clinic, and acute care openings nationwide.',
    shortDescription: 'LPN / LVN openings in long-term care, clinics, urgent care, and rehab settings.',
    commonCredentials: ['LPN', 'LVN'],
    exampleRoles: ['LTC LPN', 'Clinic LPN', 'Urgent Care LPN', 'Rehab LPN', 'Home Health LPN'],
  },
  {
    slug: 'cna',
    name: 'CNA',
    title: 'CNA resume upload',
    metaDescription: 'Free CNA resume upload. Certified Nursing Assistants matched to long-term care, hospital, and home health openings nationwide.',
    shortDescription: 'CNA openings in long-term care, acute hospital, and home health.',
    commonCredentials: ['CNA', 'STNA', 'NA'],
    exampleRoles: ['LTC CNA', 'Hospital CNA', 'Home Health CNA', 'Memory Care CNA'],
  },
  {
    slug: 'physical-therapist',
    name: 'Physical Therapist',
    title: 'Physical Therapist resume upload',
    metaDescription: 'Free PT resume upload. Physical Therapists and DPTs matched to outpatient, acute, SNF, home health, and pediatric openings nationwide.',
    shortDescription: 'PT openings across outpatient, acute, SNF, home health, and pediatric settings.',
    commonCredentials: ['DPT', 'PT'],
    exampleRoles: ['Outpatient PT', 'Acute Care PT', 'SNF PT', 'Home Health PT', 'Pediatric PT', 'Sports Medicine PT'],
  },
  {
    slug: 'occupational-therapist',
    name: 'Occupational Therapist',
    title: 'Occupational Therapist resume upload',
    metaDescription: 'Free OT resume upload. Occupational Therapists matched to outpatient, acute, SNF, home health, school, and pediatric openings nationwide.',
    shortDescription: 'OT openings across outpatient, acute, SNF, school, home health, and pediatric.',
    commonCredentials: ['OTR/L', 'OTD', 'OT'],
    exampleRoles: ['Outpatient OT', 'Acute Care OT', 'SNF OT', 'School OT', 'Pediatric OT', 'Home Health OT'],
  },
  {
    slug: 'speech-language-pathologist',
    name: 'Speech-Language Pathologist',
    title: 'Speech-Language Pathologist resume upload',
    metaDescription: 'Free SLP resume upload. Speech-Language Pathologists with CCC-SLP matched to school, acute, SNF, and outpatient openings nationwide.',
    shortDescription: 'SLP openings across schools, outpatient clinics, SNF, acute care, and early intervention.',
    commonCredentials: ['CCC-SLP', 'SLP'],
    exampleRoles: ['School SLP', 'Outpatient SLP', 'SNF SLP', 'Acute Care SLP', 'Early Intervention SLP'],
  },
  {
    slug: 'pharmacist',
    name: 'Pharmacist',
    title: 'Pharmacist resume upload',
    metaDescription: 'Free PharmD resume upload. Hospital, retail, ambulatory care, and specialty pharmacists matched to real US openings — no recruiter spam.',
    shortDescription: 'PharmD openings in hospital, retail, ambulatory care, and specialty pharmacy.',
    commonCredentials: ['PharmD', 'RPh'],
    exampleRoles: ['Hospital Pharmacist', 'Retail Pharmacist', 'Ambulatory Care Pharmacist', 'Specialty Pharmacist', 'Oncology Pharmacist'],
  },
  {
    slug: 'medical-assistant',
    name: 'Medical Assistant',
    title: 'Medical Assistant resume upload',
    metaDescription: 'Free MA resume upload. Medical Assistants (CMA, RMA, CCMA) matched to primary care, specialty clinic, and urgent care openings nationwide.',
    shortDescription: 'MA roles in primary care, specialty clinics, urgent care, and surgery centers.',
    commonCredentials: ['CMA', 'RMA', 'CCMA', 'MA'],
    exampleRoles: ['Primary Care MA', 'Specialty Clinic MA', 'Urgent Care MA', 'Surgical MA'],
  },
  {
    slug: 'radiology-tech',
    name: 'Radiology Tech',
    title: 'Radiology Tech resume upload',
    metaDescription: 'Free Rad Tech resume upload. ARRT-certified Radiologic Technologists matched to hospital, imaging center, and outpatient openings nationwide.',
    shortDescription: 'Rad Tech roles across hospital imaging, outpatient centers, and specialty modalities (CT, MRI, IR, mammo).',
    commonCredentials: ['ARRT(R)', 'ARRT', 'RT(R)'],
    exampleRoles: ['Hospital Rad Tech', 'CT Tech', 'MRI Tech', 'Mammography Tech', 'Interventional Rad Tech'],
  },
  {
    slug: 'respiratory-therapist',
    name: 'Respiratory Therapist',
    title: 'Respiratory Therapist resume upload',
    metaDescription: 'Free RRT resume upload. Respiratory Therapists matched to ICU, ER, NICU, and pulmonary openings nationwide.',
    shortDescription: 'RRT roles across ICU, ER, NICU, and pulmonary rehabilitation.',
    commonCredentials: ['RRT', 'CRT'],
    exampleRoles: ['ICU RRT', 'ER RRT', 'NICU RRT', 'Pulmonary Rehab RRT'],
  },
]

export function getCandidateSpecialty(slug: string): CandidateSpecialty | undefined {
  return CANDIDATE_SPECIALTIES.find((s) => s.slug === slug)
}
