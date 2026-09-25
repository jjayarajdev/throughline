import type { Submission as PrismaSubmission } from '@prisma/client';
import {
  Prisma,
  RoleStatus as PrismaRoleStatus,
  SubmissionStatus as PrismaSubmissionStatus,
  UserRole as PrismaUserRole,
} from '@prisma/client';
import type {
  CvDownloadResponse,
  ListRecruiterSubmissionsFilters,
  ListRoleSubmissionsFilters,
  SubmissionDetailResponse,
  SubmissionListItem,
  SubmissionResponse,
  SubmissionStatus,
  SubmissionStatusEventResponse,
  UserRole,
} from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import { AppError } from '../lib/app-error.js';
import {
  canonicalizeEmail,
  canonicalizePhone,
  computeFingerprint,
} from '../lib/dedup-hash.js';
import * as s3Service from './s3.service.js';
import type { CreateSubmissionBody } from '../validators/submission.js';

/**
 * Submission service — Phase 2 Wave 2.
 *
 * The create path is the most race-sensitive code we've written so
 * far. The key invariants, in the order the transaction enforces them:
 *
 *   1. Recruiter ownership of the s3Key — the s3Key must live under
 *      `cv/${recruiterId}/`. A forged s3Key that points at another
 *      recruiter's upload is a 403.
 *
 *   2. Role active + per-role cap not exceeded — checked with a
 *      conditional Prisma update (`where: { status: 'active',
 *      submissionsCount: { lt: maxSubmissions } }`) so two
 *      simultaneous submitters can't both push over the cap.
 *
 *   3. Per-recruiter cap not exceeded — this one is inside the TX
 *      but between the optimistic role update and the submission
 *      create. We accept a tiny race window (two concurrent submits
 *      from the same recruiter at exactly N-1 submissions), trading
 *      it for a simpler SQL plan. Founder-accepted.
 *
 *   4. Dedup — per-role uniqueness on
 *      `(role_id, candidate_fingerprint)` enforced by a DB unique
 *      index. We pre-check before the S3 verify to avoid wasting a
 *      round-trip on a known-duplicate candidate, then catch P2002
 *      inside the TX as a race guard.
 *
 *   5. S3 magic-byte verify — AFTER all cheap checks, before the row
 *      is written. If ANY step after this point throws, we
 *      fire-and-forget `s3Service.deleteObject` to clean up the
 *      orphaned bytes.
 *
 *   6. Auto-close on cap — if this insert drives submissionsCount to
 *      maxSubmissions, close the role in the same TX and stamp
 *      `closedAt`.
 *
 *   7. Initial StatusEvent row — the timeline always has a starting
 *      event so Wave 3's timeline UI doesn't need a special case.
 */

// --------------------------------------------------------------------
// Projection
// --------------------------------------------------------------------

function projectSubmission(row: PrismaSubmission): SubmissionResponse {
  return {
    id: row.id,
    roleId: row.roleId,
    recruiterId: row.recruiterId,
    candidateName: row.candidateName,
    candidateEmail: row.candidateEmail,
    candidatePhone: row.candidatePhone,
    cvOriginalFilename: row.cvOriginalFilename,
    cvSizeBytes: row.cvSizeBytes,
    cvMimeType: row.cvMimeType,
    coverNote: row.coverNote,
    expectedCtc: row.expectedCtc.toString(),
    noticePeriodDays: row.noticePeriodDays,
    currentLocation: row.currentLocation,
    currentCompany: row.currentCompany,
    status: row.status as unknown as SubmissionStatus,
    acceptedCtc: row.acceptedCtc ? row.acceptedCtc.toString() : null,
    finalPayout: row.finalPayout ? row.finalPayout.toString() : null,
    contactViewedByCompany: row.contactViewedByCompany,
    contactViewedAt: row.contactViewedAt
      ? row.contactViewedAt.toISOString()
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    // Intentionally omitted from the DTO: cvS3Key (W3 proxies
    // downloads via a pre-signed URL), candidateFingerprint (internal
    // dedup only, never surfaced).
  };
}

// --------------------------------------------------------------------
// Scope helpers
// --------------------------------------------------------------------

/**
 * Resolve the `RecruiterProfile.id` for a given user id. Mirrors
 * `resolveCompanyId` in role.service — recruiter users always have a
 * recruiter profile, so a missing row is a 500.
 */
export async function resolveRecruiterId(userId: string): Promise<string> {
  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw AppError.internal(
      'Recruiter profile missing for authenticated recruiter user',
    );
  }
  return profile.id;
}

/** Resolve recruiter profile ID + country for the authenticated user. */
export async function resolveRecruiterProfile(
  userId: string,
): Promise<{ id: string; country: string }> {
  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId },
    select: { id: true, country: true },
  });
  if (!profile) {
    throw AppError.internal(
      'Recruiter profile missing for authenticated recruiter user',
    );
  }
  return profile;
}

export async function resolveCompanyIdForUser(userId: string): Promise<string> {
  const profile = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw AppError.internal(
      'Company profile missing for authenticated company user',
    );
  }
  return profile.id;
}

// --------------------------------------------------------------------
// Create
// --------------------------------------------------------------------

export async function createSubmission(
  userId: string,
  input: CreateSubmissionBody,
): Promise<SubmissionResponse> {
  const recruiterId = await resolveRecruiterId(userId);

  // (1) Normalize candidate identifiers, compute dedup fingerprint.
  // `canonicalizePhone` throws AppError.badRequest on unparseable /
  // missing-country-code input — the 400 surfaces directly.
  const canonicalEmail = canonicalizeEmail(input.candidateEmail);
  const e164Phone = canonicalizePhone(input.candidatePhone);
  const fingerprint = computeFingerprint(canonicalEmail, e164Phone);

  // (2) s3Key ownership check. The client can only reference uploads
  // that were signed for *this* recruiter.
  const keyPrefix = `cv/${recruiterId}/`;
  if (!input.s3Key.startsWith(keyPrefix)) {
    throw AppError.forbidden(
      'Upload reference does not belong to this recruiter',
    );
  }

  // (3) Load role + assert active + per-role cap + visibility.
  const role = await prisma.role.findUnique({
    where: { id: input.roleId },
    select: {
      id: true,
      status: true,
      visibility: true,
      companyId: true,
      maxSubmissions: true,
      maxPerRecruiter: true,
      submissionsCount: true,
    },
  });
  if (!role) {
    throw AppError.notFound('Role not found');
  }
  if (role.status !== PrismaRoleStatus.published) {
    throw AppError.conflict(
      `Role is not accepting submissions (status: ${role.status}).`,
    );
  }
  if (role.submissionsCount >= role.maxSubmissions) {
    throw AppError.conflict(
      'This role has reached its submission cap and is no longer accepting candidates.',
    );
  }

  // (3b) Visibility gate — reject if recruiter not authorized for this role.
  if (role.visibility === 'preferred') {
    // Recruiter must have >= 1 joined submission with this company (any role).
    const hasPlacement = await prisma.submission.findFirst({
      where: {
        recruiterId,
        status: PrismaSubmissionStatus.joined,
        role: { companyId: role.companyId },
      },
      select: { id: true },
    });
    if (!hasPlacement) {
      throw AppError.forbidden(
        'This role is restricted to recruiters who have previously placed candidates with this company.',
      );
    }
  } else if (role.visibility === 'invite_only') {
    // Recruiter must have an accepted invitation for this specific role.
    const hasInvitation = await prisma.roleInvitation.findFirst({
      where: {
        roleId: role.id,
        recruiterProfileId: recruiterId,
        status: 'accepted',
      },
      select: { id: true },
    });
    if (!hasInvitation) {
      throw AppError.forbidden(
        'This role is invite-only. You need an accepted invitation to submit candidates.',
      );
    }
  }

  // (4) Pre-check dedup. The unique index is the source of truth
  // (handled inside the TX via P2002), but this saves the S3
  // verification round-trip on duplicates.
  const existing = await prisma.submission.findUnique({
    where: {
      roleId_candidateFingerprint: {
        roleId: role.id,
        candidateFingerprint: fingerprint,
      },
    },
    select: { id: true },
  });
  if (existing) {
    throw AppError.conflict(
      'A candidate with this email and phone has already been submitted to this role.',
    );
  }

  // (5) Per-recruiter cap (active + non-withdrawn only).
  const myExistingCount = await prisma.submission.count({
    where: {
      roleId: role.id,
      recruiterId,
      NOT: { status: PrismaSubmissionStatus.withdrawn },
    },
  });
  if (myExistingCount >= role.maxPerRecruiter) {
    throw AppError.badRequest(
      `You've already submitted ${myExistingCount} candidates to this role (max ${role.maxPerRecruiter}).`,
    );
  }

  // (6) S3 verification — any failure here is a straight 400; no
  // rollback needed yet because no row is written.
  await s3Service.verifyUploadedObject(
    input.s3Key,
    input.cvSizeBytes,
    input.cvMimeType,
  );

  // (7) Transactional write. Anything that throws beyond this point
  // triggers the S3 cleanup in the catch block below.
  let submission: PrismaSubmission;
  try {
    submission = await prisma.$transaction(async (tx) => {
      // Conditional counter bump — the `where` filter doubles as a
      // race guard against concurrent submits hitting the cap.
      let updatedRole;
      try {
        updatedRole = await tx.role.update({
          where: {
            id: role.id,
            status: PrismaRoleStatus.published,
            submissionsCount: { lt: role.maxSubmissions },
          },
          data: {
            submissionsCount: { increment: 1 },
            // Phase 12: Set firstSubmissionAt only on the very first submission
            ...(role.submissionsCount === 0 ? { firstSubmissionAt: new Date() } : {}),
          },
          select: {
            id: true,
            submissionsCount: true,
            maxSubmissions: true,
          },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2025'
        ) {
          throw AppError.conflict(
            'This role just reached its submission cap — please try a different role.',
          );
        }
        throw err;
      }

      let created: PrismaSubmission;
      try {
        created = await tx.submission.create({
          data: {
            roleId: role.id,
            recruiterId,
            candidateName: input.candidateName,
            candidateEmail: canonicalEmail,
            candidatePhone: e164Phone,
            candidateFingerprint: fingerprint,
            cvS3Key: input.s3Key,
            cvOriginalFilename: input.cvOriginalFilename,
            cvSizeBytes: input.cvSizeBytes,
            cvMimeType: input.cvMimeType,
            coverNote:
              input.coverNote === undefined ? null : input.coverNote,
            expectedCtc: new Prisma.Decimal(input.expectedCtc),
            noticePeriodDays: input.noticePeriodDays,
            currentLocation:
              input.currentLocation === undefined
                ? null
                : input.currentLocation,
            currentCompany:
              input.currentCompany === undefined
                ? null
                : input.currentCompany,
            status: PrismaSubmissionStatus.submitted,
            // Phase 16: Store AI match score if provided
            ...(input.matchScore !== undefined ? { matchScore: input.matchScore } : {}),
            ...(input.matchBreakdown !== undefined ? { matchBreakdown: input.matchBreakdown } : {}),
            ...(input.matchExplanation !== undefined ? { matchExplanation: input.matchExplanation } : {}),
          },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          throw AppError.conflict(
            'A candidate with this email and phone has already been submitted to this role.',
          );
        }
        throw err;
      }

      // Initial timeline event — same status from/to is our convention
      // for "submission created" (see SubmissionStatusEvent doc in
      // packages/types/src/interfaces/submission.ts).
      await tx.submissionStatusEvent.create({
        data: {
          submissionId: created.id,
          fromStatus: PrismaSubmissionStatus.submitted,
          toStatus: PrismaSubmissionStatus.submitted,
          actorUserId: userId,
          actorRole: PrismaUserRole.recruiter,
        },
      });

      // Phase 12: Update recruiter lastSubmissionAt
      await tx.recruiterProfile.update({
        where: { id: recruiterId },
        data: { lastSubmissionAt: new Date() },
      });

      // Auto-close when the per-role cap is hit. Single extra UPDATE
      // inside the same TX so the cap + close are observed together.
      if (updatedRole.submissionsCount >= updatedRole.maxSubmissions) {
        await tx.role.update({
          where: { id: role.id },
          data: {
            status: PrismaRoleStatus.closed,
            closedAt: new Date(),
          },
        });
      }

      return created;
    });
  } catch (err) {
    // Orphaned S3 object cleanup. Fire-and-forget — deleteObject
    // swallows its own errors so we never mask the original failure.
    void s3Service.deleteObject(input.s3Key);
    throw err;
  }

  return projectSubmission(submission);
}

// --------------------------------------------------------------------
// Read
// --------------------------------------------------------------------

export async function getSubmissionById(
  submissionId: string,
  viewer: { userId: string; role: UserRole },
): Promise<SubmissionDetailResponse> {
  const row = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      role: {
        select: { companyId: true },
      },
    },
  });
  if (!row) {
    throw AppError.notFound('Submission not found');
  }

  const roleSelect = {
    id: true,
    title: true,
    status: true,
    roleType: true,
    payoutType: true,
    shortlistPayoutValue: true,
    shortlistPayoutMode: true,
    hirePayoutValue: true,
    hirePayoutMode: true,
    company: { select: { companyName: true } },
  } as const;

  if (viewer.role === 'admin') {
    const enriched = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        statusEvents: { orderBy: { createdAt: 'asc' } },
        role: { select: roleSelect },
      },
    });
    if (!enriched) {
      throw AppError.notFound('Submission not found');
    }
    return projectSubmissionDetail(enriched);
  }

  if (viewer.role === 'recruiter') {
    const myRecruiterId = await resolveRecruiterId(viewer.userId);
    if (row.recruiterId !== myRecruiterId) {
      throw AppError.notFound('Submission not found');
    }
    const enriched = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        statusEvents: { orderBy: { createdAt: 'asc' } },
        role: { select: roleSelect },
      },
    });
    if (!enriched) {
      throw AppError.notFound('Submission not found');
    }
    return projectSubmissionDetail(enriched);
  }

  // company
  const myCompanyId = await resolveCompanyIdForUser(viewer.userId);
  if (row.role.companyId !== myCompanyId) {
    throw AppError.notFound('Submission not found');
  }

  const enriched = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      statusEvents: { orderBy: { createdAt: 'asc' } },
      role: { select: roleSelect },
    },
  });
  if (!enriched) {
    throw AppError.notFound('Submission not found');
  }
  return projectSubmissionDetail(enriched);
}

// --------------------------------------------------------------------
// List — recruiter's own submissions
// --------------------------------------------------------------------

export interface ListSubmissionsResult {
  items: SubmissionListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export async function listRecruiterSubmissions(
  userId: string,
  filters: ListRecruiterSubmissionsFilters,
): Promise<ListSubmissionsResult> {
  const recruiterId = await resolveRecruiterId(userId);

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.SubmissionWhereInput = {
    recruiterId,
    ...(filters.roleId !== undefined ? { roleId: filters.roleId } : {}),
    ...(filters.status !== undefined
      ? { status: filters.status as unknown as PrismaSubmissionStatus }
      : {}),
  };

  if (filters.search?.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { candidateName: { contains: term, mode: 'insensitive' } },
      { role: { title: { contains: term, mode: 'insensitive' } } },
      { role: { company: { companyName: { contains: term, mode: 'insensitive' } } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        role: {
          select: {
            id: true,
            title: true,
            company: { select: { companyName: true } },
          },
        },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    items: rows.map((row) => projectSubmissionListItem(row, {
      id: row.role.id,
      title: row.role.title,
      companyName: row.role.company.companyName,
    })),
    page,
    pageSize,
    total,
  };
}

// --------------------------------------------------------------------
// List — company's submissions for a specific role
// --------------------------------------------------------------------

export async function listRoleSubmissions(
  userId: string,
  roleId: string,
  filters: ListRoleSubmissionsFilters,
): Promise<ListSubmissionsResult> {
  const companyId = await resolveCompanyIdForUser(userId);

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { id: true, companyId: true },
  });
  if (!role || role.companyId !== companyId) {
    throw AppError.notFound('Role not found');
  }

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.SubmissionWhereInput = {
    roleId,
    ...(filters.status !== undefined
      ? { status: filters.status as unknown as PrismaSubmissionStatus }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        recruiter: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    items: rows.map((row) => projectSubmissionListItem(row, undefined, {
      id: row.recruiter.id,
      name: row.recruiter.fullName,
    })),
    page,
    pageSize,
    total,
  };
}

// --------------------------------------------------------------------
// Download CV (company only)
// --------------------------------------------------------------------

export async function downloadCv(
  userId: string,
  submissionId: string,
  viewerRole: 'company' | 'recruiter',
): Promise<CvDownloadResponse> {
  const row = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      role: { select: { companyId: true } },
    },
  });

  if (viewerRole === 'recruiter') {
    const recruiterId = await resolveRecruiterId(userId);
    if (!row || row.recruiterId !== recruiterId) {
      throw AppError.notFound('Submission not found');
    }
  } else {
    const companyId = await resolveCompanyIdForUser(userId);
    if (!row || row.role.companyId !== companyId) {
      throw AppError.notFound('Submission not found');
    }

    // Record first contact view (company only)
    if (!row.contactViewedByCompany) {
      await prisma.$transaction([
        prisma.submission.update({
          where: { id: submissionId },
          data: {
            contactViewedByCompany: true,
            contactViewedAt: new Date(),
          },
        }),
        prisma.auditLog.create({
          data: {
            userId,
            action: 'company_viewed_contact',
            entityType: 'submission',
            entityId: submissionId,
            metadata: {
              candidateName: row.candidateName,
              candidateEmail: row.candidateEmail,
            },
          },
        }),
      ]);
    }
  }

  const { downloadUrl, expiresAt } = await s3Service.createDownloadUrl(
    row!.cvS3Key,
  );

  return {
    downloadUrl,
    expiresAt,
    filename: row!.cvOriginalFilename,
  };
}

// --------------------------------------------------------------------
// Projections (list + detail)
// --------------------------------------------------------------------

function projectSubmissionListItem(
  row: PrismaSubmission,
  role?: { id: string; title: string; companyName: string },
  recruiter?: { id: string; name: string },
): SubmissionListItem {
  return {
    id: row.id,
    candidateName: row.candidateName,
    candidateEmail: row.candidateEmail,
    status: row.status as unknown as SubmissionStatus,
    cvOriginalFilename: row.cvOriginalFilename,
    expectedCtc: row.expectedCtc.toString(),
    noticePeriodDays: row.noticePeriodDays,
    contactViewedByCompany: row.contactViewedByCompany,
    createdAt: row.createdAt.toISOString(),
    ...(role ? { role } : {}),
    ...(recruiter ? { recruiter } : {}),
  };
}

export type SubmissionWithRoleAndEvents = PrismaSubmission & {
  role: {
    id: string;
    title: string;
    status: string;
    roleType: string;
    payoutType: string;
    shortlistPayoutValue: Prisma.Decimal | null;
    shortlistPayoutMode: string | null;
    hirePayoutValue: Prisma.Decimal | null;
    hirePayoutMode: string | null;
    company: { companyName: string };
  };
  statusEvents: Array<{
    id: string;
    submissionId: string;
    fromStatus: string;
    toStatus: string;
    actorUserId: string;
    actorRole: string;
    reason: string | null;
    metadata: unknown;
    createdAt: Date;
  }>;
};

export function projectSubmissionDetail(
  row: SubmissionWithRoleAndEvents,
): SubmissionDetailResponse {
  return {
    ...projectSubmission(row),
    role: {
      id: row.role.id,
      title: row.role.title,
      companyName: row.role.company.companyName,
      roleType: row.role.roleType,
      status: row.role.status,
      payoutType: row.role.payoutType,
      shortlistPayoutValue: row.role.shortlistPayoutValue?.toString() ?? null,
      shortlistPayoutMode: row.role.shortlistPayoutMode ?? null,
      hirePayoutValue: row.role.hirePayoutValue?.toString() ?? null,
      hirePayoutMode: row.role.hirePayoutMode ?? null,
    },
    statusEvents: row.statusEvents.map(
      (e): SubmissionStatusEventResponse => ({
        id: e.id,
        submissionId: e.submissionId,
        fromStatus: e.fromStatus as unknown as SubmissionStatus,
        toStatus: e.toStatus as unknown as SubmissionStatus,
        actorUserId: e.actorUserId,
        actorRole: e.actorRole as unknown as UserRole,
        reason: e.reason,
        metadata: (e.metadata as Record<string, unknown>) ?? null,
        createdAt: e.createdAt.toISOString(),
      }),
    ),
  };
}
