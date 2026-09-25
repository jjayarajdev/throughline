import type { SubmissionStatus } from '../enums/submission.js';
import type { UserRole } from '../enums/user.js';

/**
 * Shared Submission DTOs.
 *
 * Monetary fields are serialized as strings (Decimal convention). The CV
 * itself is delivered as a pre-signed download URL from a separate endpoint
 * (`POST /api/submissions/:id/download`); the URL is NEVER embedded in the
 * main submission DTO because it has a short expiry and is audit-logged on
 * issuance.
 *
 * Candidate contact info (`candidateEmail`, `candidatePhone`) is returned
 * in full to the company from the moment the submission lands — PII
 * redaction is explicitly out of scope for Phase 2 (founder decision). We
 * still emit a `company_viewed_contact` audit event the first time the
 * company reads the submission so a feature flag can be wired later.
 */
export interface SubmissionResponse {
  id: string;
  roleId: string;
  recruiterId: string;

  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;

  cvOriginalFilename: string;
  cvSizeBytes: number;
  cvMimeType: string;

  coverNote: string | null;

  expectedCtc: string;
  noticePeriodDays: number;
  currentLocation: string | null;
  currentCompany: string | null;

  status: SubmissionStatus;

  /** Set on transition to `hired`. Null until then. */
  acceptedCtc: string | null;
  /** Frozen at Hire time. Null for per-shortlist-only roles. */
  finalPayout: string | null;

  contactViewedByCompany: boolean;
  contactViewedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * Body for POST /api/submissions (recruiter only).
 *
 * The actual CV bytes are not in this payload — the recruiter first hits
 * POST /api/upload/cv-intent, uploads directly to S3 via pre-signed URL,
 * then references the returned `s3Key` (plus the metadata the server
 * validated at intent time) here.
 */
export interface CreateSubmissionInput {
  roleId: string;

  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;

  /** The s3Key returned by POST /api/upload/cv-intent. Server re-validates. */
  s3Key: string;
  cvOriginalFilename: string;
  cvSizeBytes: number;
  cvMimeType: string;

  coverNote?: string | null;

  expectedCtc: number;
  noticePeriodDays: number;
  currentLocation?: string | null;
  currentCompany?: string | null;

  /** Phase 16: AI match score (attached after pre-submit check). */
  matchScore?: number;
  matchBreakdown?: { skills: number; experience: number; qualifications: number };
  matchExplanation?: string;
}

/**
 * Audit row for a status transition. One row per transition — including
 * the implicit initial transition from `submitted` written at creation
 * (represented by from === to === SUBMITTED with actorRole === RECRUITER).
 */
export interface SubmissionStatusEventResponse {
  id: string;
  submissionId: string;
  fromStatus: SubmissionStatus;
  toStatus: SubmissionStatus;
  actorUserId: string;
  actorRole: UserRole;
  reason: string | null;
  /**
   * Transition metadata. Shape depends on `toStatus`:
   *   - hired: { acceptedCtc: string, finalPayout: string }
   *   - rejected / withdrawn: (optional) { reason: string }
   *   - others: null
   */
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

/** Body for POST /api/submissions/:id/status */
export interface TransitionSubmissionInput {
  toStatus: SubmissionStatus;
  reason?: string;
  /** Required when toStatus === HIRED — the accepted CTC used to compute payout. */
  acceptedCtc?: number;
}

/** Response body for POST /api/upload/cv-intent (recruiter only). */
export interface CvUploadIntentResponse {
  /** Pre-signed PUT URL, expires in 5 minutes. */
  uploadUrl: string;
  /** The S3 key the client should carry forward into POST /api/submissions. */
  s3Key: string;
  /** ISO timestamp — client should refuse to PUT after this. */
  expiresAt: string;
}

/** Body for POST /api/upload/cv-intent */
export interface CvUploadIntentInput {
  filename: string;
  sizeBytes: number;
  mimeType: string;
}

/** Response body for POST /api/submissions/:id/download (company only). */
export interface CvDownloadResponse {
  downloadUrl: string;
  expiresAt: string;
  filename: string;
}

/** Filters accepted by GET /api/submissions/me (recruiter's own submissions). */
export interface ListRecruiterSubmissionsFilters {
  roleId?: string;
  status?: SubmissionStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Filters accepted by GET /api/roles/:id/submissions (company-scoped). */
export interface ListRoleSubmissionsFilters {
  status?: SubmissionStatus;
  page?: number;
  pageSize?: number;
}

/**
 * Enriched submission detail — adds role context and status timeline
 * so detail views don't need extra round-trips.
 */
export interface SubmissionDetailResponse extends SubmissionResponse {
  role: {
    id: string;
    title: string;
    companyName: string;
    roleType: string;
    status: string;
    payoutType?: string;
    shortlistPayoutMode?: string | null;
    shortlistPayoutValue?: string | null;
    hirePayoutMode?: string | null;
    hirePayoutValue?: string | null;
  };
  statusEvents: SubmissionStatusEventResponse[];
}

/**
 * Lightweight submission DTO for list views — omits CV binary metadata
 * and large text fields to keep list payloads small.
 */
export interface SubmissionListItem {
  id: string;
  candidateName: string;
  candidateEmail: string;
  status: SubmissionStatus;
  cvOriginalFilename: string;
  expectedCtc: string;
  noticePeriodDays: number;
  contactViewedByCompany: boolean;
  createdAt: string;
  /** Present when the list caller is a recruiter (needs role context). */
  role?: {
    id: string;
    title: string;
    companyName: string;
  };
  /** Present when the list caller is a company (shows which recruiter submitted). */
  recruiter?: {
    id: string;
    name: string;
  };
}
