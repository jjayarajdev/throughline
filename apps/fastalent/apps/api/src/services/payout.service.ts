import { Prisma } from '@prisma/client';
import type { PayoutRequestResponse, PayoutBatchResponse } from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';
import { AppError } from '../lib/app-error.js';
import { env } from '../config/env.js';
import * as recruiterWalletService from './recruiter-wallet.service.js';
import * as platformSettingsService from './platform-settings.service.js';
import { notify } from '../lib/notify.js';
import { NotificationType } from '@gigcruite/types';

// ────────────────────────────────────────────────────────────
// Payout Request CRUD
// ────────────────────────────────────────────────────────────

export async function createPayoutRequest(
  userId: string,
  amount: number,
): Promise<PayoutRequestResponse> {
  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      walletBalance: true,
      lockedBalance: true,
      bankVerified: true,
      bankAccountEncrypted: true,
      bankIfscEncrypted: true,
      bankAccountHolderName: true,
    },
  });
  if (!profile) throw AppError.notFound('Recruiter profile not found');

  // Validate bank details exist and verified
  if (!profile.bankAccountEncrypted || !profile.bankIfscEncrypted) {
    throw AppError.badRequest('Please add your bank details before requesting a payout');
  }
  if (!profile.bankVerified) {
    throw AppError.badRequest('Bank account must be verified before requesting a payout');
  }

  // Validate minimum withdrawal amount
  const minAmount = (await platformSettingsService.getSettingNumber('min_withdrawal_amount')) ?? 1000;
  if (amount < minAmount) {
    throw AppError.badRequest(`Minimum withdrawal amount is ₹${minAmount}`);
  }

  // Validate sufficient available balance
  const available = profile.walletBalance.sub(profile.lockedBalance);
  const amountDecimal = new Prisma.Decimal(amount);
  if (available.lessThan(amountDecimal)) {
    throw AppError.badRequest(
      `Insufficient available balance. Available: ₹${available.toString()}, requested: ₹${amount}`,
    );
  }

  // Block concurrent pending requests
  const pendingCount = await prisma.payoutRequest.count({
    where: {
      recruiterId: profile.id,
      status: 'pending_approval',
    },
  });
  if (pendingCount > 0) {
    throw AppError.conflict('You already have a pending payout request. Wait for it to be processed.');
  }

  // Create request + lock funds atomically
  const request = await prisma.$transaction(
    async (tx) => {
      // Lock funds
      await tx.recruiterProfile.update({
        where: { id: profile.id },
        data: {
          lockedBalance: profile.lockedBalance.add(amountDecimal),
        },
      });

      return tx.payoutRequest.create({
        data: {
          recruiterId: profile.id,
          amount: amountDecimal,
          bankDetailsSnapshot: {
            bankAccountEncrypted: profile.bankAccountEncrypted,
            bankIfscEncrypted: profile.bankIfscEncrypted,
            bankAccountHolderName: profile.bankAccountHolderName,
          },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return projectPayoutRequest(request);
}

export async function approvePayoutRequest(
  requestId: string,
  adminUserId: string,
): Promise<PayoutRequestResponse> {
  const request = await prisma.payoutRequest.findUnique({ where: { id: requestId } });
  if (!request) throw AppError.notFound('Payout request not found');
  if (request.status !== 'pending_approval') {
    throw AppError.conflict(`Request is in status "${request.status}", cannot approve`);
  }

  const updated = await prisma.payoutRequest.update({
    where: { id: requestId },
    data: {
      status: 'approved',
      adminUserId,
      approvedAt: new Date(),
    },
  });

  // Notify recruiter of approval
  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { id: request.recruiterId },
    select: { userId: true },
  });
  if (recruiterProfile) {
    void notify({
      userId: recruiterProfile.userId,
      type: NotificationType.PAYOUT_UPDATE,
      title: 'Payout approved',
      body: `Your payout request for ${request.amount.toString()} has been approved.`,
      resourceType: 'payout_request',
      resourceId: requestId,
    });
  }

  return projectPayoutRequest(updated);
}

export async function rejectPayoutRequest(
  requestId: string,
  adminUserId: string,
  reason: string,
): Promise<PayoutRequestResponse> {
  const request = await prisma.payoutRequest.findUnique({ where: { id: requestId } });
  if (!request) throw AppError.notFound('Payout request not found');
  if (request.status !== 'pending_approval') {
    throw AppError.conflict(`Request is in status "${request.status}", cannot reject`);
  }

  const updated = await prisma.$transaction(
    async (tx) => {
      // Unlock funds
      const profile = await tx.recruiterProfile.findUnique({
        where: { id: request.recruiterId },
        select: { lockedBalance: true },
      });
      if (profile) {
        const newLocked = Prisma.Decimal.max(
          profile.lockedBalance.sub(request.amount),
          new Prisma.Decimal(0),
        );
        await tx.recruiterProfile.update({
          where: { id: request.recruiterId },
          data: { lockedBalance: newLocked },
        });
      }

      return tx.payoutRequest.update({
        where: { id: requestId },
        data: {
          status: 'cancelled',
          adminUserId,
          adminNote: reason,
          rejectedAt: new Date(),
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  // Notify recruiter of rejection
  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { id: request.recruiterId },
    select: { userId: true },
  });
  if (recruiterProfile) {
    void notify({
      userId: recruiterProfile.userId,
      type: NotificationType.PAYOUT_UPDATE,
      title: 'Payout request rejected',
      body: `Your payout request was rejected: ${reason}`,
      resourceType: 'payout_request',
      resourceId: requestId,
    });
  }

  return projectPayoutRequest(updated);
}

export async function listPayoutRequests(
  userId: string,
  userRole: string,
  filters: { status?: string; page?: number; pageSize?: number },
): Promise<{ requests: PayoutRequestResponse[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  let where: Prisma.PayoutRequestWhereInput = {};

  if (userRole === 'recruiter') {
    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) return { requests: [], total: 0, page, pageSize };
    where = { recruiterId: profile.id };
  }

  if (filters.status) {
    where = { ...where, status: filters.status as any };
  }

  const [items, total] = await Promise.all([
    prisma.payoutRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        recruiter: {
          select: { id: true, fullName: true, bankVerified: true },
        },
      },
    }),
    prisma.payoutRequest.count({ where }),
  ]);

  return {
    requests: items.map((r) => ({
      ...projectPayoutRequest(r),
      recruiter: r.recruiter
        ? { id: r.recruiter.id, fullName: r.recruiter.fullName, bankVerified: r.recruiter.bankVerified }
        : undefined,
    })),
    total,
    page,
    pageSize,
  };
}

export async function getPayoutRequest(
  requestId: string,
  userId: string,
  userRole: string,
): Promise<PayoutRequestResponse> {
  const request = await prisma.payoutRequest.findUnique({
    where: { id: requestId },
    include: {
      recruiter: { select: { id: true, fullName: true, bankVerified: true, userId: true } },
    },
  });
  if (!request) throw AppError.notFound('Payout request not found');

  if (userRole === 'recruiter' && request.recruiter.userId !== userId) {
    throw AppError.notFound('Payout request not found');
  }

  return {
    ...projectPayoutRequest(request),
    recruiter: {
      id: request.recruiter.id,
      fullName: request.recruiter.fullName,
      bankVerified: request.recruiter.bankVerified,
    },
  };
}

// ────────────────────────────────────────────────────────────
// Payout Batch Execution
// ────────────────────────────────────────────────────────────

const BATCH_LOCK_KEY = 'payout_batch_lock';
const BATCH_LOCK_TTL = 600; // 10 minutes

/**
 * Run payout batch: gathers approved requests, creates batches,
 * initiates bank transfers via RazorpayX.
 *
 * Uses Redis SETNX for distributed lock to prevent concurrent runs.
 */
export async function runPayoutBatch(
  _adminUserId?: string,
): Promise<PayoutBatchResponse[]> {
  // Acquire distributed lock
  const acquired = await redis.set(BATCH_LOCK_KEY, '1', 'EX', BATCH_LOCK_TTL, 'NX');
  if (!acquired) {
    throw AppError.conflict('Payout batch is already running');
  }

  try {
    // Gather approved requests
    const approvedRequests = await prisma.payoutRequest.findMany({
      where: { status: 'approved' },
      include: {
        recruiter: {
          select: {
            id: true,
            walletBalance: true,
            lockedBalance: true,
            bankAccountEncrypted: true,
            bankIfscEncrypted: true,
            bankAccountHolderName: true,
          },
        },
      },
    });

    if (approvedRequests.length === 0) {
      return [];
    }

    // Group by recruiter
    const grouped = new Map<string, typeof approvedRequests>();
    for (const req of approvedRequests) {
      const existing = grouped.get(req.recruiterId) ?? [];
      existing.push(req);
      grouped.set(req.recruiterId, existing);
    }

    const batches: PayoutBatchResponse[] = [];

    for (const [recruiterId, requests] of grouped) {
      const totalAmount = requests.reduce(
        (sum, r) => sum.add(r.amount),
        new Prisma.Decimal(0),
      );

      const batch = await prisma.$transaction(
        async (tx) => {
          // Create batch
          const b = await tx.payoutBatch.create({
            data: {
              recruiterId,
              totalAmount,
              earningsCount: requests.length,
              status: 'processing',
            },
          });

          // Update requests to processing
          for (const req of requests) {
            await tx.payoutRequest.update({
              where: { id: req.id },
              data: { status: 'processing', payoutBatchId: b.id },
            });
          }

          // Debit recruiter wallet + unlock atomically (single UPDATE to
          // avoid violating the locked_balance_le_wallet check constraint).
          await recruiterWalletService.debitRecruiterWallet(
            recruiterId,
            totalAmount,
            b.id,
            tx as any,
          );

          return b;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      // TODO: Initiate RazorpayX bank transfer here when keys are configured
      // For now, auto-complete the batch (dev mode)
      if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
        await prisma.payoutBatch.update({
          where: { id: batch.id },
          data: {
            status: 'completed',
            processedAt: new Date(),
          },
        });

        // Mark requests as completed
        for (const req of requests) {
          await prisma.payoutRequest.update({
            where: { id: req.id },
            data: { status: 'completed', completedAt: new Date() },
          });
        }

        // Mark payable earnings for this recruiter as paid
        await prisma.earning.updateMany({
          where: {
            recruiterId,
            status: 'payable',
          },
          data: {
            status: 'paid',
            payoutBatchId: batch.id,
          },
        });
      }

      batches.push(projectPayoutBatch(batch));
    }

    return batches;
  } finally {
    await redis.del(BATCH_LOCK_KEY);
  }
}

export async function listPayoutBatches(
  filters: { page?: number; pageSize?: number },
): Promise<{ batches: PayoutBatchResponse[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.payoutBatch.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.payoutBatch.count(),
  ]);

  return {
    batches: items.map(projectPayoutBatch),
    total,
    page,
    pageSize,
  };
}

// ────────────────────────────────────────────────────────────
// Projection
// ────────────────────────────────────────────────────────────

function projectPayoutRequest(row: any): PayoutRequestResponse {
  return {
    id: row.id,
    recruiterId: row.recruiterId,
    status: row.status,
    amount: row.amount.toString(),
    adminNote: row.adminNote,
    rejectedAt: row.rejectedAt?.toISOString() ?? null,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    payoutBatchId: row.payoutBatchId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function projectPayoutBatch(row: any): PayoutBatchResponse {
  return {
    id: row.id,
    recruiterId: row.recruiterId,
    status: row.status,
    totalAmount: row.totalAmount.toString(),
    earningsCount: row.earningsCount,
    razorpayPayoutId: row.razorpayPayoutId,
    failureReason: row.failureReason,
    processedAt: row.processedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
