import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from './app-error.js';

/**
 * AES-256-GCM authenticated encryption.
 *
 * Output format: `<iv_b64>:<authTag_b64>:<ciphertext_b64>`
 *   - iv      : 12 random bytes per call (NIST recommended GCM IV size)
 *   - authTag : 16 bytes
 *   - ciphertext : variable length
 *
 * Used for PAN + bank details in RecruiterProfile. Raw values are NEVER
 * exposed over the API — see maskPan / maskBankAccount for display.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = Buffer.from(env.ENCRYPTION_KEY, 'base64');
  if (key.length !== 32) {
    throw AppError.internal('ENCRYPTION_KEY must decode to exactly 32 bytes');
  }
  return key;
}

export function encrypt(plaintext: string): string {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw AppError.badRequest('Cannot encrypt empty value');
  }
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decrypt(payload: string): string {
  if (typeof payload !== 'string' || !payload.includes(':')) {
    throw AppError.internal('Invalid encrypted payload format');
  }
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw AppError.internal('Invalid encrypted payload format');
  }
  const [ivB64, tagB64, cipherB64] = parts as [string, string, string];
  const key = getKey();
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(cipherB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

/**
 * Masks a PAN as `XXXXXX1234` — keeps the last 4 chars visible.
 * Indian PAN is 10 chars (AAAPL1234C) → output: XXXXXX234C
 */
export function maskPan(pan: string | null | undefined): string | null {
  if (!pan) return null;
  const trimmed = pan.trim();
  if (trimmed.length <= 4) return 'X'.repeat(trimmed.length);
  return 'X'.repeat(trimmed.length - 4) + trimmed.slice(-4);
}

/**
 * Masks a bank account number as `XXXXXXXX1234` — keeps the last 4 digits visible.
 */
export function maskBankAccount(acct: string | null | undefined): string | null {
  if (!acct) return null;
  const trimmed = acct.trim();
  if (trimmed.length <= 4) return 'X'.repeat(trimmed.length);
  return 'X'.repeat(trimmed.length - 4) + trimmed.slice(-4);
}

/**
 * Convenience: encrypts only when value is a non-empty string, returns null otherwise.
 */
export function encryptOptional(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  return encrypt(value);
}

/**
 * Convenience: decrypts only when value is non-null/empty.
 */
export function decryptOptional(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  return decrypt(value);
}
