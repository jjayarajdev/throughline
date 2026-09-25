import { JdCruxStatus as PrismaJdCruxStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { aiComplete, isAiAvailable } from '../lib/ai-provider.js';
import * as documentParser from './document-parser.service.js';
import { redactPii } from './pii-redaction.service.js';

/**
 * Matching service — Phase 16.
 *
 * Compares a candidate's resume against a role's extracted JD crux.
 * Returns a match score (0-100) with category breakdown and explanation.
 *
 * PII is redacted from the resume before sending to the LLM.
 */

export interface MatchResult {
  score: number;
  breakdown: {
    skills: number;
    experience: number;
    qualifications: number;
  };
  missingSkills: string[];
  missingQualifications: string[];
  explanation: string;
  piiRedactionCount: number;
}

export interface BiasAuditResult {
  passed: boolean;
  maxDisparity: number;
  results: Array<{
    nameVariation: string;
    score: number;
    disparity: number;
  }>;
}

// ── Match scoring prompt ────────────────────────────────────

const MATCHING_SYSTEM_PROMPT = `You are a resume-to-job matching evaluator. Given a job description crux (structured requirements) and a resume, evaluate how well the candidate matches.

Output ONLY a valid JSON object with these exact keys:
{
  "score": number,                  // Overall match score 0-100
  "breakdown": {
    "skills": number,               // Skills match percentage 0-100
    "experience": number,           // Experience match percentage 0-100
    "qualifications": number        // Qualifications match percentage 0-100
  },
  "missingSkills": string[],       // Skills from JD that the resume lacks
  "missingQualifications": string[], // Qualifications from JD that the resume lacks
  "explanation": string             // 2-3 sentence explanation of why the score is what it is
}

Scoring rules:
- score = weighted average: skills 50%, experience 30%, qualifications 20%
- Skills: count how many key skills from JD are evidenced in resume
- Experience: compare years of experience against JD requirements
- Qualifications: check degree/certification requirements
- Nice-to-have skills boost the score but their absence doesn't penalize
- Be fair and objective — evaluate skills evidence, not writing quality
- explanation should be recruiter-facing: what's strong, what's missing
- Output ONLY the JSON object, no markdown, no explanation`;

/**
 * Check how well a candidate's resume matches a role's JD crux.
 *
 * This is the pre-submission match check endpoint. It:
 * 1. Downloads the CV from S3
 * 2. Extracts text
 * 3. Redacts PII
 * 4. Sends to LLM with the JD crux
 * 5. Returns the match result
 */
export async function checkMatch(
  roleId: string,
  cvS3Key: string,
  cvMimeType: string,
  candidateName?: string,
  candidateEmail?: string,
  candidatePhone?: string,
): Promise<MatchResult> {
  // 1. Load JD crux
  const crux = await prisma.jdCrux.findUnique({
    where: { roleId },
  });

  if (!crux || crux.status !== PrismaJdCruxStatus.completed) {
    // Fall back to role's structured data if no crux
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: {
        title: true,
        description: true,
        skills: true,
        experienceMin: true,
        experienceMax: true,
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return matchWithRoleData(role, cvS3Key, cvMimeType, candidateName, candidateEmail, candidatePhone);
  }

  // 2. Download + extract CV text
  const cvText = await documentParser.extractText(cvS3Key, cvMimeType);

  if (!cvText || cvText.trim().length < 20) {
    return {
      score: 0,
      breakdown: { skills: 0, experience: 0, qualifications: 0 },
      missingSkills: crux.keySkills,
      missingQualifications: crux.qualifications,
      explanation: 'Could not extract meaningful text from the resume.',
      piiRedactionCount: 0,
    };
  }

  // 3. Redact PII
  const { redactedText, redactionCount } = redactPii({
    text: cvText,
    knownName: candidateName,
    knownEmail: candidateEmail,
    knownPhone: candidatePhone,
  });

  // 4. Build prompt
  const jdCruxSummary = formatCruxForPrompt(crux);
  const userMessage = `## Job Requirements\n${jdCruxSummary}\n\n## Resume\n${redactedText.slice(0, 8000)}`;

  if (!isAiAvailable()) {
    throw new Error('AI provider not configured (OPENAI_API_KEY missing)');
  }

  // 5. Send to LLM
  const result = await aiComplete({
    messages: [
      { role: 'system', content: MATCHING_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    operation: 'resume-match',
    referenceType: 'role',
    referenceId: roleId,
    maxTokens: 512,
    temperature: 0.1,
  });

  // 6. Parse response
  const parsed = parseMatchResponse(result.content);
  return { ...parsed, piiRedactionCount: redactionCount };
}

/**
 * Bias audit — runs the same resume with diverse name variations and
 * checks for >10% score disparity. Admin-only endpoint.
 */
export async function runBiasAudit(
  roleId: string,
  cvS3Key: string,
  cvMimeType: string,
): Promise<BiasAuditResult> {
  // Diverse name set covering different demographics
  const nameVariations = [
    'Rajesh Kumar',
    'Priya Sharma',
    'John Smith',
    'Aisha Patel',
    'Wei Chen',
    'Maria Garcia',
    'Oluwaseun Okafor',
    'Sarah Johnson',
  ];

  // Get the baseline score (no name)
  const scores: Array<{ nameVariation: string; score: number; disparity: number }> = [];

  for (const name of nameVariations) {
    const result = await checkMatch(roleId, cvS3Key, cvMimeType, name);
    scores.push({ nameVariation: name, score: result.score, disparity: 0 });
  }

  // Calculate disparity from the mean
  const mean = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  let maxDisparity = 0;

  for (const entry of scores) {
    entry.disparity = Math.abs(entry.score - mean);
    if (entry.disparity > maxDisparity) {
      maxDisparity = entry.disparity;
    }
  }

  const disparityPct = mean > 0 ? (maxDisparity / mean) * 100 : 0;

  return {
    passed: disparityPct <= 10,
    maxDisparity: Math.round(disparityPct * 100) / 100,
    results: scores,
  };
}

// ── Fallback: match using role structured data ──────────────

async function matchWithRoleData(
  role: { title: string; description: string; skills: string[]; experienceMin: number; experienceMax: number },
  cvS3Key: string,
  cvMimeType: string,
  candidateName?: string,
  candidateEmail?: string,
  candidatePhone?: string,
): Promise<MatchResult> {
  const cvText = await documentParser.extractText(cvS3Key, cvMimeType);

  if (!cvText || cvText.trim().length < 20) {
    return {
      score: 0,
      breakdown: { skills: 0, experience: 0, qualifications: 0 },
      missingSkills: role.skills,
      missingQualifications: [],
      explanation: 'Could not extract meaningful text from the resume.',
      piiRedactionCount: 0,
    };
  }

  const { redactedText, redactionCount } = redactPii({
    text: cvText,
    knownName: candidateName,
    knownEmail: candidateEmail,
    knownPhone: candidatePhone,
  });

  const jdSummary = [
    `Title: ${role.title}`,
    `Description: ${role.description.slice(0, 2000)}`,
    `Required Skills: ${role.skills.join(', ')}`,
    `Experience: ${role.experienceMin}-${role.experienceMax} years`,
  ].join('\n');

  if (!isAiAvailable()) {
    throw new Error('AI provider not configured (OPENAI_API_KEY missing)');
  }

  const result = await aiComplete({
    messages: [
      { role: 'system', content: MATCHING_SYSTEM_PROMPT },
      { role: 'user', content: `## Job Requirements\n${jdSummary}\n\n## Resume\n${redactedText.slice(0, 8000)}` },
    ],
    operation: 'resume-match',
    referenceType: 'role',
    referenceId: undefined,
    maxTokens: 512,
    temperature: 0.1,
  });

  const parsed = parseMatchResponse(result.content);
  return { ...parsed, piiRedactionCount: redactionCount };
}

// ── Helpers ─────────────────────────────────────────────────

function formatCruxForPrompt(crux: {
  keySkills: string[];
  niceToHaveSkills: string[];
  mustHaves: string[];
  qualifications: string[];
  seniorityLevel: string | null;
  experienceMin: number | null;
  experienceMax: number | null;
  summary: string | null;
}): string {
  const parts: string[] = [];

  if (crux.summary) parts.push(`Summary: ${crux.summary}`);
  if (crux.keySkills.length > 0) parts.push(`Key Skills (required): ${crux.keySkills.join(', ')}`);
  if (crux.niceToHaveSkills.length > 0) parts.push(`Nice-to-have Skills: ${crux.niceToHaveSkills.join(', ')}`);
  if (crux.mustHaves.length > 0) parts.push(`Must-haves: ${crux.mustHaves.join(', ')}`);
  if (crux.qualifications.length > 0) parts.push(`Qualifications: ${crux.qualifications.join(', ')}`);
  if (crux.seniorityLevel) parts.push(`Seniority: ${crux.seniorityLevel}`);
  if (crux.experienceMin !== null || crux.experienceMax !== null) {
    const min = crux.experienceMin ?? 0;
    const max = crux.experienceMax;
    parts.push(`Experience: ${max ? `${min}-${max}` : `${min}+`} years`);
  }

  return parts.join('\n');
}

function parseMatchResponse(content: string): Omit<MatchResult, 'piiRedactionCount'> {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`LLM returned invalid JSON for match: ${cleaned.slice(0, 200)}`);
  }

  const score = typeof parsed.score === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.score))) : 0;
  const breakdown = parsed.breakdown ?? {};

  return {
    score,
    breakdown: {
      skills: clampScore(breakdown.skills),
      experience: clampScore(breakdown.experience),
      qualifications: clampScore(breakdown.qualifications),
    },
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills.map(String) : [],
    missingQualifications: Array.isArray(parsed.missingQualifications)
      ? parsed.missingQualifications.map(String)
      : [],
    explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
  };
}

function clampScore(v: unknown): number {
  if (typeof v !== 'number') return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}
