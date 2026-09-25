import type { CompanySize } from '../enums/company.js';
import type { ReputationTier } from '../enums/reputation.js';

/**
 * Shared profile DTOs.
 *
 * These describe what the API sends to the client — NOT the DB row. In
 * particular:
 *   - PAN and bank account number are ALWAYS masked on the wire
 *     (XXXXXX1234), never the raw decrypted value.
 *   - IFSC is returned in plaintext because IFSC codes are public routing
 *     codes (non-sensitive) — encryption at rest is purely defense-in-depth.
 *   - Wallet balances are serialized as strings because Prisma's Decimal
 *     can exceed JavaScript's safe integer range for large ledgers and we
 *     want downstream consumers to handle money with a decimal library
 *     rather than a lossy float.
 */
export interface RecruiterProfileResponse {
  id: string;
  userId: string;

  // Basic
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  specializations: string[];
  linkedinUrl: string | null;

  // Country / currency
  country: string;
  currency: string;

  // Sensitive — masked (never raw)
  panMasked: string | null;
  bankAccountMasked: string | null;
  bankIfsc: string | null;
  bankAccountHolderName: string | null;
  hasBankDetails: boolean;

  // Wallet (string-serialised from Decimal)
  walletBalance: string;
  lockedBalance: string;

  // Reputation
  reputationScore: number;
  reputationTier: ReputationTier;
  totalPlacements: number;
  successfulPlacements: number;

  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfileResponse {
  id: string;
  userId: string;
  companyName: string;
  industry: string | null;
  companySize: CompanySize | null;
  website: string | null;
  logoUrl: string | null;
  description: string | null;
  foundedYear: number | null;
  headquarters: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  gstNumber: string | null;
  country: string;
  currency: string;
  defaultCommissionPct: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request payloads — re-exported so the web app can type its forms
 * identically to the server's Zod schemas.
 */
export interface UpdateRecruiterProfileInput {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  yearsOfExperience?: number | null;
  specializations?: string[];
  linkedinUrl?: string | null;
  country?: string;
  currency?: string;
}

export interface UpdateRecruiterBankDetailsInput {
  pan: string;
  bankAccount: string;
  bankIfsc: string;
  bankAccountHolderName: string;
}

export interface UpdateCompanyProfileInput {
  companyName?: string;
  industry?: string | null;
  companySize?: CompanySize | null;
  website?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  foundedYear?: number | null;
  headquarters?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  gstNumber?: string | null;
  country?: string;
  currency?: string;
  defaultCommissionPct?: number | null;
}
