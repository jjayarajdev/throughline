import { createHash } from 'node:crypto';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { AppError } from './app-error.js';

/**
 * Candidate dedup fingerprint — Phase 2 Wave 2.
 *
 * We refuse "the same candidate, twice, to the same role" using a
 * per-role unique index on `(role_id, candidate_fingerprint)`. The
 * fingerprint is `SHA256(lowercaseEmail + '|' + E164Phone)`:
 *
 *   - Email is trimmed + lowercased so "Alice@X.com" and "alice@x.com"
 *     collide. Intentional — recruiters shouldn't be able to sneak the
 *     same candidate past with trivial case tricks.
 *
 *   - Phone is normalised to E.164 via libphonenumber-js with NO
 *     default country. If the caller doesn't include the country code
 *     we throw 400 — "+91 9876543210" valid, "9876543210" invalid.
 *     Founder directive: international-first, one source of truth.
 *
 *   - The separator `|` prevents concatenation ambiguity (otherwise
 *     "a@b.comxx" with phone "" would collide with "a@b.com" + "xx").
 */

export function canonicalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Parse a user-supplied phone string into E.164. Throws AppError.badRequest
 * if the string is unparseable, missing a country code, or fails
 * libphonenumber-js validity checks.
 */
export function canonicalizePhone(phone: string): string {
  const trimmed = typeof phone === 'string' ? phone.trim() : '';
  if (trimmed.length === 0) {
    throw AppError.badRequest(
      'Phone must include country code, e.g. +91 9876543210',
    );
  }
  // No default country — parsePhoneNumberFromString will refuse to
  // guess and return undefined for bare national numbers.
  const parsed = parsePhoneNumberFromString(trimmed);
  if (!parsed || !parsed.isValid()) {
    throw AppError.badRequest(
      'Phone must include country code, e.g. +91 9876543210',
    );
  }
  return parsed.number; // E.164 with leading `+`
}

export function computeFingerprint(
  canonicalEmail: string,
  e164Phone: string,
): string {
  return createHash('sha256')
    .update(canonicalEmail + '|' + e164Phone)
    .digest('hex');
}
