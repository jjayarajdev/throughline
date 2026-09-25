import { Prisma } from '@prisma/client';
import type { EarningResponse, EarningSummaryResponse } from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import * as companyWalletService from './company-wallet.service.js';
import * as recruiterWalletService from './recruiter-wallet.service.js';

/**
 * Earning service — Phase 3 Wave 2.
 *
 * Core financial engine. Creates earnings on status transitions, computes
 * commission, credits recruiter wallet, debits company locked funds.
 *
 * All methods accept a TX client — they run inside the SAME atomic
 * transaction as the status transition in submission-status.service.ts.
 */

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// ────────────────────────────────────────────────────────────
// Earning creation on status transitions
// ────────────────────────────────────────────────────────────

/**
 * Called on shortlisted transition.
 * Creates a PAYABLE earning (immediate for shortlist — founder decision).
 * Credits recruiter wallet and debits company locked funds.
 */
export async function createShortlistEarning(
  submissionId: string,
  tx: TxClient,
): Promise<void> {
  const submission = await tx.submission.findUnique({
    where: { id: submissionId },
    include: {
      role: {
        select: {
          id: true,
          companyId: true,
          payoutType: true,
          shortlistPayoutMode: true,
          shortlistPayoutValue: true,
          ctcMax: true,
          platformCommissionPct: true,
        },
      },
    },
  });
  if (!submission) return;

  // Only if role has shortlist payout
  const payoutType = submission.role.payoutType;
  if (payoutType !== 'per_shortlist' && payoutType !== 'hybrid') return;
  if (!submission.role.shortlistPayoutValue || !submission.role.shortlistPayoutMode) return;

  // Idempotency: check unique constraint before insert
  const existing = await tx.earning.findUnique({
    where: {
      submissionId_earningType: {
        submissionId,
        earningType: 'shortlist_payout',
      },
    },
  });
  if (existing) return;

  // Calculate gross amount based on payout mode
  const grossAmount = submission.role.shortlistPayoutMode === 'percentage'
    ? submission.role.ctcMax.mul(submission.role.shortlistPayoutValue).div(100).toDecimalPlaces(2)
    : submission.role.shortlistPayoutValue;
  const commissionPct = submission.role.platformCommissionPct ?? new Prisma.Decimal(20);
  const commission = grossAmount.mul(commissionPct).div(100).toDecimalPlaces(2);
  const netAmount = grossAmount.sub(commission);

  // Create earning as PAYABLE (shortlist = immediate)
  await tx.earning.create({
    data: {
      submissionId,
      recruiterId: submission.recruiterId,
      roleId: submission.role.id,
      earningType: 'shortlist_payout',
      status: 'payable',
      grossAmount,
      platformCommissionPct: commissionPct,
      platformCommission: commission,
      netAmount,
    },
  });

  // Debit company locked funds (grossAmount — full cost to company)
  await companyWalletService.debitLockedFunds(
    submission.role.companyId,
    submission.role.id,
    grossAmount,
    submissionId,
    tx,
  );

  // Credit recruiter wallet (netAmount — after commission)
  await recruiterWalletService.creditRecruiterWallet(
    submission.recruiterId,
    netAmount,
    submissionId,
    'shortlist_payout',
    tx,
  );

  // Platform commission TX entry
  await tx.walletTransaction.create({
    data: {
      transactionType: 'platform_commission',
      amount: commission,
      balanceBefore: new Prisma.Decimal(0),
      balanceAfter: commission,
      description: `Commission on shortlist payout`,
      recruiterProfileId: submission.recruiterId,
      referenceType: 'submission',
      referenceId: submissionId,
      metadata: {
        earningType: 'shortlist_payout',
        commissionPct: commissionPct.toString(),
      },
    },
  });
}

/**
 * Called on hired transition.
 * Creates a PENDING earning (waits for join — founder decision).
 * No wallet movement yet — just records the intent.
 */
export async function createHireEarning(
  submissionId: string,
  tx: TxClient,
): Promise<void> {
  const submission = await tx.submission.findUnique({
    where: { id: submissionId },
    include: {
      role: {
        select: {
          id: true,
          companyId: true,
          payoutType: true,
          hirePayoutMode: true,
          hirePayoutValue: true,
          ctcMax: true,
          platformCommissionPct: true,
        },
      },
    },
  });
  if (!submission) return;

  const payoutType = submission.role.payoutType;
  if (payoutType !== 'per_hire' && payoutType !== 'hybrid') return;
  if (!submission.role.hirePayoutValue || !submission.role.hirePayoutMode) return;

  // Idempotency
  const existing = await tx.earning.findUnique({
    where: {
      submissionId_earningType: {
        submissionId,
        earningType: 'hire_payout',
      },
    },
  });
  if (existing) return;

  // Calculate gross amount based on payout mode
  // For hire: use acceptedCtc if available, otherwise ctcMax
  const ctcForCalc = submission.acceptedCtc ?? submission.role.ctcMax;
  const grossAmount = submission.role.hirePayoutMode === 'percentage'
    ? ctcForCalc.mul(submission.role.hirePayoutValue).div(100).toDecimalPlaces(2)
    : submission.role.hirePayoutValue;
  const commissionPct = submission.role.platformCommissionPct ?? new Prisma.Decimal(20);
  const commission = grossAmount.mul(commissionPct).div(100).toDecimalPlaces(2);
  const netAmount = grossAmount.sub(commission);

  // Create earning as PENDING (hire — waits for join)
  await tx.earning.create({
    data: {
      submissionId,
      recruiterId: submission.recruiterId,
      roleId: submission.role.id,
      earningType: 'hire_payout',
      status: 'pending',
      grossAmount,
      platformCommissionPct: commissionPct,
      platformCommission: commission,
      netAmount,
    },
  });
}

/**
 * Called on joined transition.
 * Activates PENDING hire earning → PAYABLE. Credits recruiter, debits company.
 */
export async function activateHireEarning(
  submissionId: string,
  tx: TxClient,
): Promise<void> {
  const earning = await tx.earning.findUnique({
    where: {
      submissionId_earningType: {
        submissionId,
        earningType: 'hire_payout',
      },
    },
  });
  if (!earning || earning.status !== 'pending') return;

  await tx.earning.update({
    where: { id: earning.id },
    data: { status: 'payable' },
  });

  const submission = await tx.submission.findUnique({
    where: { id: submissionId },
    include: {
      role: { select: { id: true, companyId: true } },
    },
  });
  if (!submission) return;

  // Debit company locked funds
  await companyWalletService.debitLockedFunds(
    submission.role.companyId,
    submission.role.id,
    earning.grossAmount,
    submissionId,
    tx,
  );

  // Credit recruiter wallet
  await recruiterWalletService.creditRecruiterWallet(
    earning.recruiterId,
    earning.netAmount,
    submissionId,
    'hire_payout',
    tx,
  );

  // Platform commission TX entry
  await tx.walletTransaction.create({
    data: {
      transactionType: 'platform_commission',
      amount: earning.platformCommission,
      balanceBefore: new Prisma.Decimal(0),
      balanceAfter: earning.platformCommission,
      description: `Commission on hire payout`,
      recruiterProfileId: earning.recruiterId,
      referenceType: 'submission',
      referenceId: submissionId,
      metadata: {
        earningType: 'hire_payout',
        commissionPct: earning.platformCommissionPct.toString(),
      },
    },
  });
}

/**
 * Called on rejection.
 * Cancels any PENDING earnings and unlocks company funds.
 * PAYABLE earnings are NOT clawed back (founder decision — no clawback MVP).
 */
export async function cancelPendingEarnings(
  submissionId: string,
  tx: TxClient,
): Promise<void> {
  const pendingEarnings = await tx.earning.findMany({
    where: { submissionId, status: 'pending' },
  });

  if (pendingEarnings.length === 0) return;

  const submission = await tx.submission.findUnique({
    where: { id: submissionId },
    include: {
      role: { select: { id: true, companyId: true } },
    },
  });
  if (!submission) return;

  for (const earning of pendingEarnings) {
    await tx.earning.update({
      where: { id: earning.id },
      data: { status: 'cancelled' },
    });

    // Unlock company funds for cancelled earning
    await companyWalletService.unlockFundsForRole(
      submission.role.companyId,
      submission.role.id,
      earning.grossAmount,
      'Earning cancelled on rejection',
      tx,
    );
  }
}

// ────────────────────────────────────────────────────────────
// Read operations (outside TX)
// ────────────────────────────────────────────────────────────

export async function listRecruiterEarnings(
  userId: string,
  filters: { status?: string; earningType?: string; search?: string; page?: number; pageSize?: number },
): Promise<{ earnings: EarningResponse[]; total: number; page: number; pageSize: number }> {
  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return { earnings: [], total: 0, page: 1, pageSize: 20 };

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.EarningWhereInput = {
    recruiterId: profile.id,
    ...(filters.status ? { status: filters.status as any } : {}),
    ...(filters.earningType ? { earningType: filters.earningType as any } : {}),
  };

  if (filters.search?.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { role: { title: { contains: term, mode: 'insensitive' } } },
      { role: { company: { companyName: { contains: term, mode: 'insensitive' } } } },
      { submission: { candidateName: { contains: term, mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.earning.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        submission: { select: { candidateName: true, status: true } },
        role: {
          select: {
            id: true,
            title: true,
            company: { select: { companyName: true } },
          },
        },
      },
    }),
    prisma.earning.count({ where }),
  ]);

  return {
    earnings: items.map((e) => projectEarning(e)),
    total,
    page,
    pageSize,
  };
}

export async function getEarningSummary(
  userId: string,
): Promise<EarningSummaryResponse> {
  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    return {
      totalEarned: '0',
      totalPending: '0',
      totalPayable: '0',
      totalPaid: '0',
      totalCommission: '0',
      earningsCount: 0,
    };
  }

  const [payable, pending, paid, all] = await Promise.all([
    prisma.earning.aggregate({
      where: { recruiterId: profile.id, status: 'payable' },
      _sum: { netAmount: true },
    }),
    prisma.earning.aggregate({
      where: { recruiterId: profile.id, status: 'pending' },
      _sum: { netAmount: true },
    }),
    prisma.earning.aggregate({
      where: { recruiterId: profile.id, status: 'paid' },
      _sum: { netAmount: true },
    }),
    prisma.earning.aggregate({
      where: {
        recruiterId: profile.id,
        status: { in: ['payable', 'paid'] },
      },
      _sum: { netAmount: true, platformCommission: true },
      _count: true,
    }),
  ]);

  return {
    totalEarned: (all._sum.netAmount ?? new Prisma.Decimal(0)).toString(),
    totalPending: (pending._sum.netAmount ?? new Prisma.Decimal(0)).toString(),
    totalPayable: (payable._sum.netAmount ?? new Prisma.Decimal(0)).toString(),
    totalPaid: (paid._sum.netAmount ?? new Prisma.Decimal(0)).toString(),
    totalCommission: (all._sum.platformCommission ?? new Prisma.Decimal(0)).toString(),
    earningsCount: all._count,
  };
}

export async function listCompanyEarnings(
  userId: string,
  filters: { page?: number; pageSize?: number },
): Promise<{ earnings: EarningResponse[]; total: number; page: number; pageSize: number }> {
  const profile = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return { earnings: [], total: 0, page: 1, pageSize: 20 };

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  // Find all roles for this company, then all earnings for those roles
  const where: Prisma.EarningWhereInput = {
    role: { companyId: profile.id },
  };

  const [items, total] = await Promise.all([
    prisma.earning.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        submission: { select: { candidateName: true, status: true } },
        role: {
          select: {
            id: true,
            title: true,
            company: { select: { companyName: true } },
          },
        },
      },
    }),
    prisma.earning.count({ where }),
  ]);

  return {
    earnings: items.map((e) => projectEarning(e)),
    total,
    page,
    pageSize,
  };
}

// ────────────────────────────────────────────────────────────
// Projection
// ────────────────────────────────────────────────────────────

function projectEarning(row: any): EarningResponse {
  return {
    id: row.id,
    submissionId: row.submissionId,
    recruiterId: row.recruiterId,
    roleId: row.roleId,
    earningType: row.earningType,
    status: row.status,
    grossAmount: row.grossAmount.toString(),
    platformCommissionPct: row.platformCommissionPct.toString(),
    platformCommission: row.platformCommission.toString(),
    netAmount: row.netAmount.toString(),
    payoutBatchId: row.payoutBatchId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(row.submission
      ? {
          submission: {
            candidateName: row.submission.candidateName,
            status: row.submission.status,
          },
        }
      : {}),
    ...(row.role
      ? {
          role: {
            id: row.role.id,
            title: row.role.title,
            companyName: row.role.company?.companyName ?? '',
          },
        }
      : {}),
  };
}
