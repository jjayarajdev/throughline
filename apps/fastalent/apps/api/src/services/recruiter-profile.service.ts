import type { RecruiterProfile } from '@prisma/client';
import type {
  RecruiterProfileResponse,
  ReputationTier,
} from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import { AppError } from '../lib/app-error.js';
import {
  decryptOptional,
  encrypt,
  maskBankAccount,
  maskPan,
} from '../lib/crypto.js';
import type {
  UpdateRecruiterBankDetailsInput,
  UpdateRecruiterProfileInput,
} from '../validators/recruiter-profile.js';

/**
 * Recruiter profile service.
 *
 * Security-critical invariants:
 *   - Raw PAN and raw bank account MUST NEVER leave this module. Only the
 *     masked projections (XXXXXX1234) are emitted in the response DTOs.
 *   - AES-256-GCM encryption happens HERE, at the service boundary, so no
 *     handler or route accidentally persists a plaintext PII value.
 *   - `hasBankDetails` is computed server-side — the client needs this to
 *     decide whether to show a "Set up bank details" or "Update" CTA
 *     without ever learning the values.
 */

// ---------- projection ----------

function projectRecruiterProfile(
  row: RecruiterProfile,
): RecruiterProfileResponse {
  // Decrypt just long enough to mask — the cleartext never leaves this scope.
  const panPlain = decryptOptional(row.panEncrypted);
  const bankPlain = decryptOptional(row.bankAccountEncrypted);
  const ifscPlain = decryptOptional(row.bankIfscEncrypted);

  return {
    id: row.id,
    userId: row.userId,
    fullName: row.fullName,
    phone: row.phone,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    yearsOfExperience: row.yearsOfExperience,
    specializations: row.specializations ?? [],
    linkedinUrl: row.linkedinUrl,

    country: row.country,
    currency: row.currency,

    panMasked: maskPan(panPlain),
    bankAccountMasked: maskBankAccount(bankPlain),
    // IFSC is a public routing code — safe to return in plaintext for display.
    bankIfsc: ifscPlain,
    bankAccountHolderName: row.bankAccountHolderName,
    hasBankDetails: Boolean(
      row.panEncrypted && row.bankAccountEncrypted && row.bankIfscEncrypted,
    ),

    walletBalance: row.walletBalance.toString(),
    lockedBalance: row.lockedBalance.toString(),

    reputationScore: row.reputationScore,
    // Prisma's generated ReputationTier enum is byte-identical to the
    // @gigcruite/types enum — cast at the boundary per Wave 3 gotcha #2.
    reputationTier: row.reputationTier as ReputationTier,
    totalPlacements: row.totalPlacements,
    successfulPlacements: row.successfulPlacements,

    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------- read ----------

export async function getRecruiterProfile(
  userId: string,
): Promise<RecruiterProfileResponse> {
  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId },
  });
  if (!profile) {
    throw AppError.notFound('Recruiter profile not found');
  }
  return projectRecruiterProfile(profile);
}

// ---------- update general profile ----------

export async function updateRecruiterProfile(
  userId: string,
  input: UpdateRecruiterProfileInput,
): Promise<RecruiterProfileResponse> {
  // Ensure the row exists before we issue the update so we return a clean
  // 404 instead of a Prisma P2025 wrapped as 500.
  const existing = await prisma.recruiterProfile.findUnique({
    where: { userId },
  });
  if (!existing) {
    throw AppError.notFound('Recruiter profile not found');
  }

  // Prisma distinguishes `undefined` (skip field) from `null` (explicit clear).
  // Our validators already translate "" → null for optional string fields,
  // so we can pass them through directly.
  const updated = await prisma.recruiterProfile.update({
    where: { userId },
    data: {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.yearsOfExperience !== undefined
        ? { yearsOfExperience: input.yearsOfExperience }
        : {}),
      ...(input.specializations !== undefined
        ? { specializations: input.specializations }
        : {}),
      ...(input.linkedinUrl !== undefined
        ? { linkedinUrl: input.linkedinUrl }
        : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
    },
  });

  return projectRecruiterProfile(updated);
}

// ---------- update bank details (PII path) ----------

export async function updateRecruiterBankDetails(
  userId: string,
  input: UpdateRecruiterBankDetailsInput,
): Promise<RecruiterProfileResponse> {
  const existing = await prisma.recruiterProfile.findUnique({
    where: { userId },
  });
  if (!existing) {
    throw AppError.notFound('Recruiter profile not found');
  }

  // Encrypt each field with a fresh random IV (handled inside `encrypt`).
  const panEncrypted = encrypt(input.pan);
  const bankAccountEncrypted = encrypt(input.bankAccount);
  const bankIfscEncrypted = encrypt(input.bankIfsc);

  const updated = await prisma.recruiterProfile.update({
    where: { userId },
    data: {
      panEncrypted,
      bankAccountEncrypted,
      bankIfscEncrypted,
      bankAccountHolderName: input.bankAccountHolderName,
    },
  });

  return projectRecruiterProfile(updated);
}
