import { JdCruxStatus as PrismaJdCruxStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { aiComplete, isAiAvailable } from '../lib/ai-provider.js';
import * as documentParser from './document-parser.service.js';

/**
 * JD Extraction — Phase 16.
 *
 * Downloads a role's JD document from S3, extracts plaintext, then
 * sends it to the LLM for structured extraction (key skills, must-haves,
 * nice-to-haves, qualifications, seniority level, etc.).
 *
 * The result is stored in the JdCrux model (1:1 with Role).
 */

export interface JdCruxData {
  keySkills: string[];
  niceToHaveSkills: string[];
  mustHaves: string[];
  qualifications: string[];
  seniorityLevel: string | null;
  experienceMin: number | null;
  experienceMax: number | null;
  summary: string;
}

// ── LLM prompt ──────────────────────────────────────────────

const EXTRACTION_SYSTEM_PROMPT = `You are a structured data extraction assistant. Given a job description, extract the following fields as JSON. Be precise and concise.

Output ONLY a valid JSON object with these exact keys:
{
  "keySkills": string[],        // Required technical/domain skills
  "niceToHaveSkills": string[], // Preferred but not required skills
  "mustHaves": string[],        // Hard requirements (certifications, clearances, education)
  "qualifications": string[],   // Degree/certification requirements
  "seniorityLevel": string,     // One of: "intern", "junior", "mid", "senior", "lead", "principal", "director", "executive"
  "experienceMin": number|null, // Minimum years of experience (null if not stated)
  "experienceMax": number|null, // Maximum years of experience (null if not stated)
  "summary": string             // 2-3 sentence summary of the role
}

Rules:
- Skills should be specific and normalized (e.g. "React" not "React.js framework")
- If experience is stated as "5+ years", set experienceMin=5, experienceMax=null
- If experience is a range like "3-5 years", set experienceMin=3, experienceMax=5
- Keep mustHaves distinct from keySkills — mustHaves are non-negotiable requirements
- summary should be recruiter-facing: what kind of candidate this role needs
- Output ONLY the JSON object, no markdown, no explanation`;

/**
 * Extract structured crux from a role's JD document.
 *
 * This is the main entry point — called by the BullMQ worker when a
 * role with a JD is approved, or by the admin manual trigger endpoint.
 */
export async function extractJdCrux(roleId: string): Promise<void> {
  // Load role + existing crux
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      jdS3Key: true,
      jdMimeType: true,
      title: true,
      description: true,
      skills: true,
      experienceMin: true,
      experienceMax: true,
    },
  });

  if (!role) {
    console.error(`[jd-extraction] Role ${roleId} not found`);
    return;
  }

  // Upsert JdCrux row as "processing"
  await prisma.jdCrux.upsert({
    where: { roleId },
    create: { roleId, status: PrismaJdCruxStatus.processing },
    update: { status: PrismaJdCruxStatus.processing, errorMessage: null },
  });

  try {
    let jdText: string;

    if (role.jdS3Key) {
      // Extract text from the uploaded JD document
      jdText = await documentParser.extractText(role.jdS3Key, role.jdMimeType ?? undefined);
    } else {
      // No JD document — use the role description + skills as input
      jdText = buildFallbackJdText(role);
    }

    if (!jdText || jdText.trim().length < 20) {
      throw new Error('Extracted text is too short to analyze');
    }

    if (!isAiAvailable()) {
      throw new Error('AI provider not configured (OPENAI_API_KEY missing)');
    }

    // Send to LLM
    const result = await aiComplete({
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: `Job Title: ${role.title}\n\nJob Description:\n${jdText}` },
      ],
      operation: 'jd-extraction',
      referenceType: 'role',
      referenceId: roleId,
      maxTokens: 1024,
      temperature: 0.1,
    });

    // Parse LLM response
    const parsed = parseExtractionResponse(result.content);

    // Store result
    await prisma.jdCrux.update({
      where: { roleId },
      data: {
        status: PrismaJdCruxStatus.completed,
        keySkills: parsed.keySkills,
        niceToHaveSkills: parsed.niceToHaveSkills,
        mustHaves: parsed.mustHaves,
        qualifications: parsed.qualifications,
        seniorityLevel: parsed.seniorityLevel,
        experienceMin: parsed.experienceMin,
        experienceMax: parsed.experienceMax,
        summary: parsed.summary,
        rawText: jdText.slice(0, 50_000), // Cap at 50K chars for storage
        errorMessage: null,
      },
    });

    console.log(`[jd-extraction] Completed for role ${roleId}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[jd-extraction] Failed for role ${roleId}:`, msg);

    await prisma.jdCrux.update({
      where: { roleId },
      data: {
        status: PrismaJdCruxStatus.failed,
        errorMessage: msg.slice(0, 2000),
      },
    });
  }
}

/**
 * Get the extracted JD crux for a role. Returns null if not yet extracted.
 */
export async function getJdCrux(roleId: string) {
  return prisma.jdCrux.findUnique({
    where: { roleId },
    select: {
      id: true,
      roleId: true,
      status: true,
      keySkills: true,
      niceToHaveSkills: true,
      mustHaves: true,
      qualifications: true,
      seniorityLevel: true,
      experienceMin: true,
      experienceMax: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
      // Deliberately omit rawText and errorMessage from public reads
    },
  });
}

// ── Helpers ─────────────────────────────────────────────────

function buildFallbackJdText(role: {
  title: string;
  description: string;
  skills: string[];
  experienceMin: number;
  experienceMax: number;
}): string {
  const parts = [
    `Title: ${role.title}`,
    `\nDescription:\n${role.description}`,
  ];
  if (role.skills.length > 0) {
    parts.push(`\nSkills: ${role.skills.join(', ')}`);
  }
  parts.push(`\nExperience: ${role.experienceMin}-${role.experienceMax} years`);
  return parts.join('\n');
}

function parseExtractionResponse(content: string): JdCruxData {
  // Strip markdown code fences if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`LLM returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  return {
    keySkills: Array.isArray(parsed.keySkills) ? parsed.keySkills.map(String) : [],
    niceToHaveSkills: Array.isArray(parsed.niceToHaveSkills)
      ? parsed.niceToHaveSkills.map(String)
      : [],
    mustHaves: Array.isArray(parsed.mustHaves) ? parsed.mustHaves.map(String) : [],
    qualifications: Array.isArray(parsed.qualifications) ? parsed.qualifications.map(String) : [],
    seniorityLevel: typeof parsed.seniorityLevel === 'string' ? parsed.seniorityLevel : null,
    experienceMin:
      typeof parsed.experienceMin === 'number' ? Math.round(parsed.experienceMin) : null,
    experienceMax:
      typeof parsed.experienceMax === 'number' ? Math.round(parsed.experienceMax) : null,
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
  };
}
