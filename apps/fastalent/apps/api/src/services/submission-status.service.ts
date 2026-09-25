import {
  Prisma,
  SubmissionStatus as PrismaSubmissionStatus,
  UserRole as PrismaUserRole,
} from '@prisma/client';
import type {
  SubmissionDetailResponse,
  SubmissionStatus,
  SubmissionStatusEventResponse,
  UserRole,
} from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import { AppError } from '../lib/app-error.js';
import {
  canTransition,
  requiresAcceptedCtc,
  TERMINAL_STATUSES,
} from '../lib/submission-state-machine.js';
import {
  resolveCompanyIdForUser,
  resolveRecruiterId,
  projectSubmissionDetail,
  type SubmissionWithRoleAndEvents,
} from './submission.service.js';
import * as earningService from './earning.service.js';
import type { TransitionSubmissionBody } from '../validators/submission.js';
import { notify } from '../lib/notify.js';
import { NotificationType } from '@gigcruite/types';

/**
 * Submission status transition service — Phase 2 Wave 4.
 *
 * Each transition is atomic (single Prisma $transaction). The service:
 *   1. Loads the submission + role for ownership check.
 *   2. Resolves the actor identity (company or recruiter).
 *   3. Validates the transition via the state machine.
 *   4. For `hired`: computes `finalPayout` from role payout config.
 *   5. TX: updates submission, inserts SubmissionStatusEvent, bumps role counters.
 *   6. Auto-fills the role if all submissions are terminal and hiredCount > 0.
 *   7. Returns the enriched SubmissionDetailResponse.
 */

export async function transitionStatus(
  userId: string,
  userRole: UserRole,
  submissionId: string,
  input: TransitionSubmissionBody,
): Promise<SubmissionDetailResponse> {
  const toStatus = input.toStatus as unknown as PrismaSubmissionStatus;

  // 1. Load submission + role
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      role: {
        select: {
          id: true,
          companyId: true,
          payoutType: true,
          shortlistPayoutValue: true,
          shortlistPayoutMode: true,
          hirePayoutValue: true,
          hirePayoutMode: true,
          platformCommissionPct: true,
          maxSubmissions: true,
          submissionsCount: true,
        },
      },
    },
  });
  if (!submission) {
    throw AppError.notFound('Submission not found');
  }

  // 2. Ownership check
  if (userRole === 'company') {
    const companyId = await resolveCompanyIdForUser(userId);
    if (submission.role.companyId !== companyId) {
      throw AppError.notFound('Submission not found');
    }
  } else if (userRole === 'recruiter') {
    const recruiterId = await resolveRecruiterId(userId);
    if (submission.recruiterId !== recruiterId) {
      throw AppError.notFound('Submission not found');
    }
  } else if (userRole !== 'admin') {
    throw AppError.forbidden('Insufficient role');
  }

  // 3. Validate transition
  const fromStatus = submission.status as unknown as SubmissionStatus;
  const result = canTransition(
    fromStatus,
    input.toStatus,
    userRole,
  );
  if (!result.allowed) {
    throw AppError.badRequest(result.reason ?? 'Invalid status transition');
  }

  // 4. Compute hire-specific fields
  let acceptedCtc: Prisma.Decimal | undefined;
  let finalPayout: Prisma.Decimal | undefined;

  if (requiresAcceptedCtc(input.toStatus)) {
    if (input.acceptedCtc === undefined || input.acceptedCtc === null) {
      throw AppError.badRequest(
        'acceptedCtc is required when transitioning to hired',
      );
    }
    acceptedCtc = new Prisma.Decimal(input.acceptedCtc);

    // Per-hire payout: flat amount or percentage of acceptedCtc.
    const role = submission.role;
    if (role.hirePayoutValue) {
      if (role.hirePayoutMode === 'percentage') {
        // percentage: acceptedCtc * hirePayoutValue / 100
        finalPayout = acceptedCtc!.mul(role.hirePayoutValue).div(100);
      } else {
        // flat: direct amount
        finalPayout = role.hirePayoutValue;
      }
    }
    // PER_SHORTLIST-only roles have no hire payout — finalPayout stays undefined.
  }

  // 5. Atomic transaction (Serializable — touches wallet balances)
  const enrichedRow = await prisma.$transaction(async (tx) => {
    // Update submission status + frozen hire fields
    await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: toStatus,
        ...(acceptedCtc !== undefined ? { acceptedCtc } : {}),
        ...(finalPayout !== undefined ? { finalPayout } : {}),
      },
    });

    // Insert status event
    const eventMetadata =
      input.toStatus === ('hired' as SubmissionStatus)
        ? {
            acceptedCtc: acceptedCtc!.toString(),
            ...(finalPayout !== undefined
              ? { finalPayout: finalPayout.toString() }
              : {}),
          }
        : input.reason
          ? { reason: input.reason }
          : Prisma.JsonNull;

    await tx.submissionStatusEvent.create({
      data: {
        submissionId,
        fromStatus: submission.status,
        toStatus,
        actorUserId: userId,
        actorRole: userRole as unknown as PrismaUserRole,
        reason: input.reason ?? null,
        metadata: eventMetadata,
        // Phase 12: Structured rejection reason for analytics
        ...(input.toStatus === ('rejected' as SubmissionStatus) && input.rejectionReason
          ? { rejectionReason: input.rejectionReason as any }
          : {}),
      },
    });

    // Bump role counters
    if (input.toStatus === ('shortlisted' as SubmissionStatus)) {
      await tx.role.update({
        where: { id: submission.roleId },
        data: { shortlistedCount: { increment: 1 } },
      });
    } else if (input.toStatus === ('hired' as SubmissionStatus)) {
      await tx.role.update({
        where: { id: submission.roleId },
        data: { hiredCount: { increment: 1 } },
      });
    }

    // Phase 3: Earning hooks — create/activate/cancel earnings based on transition.
    // These run inside the SAME TX boundary as the status transition. Atomicity guaranteed.
    if (input.toStatus === ('shortlisted' as SubmissionStatus)) {
      await earningService.createShortlistEarning(submissionId, tx as any);
    } else if (input.toStatus === ('hired' as SubmissionStatus)) {
      await earningService.createHireEarning(submissionId, tx as any);
    } else if (input.toStatus === ('joined' as SubmissionStatus)) {
      await earningService.activateHireEarning(submissionId, tx as any);
    } else if (input.toStatus === ('rejected' as SubmissionStatus)) {
      await earningService.cancelPendingEarnings(submissionId, tx as any);
    }

    // Auto-fill: if all submissions for this role are in a terminal state
    // and at least one hire exists, mark the role as filled.
    if (TERMINAL_STATUSES.has(input.toStatus)) {
      const nonTerminalCount = await tx.submission.count({
        where: {
          roleId: submission.roleId,
          NOT: {
            status: {
              in: [
                PrismaSubmissionStatus.joined,
                PrismaSubmissionStatus.rejected,
                PrismaSubmissionStatus.withdrawn,
              ],
            },
          },
        },
      });
      if (nonTerminalCount === 0) {
        const roleState = await tx.role.findUnique({
          where: { id: submission.roleId },
          select: { hiredCount: true, openPositions: true },
        });
        if (roleState && roleState.hiredCount >= roleState.openPositions) {
          const now = new Date();
          await tx.role.update({
            where: { id: submission.roleId },
            data: { status: 'filled', closedAt: now },
          });

          // Phase 12: Compute and store HiringMetric snapshot
          void computeHiringMetric(submission.roleId, now, tx as any).catch(() => {});
        }
      }
    }

    // Reload enriched for response
    const row = await tx.submission.findUnique({
      where: { id: submissionId },
      include: {
        statusEvents: { orderBy: { createdAt: 'asc' } },
        role: {
          select: {
            id: true,
            title: true,
            status: true,
            roleType: true,
            company: { select: { companyName: true } },
          },
        },
      },
    });
    if (!row) {
      throw AppError.internal('Submission disappeared after update');
    }
    return row;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  const detail = projectSubmissionDetail(enrichedRow as unknown as SubmissionWithRoleAndEvents);

  // Fire-and-forget notifications — never block the main flow.
  // Notify the recruiter who owns the submission about the status change.
  const recruiterUserId = await prisma.recruiterProfile
    .findUnique({ where: { id: submission.recruiterId }, select: { userId: true } })
    .then((p) => p?.userId);
  if (recruiterUserId) {
    void notify({
      userId: recruiterUserId,
      type: NotificationType.SUBMISSION_STATUS_CHANGED,
      title: 'Submission status updated',
      body: `Your submission moved to "${input.toStatus}".`,
      resourceType: 'submission',
      resourceId: submissionId,
    });

    // Earning-created notification for shortlist/hire
    if (input.toStatus === ('shortlisted' as SubmissionStatus) || input.toStatus === ('hired' as SubmissionStatus)) {
      void notify({
        userId: recruiterUserId,
        type: NotificationType.EARNING_CREATED,
        title: 'New earning',
        body: input.toStatus === ('shortlisted' as SubmissionStatus)
          ? 'You earned a shortlist payout.'
          : 'A hire earning has been created (pending candidate join).',
        resourceType: 'submission',
        resourceId: submissionId,
      });
    }
  }

  // Recalculate trust score on terminal transitions
  if (TERMINAL_STATUSES.has(input.toStatus)) {
    void import('./trust-score.service.js').then(m => m.recalculateTrustScore(submission.recruiterId));
  }

  // For hire/join, also notify the company user who owns the role.
  if (input.toStatus === ('hired' as SubmissionStatus) || input.toStatus === ('joined' as SubmissionStatus)) {
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { id: submission.role.companyId },
      select: { userId: true },
    });
    if (companyProfile) {
      void notify({
        userId: companyProfile.userId,
        type: NotificationType.SUBMISSION_STATUS_CHANGED,
        title: input.toStatus === ('hired' as SubmissionStatus) ? 'Candidate hired' : 'Candidate joined',
        body: `A submission has been marked as "${input.toStatus}".`,
        resourceType: 'submission',
        resourceId: submissionId,
      });
    }
  }

  return detail;
}

/**
 * List status events for a submission. Access gated: company must own the
 * role, recruiter must own the submission, admin sees all.
 */
export async function listStatusEvents(
  userId: string,
  userRole: UserRole,
  submissionId: string,
): Promise<SubmissionStatusEventResponse[]> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      role: { select: { companyId: true } },
    },
  });
  if (!submission) {
    throw AppError.notFound('Submission not found');
  }

  if (userRole === 'company') {
    const companyId = await resolveCompanyIdForUser(userId);
    if (submission.role.companyId !== companyId) {
      throw AppError.notFound('Submission not found');
    }
  } else if (userRole === 'recruiter') {
    const recruiterId = await resolveRecruiterId(userId);
    if (submission.recruiterId !== recruiterId) {
      throw AppError.notFound('Submission not found');
    }
  }

  const events = await prisma.submissionStatusEvent.findMany({
    where: { submissionId },
    orderBy: { createdAt: 'asc' },
  });

  return events.map((e): SubmissionStatusEventResponse => ({
    id: e.id,
    submissionId: e.submissionId,
    fromStatus: e.fromStatus as unknown as SubmissionStatus,
    toStatus: e.toStatus as unknown as SubmissionStatus,
    actorUserId: e.actorUserId,
    actorRole: e.actorRole as unknown as UserRole,
    reason: e.reason,
    metadata: (e.metadata as Record<string, unknown>) ?? null,
    createdAt: e.createdAt.toISOString(),
  }));
}

/**
 * Phase 12: Compute and store a HiringMetric snapshot when a role reaches
 * a terminal state (filled/closed). Idempotent — skips if metric already exists.
 */
async function computeHiringMetric(
  roleId: string,
  closedAt: Date,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<void> {
  const existing = await tx.hiringMetric.findUnique({ where: { roleId } });
  if (existing) return;

  const role = await tx.role.findUnique({
    where: { id: roleId },
    select: {
      publishedAt: true,
      firstSubmissionAt: true,
      submissionsCount: true,
      shortlistedCount: true,
      hiredCount: true,
    },
  });
  if (!role) return;

  // Count interview/rejected/withdrawn from submissions
  const statusCounts = await tx.submission.groupBy({
    by: ['status'],
    where: { roleId },
    _count: true,
  });
  const countMap = new Map(statusCounts.map((s) => [s.status, s._count]));
  const interviewCount =
    (countMap.get('interview') ?? 0) +
    (countMap.get('hired') ?? 0) +
    (countMap.get('joined') ?? 0);
  const rejectedCount = countMap.get('rejected') ?? 0;
  const withdrawnCount = countMap.get('withdrawn') ?? 0;

  // Unique recruiters
  const uniqueRecruiters = await tx.submission.findMany({
    where: { roleId },
    select: { recruiterId: true },
    distinct: ['recruiterId'],
  });

  // Total payout from earnings
  const earningsAgg = await tx.earning.aggregate({
    where: { roleId },
    _sum: { grossAmount: true },
  });
  const totalPayout = earningsAgg._sum.grossAmount;

  // Compute days
  const daysToFill =
    role.publishedAt
      ? Math.round((closedAt.getTime() - role.publishedAt.getTime()) / 86_400_000)
      : null;
  const daysToFirstSub =
    role.publishedAt && role.firstSubmissionAt
      ? Math.max(0, Math.round((role.firstSubmissionAt.getTime() - role.publishedAt.getTime()) / 86_400_000))
      : null;

  const subToHireRatio =
    role.submissionsCount > 0
      ? Number(((role.hiredCount / role.submissionsCount) * 100).toFixed(2))
      : null;
  const costPerHire =
    role.hiredCount > 0 && totalPayout
      ? Number(totalPayout) / role.hiredCount
      : null;

  await tx.hiringMetric.create({
    data: {
      roleId,
      daysToFill,
      daysToFirstSubmission: daysToFirstSub,
      submissionCount: role.submissionsCount,
      shortlistCount: role.shortlistedCount,
      interviewCount,
      hireCount: role.hiredCount,
      rejectedCount,
      withdrawnCount,
      submissionToHireRatio: subToHireRatio,
      totalPayoutAmount: totalPayout ? Number(totalPayout) : null,
      costPerHire,
      uniqueRecruiters: uniqueRecruiters.length,
    },
  });
}
