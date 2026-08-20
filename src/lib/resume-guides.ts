// Resume-writing guide content for the specialty hubs. GENERATED from the
// 2026-06 audit content engine (resume_guides_generated.json) - targets the
// '[role] resume' query family GSC showed at position ~26 with zero content
// behind it. Each guide is recruiter-grounded: example summary, ATS skill
// keywords, credential formatting, role-specific tips.
//
// Editing: tweak copy freely (it is plain data). Keep the voice rules: no em
// dashes, no semicolons, short plain sentences.

export type ResumeGuide = {
  slug: string
  roleName: string
  pageTitle: string
  metaDescription: string
  alsoKnownAs: string[]
  summaryExample: string
  skillsKeywords: string[]
  credentialLine: string
  tips: string[]
}

export const RESUME_GUIDES: Record<string, ResumeGuide> = {
  "nurse-practitioner": {
      "slug": "nurse-practitioner",
      "roleName": "Nurse Practitioner",
      "pageTitle": "Nurse Practitioner Resume: Examples and Skills",
      "metaDescription": "See a nurse practitioner resume example with the skills recruiters search for. Fix your format, then upload your NP resume free and get matched to jobs.",
      "alsoKnownAs": [
          "NP",
          "APRN",
          "FNP",
          "Family Nurse Practitioner",
          "PMHNP",
          "Advanced Practice Registered Nurse"
      ],
      "summaryExample": "Family nurse practitioner with five years in outpatient primary care. I see 18 to 22 patients a day across all ages and manage my own panel, mostly chronic disease follow up plus same day visits. Board certified through AANP, with an unrestricted license and full prescriptive authority including DEA. Charting in Epic now, and used Athena before that.",
      "skillsKeywords": [
          "FNP-BC",
          "FNP-C",
          "Primary care",
          "Chronic disease management",
          "Patient panel management",
          "Prescriptive authority",
          "DEA registration",
          "Epic",
          "E/M coding",
          "Telehealth visits",
          "Annual wellness visits",
          "Point of care testing",
          "Patient education",
          "HEDIS quality measures"
      ],
      "credentialLine": "List your RN and APRN licenses by state, then your national certification, like FNP-BC or PMHNP-BC, with the certifying body. Keep them in one credentials section near the top of the page.",
      "tips": [
          "Name your certification exactly. FNP-BC and FNP-C come from different certifying boards, and recruiters filter on the exact letters.",
          "State your patient volume. Patients per day is the first thing a hiring manager tries to pin down, so just say it.",
          "Say whether you hold full prescriptive authority and an active DEA number. It changes which jobs you fit.",
          "Split your RN years from your NP years. Both count, but a recruiter needs to see your NP experience on its own.",
          "List your EMR by name. Epic in particular gets searched.",
          "If you practice under a collaborative agreement, say so. Scope rules differ by state and recruiters have to check the fit."
      ]
  },
  "registered-nurse": {
      "slug": "registered-nurse",
      "roleName": "Registered Nurse",
      "pageTitle": "Registered Nurse Resume: Examples and Skills",
      "metaDescription": "See a registered nurse resume example with the skills recruiters look for. Get the format down, then upload your RN resume free and get matched to jobs.",
      "alsoKnownAs": [
          "RN",
          "Staff Nurse",
          "BSN RN",
          "Travel Nurse",
          "Bedside Nurse"
      ],
      "summaryExample": "Registered nurse with four years in a 24 bed medical ICU. I take vented and titrating patients on a 1 to 2 ratio and precept new grads on the unit. BSN with an active compact license, ACLS and CCRN current. Charting in Epic and looking for a day shift ICU or step down role.",
      "skillsKeywords": [
          "Patient assessment",
          "Medication administration",
          "IV insertion",
          "Telemetry monitoring",
          "Epic",
          "BLS and ACLS",
          "Charge nurse experience",
          "Precepting new nurses",
          "Patient and family education",
          "Wound care",
          "Code response",
          "Discharge planning",
          "Compact (multistate) license",
          "HIPAA compliance"
      ],
      "credentialLine": "List RN with the state of licensure, and say if it is a compact multistate license. After your name, put your highest degree first and your license and certifications after it, like BSN, RN, CCRN.",
      "tips": [
          "Name your unit type and bed count. A 32 bed med surg unit tells a recruiter exactly where you fit.",
          "Put your ratios in. A 1 to 2 ICU ratio or a 1 to 6 med surg ratio shows your acuity without another word.",
          "Keep BLS and ACLS current and dated on the resume, plus any specialty certification like CCRN or CEN.",
          "Say compact license plainly if you have one. For travel and multi state employers it is the first filter.",
          "List your EMR systems. Epic and Cerner get searched by name.",
          "Travel nurses should list each contract with the facility type and unit. Gaps between contracts are normal, just label them."
      ]
  },
  "crna": {
      "slug": "crna",
      "roleName": "CRNA",
      "pageTitle": "CRNA Resume: Examples and Skills",
      "metaDescription": "See a CRNA resume example with the skills anesthesia recruiters look for. Get the format right, then upload your CRNA resume free and get matched to jobs.",
      "alsoKnownAs": [
          "Certified Registered Nurse Anesthetist",
          "Nurse Anesthetist",
          "Nurse Anesthesiologist"
      ],
      "summaryExample": "CRNA with seven years across a level II trauma center and two surgery centers. I run my own rooms in a care team model and take independent call for OB and general cases on weekends. Comfortable with neuraxial and ultrasound guided regional blocks. NBCRNA certified and current on recertification, with active APRN licenses in two states.",
      "skillsKeywords": [
          "General anesthesia",
          "Regional anesthesia",
          "Spinal and epidural anesthesia",
          "Ultrasound guided nerve blocks",
          "Airway management",
          "OB anesthesia",
          "Care team and independent practice",
          "Pre anesthesia assessment",
          "ACLS and PALS",
          "Arterial and central line placement",
          "Trauma anesthesia",
          "Pediatric anesthesia",
          "Anesthesia record documentation",
          "Locum experience"
      ],
      "credentialLine": "List your NBCRNA certification and your APRN or RN license for each state, with the state named for every license. CRNA goes after your name with your degree, like DNP, CRNA.",
      "tips": [
          "Name your practice model up front. Care team or independent practice changes which jobs you fit.",
          "List your case mix with rough numbers. Cases per week and the types you cover, like OB, peds, hearts, or blocks.",
          "Spell out your regional skills. Recruiters search for the specific block names, and the phrase regional anesthesia is too vague on its own.",
          "Put your call schedule on paper. Call frequency is one of the first screening questions in anesthesia recruiting.",
          "Keep your NBCRNA recertification status easy to find. Credentialing starts there.",
          "If you do locum work, list each assignment with dates and the facility type. Short stints read fine when they are labeled as locums."
      ]
  },
  "lpn": {
      "slug": "lpn",
      "roleName": "Licensed Practical Nurse",
      "pageTitle": "LPN / LVN Resume: Examples and Skills",
      "metaDescription": "A real LPN resume summary example plus the skills recruiters search for. Advice from healthcare recruiters and a free place to upload your resume.",
      "alsoKnownAs": [
          "LPN",
          "LVN",
          "Licensed Vocational Nurse",
          "Practical Nurse"
      ],
      "summaryExample": "Licensed Practical Nurse with six years in long-term care and skilled nursing. I run the med pass for a 30-resident unit and handle wound care and treatments. I chart in PointClickCare and supervise the CNAs on my hall. Current LPN license in good standing, IV certified.",
      "skillsKeywords": [
          "Medication administration",
          "Wound care",
          "Vital signs monitoring",
          "PointClickCare",
          "Long-term care",
          "Skilled nursing facility (SNF)",
          "IV therapy",
          "Patient assessment",
          "Charting and documentation",
          "CNA supervision",
          "Infection control",
          "Care plan updates",
          "Catheter care",
          "HIPAA compliance"
      ],
      "credentialLine": "Put your LPN or LVN license first with the state and status, like LPN, Florida, active. List certifications such as IV therapy and BLS after it, each with its expiration date.",
      "tips": [
          "Put your license type and state at the top, right under your name. Recruiters filter by state first and will not dig for it.",
          "Name your setting. LTC, SNF, clinic, and home health are different jobs, and hiring managers look for theirs.",
          "Quantify the med pass. 'Med pass for 30 residents per shift' beats 'administered medications.'",
          "List the charting system you know. PointClickCare or MatrixCare on the page gets you past keyword screens.",
          "If you are IV certified, say so near the top. It is one of the first things recruiters search for on LPN resumes."
      ]
  },
  "cna": {
      "slug": "cna",
      "roleName": "Certified Nursing Assistant",
      "pageTitle": "CNA Resume: Examples and Skills",
      "metaDescription": "A real CNA resume summary example and the skills recruiters look for. Written by healthcare recruiters, with a free resume upload when you are ready.",
      "alsoKnownAs": [
          "CNA",
          "Nursing Assistant",
          "Nurse Aide",
          "STNA",
          "Certified Nurse Aide"
      ],
      "summaryExample": "Certified Nursing Assistant with four years in skilled nursing and memory care. I handle a 12 to 15 resident assignment with full ADL care and transfers. Nurses count on me to catch changes early and chart them in PointClickCare. Active CNA certification and current BLS.",
      "skillsKeywords": [
          "Activities of daily living (ADLs)",
          "Vital signs",
          "Patient transfers",
          "Hoyer lift",
          "Memory care",
          "Long-term care",
          "Charting and documentation",
          "PointClickCare",
          "Infection control",
          "Fall prevention",
          "Feeding assistance",
          "HIPAA compliance",
          "BLS / CPR"
      ],
      "credentialLine": "Lead with your CNA certification and the state registry where it is active. Put BLS or CPR right after it and include the expiration date.",
      "tips": [
          "Put your certification and state registry status at the top. Facilities have to verify it, so make it easy to find.",
          "Give your assignment size. 'Cared for 14 residents per shift' tells a manager more than a long list of duties.",
          "Name the setting. Hospital floors and memory care run very differently, and managers hire for their floor.",
          "List equipment you have used, like Hoyer lifts or sit-to-stand lifts. It cuts training time and managers know it.",
          "Keep it to one page. Recruiters skim, so your cert and your last two jobs should be the first things they see."
      ]
  },
  "physical-therapist": {
      "slug": "physical-therapist",
      "roleName": "Physical Therapist",
      "pageTitle": "Physical Therapist Resume: Examples and Skills",
      "metaDescription": "A real physical therapist resume example plus the skills recruiters search for. Advice from healthcare recruiters and a free PT resume upload.",
      "alsoKnownAs": [
          "PT",
          "DPT",
          "Doctor of Physical Therapy"
      ],
      "summaryExample": "Doctor of Physical Therapy with five years in outpatient orthopedics. I carry a caseload of 12 to 14 patients a day and document in WebPT. Most of my work is post-op knees and shoulders, with a heavy manual therapy load. Licensed PT with current BLS, dry needling certified.",
      "skillsKeywords": [
          "Outpatient orthopedics",
          "Manual therapy",
          "Therapeutic exercise",
          "Patient evaluation",
          "Plan of care",
          "WebPT",
          "Epic",
          "Medicare documentation",
          "Post-surgical rehabilitation",
          "Gait training",
          "Caseload management",
          "Home exercise programs",
          "Dry needling"
      ],
      "credentialLine": "List your state PT license first, then your degree (DPT or MPT). Add specialty certifications like OCS or dry needling after that, with expiration dates where they apply.",
      "tips": [
          "Lead with setting and caseload. 'Outpatient ortho, 13 patients a day' tells a recruiter exactly where you fit.",
          "Name your EMR. WebPT or Raintree on the page gets you through keyword screens.",
          "Show outcomes where you can. Real numbers on discharges or plan-of-care completion beat a list of techniques.",
          "Be straight about productivity. Clinics ask in the first call anyway, and a real number builds trust.",
          "If you hold a board specialty like OCS, put the letters right after your name. Recruiters scan for them.",
          "New grads should write clinical rotations like jobs, with the setting and patient mix. It is real experience."
      ]
  },
  "occupational-therapist": {
      "slug": "occupational-therapist",
      "roleName": "Occupational Therapist",
      "pageTitle": "Occupational Therapist Resume: Examples and Skills",
      "metaDescription": "A real occupational therapist resume example and the skills recruiters search for. Tips written by healthcare recruiters, plus a free OT resume upload.",
      "alsoKnownAs": [
          "OT",
          "OTR/L",
          "OTR",
          "Registered Occupational Therapist"
      ],
      "summaryExample": "Occupational therapist with seven years across skilled nursing and home health. I carry a daily caseload of 8 to 10 patients and document in Net Health. My focus is ADL retraining and safe discharge planning, and my Medicare documentation is clean. OTR/L with current BLS.",
      "skillsKeywords": [
          "ADL retraining",
          "Skilled nursing facility (SNF)",
          "Home health",
          "Plan of care",
          "Medicare documentation",
          "OASIS documentation",
          "Net Health",
          "Epic",
          "Discharge planning",
          "Cognitive assessment",
          "Splinting",
          "Fall prevention",
          "Caregiver education",
          "Functional mobility"
      ],
      "credentialLine": "List your state OT license and your NBCOT credential together, the way OTR/L shows both. Add any certifications after, each with its expiration date.",
      "tips": [
          "Put your setting in the first line. SNF, home health, schools, and outpatient all hire differently.",
          "Give a caseload number. 'Daily caseload of 9 patients' reads stronger than 'managed a busy caseload.'",
          "Call out Medicare and OASIS documentation if you have it. Home health managers screen for it by name.",
          "List your EMR systems. Net Health or Casamba on the page matches what the ATS searches for.",
          "If you split settings, give each its own entry with dates. One blended entry hides experience managers want to see."
      ]
  },
  "speech-language-pathologist": {
      "slug": "speech-language-pathologist",
      "roleName": "Speech-Language Pathologist",
      "pageTitle": "Speech-Language Pathologist Resume: Examples and Skills",
      "metaDescription": "A real speech-language pathologist resume example with the skills recruiters search for. Tips from healthcare recruiters and a free SLP resume upload.",
      "alsoKnownAs": [
          "SLP",
          "Speech Therapist",
          "Speech Pathologist",
          "CCC-SLP"
      ],
      "summaryExample": "Speech-language pathologist with six years split between schools and skilled nursing. I manage a school caseload of about 45 students with IEPs and pick up SNF dysphagia work over the summer, documenting in Net Health. I run my own evaluations and keep IEP paperwork on deadline. CCC-SLP with a current state license.",
      "skillsKeywords": [
          "Dysphagia treatment",
          "Swallow evaluations",
          "Articulation therapy",
          "Language assessment",
          "IEP development",
          "AAC devices",
          "Pediatric speech therapy",
          "Skilled nursing facility (SNF)",
          "Modified barium swallow studies",
          "Cognitive-communication therapy",
          "Early intervention",
          "Medicare documentation",
          "Caseload management",
          "Parent and caregiver training"
      ],
      "credentialLine": "List your state SLP license first, then your ASHA CCC-SLP. Clinical fellows should write CF clearly and give the expected completion date.",
      "tips": [
          "Say your setting and population first. A school caseload and an acute care caseload are different jobs to a hiring manager.",
          "Put CCC-SLP right after your name. Recruiters and ATS filters both search for it.",
          "Give caseload numbers. 'Caseload of 45 students across two schools' beats a paragraph of duties.",
          "Name dysphagia experience if you have it. Medical settings screen for swallow evals before anything else.",
          "Clinical fellows should label the CF year clearly. Employers can still hire you, and hiding it wastes everyone's time.",
          "If you have done teletherapy, list the platforms you used. Virtual SLP openings are real and that line gets you matched."
      ]
  },
  "pharmacist": {
      "slug": "pharmacist",
      "roleName": "Pharmacist",
      "pageTitle": "Pharmacist Resume: Examples and Skills",
      "metaDescription": "See a real pharmacist resume summary example, the skills employers search for, and writing tips from healthcare recruiters. Upload your resume free.",
      "alsoKnownAs": [
          "PharmD",
          "RPh",
          "Staff Pharmacist",
          "Clinical Pharmacist",
          "Hospital Pharmacist",
          "Retail Pharmacist"
      ],
      "summaryExample": "Licensed pharmacist with eight years across hospital and retail settings, currently staff pharmacist at a 300-bed acute care hospital. I verify 150 to 200 orders per shift in Epic Willow, cover IV room compounding checks, round with the ICU team, and consult on vancomycin and anticoagulation dosing. PharmD with an active state license, immunization certified, BLS. Looking for a clinical or hybrid role with direct patient contact.",
      "skillsKeywords": [
          "Medication therapy management (MTM)",
          "Order verification",
          "Sterile compounding (USP 797)",
          "Epic Willow",
          "Anticoagulation management",
          "Antimicrobial stewardship",
          "Immunization administration",
          "Patient counseling",
          "Drug utilization review",
          "Prior authorizations",
          "Controlled substance management",
          "Pyxis / Omnicell automated dispensing",
          "Inventory management"
      ],
      "credentialLine": "List your PharmD or BS in Pharmacy under education, then a separate licenses section with your state pharmacist license, the state, and active status. Board certifications like BCPS go right after the license, written exactly as the board formats them.",
      "tips": [
          "Name your practice setting in the first line. Hospital, retail, ambulatory care, and specialty pharmacy are different jobs, and recruiters filter by setting before anything else.",
          "Quantify your volume. Orders verified per shift or prescriptions filled per day tells a recruiter your pace faster than any adjective.",
          "List your pharmacy systems by name. Epic Willow, Cerner, Pyxis, and Omnicell all get searched as keywords.",
          "If you have hospital experience, call out clinical work like rounding and anticoagulation dosing. That is what separates a clinical resume from a dispensing one.",
          "Put board certifications like BCPS or BCOP right after your license. Recruiters search the exact abbreviation.",
          "If you are moving from retail to hospital, lead with anything clinical, like MTM and immunization work."
      ]
  },
  "medical-assistant": {
      "slug": "medical-assistant",
      "roleName": "Medical Assistant",
      "pageTitle": "Medical Assistant Resume: Examples and Skills",
      "metaDescription": "A real medical assistant resume summary example, the skills clinics search for, and writing tips from healthcare recruiters. Upload your resume free.",
      "alsoKnownAs": [
          "MA",
          "CMA",
          "RMA",
          "CCMA",
          "Certified Medical Assistant"
      ],
      "summaryExample": "Certified Medical Assistant (CCMA) with four years in family practice and urgent care. I room 20 to 25 patients a day, take vitals and histories, give injections, run EKGs, and handle refill requests in Epic and eClinicalWorks. Comfortable on the front desk too, with scheduling and insurance verification. Looking for a full-time clinic role with steady patient flow.",
      "skillsKeywords": [
          "Patient rooming and vitals",
          "EKG",
          "Injections and immunizations",
          "Phlebotomy",
          "Epic",
          "eClinicalWorks",
          "Athenahealth",
          "Prior authorizations",
          "Insurance verification",
          "Medication reconciliation",
          "Point-of-care testing",
          "Patient scheduling",
          "HIPAA compliance"
      ],
      "credentialLine": "Put your certification next to your name and again in a certifications section: CMA (AAMA), RMA (AMT), or CCMA (NHA), with the year earned. Most states do not license medical assistants, so the certification is the credential employers check.",
      "tips": [
          "Name your certification and certifying body. CMA (AAMA), RMA (AMT), and CCMA (NHA) are different credentials, and employers search for the exact one their posting asks for.",
          "Say how many patients you room per day. It is the fastest way to show a hiring manager your pace.",
          "Split clinical skills and front-office skills into two short lists. Most MA jobs need both, and recruiters scan for each separately.",
          "List your EHR systems by name. Epic, Cerner, eClinicalWorks, and Athenahealth all get keyword searched.",
          "Call out hands-on skills like blood draws and EKGs, and say how often you do them. 'Daily blood draws' beats 'phlebotomy trained.'",
          "If you speak a second language, put it near the top. Clinics hire for it."
      ]
  },
  "radiology-tech": {
      "slug": "radiology-tech",
      "roleName": "Radiologic Technologist",
      "pageTitle": "Radiologic Technologist Resume: Examples and Skills",
      "metaDescription": "A real radiologic technologist resume example, the skills imaging departments search for, and tips from healthcare recruiters. Upload your resume free.",
      "alsoKnownAs": [
          "Rad Tech",
          "Radiology Tech",
          "X-Ray Tech",
          "RT(R)",
          "Radiographer",
          "Radiologic Technician"
      ],
      "summaryExample": "ARRT registered Radiologic Technologist, RT(R), with six years split between a Level II trauma hospital and an outpatient imaging center. I average 30 to 40 exams per shift across general diagnostic, portables, OR fluoro, and trauma cases, charting in Epic Radiant. Cross-trained in CT and sitting for the CT registry this year. Active state license and BLS, with a low repeat rate I track and can speak to.",
      "skillsKeywords": [
          "ARRT (R) registered",
          "Diagnostic radiography",
          "Portable imaging",
          "OR fluoroscopy and C-arm",
          "Trauma imaging",
          "CT cross-training",
          "Epic Radiant",
          "PACS",
          "Patient positioning",
          "Radiation safety and ALARA",
          "IV contrast administration",
          "Quality control",
          "BLS certification"
      ],
      "credentialLine": "Use the exact ARRT format, like RT(R) or RT(R)(CT), right after your name and in a credentials section. Add your state license below it if your state requires one, with the state and status.",
      "tips": [
          "Write your credential exactly the way ARRT formats it, like RT(R) or RT(R)(CT). Recruiters search the exact string.",
          "List your modalities and how often you work each one. Cross-training in CT or mammo is often what gets the call.",
          "Name your equipment vendors. A department that runs Siemens machines wants to see Siemens on your resume.",
          "Include exam volume per shift and which settings you covered. ER and OR experience carries weight.",
          "If you float between hospital and outpatient, say so. It signals you can handle both the pace and the patient mix."
      ]
  },
  "respiratory-therapist": {
      "slug": "respiratory-therapist",
      "roleName": "Respiratory Therapist",
      "pageTitle": "Respiratory Therapist Resume: Examples and Skills",
      "metaDescription": "A real respiratory therapist resume example, the skills hospitals search for, and writing tips from healthcare recruiters. Upload your resume free.",
      "alsoKnownAs": [
          "RRT",
          "RT",
          "Registered Respiratory Therapist",
          "CRT",
          "Respiratory Care Practitioner"
      ],
      "summaryExample": "Registered Respiratory Therapist with five years in adult ICU and ER at a 400-bed hospital, plus a year of NICU cross-coverage. I manage 8 to 12 vented patients per shift, titrate from high-flow through conventional vent support, draw and run ABGs, and respond with the code and rapid response teams. RRT with an active state license plus ACLS and NRP, charting in Epic. Looking for an ICU-heavy role with a strong vent protocol culture.",
      "skillsKeywords": [
          "Mechanical ventilation",
          "Ventilator weaning protocols",
          "BiPAP and CPAP",
          "High-flow nasal cannula",
          "Arterial blood gases (ABGs)",
          "Rapid response and code team",
          "Intubation assistance",
          "Neonatal and pediatric ventilation",
          "ACLS",
          "NRP",
          "Epic charting",
          "ECMO exposure",
          "Pulmonary function testing"
      ],
      "credentialLine": "List your NBRC credential first, RRT or CRT, then your state respiratory care license with the state and status. Specialty credentials like NPS or ACCS go after that, written the way the NBRC formats them.",
      "tips": [
          "Lead with RRT. If you are a CRT working toward RRT, say that and give the timeline.",
          "List the vents you have run by name, like Servo or Hamilton. ICU managers ask.",
          "Give your typical vent load per shift. It is the first number every hiring manager wants.",
          "Spell out which patient populations you cover. Adult and NICU are different skill sets and different postings.",
          "Put code team and rapid response work near the top of each job entry. It shows you handle acuity.",
          "Include ECMO exposure even if you were not the primary. Programs screen for it."
      ]
  },
  "clinical-social-worker": {
      "slug": "clinical-social-worker",
      "roleName": "Licensed Clinical Social Worker",
      "pageTitle": "Licensed Clinical Social Worker Resume: Examples and Skills",
      "metaDescription": "A real LCSW resume example, the clinical skills employers search for, and resume tips from healthcare recruiters. Upload your social work resume free.",
      "alsoKnownAs": [
          "LCSW",
          "Clinical Social Worker",
          "LICSW",
          "LISW-CP",
          "Medical Social Worker"
      ],
      "summaryExample": "LCSW with seven years across hospital behavioral health and outpatient therapy, currently carrying about 25 clients a week. I run individual and group sessions using CBT and DBT and cover crisis assessments in the ED, documenting everything in Epic. Licensed in two states, with telehealth experience since 2022. Looking for a hybrid or telehealth role with a stable caseload.",
      "skillsKeywords": [
          "Biopsychosocial assessments",
          "Individual therapy",
          "Group therapy",
          "CBT",
          "DBT",
          "Crisis intervention",
          "Safety planning",
          "Discharge planning",
          "Care coordination",
          "Treatment planning",
          "Telehealth therapy",
          "Trauma-informed care",
          "Substance use assessment",
          "Epic documentation"
      ],
      "credentialLine": "Put LCSW, or your state's version like LICSW, right after your name. List each state license separately with the state and status, and put your MSW under education with the school and year.",
      "tips": [
          "If you hold the clinical license, make it impossible to miss. Many postings screen for LCSW specifically.",
          "List every state you are licensed in. Multi-state licensure is a real advantage for telehealth roles.",
          "Name your treatment approaches, like CBT or EMDR. Employers search for them as keywords.",
          "Give a caseload number. Clients per week tells an employer more than any adjective.",
          "Separate clinical work from case management. If you want therapy roles, lead with assessment and treatment work and keep care coordination shorter.",
          "Include your documentation systems and your telehealth setup. Both come up in the first screen."
      ]
  },
  "psychologist": {
      "slug": "psychologist",
      "roleName": "Psychologist",
      "pageTitle": "Psychologist Resume: Examples and Skills",
      "metaDescription": "A real psychologist resume example with the skills recruiters look for, plus how to list your license. Upload your resume free and get matched to jobs.",
      "alsoKnownAs": [
          "Clinical Psychologist",
          "Licensed Psychologist",
          "PsyD",
          "Neuropsychologist",
          "School Psychologist"
      ],
      "summaryExample": "Licensed clinical psychologist (PsyD) with eight years across outpatient practice and a hospital behavioral health unit. I carry a caseload of 25 to 30 therapy and assessment clients a week and complete full psychological evaluations with integrated reports. I chart in Epic and run a steady telehealth schedule, and I hold PSYPACT authority for interstate practice. Looking for a clinical role where assessment work is a real part of the job.",
      "skillsKeywords": [
          "psychological assessment",
          "psychotherapy",
          "cognitive behavioral therapy (CBT)",
          "diagnostic evaluation",
          "DSM-5-TR diagnosis",
          "treatment planning",
          "integrated report writing",
          "neuropsychological testing",
          "telehealth",
          "PSYPACT",
          "crisis intervention",
          "clinical supervision",
          "evidence-based treatment",
          "Epic EHR"
      ],
      "credentialLine": "Put PhD or PsyD after your name. Give your state psychologist license its own line with the state and expiration date, and add PSYPACT authority or ABPP certification below it if you hold either.",
      "tips": [
          "Put your license and degree in the top line. Hiring managers check licensure before they read anything else.",
          "Quantify the work. Say how many clients you see per week and how many full evaluations you complete per month.",
          "Name your assessment instruments, like the WAIS or MMPI. Those exact terms are what screening software and hiring managers search.",
          "If you hold PSYPACT authority, put it near the top. Telehealth employers filter on it.",
          "Spell out your treatment models, like CBT or EMDR. Screening software matches exact terms and skips vague phrases like 'integrative approach'.",
          "Early career, list your APA-accredited internship and supervised hours. After a few years licensed, cut them and let the work speak."
      ]
  },
  "surgical-tech": {
      "slug": "surgical-tech",
      "roleName": "Surgical Technologist",
      "pageTitle": "Surgical Technologist Resume: Examples and Skills",
      "metaDescription": "A real surgical tech resume example with the skills OR managers want, plus how to list your CST. Upload your resume free and get matched to jobs.",
      "alsoKnownAs": [
          "Surgical Tech",
          "Scrub Tech",
          "OR Tech",
          "Operating Room Technician",
          "CST"
      ],
      "summaryExample": "Certified Surgical Technologist (CST) with six years in hospital ORs and an ambulatory surgery center. I scrub general, ortho, GYN, and urology cases, around 45 cases a month, and I first scrub total joints. Strong on sterile technique and accurate counts, and I pick cases in Epic OpTime. Open to full time OR work with a call rotation.",
      "skillsKeywords": [
          "sterile technique",
          "aseptic technique",
          "surgical instrumentation",
          "case preparation",
          "instrument counts",
          "scrubbing",
          "draping",
          "specimen handling",
          "OR turnover",
          "laparoscopic instrumentation",
          "orthopedic hardware",
          "central sterile processing",
          "Epic OpTime",
          "BLS certification"
      ],
      "credentialLine": "Put CST after your name and give it its own line in certifications with NBSTSA as the certifying body and the expiration date. Add your state registration on the next line if your state requires one.",
      "tips": [
          "Lead with your case mix. Name the specialties you scrub and your rough monthly case volume.",
          "Call out first scrub experience by specialty. First scrubbing total joints or open hearts carries more weight than a generic OR line.",
          "Make your CST impossible to miss. Put it in your name line and again in a certifications section with the expiration date.",
          "List the EHR and preference card systems you have used. OR managers want techs who can pick cases without hand holding.",
          "If you take call, say so. Call availability is a real selling point for hospital ORs.",
          "Separate ASC time from hospital OR time. The pace and turnover expectations differ and managers want to see both."
      ]
  },
  "audiologist": {
      "slug": "audiologist",
      "roleName": "Audiologist",
      "pageTitle": "Audiologist Resume: Examples and Skills",
      "metaDescription": "A real audiologist resume example with the skills clinics look for, plus how to list your AuD and license. Upload your resume free and get matched.",
      "alsoKnownAs": [
          "AuD",
          "Doctor of Audiology",
          "Clinical Audiologist",
          "CCC-A"
      ],
      "summaryExample": "Audiologist (AuD, CCC-A) with five years split between an ENT practice and a hospital outpatient clinic. I see 10 to 12 patients a day for diagnostic audiograms and hearing aid fittings, with real ear verification on every fitting. I run vestibular testing two days a week and chart in Noah and Epic. Looking for a clinical role that keeps a mix of diagnostics and amplification.",
      "skillsKeywords": [
          "diagnostic audiometry",
          "pure tone audiometry",
          "tympanometry",
          "otoacoustic emissions (OAE)",
          "auditory brainstem response (ABR)",
          "hearing aid fitting",
          "real ear measurement",
          "vestibular testing (VNG)",
          "cochlear implant mapping",
          "cerumen management",
          "newborn hearing screening",
          "patient counseling",
          "Noah software",
          "Epic EHR"
      ],
      "credentialLine": "List AuD after your name, then your state audiology license on its own line with the state and expiration date. Add CCC-A or ABA board certification below the license if you hold it.",
      "tips": [
          "State your daily patient volume and the split between diagnostics and hearing aid work. Clinics hire for a specific mix and want to see yours.",
          "Name the test batteries you run, like ABR, OAE, and VNG. Each one is a keyword a screening system can match.",
          "List the hearing aid manufacturer software you fit with regularly. Practices want someone who already knows their product lines.",
          "If you dispense, give units fit per month. It is a concrete number that travels better than revenue claims.",
          "Pediatric and cochlear implant experience each deserve their own line. Both are specialty skills that change which jobs you match.",
          "Keep your externship details only if you are newly licensed. Drop them once you have a few years of practice."
      ]
  },
  "registered-dietitian": {
      "slug": "registered-dietitian",
      "roleName": "Registered Dietitian",
      "pageTitle": "Registered Dietitian Resume: Examples and Skills",
      "metaDescription": "A real dietitian resume example with the skills clinical nutrition managers want, plus how to list your RDN. Upload your resume free and get matched.",
      "alsoKnownAs": [
          "RD",
          "RDN",
          "Registered Dietitian Nutritionist",
          "Clinical Dietitian",
          "Dietitian"
      ],
      "summaryExample": "Registered Dietitian Nutritionist with four years of acute care experience at a 300 bed hospital. I cover med surg and ICU floors and complete 12 to 15 nutrition assessments a day, including enteral and parenteral recommendations with the care team. I chart ADIME notes in Epic and hold the CNSC. Looking for a clinical role with a path into nutrition support or critical care.",
      "skillsKeywords": [
          "medical nutrition therapy (MNT)",
          "nutrition assessment",
          "Nutrition Care Process (NCP)",
          "ADIME charting",
          "enteral nutrition",
          "parenteral nutrition (TPN)",
          "nutrition focused physical exam",
          "malnutrition diagnosis",
          "patient education",
          "diabetes education",
          "renal diets",
          "interdisciplinary care planning",
          "regulatory compliance",
          "Epic EHR"
      ],
      "credentialLine": "Put RDN or RD after your name and list it in certifications with CDR as the credentialing body. Add your state license or certification on the next line with the state and expiration date, since most states require one.",
      "tips": [
          "Say your setting and daily assessment volume up front. Inpatient, dialysis, and outpatient resumes get read differently.",
          "Use ADIME and malnutrition criteria language. Clinical nutrition managers look for those exact terms.",
          "If you do nutrition support, spell out enteral and parenteral on the resume, and add the CNSC if you hold it.",
          "Count your education work. Classes taught per month or diabetes education hours are easy numbers to give.",
          "Keep your RDN credential and state license together near the top. Some screeners reject resumes that bury them.",
          "Preceptor or intern supervision belongs on the resume. It signals seniority without a title change."
      ]
  },
  "optometrist": {
      "slug": "optometrist",
      "roleName": "Optometrist",
      "pageTitle": "Optometrist Resume: Examples and Skills",
      "metaDescription": "A real optometrist resume example with the skills practices look for, plus how to list your OD and license. Upload your resume free and get matched.",
      "alsoKnownAs": [
          "OD",
          "Doctor of Optometry",
          "Eye Doctor"
      ],
      "summaryExample": "Optometrist (OD) with seven years across private practice and a retail setting. I see 18 to 22 patients a day, mostly routine exams and contact lens fittings, plus a growing medical caseload in glaucoma and dry eye. I co-manage cataract and refractive surgery patients with a local ophthalmology group. Licensed with therapeutic privileges and looking for full time clinical work.",
      "skillsKeywords": [
          "ocular disease management",
          "glaucoma management",
          "dry eye treatment",
          "contact lens fitting",
          "specialty contact lenses",
          "diabetic eye exams",
          "OCT imaging",
          "fundus photography",
          "slit lamp examination",
          "refraction",
          "cataract co-management",
          "myopia management",
          "low vision",
          "EHR charting"
      ],
      "credentialLine": "List OD after your name, then your state optometry license on its own line with the state, your privilege level if your state designates one, and the expiration date. If you hold more than one state license, list each, current state first.",
      "tips": [
          "State your daily patient volume and exam mix. Practices staff around it and will ask in the first call anyway.",
          "Spell out your scope, including therapeutic privileges and any minor procedures your state allows you to perform.",
          "Name the diagnostic equipment you use, like OCT and visual fields. Offices want someone who can run what is already in the lane.",
          "Specialty lens work gets its own line. Sclerals and ortho-k change which practices want you.",
          "Include retail exam volume and optical numbers when applying to retail. Private practices read medical optometry experience first.",
          "Multi-state licenses go near the top. They open more matches, including telehealth roles."
      ]
  },
  "podiatrist": {
      "slug": "podiatrist",
      "roleName": "Podiatrist",
      "pageTitle": "Podiatrist Resume: Examples and Skills",
      "metaDescription": "A real podiatrist resume example plus the skills recruiters look for. Written by healthcare recruiters. Upload your DPM resume free and get matched to jobs.",
      "alsoKnownAs": [
          "DPM",
          "Doctor of Podiatric Medicine",
          "podiatric physician",
          "podiatric surgeon",
          "foot and ankle doctor"
      ],
      "summaryExample": "DPM with seven years in private practice and hospital wound care. I see 25 to 30 patients a day across diabetic foot care, heel pain, nail procedures, and sports injuries. I hold surgical privileges at two hospitals and round on inpatient wound care consults each week. Comfortable in Epic and NextGen and used to managing my own clinic schedule.",
      "skillsKeywords": [
          "Diabetic foot care",
          "Wound care and debridement",
          "Limb salvage",
          "Foot and ankle surgery",
          "Ingrown toenail and matrixectomy procedures",
          "Custom orthotics",
          "Gait and biomechanical evaluation",
          "X-ray interpretation",
          "Ulcer offloading",
          "EHR documentation (Epic, NextGen)",
          "CPT and E/M coding",
          "Patient education"
      ],
      "credentialLine": "Put DPM right after your name at the top, like Maria Lopez, DPM. In a licenses section, list each state podiatry license with the state and expiration date, then add any board certification or surgical privileges below it.",
      "tips": [
          "Put your weekly patient volume in the first bullet. A practice owner wants to know you can carry 25 plus visits a day before anything else.",
          "Split clinic work from surgical work. List your OR cases by type and rough annual volume so a hospital can see what privileges to expect.",
          "Name your wound care experience directly. Diabetic ulcer care and debridement are what hospital wound programs search for.",
          "List the EHRs you have used. Epic or NextGen on the page saves the hiring manager a question.",
          "If you finished a surgical residency, say which type and how many years. PMSR with RRA means something specific to employers, so spell it out.",
          "Skip the long philosophy of care paragraph. Use that space for numbers, like procedures per month or new patients added."
      ]
  },
  "chiropractor": {
      "slug": "chiropractor",
      "roleName": "Chiropractor",
      "pageTitle": "Chiropractor Resume: Examples and Skills",
      "metaDescription": "A real chiropractor resume example plus the skills clinics look for. Advice from working recruiters. Upload your DC resume free and get matched to jobs.",
      "alsoKnownAs": [
          "DC",
          "Doctor of Chiropractic",
          "chiropractic physician"
      ],
      "summaryExample": "Licensed chiropractor (DC) with five years in a busy private practice. I handle 30 to 40 patient visits a day, mostly low back and neck pain along with auto and work injuries. I document in ChiroTouch and have managed personal injury and workers comp cases from intake through final report. I built a patient base of my own through community screenings and referral relationships with local providers.",
      "skillsKeywords": [
          "Spinal adjustment and manipulation",
          "Diversified technique",
          "Activator Methods",
          "Flexion distraction",
          "Soft tissue therapy",
          "Rehab exercise programming",
          "X-ray analysis",
          "SOAP note documentation",
          "ChiroTouch",
          "Personal injury cases",
          "Workers comp documentation",
          "Patient retention",
          "New patient exams"
      ],
      "credentialLine": "Put DC after your name at the top, like Sam Carter, DC. List each state chiropractic license with the state and expiration date, and add extra certifications like Activator or acupuncture below your licenses.",
      "tips": [
          "Lead with patient volume. Clinics live on visits per day, so put your number in the first line of your most recent job.",
          "Name your techniques. Diversified, Activator, Gonstead, or flexion distraction tells a clinic owner if you fit their patient base.",
          "Show retention or growth numbers if you have them. New patients per month matters more to an owner than your adjusting philosophy.",
          "Call out personal injury and workers comp experience. Documentation that survives attorney review is a skill, so say you have it.",
          "List your EHR. ChiroTouch or Jane on the resume answers a question every clinic asks.",
          "If you want an ownership track job, show business numbers you touched, like collections or case acceptance."
      ]
  },
  "perfusionist": {
      "slug": "perfusionist",
      "roleName": "Perfusionist",
      "pageTitle": "Perfusionist Resume: Examples and Skills",
      "metaDescription": "See a real perfusionist resume example and the skills hiring teams want. Recruiter advice for CCPs. Upload your resume free and get matched to openings.",
      "alsoKnownAs": [
          "CCP",
          "Certified Clinical Perfusionist",
          "cardiovascular perfusionist",
          "clinical perfusionist",
          "cardiac perfusionist"
      ],
      "summaryExample": "Certified Clinical Perfusionist (CCP) with six years on an adult cardiac team. I pump about 150 cases a year, mostly CABG and valves, and I take ECMO call on a rotating schedule. I run Terumo and LivaNova heart lung machines and handle cell saver and autotransfusion setup. Board certified through ABCP and current on all CEU requirements.",
      "skillsKeywords": [
          "Cardiopulmonary bypass",
          "ECMO management",
          "Cell saver and autotransfusion",
          "Cardioplegia delivery",
          "Myocardial protection",
          "Intra-aortic balloon pump (IABP)",
          "Ventricular assist devices (VAD)",
          "Blood gas management",
          "ACT and anticoagulation monitoring",
          "Circuit priming and setup",
          "Hemoconcentration",
          "Point of care testing",
          "Pediatric perfusion",
          "Perioperative blood management"
      ],
      "credentialLine": "Put CCP after your name if you are certified, like Dana Reyes, CCP. In a certifications section, list your ABCP certification with the year earned, any state perfusion license where required, and current BLS or ACLS with expiration dates.",
      "tips": [
          "Put your annual case count up top. Pump cases per year is the first number every chief perfusionist looks for.",
          "Break out your case mix. CABG, valves, transplant, or pediatric cases each signal a different level, so list what you actually do.",
          "List your equipment by name. The heart lung machine models and cell saver systems you run should be on the page.",
          "State your ECMO experience clearly, including whether you manage circuits and take call. ECMO demand drives a lot of hiring.",
          "Show your call burden honestly. A team hiring for 1 in 3 call wants to know you have lived that schedule before.",
          "Keep your ABCP status dated on the resume. Certification year and recert status get checked first."
      ]
  },
  "rnfa-first-assist": {
      "slug": "rnfa-first-assist",
      "roleName": "RNFA / Surgical First Assistant",
      "pageTitle": "RNFA / Surgical First Assistant Resume: Examples and Skills",
      "metaDescription": "A real RNFA resume example plus the skills OR hiring managers want. Advice from healthcare recruiters. Upload your first assist resume free today.",
      "alsoKnownAs": [
          "RNFA",
          "Registered Nurse First Assistant",
          "CSFA",
          "Certified Surgical First Assistant",
          "surgical first assist",
          "first assist",
          "CRNFA"
      ],
      "summaryExample": "RNFA with eight years in the OR, the last four as a first assist on orthopedic and general surgery cases. I assist on 8 to 10 cases a week and handle everything from exposure through closure, including robotic cases on the da Vinci. I hold CNOR certification and an active RN license, with first assist privileges at two facilities. I document in Epic and keep turnover tight between cases.",
      "skillsKeywords": [
          "Surgical first assisting",
          "Exposure and retraction",
          "Hemostasis",
          "Suturing and wound closure",
          "Robotic surgery assisting (da Vinci)",
          "Laparoscopic instrumentation",
          "Endoscopic vein harvesting",
          "Sterile technique",
          "Preoperative and postoperative assessment",
          "Orthopedic and general surgery cases",
          "Epic OpTime documentation",
          "Surgeon and team communication"
      ],
      "credentialLine": "Lead with your nursing credentials in the standard order, like Jordan Kim, MSN, RN, CNOR, RNFA. List your RN license by state with the expiration date, then your RNFA or CSFA credential and any certifications like CNOR with their expiration dates.",
      "tips": [
          "Say whether you are an RNFA, a CSFA, or both in the first line. Hiring managers filter on the credential before reading anything else.",
          "List cases per week and your specialty mix. Assisting on 10 ortho cases a week reads very differently than 3 general cases.",
          "Call out robotic experience by platform and case count. Da Vinci hours are one of the most searched skills for first assist roles.",
          "Show your years in the OR before you became a first assist. Scrub and circulating background counts, so keep it on the resume.",
          "List where you hold privileges by facility type, like a level II trauma center or an ASC. It builds trust fast.",
          "Keep CNOR and your RN license dates visible. Expired-looking credentials get a resume set aside."
      ]
  },
  "genetic-counselor": {
      "slug": "genetic-counselor",
      "roleName": "Genetic Counselor",
      "pageTitle": "Genetic Counselor Resume: Examples and Skills",
      "metaDescription": "A real genetic counselor resume example and the skills employers want. Recruiter advice for CGCs. Upload your resume free and get matched to openings.",
      "alsoKnownAs": [
          "CGC",
          "Certified Genetic Counselor",
          "genetics counselor",
          "LCGC",
          "licensed genetic counselor"
      ],
      "summaryExample": "Certified Genetic Counselor (CGC) with four years in cancer genetics at an academic medical center. I see about 15 patients a week for hereditary cancer risk assessment and handle my own results disclosure and follow up. I order testing through the major commercial labs and document in Epic. I present at a weekly tumor board and hold genetic counselor licenses in three states.",
      "skillsKeywords": [
          "Hereditary cancer risk assessment",
          "Pedigree construction and analysis",
          "Variant interpretation and VUS counseling",
          "Pre and post test counseling",
          "Results disclosure",
          "Prenatal and carrier screening",
          "Test ordering and utilization management",
          "Insurance preauthorization for genetic testing",
          "Telehealth counseling",
          "Tumor board participation",
          "Epic documentation",
          "Patient education materials"
      ],
      "credentialLine": "Put MS, CGC after your name, like Priya Shah, MS, CGC. List your ABGC certification with the year, then each state genetic counselor license with the state and expiration date, since licensure rules vary by state.",
      "tips": [
          "Lead with your specialty area. Cancer, prenatal, pediatric, and lab roles are hired separately, so name yours in the first line.",
          "Put weekly patient volume and your mix of new versus follow up visits in your top bullets.",
          "List the platforms you order through and document in. Epic experience is worth a line of its own.",
          "Name every state license you hold. Multi-state coverage is a real advantage for telehealth roles.",
          "Include tumor board or teaching work. It shows you operate as part of a clinical team.",
          "If you have research or publications, keep that section short. Clinical roles care about patient work first."
      ]
  },
  "paramedic": {
      "slug": "paramedic",
      "roleName": "Paramedic",
      "pageTitle": "Paramedic Resume: Examples and Skills",
      "metaDescription": "See a real paramedic resume summary example, the skills EMS employers search for, and how to list your NREMT and state credentials. Free resume upload.",
      "alsoKnownAs": [
          "EMT",
          "EMT-P",
          "NRP",
          "NREMT Paramedic",
          "Medic",
          "Critical Care Paramedic",
          "Flight Paramedic"
      ],
      "summaryExample": "Paramedic with six years on a busy county 911 system, running 8 to 12 calls per shift. NRP certified with current ACLS and PALS and a clean driving record. I chart in ESO and hand patients off to Level I and Level II trauma teams every week. Looking for a critical care transport role where I can put my FP-C studying to work.",
      "skillsKeywords": [
          "Advanced Cardiac Life Support (ACLS)",
          "Pediatric Advanced Life Support (PALS)",
          "Basic Life Support (BLS)",
          "911 emergency response",
          "Patient assessment",
          "Airway management",
          "IV access and medication administration",
          "12-lead EKG interpretation",
          "Trauma care",
          "ePCR documentation (ESO, ImageTrend)",
          "Interfacility transport",
          "Critical care transport",
          "Scene safety",
          "Ambulance operations"
      ],
      "credentialLine": "List your NREMT certification and your state paramedic license on separate lines with expiration dates. Put ACLS, PALS, and BLS right below them so a recruiter can verify current cards without asking.",
      "tips": [
          "Put certifications at the top, right under your name. EMS recruiters scan for NRP and the state license before reading anything else.",
          "Quantify call volume. '10 to 14 calls per 12-hour shift' tells a hiring chief more than 'high-volume system.'",
          "Say which service types you have run. 911, IFT, critical care, and event standby are different jobs with different skill sets.",
          "List your ePCR software by name. ESO, ImageTrend, and Zoll are search filters on the hiring side.",
          "Keep expiration dates accurate. An expired card listed as current kills trust fast.",
          "If you precept students or new medics, say so. FTO experience moves you up the list for lead and supervisor roles."
      ]
  },
  "medical-laboratory-scientist": {
      "slug": "medical-laboratory-scientist",
      "roleName": "Medical Laboratory Scientist",
      "pageTitle": "Medical Laboratory Scientist Resume: Examples and Skills",
      "metaDescription": "See a real medical laboratory scientist resume example, the lab skills employers search for, and how to list ASCP certification. Free resume upload.",
      "alsoKnownAs": [
          "MLS",
          "Medical Technologist",
          "MT",
          "Clinical Laboratory Scientist",
          "CLS",
          "Med Tech",
          "MLT"
      ],
      "summaryExample": "Medical laboratory scientist, ASCP certified, with five years in a 300-bed hospital core lab. I run chemistry, hematology, and coagulation benches and cover blood bank on nights. I chart in Epic Beaker, run Sysmex analyzers, and helped prep our last CAP inspection. Looking for a generalist role with a path to lead tech.",
      "skillsKeywords": [
          "MLS (ASCP) certification",
          "Clinical chemistry",
          "Hematology",
          "Blood bank / immunohematology",
          "Microbiology",
          "Coagulation",
          "Urinalysis",
          "Molecular diagnostics (PCR)",
          "Quality control and QA",
          "CAP and CLIA compliance",
          "Epic Beaker LIS",
          "Analyzer maintenance and troubleshooting",
          "Specimen processing",
          "Critical value reporting"
      ],
      "credentialLine": "Put your board certification right after your name in the exact format issued, like MLS (ASCP) or MT (ASCP). If your state licenses lab personnel, list that license with its state and expiration date in your certifications section.",
      "tips": [
          "Write your certification exactly as the board issues it, MLS (ASCP) or MT (ASCP). Recruiters search that exact string.",
          "Name your benches. A generalist who covers blood bank reads differently from a chemistry-only tech, so spell out what you run.",
          "List analyzers and your LIS by name. Instrument experience like Sysmex or Beckman plus Epic Beaker is what hiring managers filter on.",
          "Give scale. Bed count, daily test volume, or shift coverage tells the reader what kind of lab you come from.",
          "Mention inspection experience. CAP or Joint Commission prep work stands out for lead and supervisor roles.",
          "If you train students or new techs, include it. Labs run short-staffed and teaching ability matters."
      ]
  },
  "sonographer": {
      "slug": "sonographer",
      "roleName": "Sonographer",
      "pageTitle": "Sonographer Resume: Examples and Skills",
      "metaDescription": "See a real sonographer resume example, the ultrasound skills employers search for, and how to list RDMS and ARDMS credentials. Free resume upload.",
      "alsoKnownAs": [
          "Ultrasound Tech",
          "Diagnostic Medical Sonographer",
          "Ultrasound Technologist",
          "Echo Tech",
          "Cardiac Sonographer",
          "Vascular Technologist",
          "RDMS"
      ],
      "summaryExample": "Registered sonographer with RDMS credentials in abdomen and OB/GYN and four years in hospital imaging. I scan 10 to 14 studies a day across general, OB, and small parts, and I take ER call two weekends a month. I work in Epic and PACS and keep my own QA logs. Looking for an outpatient role with modern machines and a steady schedule.",
      "skillsKeywords": [
          "RDMS",
          "RVT",
          "Abdominal ultrasound",
          "OB/GYN ultrasound",
          "Vascular ultrasound",
          "Echocardiography",
          "Doppler imaging",
          "Small parts ultrasound",
          "PACS",
          "Epic imaging workflows",
          "Image optimization",
          "Ultrasound-guided procedures",
          "Patient prep and positioning",
          "On-call coverage"
      ],
      "credentialLine": "List each registry exactly as issued, like RDMS with your specialties, RDCS, or RVT, plus the issuing body and expiration date. Keep them in a certifications block near the top, above your work history.",
      "tips": [
          "List each registry and specialty separately. RDMS (AB), RDMS (OB/GYN), and RVT are each their own search term for recruiters.",
          "Give your exam mix and daily volume. 'General, OB, and small parts at 12 studies a day' is the line a lead tech wants to see.",
          "Name your machines. GE, Philips, and Canon experience is searchable, and managers care which systems you know.",
          "Call coverage is a selling point for hospital roles. If you carry ER or weekend call, put it in your bullets.",
          "If you are cross-trained, make it obvious. A sonographer who covers general and vascular fills two schedule gaps.",
          "New grads: list clinical rotation sites and exam counts. That is your scan volume until your first job."
      ]
  },
  "physical-therapy-assistant": {
      "slug": "physical-therapy-assistant",
      "roleName": "Physical Therapist Assistant",
      "pageTitle": "Physical Therapist Assistant Resume: Examples and Skills",
      "metaDescription": "See a real physical therapist assistant resume example, the PTA skills employers search for, and how to list your license. Free resume upload.",
      "alsoKnownAs": [
          "PTA",
          "Physical Therapy Assistant",
          "Licensed PTA",
          "LPTA",
          "Travel PTA"
      ],
      "summaryExample": "Licensed physical therapist assistant with three years split between outpatient ortho and skilled nursing. I carry a caseload of 10 to 14 patients a day and document in WebPT and Net Health. I run post-op protocols and progress plans of care under my supervising PT. Looking for a full-time outpatient role with a path to clinic lead.",
      "skillsKeywords": [
          "Therapeutic exercise",
          "Manual therapy techniques",
          "Gait training",
          "Post-surgical rehab protocols",
          "Plan of care progression",
          "Medicare documentation",
          "WebPT",
          "Net Health",
          "Skilled nursing (SNF) rehab",
          "Outpatient orthopedics",
          "Patient education",
          "Modalities (ultrasound, e-stim)",
          "Balance and fall prevention",
          "Productivity standards"
      ],
      "credentialLine": "List your state PTA license with the state and expiration date, and add the license number if the application asks for it. Put CPR/BLS next to it near the top of the page.",
      "tips": [
          "Use the exact licensed title, physical therapist assistant. That is the phrase recruiters and ATS filters search for.",
          "Name your settings and caseload. Outpatient ortho at 12 patients a day is a different job than SNF at 8.",
          "List your documentation systems. WebPT and Net Health show up as keyword filters on the hiring side.",
          "Show plan-of-care work. Give an example like progressing post-op knee patients through protocol milestones.",
          "If your productivity numbers are strong, include them. Rehab directors live by that metric.",
          "List recent CEUs that match the job, like manual therapy or vestibular courses."
      ]
  },
  "occupational-therapy-assistant": {
      "slug": "occupational-therapy-assistant",
      "roleName": "Occupational Therapy Assistant",
      "pageTitle": "Occupational Therapy Assistant Resume: Examples and Skills",
      "metaDescription": "See a real occupational therapy assistant resume example, the COTA skills employers search for, and how to list your license. Free resume upload.",
      "alsoKnownAs": [
          "COTA",
          "OTA",
          "COTA/L",
          "Certified Occupational Therapy Assistant",
          "Occupational Therapist Assistant"
      ],
      "summaryExample": "COTA with four years across skilled nursing and home health. I carry 9 to 12 patients a day, focused on ADLs, transfers, and safe discharge planning, and I document in PointClickCare. NBCOT certified and licensed in two states. Looking for a school-based or pediatric role where my feeding and fine motor continuing ed gets real use.",
      "skillsKeywords": [
          "ADL training",
          "Functional mobility and transfers",
          "Therapeutic activities",
          "Cognitive retraining",
          "Home safety assessments",
          "Discharge planning support",
          "PointClickCare",
          "Net Health",
          "SNF rehab",
          "Home health OT",
          "School-based services",
          "Pediatric feeding and fine motor",
          "Medicare documentation",
          "Caregiver education"
      ],
      "credentialLine": "List your NBCOT certification as COTA and your state OTA license with state and expiration date. If you write COTA/L after your name, keep the format consistent through the whole resume.",
      "tips": [
          "Write out occupational therapy assistant once near the top, then use COTA. The long form catches ATS filters and the short form is what people scan for.",
          "Lead with your settings. SNF, home health, schools, and peds are different worlds, and directors hire for the one they staff.",
          "Show caseload and documentation system. Nine patients a day in PointClickCare tells a recruiter you can step in fast.",
          "Tie tasks to outcomes. A patient who can dress independently or return home safely says more than a list of treatment codes.",
          "List every state license you hold. It signals you can float or travel without paperwork delays.",
          "New grads: lead with fieldwork. Name the settings and the caseload you carried."
      ]
  },
  "phlebotomist": {
      "slug": "phlebotomist",
      "roleName": "Phlebotomist",
      "pageTitle": "Phlebotomist Resume: Examples and Skills",
      "metaDescription": "A real phlebotomist resume example plus the skills and certs recruiters want to see. Upload your resume free and get matched to phlebotomy jobs.",
      "alsoKnownAs": [
          "Phlebotomy Technician",
          "Phlebotomy Tech",
          "CPT",
          "Mobile Phlebotomist"
      ],
      "summaryExample": "Certified phlebotomist (CPT through NHA) with four years of draws in a 300-bed hospital lab and two outpatient draw stations. Comfortable at 50 to 70 sticks a shift, including pediatric and hard-stick patients. I label and process specimens in Epic Beaker and my mislabel record is clean. Looking for a hospital or donor center role where volume and accuracy both count.",
      "skillsKeywords": [
          "Venipuncture",
          "Capillary collection",
          "Order of draw",
          "Specimen labeling and processing",
          "Patient identification verification",
          "Pediatric and geriatric draws",
          "Hard-stick techniques",
          "Blood culture collection",
          "Glucose tolerance testing",
          "Epic Beaker",
          "Centrifuge operation",
          "Infection control",
          "HIPAA compliance",
          "High-volume draw environments"
      ],
      "credentialLine": "List your certification with the credentialing body, like CPT (NHA) or PBT (ASCP), in a certifications section with the expiration date. If your state licenses phlebotomists, add the state license number too.",
      "tips": [
          "Put your draw volume in the first bullet. 'Averaged 60 draws per shift' tells a lab manager more than any adjective.",
          "Name the settings you have worked. Hospital floor draws and plasma center draws are different jobs to a hiring manager.",
          "Call out pediatric, geriatric, or hard-stick experience by name. Those are the draws labs struggle to staff.",
          "List the lab systems you have used, like Epic Beaker. Recruiters search for system names.",
          "If you have a clean labeling record or a low redraw rate, say so plainly. A specific accuracy claim beats a buzzword.",
          "Spell out your cert the first time, like Certified Phlebotomy Technician (CPT), so both versions hit ATS keyword matches."
      ]
  },
  "patient-care-tech": {
      "slug": "patient-care-tech",
      "roleName": "Patient Care Technician",
      "pageTitle": "Patient Care Technician Resume: Examples and Skills",
      "metaDescription": "Patient care technician resume example with the skills and certs hospital recruiters look for. Upload your resume free and get matched to PCT jobs.",
      "alsoKnownAs": [
          "PCT",
          "Patient Care Tech",
          "Patient Care Assistant",
          "ED Tech",
          "Hospital Tech"
      ],
      "summaryExample": "Patient care technician with three years on a 32-bed med-surg telemetry floor, usually covering 10 to 12 patients a shift. CNA and CPCT/A certified, EKG trained, and comfortable with blood draws. I chart vitals, intake and output, and safety rounds in Epic without falling behind. Charge nurses pull me for the heaviest assignments because my documentation holds up.",
      "skillsKeywords": [
          "Vital signs",
          "EKG and telemetry monitoring",
          "Phlebotomy",
          "Blood glucose checks",
          "Foley catheter care",
          "Patient transfers and mobility",
          "ADL assistance",
          "Intake and output documentation",
          "Hourly rounding",
          "Fall prevention",
          "Epic charting",
          "Wound care assistance",
          "Code response support",
          "BLS certification"
      ],
      "credentialLine": "List your CNA with the issuing state and your CPCT/A or other tech certification in a certifications section with expiration dates. Put BLS there too, since most hospitals require it.",
      "tips": [
          "State your floor type and patient ratio up front. 'Med-surg tele, 10 to 12 patients' is the first thing a nurse manager wants to know.",
          "List every clinical skill you are signed off on. EKGs, blood draws, Foley care, and glucose checks each match a keyword search.",
          "Name your EMR. Epic or Cerner experience saves the unit training time and recruiters filter on it.",
          "Keep CNA, CPCT/A, and BLS in their own certifications section with expiration dates. Missing dates get resumes set aside.",
          "If you float between units, say which ones. Float experience reads as flexible staffing to a hospital.",
          "Mention safety results if you have them, like fall-free stretches on your assignments. Safety is what managers get graded on."
      ]
  },
  "sleep-tech": {
      "slug": "sleep-tech",
      "roleName": "Sleep Technologist",
      "pageTitle": "Sleep Technologist Resume: Examples and Skills",
      "metaDescription": "Sleep technologist resume example with the skills and credentials sleep labs look for. Upload your resume free and get matched to sleep tech jobs.",
      "alsoKnownAs": [
          "Sleep Tech",
          "Sleep Technician",
          "Polysomnographic Technologist",
          "Polysomnography Tech",
          "RPSGT",
          "Sleep Lab Technician"
      ],
      "summaryExample": "RPSGT with five years running in-lab studies at a 6-bed AASM-accredited sleep center. I handle full PSG hookups using the 10-20 system plus CPAP and BiPAP titrations. I also run MSLTs and score my own studies to AASM guidelines, usually covering two patients a night. Looking for a lead tech role or a lab that also does home sleep testing.",
      "skillsKeywords": [
          "Polysomnography (PSG)",
          "CPAP and BiPAP titration",
          "10-20 electrode placement",
          "Sleep staging and scoring",
          "AASM scoring guidelines",
          "MSLT and MWT testing",
          "Home sleep apnea testing (HSAT)",
          "PAP mask fitting and patient education",
          "Artifact recognition and correction",
          "EEG, EKG, and EMG monitoring",
          "Sleep study hookups",
          "Patient safety monitoring",
          "Acquisition and scoring software"
      ],
      "credentialLine": "List RPSGT or RST with the credentialing board and your credential number, plus BLS, each with the expiration date. If your state licenses sleep techs, add the state license on the same line.",
      "tips": [
          "Lead with your credential and study volume. 'RPSGT, two beds a night' beats a paragraph about your passion for sleep medicine.",
          "List the test types you run by name. PSG, CPAP and BiPAP titration, MSLT, and HSAT are all separate keyword searches.",
          "Say whether you score your own studies and to what standard. Scoring to AASM guidelines is a skill labs pay attention to.",
          "Name your acquisition and scoring software. Lab managers look for techs who already know their system.",
          "If you have worked with pediatric patients or in an AASM-accredited lab, say so. Both narrow the candidate pool fast.",
          "Night shift reliability is the quiet dealbreaker. A line like 'five years of full-time third shift' answers it before the interview."
      ]
  },
  "dental-hygienist": {
      "slug": "dental-hygienist",
      "roleName": "Dental Hygienist",
      "pageTitle": "Dental Hygienist Resume: Examples and Skills",
      "metaDescription": "Dental hygienist resume example with the skills and license details offices look for. Upload your resume free and get matched to RDH jobs near you.",
      "alsoKnownAs": [
          "RDH",
          "Registered Dental Hygienist",
          "Hygienist"
      ],
      "summaryExample": "Licensed RDH with six years in general practice and one year in a periodontics office. I see 8 to 10 patients a day and handle my own perio charting and SRP. I run on time, which front desks notice, and I am comfortable in Dentrix and Eaglesoft. Local anesthesia certified in my state and looking for a practice that books me full.",
      "skillsKeywords": [
          "Adult and child prophylaxis",
          "Scaling and root planing (SRP)",
          "Periodontal charting",
          "Digital radiographs",
          "Local anesthesia administration",
          "Ultrasonic instrumentation",
          "Fluoride and sealant application",
          "Perio maintenance",
          "Patient education",
          "Dentrix",
          "Eaglesoft",
          "Infection control and OSHA compliance",
          "Intraoral imaging",
          "Recall scheduling support"
      ],
      "credentialLine": "Put RDH after your name and list your state license with the number and expiration in a licenses section. Add local anesthesia or nitrous oxide permits if your state issues them, plus CPR certification.",
      "tips": [
          "Put your patients-per-day number in your first bullet. Offices schedule production around it.",
          "List your clinical permits exactly as your state names them. Local anesthesia and nitrous permits change which offices can use you.",
          "Name your practice software. Dentrix, Eaglesoft, or Open Dental experience means a shorter ramp-up and offices know it.",
          "Call out perio experience separately. SRP volume matters to perio offices and to general practices with big perio programs.",
          "If you temp or work PRN, list the range of office types you have covered. It shows you can walk into any operatory and produce.",
          "Keep your license line current. An expired-looking license date is the fastest way to get screened out."
      ]
  },
  "mental-health-tech": {
      "slug": "mental-health-tech",
      "roleName": "Mental Health Technician",
      "pageTitle": "Mental Health Technician Resume: Examples and Skills",
      "metaDescription": "Mental health technician resume example with the skills psych units look for. Upload your resume free and get matched to behavioral health tech jobs.",
      "alsoKnownAs": [
          "MHT",
          "Behavioral Health Technician",
          "BHT",
          "Psychiatric Technician",
          "Psych Tech",
          "Behavioral Health Associate"
      ],
      "summaryExample": "Mental health technician with four years on adult inpatient psych units, including a year in crisis stabilization. CPI trained, and I talk most situations down before they get physical. I run Q15 safety checks and 1:1 observations and chart everything the same shift. Nurses trust me with the acute patients because I stay calm and follow the plan.",
      "skillsKeywords": [
          "Crisis de-escalation",
          "CPI certification",
          "Q15 safety checks",
          "1:1 patient observation",
          "Behavioral documentation",
          "Vital signs",
          "Suicide precautions",
          "Milieu management",
          "Group facilitation support",
          "Therapeutic communication",
          "Restraint and seclusion protocols",
          "ADL assistance",
          "EMR charting",
          "Admissions and intake support"
      ],
      "credentialLine": "Most MHT jobs do not require a license, so lead with your training instead. List CPI or other crisis intervention training with the year, plus BLS and CNA if you hold them, each with expiration dates.",
      "tips": [
          "Name the unit types you have worked, like adult inpatient, adolescent, or crisis stabilization. Acuity level is the first screen.",
          "Put your de-escalation training and record up front. CPI certification with a low restraint count is what psych nurse managers look for.",
          "Spell out your observation experience. Q15 checks and 1:1s are searchable terms and they signal you know the safety routine.",
          "List documentation by name, like behavioral charting in the unit EMR. Care that was not charted did not happen, and managers know it.",
          "If you have worked with substance use or dual diagnosis patients, say so. Those programs hire constantly and screen for it.",
          "Steady attendance is worth a line. Psych units run short and managers notice techs who show up."
      ]
  },
  "bcba": {
      "slug": "bcba",
      "roleName": "Board Certified Behavior Analyst (BCBA)",
      "pageTitle": "BCBA Resume: Examples and Skills",
      "metaDescription": "See a BCBA resume example, the ABA skills recruiters search for, and how to list your certification. Then upload your resume free and get matched to jobs.",
      "alsoKnownAs": [
          "BCBA",
          "Behavior Analyst",
          "ABA Therapist",
          "Applied Behavior Analyst",
          "BCaBA",
          "Licensed Behavior Analyst (LBA)"
      ],
      "summaryExample": "Board Certified Behavior Analyst with six years across clinic and in-home ABA programs for kids ages 2 to 12. I carry a caseload of 10 to 14 clients and supervise eight RBTs with documented monthly supervision hours. I run VB-MAPP and ABLLS-R assessments, write behavior intervention plans, and handle insurance reauthorizations in CentralReach. Licensed LBA with real experience training parents to run programs at home.",
      "skillsKeywords": [
          "Applied Behavior Analysis (ABA)",
          "Functional Behavior Assessment (FBA)",
          "Behavior Intervention Plans (BIP)",
          "VB-MAPP",
          "ABLLS-R",
          "RBT supervision",
          "Parent and caregiver training",
          "CentralReach",
          "Discrete trial training (DTT)",
          "Natural environment teaching (NET)",
          "Insurance authorizations and reauthorizations",
          "Treatment plan writing",
          "Data collection and graphing",
          "HIPAA compliance"
      ],
      "credentialLine": "List your BCBA first, issued by the Behavior Analyst Certification Board, with your certification date. Add your state behavior analyst license (LBA) for each state that requires one, with the state and expiration date.",
      "tips": [
          "Put your caseload size and client ages in the first line. A BCBA who manages 14 in-home cases reads very differently from one running a clinic pod.",
          "Name the assessments you actually run, like VB-MAPP, ABLLS-R, and FBAs. Clinical directors scan for these.",
          "List how many RBTs and BCaBAs you supervise. Supervision capacity is a hiring factor at almost every ABA company.",
          "Name your practice management software, like CentralReach or Rethink. Clinics filter on it because training time costs money.",
          "Show one or two client outcomes in plain numbers, like goals mastered per authorization period or a drop in target behaviors. Skip lines about being passionate.",
          "If you hold a state LBA license, list every state you hold it in. Multi-state licensure matters for telehealth and regional companies."
      ]
  },
  "cath-lab-tech": {
      "slug": "cath-lab-tech",
      "roleName": "Cath Lab Technologist",
      "pageTitle": "Cath Lab Tech Resume: Examples and Skills",
      "metaDescription": "See a cath lab tech resume example, the skills cardiology teams look for, and how to list RCIS and ACLS. Upload your resume free and get matched to jobs.",
      "alsoKnownAs": [
          "Cath Lab Tech",
          "Cardiovascular Invasive Specialist",
          "RCIS",
          "Cardiovascular Technologist (CVT)",
          "EP Tech",
          "Cardiac Cath Tech"
      ],
      "summaryExample": "Cath lab technologist with eight years scrubbing and circulating in a high volume interventional lab, about 2,500 cases a year. I scrub diagnostic caths, PCIs, and structural cases including TAVR. RCIS certified with current ACLS, and I take STEMI call about ten nights a month. I monitor hemodynamics on Mac-Lab and chart in Epic.",
      "skillsKeywords": [
          "RCIS",
          "Scrubbing and circulating",
          "Percutaneous coronary intervention (PCI)",
          "Hemodynamic monitoring",
          "Mac-Lab",
          "Electrophysiology (EP) studies",
          "Device implants (pacemakers, ICDs)",
          "Structural heart (TAVR)",
          "Sheath pulls and groin management",
          "STEMI call coverage",
          "Radiation safety (ALARA)",
          "Sterile technique",
          "ACLS",
          "Epic documentation"
      ],
      "credentialLine": "List RCIS or RCES from Cardiovascular Credentialing International first, then any ARRT registration, then BLS and ACLS with expiration dates. Add your state radiologic or fluoroscopy license if your state requires one for cath lab work.",
      "tips": [
          "Lead with your case volume and lab type. Annual cases and whether the lab runs PCI around the clock tell a manager most of what they need.",
          "List procedures by name: diagnostic caths, PCI, EP studies, device implants, structural cases like TAVR. Vague lines like \"assisted with procedures\" get skipped.",
          "Spell out your role in the room. Scrubbing, circulating, and monitoring are different skills, so say which ones you cover.",
          "Put STEMI call on your resume with how often you take it. Call coverage is usually the hardest slot to fill.",
          "Name your hemodynamic and charting systems, like Mac-Lab and Epic. Managers want techs who can chart on day one.",
          "If you have RCIS, put it next to your name at the top of the page so it shows in the ATS preview."
      ]
  },
  "mri-tech": {
      "slug": "mri-tech",
      "roleName": "MRI Technologist",
      "pageTitle": "MRI Tech Resume: Examples and Skills",
      "metaDescription": "See an MRI tech resume example, the skills imaging managers look for, and how to list ARRT (MR). Upload your resume free and get matched to real jobs.",
      "alsoKnownAs": [
          "MRI Tech",
          "MR Technologist",
          "Magnetic Resonance Imaging Technologist",
          "ARRT (MR) Tech",
          "ARMRIT Tech"
      ],
      "summaryExample": "MRI technologist with five years split between a hospital imaging department and an outpatient center, ARRT registered in Radiography and MR. I scan 12 to 16 patients a shift on Siemens and GE 1.5T and 3T magnets, mostly neuro, spine, and MSK protocols. I handle my own contrast screening and implant clearance and start my own IVs. I document in Epic Radiant and work daily in PACS.",
      "skillsKeywords": [
          "ARRT (MR)",
          "MRI safety screening",
          "Implant and device clearance",
          "1.5T and 3T scanners",
          "Neuro and spine protocols",
          "MSK protocols",
          "Gadolinium contrast administration",
          "IV insertion",
          "PACS",
          "Epic Radiant",
          "Patient positioning",
          "Artifact reduction and image quality",
          "Mobile MRI",
          "BLS"
      ],
      "credentialLine": "List your ARRT registration with categories in the standard format, like ARRT (R)(MR), then your state license in states that license technologists, then BLS with its expiration date. If you registered through ARMRIT instead, list it the same way.",
      "tips": [
          "Put ARRT (MR) next to your name at the top. Recruiters search the credential string before they read anything else.",
          "Quantify your scanning: patients per shift, field strengths, and scanner brands. A tech running a 3T magnet all day is a different hire than one on a slow mobile unit.",
          "List protocols by body area, like neuro, spine, MSK, abdomen, and breast. Imaging managers staff by protocol coverage.",
          "Call out MRI safety work: screening, implant and device clearance, and zone access control. Safety incidents are what keep managers up at night.",
          "If you also hold ARRT (R), list both registrations. Departments like techs who can cover X-ray in a pinch.",
          "Say if you start your own IVs and run power injectors. Some outpatient centers require it and screen for it."
      ]
  },
}

export function getResumeGuide(slug: string): ResumeGuide | undefined {
  return RESUME_GUIDES[slug]
}
