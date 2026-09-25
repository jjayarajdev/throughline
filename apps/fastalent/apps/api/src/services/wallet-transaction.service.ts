import type { WalletTransactionResponse } from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import { AppError } from '../lib/app-error.js';

/**
 * Wallet transaction service — read-only ledger queries.
 * Write operations go through company-wallet.service or recruiter-wallet.service.
 */

export async function getTransactionById(
  id: string,
  userId: string,
  userRole: string,
): Promise<WalletTransactionResponse> {
  const txn = await prisma.walletTransaction.findUnique({
    where: { id },
    include: {
      companyWallet: { select: { company: { select: { userId: true } } } },
      recruiterProfile: { select: { userId: true } },
    },
  });

  if (!txn) throw AppError.notFound('Transaction not found');

  // Ownership check (admin sees all)
  if (userRole !== 'admin') {
    const ownerUserId =
      txn.companyWallet?.company.userId ?? txn.recruiterProfile?.userId;
    if (ownerUserId !== userId) {
      throw AppError.notFound('Transaction not found');
    }
  }

  // Enrich metadata with referenced entity context
  let metadata: Record<string, unknown> =
    (txn.metadata as Record<string, unknown>) ?? {};

  if (txn.referenceType === 'submission' && txn.referenceId) {
    const sub = await prisma.submission.findUnique({
      where: { id: txn.referenceId },
      select: {
        candidateName: true,
        status: true,
        role: {
          select: {
            id: true,
            title: true,
            company: { select: { companyName: true } },
          },
        },
        recruiter: { select: { fullName: true } },
      },
    });
    if (sub) {
      metadata = {
        ...metadata,
        candidateName: sub.candidateName,
        submissionStatus: sub.status,
        roleId: sub.role.id,
        roleTitle: sub.role.title,
        companyName: sub.role.company.companyName,
        recruiterName: sub.recruiter.fullName,
      };
    }
  }

  if (txn.referenceType === 'role' && txn.referenceId) {
    const role = await prisma.role.findUnique({
      where: { id: txn.referenceId },
      select: {
        title: true,
        status: true,
        company: { select: { companyName: true } },
      },
    });
    if (role) {
      metadata = {
        ...metadata,
        roleTitle: role.title,
        roleStatus: role.status,
        companyName: role.company.companyName,
      };
    }
  }

  return {
    id: txn.id,
    transactionType: txn.transactionType as any,
    amount: txn.amount.toString(),
    balanceBefore: txn.balanceBefore.toString(),
    balanceAfter: txn.balanceAfter.toString(),
    description: txn.description,
    referenceType: txn.referenceType,
    referenceId: txn.referenceId,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
    createdAt: txn.createdAt.toISOString(),
  };
}
