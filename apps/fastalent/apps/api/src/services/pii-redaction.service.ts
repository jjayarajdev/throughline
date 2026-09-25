/**
 * PII redaction — Phase 16.
 *
 * Strips personally identifiable information from document text before
 * sending to an external LLM provider. The goal is to prevent candidate
 * PII from leaking to third-party APIs.
 *
 * Strategy:
 *   1. Known values — the recruiter provides candidate name, email, phone
 *      in the submission form. We replace exact matches first.
 *   2. Pattern-based — catch any remaining emails, phone numbers, and
 *      common address/ID patterns that the known values might miss.
 */

export interface PiiRedactionInput {
  text: string;
  /** Known candidate name from the submission form. */
  knownName?: string;
  /** Known candidate email from the submission form. */
  knownEmail?: string;
  /** Known candidate phone from the submission form. */
  knownPhone?: string;
}

export interface PiiRedactionResult {
  redactedText: string;
  /** Count of replacements made, for audit/logging. */
  redactionCount: number;
}

// ── Patterns ────────────────────────────────────────────────

// Email: standard pattern
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Phone numbers: various formats (Indian + international)
// Matches: +91-9876543210, (091) 9876-543210, +1 (555) 123-4567, 9876543210, etc.
const PHONE_RE = /(?:\+?\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,5}[\s\-.]?\d{3,5}/g;

// Aadhaar number (Indian national ID): 12 digits with optional spaces/dashes
const AADHAAR_RE = /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g;

// PAN number (Indian tax ID): ABCDE1234F pattern
const PAN_RE = /\b[A-Z]{5}\d{4}[A-Z]\b/g;

// Passport number patterns (generic)
const PASSPORT_RE = /\b[A-Z]\d{7}\b/g;

// Street addresses — heuristic: line starting with number followed by common address words
const ADDRESS_LINE_RE = /\b\d+[,\s]+(?:(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Floor|Sector|Block|Plot|House|Flat|Apartment|Apt)[.,\s].*?)(?:\n|$)/gi;

/**
 * Redact PII from the given text.
 *
 * The approach is conservative — we'd rather over-redact than leak PII.
 * Replacement tokens are descriptive so the LLM can still reason about
 * document structure (e.g., "[CANDIDATE_NAME]" vs just "[REDACTED]").
 */
export function redactPii(input: PiiRedactionInput): PiiRedactionResult {
  let text = input.text;
  let count = 0;

  // 1. Known values first (exact + case-insensitive)
  if (input.knownName && input.knownName.trim().length > 1) {
    const name = input.knownName.trim();
    // Replace full name
    const nameRe = new RegExp(escapeRegex(name), 'gi');
    const nameMatches = text.match(nameRe);
    if (nameMatches) {
      count += nameMatches.length;
      text = text.replace(nameRe, '[CANDIDATE_NAME]');
    }

    // Also try individual name parts (first/last) if multi-word
    const parts = name.split(/\s+/).filter((p) => p.length > 2);
    for (const part of parts) {
      // Only replace standalone words (word boundary)
      const partRe = new RegExp(`\\b${escapeRegex(part)}\\b`, 'gi');
      const partMatches = text.match(partRe);
      if (partMatches) {
        count += partMatches.length;
        text = text.replace(partRe, '[NAME]');
      }
    }
  }

  if (input.knownEmail && input.knownEmail.trim().length > 0) {
    const emailRe = new RegExp(escapeRegex(input.knownEmail.trim()), 'gi');
    const emailMatches = text.match(emailRe);
    if (emailMatches) {
      count += emailMatches.length;
      text = text.replace(emailRe, '[EMAIL]');
    }
  }

  if (input.knownPhone && input.knownPhone.trim().length > 0) {
    // Normalize: strip all non-digit chars for comparison
    const digits = input.knownPhone.replace(/\D/g, '');
    if (digits.length >= 7) {
      // Replace any occurrence of these digits in various formats
      const phonePattern = digits.split('').join('[\\s\\-\\.]*');
      const phoneRe = new RegExp(phonePattern, 'g');
      const phoneMatches = text.match(phoneRe);
      if (phoneMatches) {
        count += phoneMatches.length;
        text = text.replace(phoneRe, '[PHONE]');
      }
    }
  }

  // 2. Pattern-based catch-all
  text = text.replace(EMAIL_RE, (match) => {
    // Skip if already redacted
    if (match.includes('[EMAIL]')) return match;
    count++;
    return '[EMAIL]';
  });

  text = text.replace(PHONE_RE, (match) => {
    // Only redact if it looks like a real phone (7+ digits)
    const digits = match.replace(/\D/g, '');
    if (digits.length < 7) return match;
    count++;
    return '[PHONE]';
  });

  text = text.replace(AADHAAR_RE, () => {
    count++;
    return '[AADHAAR]';
  });

  text = text.replace(PAN_RE, () => {
    count++;
    return '[PAN]';
  });

  text = text.replace(PASSPORT_RE, () => {
    count++;
    return '[PASSPORT]';
  });

  text = text.replace(ADDRESS_LINE_RE, () => {
    count++;
    return '[ADDRESS]\n';
  });

  return { redactedText: text, redactionCount: count };
}

// ── Helpers ─────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
