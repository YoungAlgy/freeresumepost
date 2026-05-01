// Client-side resume text extraction + regex field detection.
// Runs entirely in the browser — PDF/DOCX bytes never leave the user's machine.
// The only thing we POST server-side is the extracted text + structured fields.

export type ParsedResume = {
  rawText: string
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  credentials: string[]
  inferredSpecialty: string | null
  state: string | null
  city: string | null
  yearsExperience: number | null
}

const CREDENTIAL_TOKENS = [
  // Physician + APP
  'MD', 'DO', 'PA-C', 'PA', 'NP', 'FNP', 'FNP-BC', 'AGNP', 'AGNP-BC',
  'AGACNP', 'AGACNP-BC', 'PMHNP', 'PMHNP-BC', 'ACNP', 'ACNP-BC',
  'WHNP', 'NNP', 'ARNP', 'CRNA', 'CNM',
  // Nursing + nursing certs
  'RN', 'RN-BC', 'BSN', 'MSN', 'LPN', 'LVN', 'CNA',
  'CCRN', 'CMSRN', 'CEN', 'TCRN', 'CNRN', 'OCN', 'CHPN', 'CNOR', 'CRRN',
  // Behavioral health + therapy
  'LCSW', 'LMHC', 'LMFT', 'LPC', 'LCMHC', 'LBA',
  'BCBA', 'BCABA', 'BCBA-D',
  'PSYD', 'PHD', 'PHARMD',
  // Rehab
  'PT', 'DPT', 'PTA', 'OT', 'OTR', 'COTA', 'SLP', 'CCC-SLP',
  // Allied health — imaging, lab, sleep, cath lab
  'ARRT', 'ARDMS', 'RDMS', 'RDCS', 'RVT', 'ARMRIT',
  'RPSGT', 'RST', 'CPSGT',
  'RCIS', 'RCES', 'CVT',
  'CPT', 'PBT', 'RDH',
  'MLS', 'MT', 'CLS', 'MLT',
  // Dental
  'DDS', 'DMD',
]

const SPECIALTY_HINTS: Array<[RegExp, string]> = [
  // Order matters: more specific hints first, so allied health doesn't get
  // shadowed by broad terms like "radiology" matching "MRI tech".
  [/\b(MRI tech|magnetic resonance imag|ARRT.{0,4}MR)\b/i, 'MRI Tech'],
  [/\b(cath\s*lab|RCIS|RCES|electrophysiology|EP\s*lab)\b/i, 'Cath Lab Tech'],
  [/\b(BCBA|BCaBA|behavior analyst|ABA therap|applied behavior analysis)\b/i, 'BCBA'],
  [/\b(mental health tech|behavioral health tech|psych tech\b|MHT\b|BHT\b)\b/i, 'Mental Health Tech'],
  [/\b(dental hygienist|RDH\b|registered dental hygien)\b/i, 'Dental Hygienist'],
  [/\b(sleep tech|polysomnograph|RPSGT|sleep lab)\b/i, 'Sleep Tech'],
  [/\b(patient care tech|PCT\b|nurse aide|CNA tech|ED tech|dialysis tech)\b/i, 'Patient Care Tech'],
  [/\b(phlebotom)\b/i, 'Phlebotomist'],
  [/\b(occupational therapy assistant|COTA\b)\b/i, 'Occupational Therapy Assistant'],
  [/\b(physical therapy assistant|PTA\b)\b/i, 'Physical Therapy Assistant'],
  // Existing hints continue
  [/\b(psychiatr(y|ist)|behavioral health)\b/i, 'Psychiatry'],
  [/\b(family medicine|family practice|FP|primary care)\b/i, 'Family Medicine'],
  [/\b(internal medicine|IM)\b/i, 'Internal Medicine'],
  [/\bemergency\s+(medicine|room|department|dept)\b/i, 'Emergency Medicine'],
  [/\b(cardiolog(y|ist))\b/i, 'Cardiology'],
  [/\b(anesthesiolog(y|ist))\b/i, 'Anesthesiology'],
  [/\b(neurolog(y|ist))\b/i, 'Neurology'],
  [/\b(pediatr(ic|ician|ics))\b/i, 'Pediatrics'],
  [/\b(ob-?gyn|obstetrics|gynecolog)\b/i, 'OB/GYN'],
  [/\b(orthopedic|ortho surgery|orthopaedic)\b/i, 'Orthopedics'],
  [/\b(gastroenterolog)\b/i, 'Gastroenterology'],
  [/\b(urolog(y|ist))\b/i, 'Urology'],
  [/\b(dermatolog)\b/i, 'Dermatology'],
  [/\b(oncolog)\b/i, 'Oncology'],
  [/\b(radiolog)\b/i, 'Radiology'],
  [/\b(hospitalist|nocturnist)\b/i, 'Hospital Medicine'],
  [/\b(ICU|intensive care|critical care)\b/i, 'Critical Care'],
  [/\b(labor (?:and|&) delivery|L&D)\b/i, 'Labor & Delivery'],
  [/\btelehealth\b/i, 'Telehealth'],
]

const STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID',
  'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS',
  'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK',
  'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV',
  'WI', 'WY', 'DC',
]

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  const ab = await file.arrayBuffer()
  if (name.endsWith('.pdf')) return extractPdfText(ab)
  if (name.endsWith('.docx')) return extractDocxText(ab)
  if (name.endsWith('.txt')) return new TextDecoder().decode(ab)
  throw new Error('Unsupported file type. Use PDF, DOCX, or TXT.')
}

async function extractPdfText(ab: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  // Use the worker bundled under node_modules — Next puts it next to the app
  // via dynamic import; fall back to inline parsing if worker unavailable.
  try {
    const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url' as unknown as string)).default
    ;(pdfjs.GlobalWorkerOptions as { workerSrc: string }).workerSrc = workerSrc
  } catch {
    /* no-op — pdfjs will run in main thread if worker can't load */
  }
  const doc = await pdfjs.getDocument({ data: ab }).promise
  let text = ''
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n'
  }
  return text
}

async function extractDocxText(ab: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer: ab })
  return result.value || ''
}

export function parseFields(raw: string): ParsedResume {
  const text = raw.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim()
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  // Email
  const emailMatch = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)
  const email = emailMatch?.[0] ?? null

  // Phone — US 10-digit with optional country code
  const phoneMatch = text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/)
  const phone = phoneMatch?.[0]?.trim() ?? null

  // Name — take the first non-email, non-phone line that has 2-4 Title-Case tokens.
  // Strip trailing punctuation BEFORE the regex test (so "Mitchell," still matches),
  // and exclude credential tokens (so "Sarah Mitchell, RN" doesn't pick "RN" as the last name).
  let firstName: string | null = null
  let lastName: string | null = null
  for (const line of lines.slice(0, 8)) {
    if (/[@\d]/.test(line)) continue
    const cleaned = line.split(/\s+/).map((t) => t.replace(/[.,;]+$/, ''))
    const tokens = cleaned.filter(
      (t) =>
        /^[A-Z][a-zA-Z'-]{1,20}$/.test(t) &&
        !CREDENTIAL_TOKENS.includes(t.toUpperCase())
    )
    if (tokens.length >= 2 && tokens.length <= 5) {
      firstName = tokens[0]
      lastName = tokens[tokens.length - 1]
      break
    }
  }

  // Credentials — pick up standalone tokens
  const upperTokens = text.match(/\b[A-Z][A-Z0-9.-]{1,7}\b/g) || []
  const credSet = new Set<string>()
  for (const t of upperTokens) {
    const clean = t.replace(/\.$/, '').toUpperCase()
    if (CREDENTIAL_TOKENS.includes(clean)) credSet.add(clean)
  }
  const credentials = Array.from(credSet)

  // Specialty
  let inferredSpecialty: string | null = null
  for (const [re, label] of SPECIALTY_HINTS) {
    if (re.test(text)) {
      inferredSpecialty = label
      break
    }
  }

  // State + city — last "City, XX ZIP?" pattern wins (likely current address).
  // Restrict the city span to single-line characters (no \s inside the class)
  // so e.g. "Urgent Care\nTampa, FL" doesn't capture "Urgent CareTampa" as the city.
  let state: string | null = null
  let city: string | null = null
  const addressMatches = text.match(/\b([A-Z][a-zA-Z .'-]+?),\s+([A-Z]{2})\b\s*\d{0,5}/g)
  if (addressMatches?.length) {
    const last = addressMatches[addressMatches.length - 1]
    const m = last.match(/\b([A-Z][a-zA-Z .'-]+?),\s+([A-Z]{2})\b/)
    if (m) {
      const st = m[2]
      if (STATE_CODES.includes(st)) {
        state = st
        city = m[1].trim()
      }
    }
  }

  // Years of experience — look for "X years of experience" or similar
  let yearsExperience: number | null = null
  const yrs = text.match(/(\d{1,2})\+?\s*(?:years?|yrs?)\b[^.]*\bexperience\b/i)
  if (yrs) {
    const n = parseInt(yrs[1], 10)
    if (n >= 0 && n <= 60) yearsExperience = n
  }

  return {
    rawText: text,
    email,
    phone,
    firstName,
    lastName,
    credentials,
    inferredSpecialty,
    state,
    city,
    yearsExperience,
  }
}
