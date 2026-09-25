import type { RoleType, RoleStatus, PayoutType, PayoutMode, RoleVisibility } from '../enums/role.js';

/**
 * Allowed employment types. Stored as a plain string in the DB (no Prisma
 * enum — no migration needed to add a new entry). Validated at API + form
 * boundaries against this list.
 */
export const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'gig',
  'internship',
  'freelance',
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/** Human-readable labels for the form dropdown. */
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  gig: 'Gig',
  internship: 'Internship',
  freelance: 'Freelance',
};

/**
 * Shared Role DTOs.
 *
 * Numeric-money fields are serialised as STRINGS on the wire because the
 * server uses `Prisma.Decimal` which can exceed JS safe-integer range and
 * we want downstream consumers to use a decimal library rather than a
 * lossy float (same convention as wallet balances in profile.ts).
 */

/** Owner-facing (company) view of a role, including private stats. */
export interface RoleOwnerResponse {
  id: string;
  companyId: string;

  title: string;
  description: string;
  roleType: RoleType;
  status: RoleStatus;
  visibility: RoleVisibility;

  country: string;
  currency: string;

  location: string;
  isRemote: boolean;
  employmentType: string;

  experienceMin: number;
  experienceMax: number;
  skills: string[];

  ctcMin: string;
  ctcMax: string;

  payoutType: PayoutType;
  shortlistPayoutMode: PayoutMode | null;
  shortlistPayoutValue: string | null;
  hirePayoutMode: PayoutMode | null;
  hirePayoutValue: string | null;
  /** Platform commission percentage — null if not yet resolved. */
  platformCommissionPct: string | null;
  /** Vendor benchmark % snapshot — frozen at approve time for stable reporting. */
  vendorBenchmarkPct: string | null;

  maxSubmissions: number;
  maxPerRecruiter: number;
  openPositions: number;

  submissionsCount: number;
  shortlistedCount: number;
  hiredCount: number;

  /** JD (Job Description) document metadata — null if no JD attached. */
  jdOriginalFilename: string | null;
  jdSizeBytes: number | null;
  jdMimeType: string | null;

  /** Phase 12: When admin approved (published) this role. */
  publishedAt: string | null;
  /** Phase 12: When the first submission was received. */
  firstSubmissionAt: string | null;

  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public (recruiter) view of a published role. Recruiter-facing fields are a
 * subset — the company identity is shown as an embedded mini-object instead
 * of a raw `companyId`, and private stats are hidden.
 */
export interface RolePublicResponse {
  id: string;
  title: string;
  description: string;
  roleType: RoleType;
  status: RoleStatus;
  visibility: RoleVisibility;

  country: string;
  currency: string;

  location: string;
  isRemote: boolean;
  employmentType: string;

  experienceMin: number;
  experienceMax: number;
  skills: string[];

  ctcMin: string;
  ctcMax: string;

  payoutType: PayoutType;
  shortlistPayoutMode: PayoutMode | null;
  shortlistPayoutValue: string | null;
  hirePayoutMode: PayoutMode | null;
  hirePayoutValue: string | null;

  /** How many slots are still open on this role (derived on server). */
  slotsRemaining: number;
  openPositions: number;

  /** JD (Job Description) document metadata — null if no JD attached. */
  jdOriginalFilename: string | null;
  jdSizeBytes: number | null;
  jdMimeType: string | null;

  company: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    industry: string | null;
  };

  createdAt: string;
}

/** Request payload for POST /api/roles (company only). */
export interface CreateRoleInput {
  title: string;
  description: string;
  roleType: RoleType;
  visibility?: RoleVisibility;

  /** ISO 3166-1 alpha-2 country code. Defaults to company's country. */
  country?: string;

  location: string;
  isRemote: boolean;
  employmentType: string;

  experienceMin: number;
  experienceMax: number;
  skills: string[];

  /** Annual CTC, as a plain number on input (server will convert to Decimal). */
  ctcMin: number;
  ctcMax: number;

  payoutType: PayoutType;
  shortlistPayoutMode?: PayoutMode;
  shortlistPayoutValue?: number;
  hirePayoutMode?: PayoutMode;
  hirePayoutValue?: number;

  /** Defaults enforced server-side if omitted. */
  maxSubmissions?: number;
  maxPerRecruiter?: number;
  openPositions?: number;

  /** JD metadata — optional. Set after a successful upload via POST /upload/jd-intent. */
  jdS3Key?: string;
  jdOriginalFilename?: string;
  jdSizeBytes?: number;
  jdMimeType?: string;
}

/**
 * Request payload for PATCH /api/roles/:id (company only).
 * Only allowed while role.status is draft, rejected, or paused — enforced server-side.
 */
export type UpdateRoleInput = Partial<CreateRoleInput>;

/** Filters accepted by GET /api/roles/me (company's own roles). */
export interface ListOwnerRolesFilters {
  status?: RoleStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Body for POST /api/upload/jd-intent (company only). */
export interface JdUploadIntentInput {
  filename: string;
  sizeBytes: number;
  mimeType: string;
}

/** Response body for POST /api/upload/jd-intent. */
export interface JdUploadIntentResponse {
  uploadUrl: string;
  s3Key: string;
  expiresAt: string;
}

/** Response body for POST /api/roles/:id/jd-download. */
export interface JdDownloadResponse {
  downloadUrl: string;
  expiresAt: string;
  filename: string;
}

/** Filters accepted by GET /api/roles (public recruiter browsing). */
export interface ListPublicRolesFilters {
  search?: string;
  roleType?: RoleType;
  skills?: string[];
  minCtc?: number;
  maxCtc?: number;
  isRemote?: boolean;
  employmentType?: string;
  /** Filter by status (published/filled). Omit for default (published + filled). */
  status?: RoleStatus;
  /** Cursor = last role id seen (created-at descending). */
  cursor?: string;
  pageSize?: number;
}

/** Admin view of a role for review queue. */
export interface RoleAdminResponse extends RoleOwnerResponse {
  company: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    industry: string | null;
    defaultCommissionPct: string | null;
  };
}

/** Role status history entry. */
export interface RoleStatusHistoryEntry {
  id: string;
  fromStatus: RoleStatus | null;
  toStatus: RoleStatus;
  changedBy: string;
  changedByEmail?: string;
  changedByName?: string;
  comment: string | null;
  createdAt: string;
}

/** Country config DTO. */
export interface CountryConfigResponse {
  id: string;
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string | null;
  shortlistFlatMin: string;
  shortlistFlatMax: string;
  shortlistPctMin: string;
  shortlistPctMax: string;
  hireFlatMin: string;
  hireFlatMax: string;
  hirePctMin: string;
  hirePctMax: string;
  vendorBenchmarkPct: string;
  isActive: boolean;
}

/** Input for creating/updating a country config. */
export interface CountryConfigInput {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencySymbol?: string | null;
  shortlistFlatMin: number;
  shortlistFlatMax: number;
  shortlistPctMin: number;
  shortlistPctMax: number;
  hireFlatMin: number;
  hireFlatMax: number;
  hirePctMin: number;
  hirePctMax: number;
  vendorBenchmarkPct: number;
  isActive?: boolean;
}

/** Savings dashboard response. */
export interface SavingsResponse {
  totalHires: number;
  totalAcceptedCtc: string;
  vendorBenchmarkPct: string;
  traditionalCost: string;
  actualCost: string;
  savings: string;
  savingsPct: string;
  currency: string;
  currencySymbol: string | null;
  perRoleBreakdown: SavingsRoleBreakdown[];
}

export interface SavingsRoleBreakdown {
  roleId: string;
  roleTitle: string;
  hires: number;
  totalCtc: string;
  traditionalCost: string;
  actualCost: string;
  saved: string;
  /** Per-role frozen benchmark % (from approve time). */
  vendorBenchmarkPct: string;
}
