/**
 * Resume/cover-letter tailoring — one job posting + the candidate's resume
 * text in, a tailored rewrite out. Ported from the standalone ApplyKit
 * product (github.com/YoungAlgy/applykit) now that the feature lives here
 * as a native /account/tailor page instead of a separate app.
 */
import { GoogleGenAI, Type } from "@google/genai";

// Lazily constructed so a build (or a route that never gets called) doesn't
// depend on GEMINI_API_KEY being set yet.
let _ai: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "missing" });
  return _ai;
}

export interface TailorResult {
  tailoredBullets: string[];
  coverLetter: string;
  interviewPrep: { question: string; tip: string }[];
  keywordsToAdd: string[];
}

const RESULT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    tailoredBullets: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "5-8 resume bullets rewritten to match the job's language and priorities, based on the candidate's real experience only.",
    },
    coverLetter: {
      type: Type.STRING,
      description: "A short (under 250 words), specific cover letter referencing the actual job and company. Sign it with the candidate's real name taken from their resume. Never leave placeholder brackets like [Your Name], [Company], or [Date] in the text.",
    },
    interviewPrep: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          tip: { type: Type.STRING },
        },
        required: ["question", "tip"],
      },
      description: "6-8 likely interview questions for this specific role, each with a one-line tip on how to answer well given the candidate's background.",
    },
    keywordsToAdd: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "4-8 specific skills, tools, or terms the job posting emphasizes that are missing or weak in the candidate's current resume. Real terms from the posting only, no filler.",
    },
  },
  required: ["tailoredBullets", "coverLetter", "interviewPrep", "keywordsToAdd"],
};

export async function tailorApplication(opts: {
  jobDescription: string;
  resumeText: string;
}): Promise<TailorResult> {
  const prompt = `You are a career coach helping a real healthcare job seeker tailor their application. Do not invent experience the candidate doesn't have. Only reframe and reprioritize what's actually in their resume to match the job.

JOB POSTING:
"""
${opts.jobDescription.slice(0, 8000)}
"""

CANDIDATE'S CURRENT RESUME:
"""
${opts.resumeText.slice(0, 8000)}
"""

Produce tailored resume bullets, a cover letter, interview prep, and a keyword gap list specific to this exact job. Find the candidate's real name in their resume and sign the cover letter with it. Do not leave any placeholder brackets like [Your Name], [Company Name], or [Date] anywhere. If a detail like the hiring manager's name isn't available, use a natural greeting like "Dear Hiring Team" instead of a bracket.`;

  const response = await getAi().models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: RESULT_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) throw new Error("empty_gemini_response");

  const parsed = JSON.parse(text) as TailorResult;

  // The schema guarantees shape, not content. On a refusal or safety block
  // Gemini can return empty arrays / a blank letter. Throw here so the caller
  // never returns a "success" with nothing in it.
  const hasBullets = Array.isArray(parsed.tailoredBullets) && parsed.tailoredBullets.some((b) => b?.trim());
  const hasLetter = typeof parsed.coverLetter === "string" && parsed.coverLetter.trim().length > 0;
  const hasPrep = Array.isArray(parsed.interviewPrep) && parsed.interviewPrep.some((q) => q?.question?.trim());
  if (!hasBullets || !hasLetter || !hasPrep) throw new Error("empty_gemini_content");

  // keywordsToAdd is a bonus field; never fail the whole result over it.
  if (!Array.isArray(parsed.keywordsToAdd)) parsed.keywordsToAdd = [];

  return parsed;
}
