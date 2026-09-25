import { Prisma } from '@prisma/client';
import type { CompanyWalletResponse, WalletTransactionResponse } from '@gigcruite/types';
import { TransactionType } from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import { AppError } from '../lib/app-error.js';

/**
 * Company wallet service — Phase 3 Wave 1.
 *
 * ALL financial ops use Serializable isolation and accept a Prisma TX client.
 * The caller wraps in `prisma.$transaction(fn, { isolationLevel: 'Serializable' })`.
 */

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

async function resolveCompanyId(userId: string): Promise<string> {
  const profile = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw AppError.internal('Company profile missing for authenticated company user');
  }
  return profile.id;
}

// ────────────────────────────────────────────────────────────
// Core operations
// ────────────────────────────────────────────────────────────

/** Idempotent wallet creation — one per company. */
export async function getOrCreateWallet(
  companyId: string,
  tx: TxClient = prisma,
): Promise<{ id: string; balance: Prisma.Decimal; lockedBalance: Prisma.Decimal }> {
  let wallet = await tx.companyWallet.findUnique({ where: { companyId } });
  if (!wallet) {
    wallet = await tx.companyWallet.create({ data: { companyId } });
  }
  return wallet;
}

/** Get wallet balance for the authenticated company user. */
export async function getWalletBalance(
  userId: string,
): Promise<CompanyWalletResponse> {
  const companyId = await resolveCompanyId(userId);
  const wallet = await getOrCreateWallet(companyId);
  return {
    id: wallet.id,
    companyId,
    balance: wallet.balance.toString(),
    lockedBalance: wallet.lockedBalance.toString(),
    createdAt: (wallet as any).createdAt.toISOString(),
    updatedAt: (wallet as any).updatedAt.toISOString(),
  };
}

/**
 * Credit company wallet from a Razorpay payment.
 * Idempotent: if a WalletTransaction already exists for this razorpayOrderId, skip.
 */
export async function depositFromRazorpay(
  companyId: string,
  amount: Prisma.Decimal,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  tx: TxClient,
): Promise<WalletTransactionResponse> {
  // Idempotency check
  const existing = await tx.walletTransaction.findFirst({
    where: {
      referenceType: 'razorpay_order',
      referenceId: razorpayOrderId,
    },
  });
  if (existing) {
    return projectTransaction(existing);
  }

  const wallet = await getOrCreateWallet(companyId, tx);
  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore.add(amount);

  await tx.companyWallet.update({
    where: { companyId },
    data: { balance: balanceAfter },
  });

  const txn = await tx.walletTransaction.create({
    data: {
      transactionType: 'company_deposit',
      amount,
      balanceBefore,
      balanceAfter,
      description: `Deposit via Razorpay (${razorpayPaymentId})`,
      companyWalletId: wallet.id,
      referenceType: 'razorpay_order',
      referenceId: razorpayOrderId,
      metadata: { razorpayPaymentId, razorpayOrderId },
    },
  });

  return projectTransaction(txn);
}

/**
 * Lock funds for a role when it's published.
 * Moves `amount` from available balance into lockedBalance.
 */
export async function lockFundsForRole(
  companyId: string,
  roleId: string,
  amount: Prisma.Decimal,
  tx: TxClient,
): Promise<void> {
  const wallet = await getOrCreateWallet(companyId, tx);
  const available = wallet.balance.sub(wallet.lockedBalance);

  if (available.lessThan(amount)) {
    throw AppError.badRequest(
      `Insufficient wallet balance. Available: ₹${available.toString()}, required: ₹${amount.toString()}. Please add funds before publishing.`,
    );
  }

  await tx.companyWallet.update({
    where: { companyId },
    data: {
      lockedBalance: wallet.lockedBalance.add(amount),
    },
  });

  await tx.walletTransaction.create({
    data: {
      transactionType: 'company_lock',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance, // total balance unchanged, locked portion changed
      description: `Funds locked for role`,
      companyWalletId: wallet.id,
      referenceType: 'role',
      referenceId: roleId,
      metadata: { action: 'publish_lock' },
    },
  });
}

/**
 * Unlock remaining locked funds for a role (e.g. when role is closed).
 */
export async function unlockFundsForRole(
  companyId: string,
  roleId: string,
  amount: Prisma.Decimal,
  reason: string,
  tx: TxClient,
): Promise<void> {
  if (amount.isZero() || amount.isNegative()) return;

  const wallet = await getOrCreateWallet(companyId, tx);

  // Cap unlock to actual locked amount (safety)
  const unlockAmount = Prisma.Decimal.min(amount, wallet.lockedBalance);
  if (unlockAmount.isZero()) return;

  await tx.companyWallet.update({
    where: { companyId },
    data: {
      lockedBalance: wallet.lockedBalance.sub(unlockAmount),
    },
  });

  await tx.walletTransaction.create({
    data: {
      transactionType: 'company_unlock',
      amount: unlockAmount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      description: reason,
      companyWalletId: wallet.id,
      referenceType: 'role',
      referenceId: roleId,
      metadata: { action: 'unlock', reason },
    },
  });
}

/**
 * Debit locked funds when a recruiter earning is credited.
 * Reduces both balance and lockedBalance.
 */
export async function debitLockedFunds(
  companyId: string,
  roleId: string,
  amount: Prisma.Decimal,
  submissionId: string,
  tx: TxClient,
): Promise<void> {
  const wallet = await getOrCreateWallet(companyId, tx);

  const newBalance = wallet.balance.sub(amount);
  const newLocked = wallet.lockedBalance.sub(amount);

  await tx.companyWallet.update({
    where: { companyId },
    data: {
      balance: newBalance,
      lockedBalance: Prisma.Decimal.max(newLocked, new Prisma.Decimal(0)),
    },
  });

  await tx.walletTransaction.create({
    data: {
      transactionType: 'company_debit',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: newBalance,
      description: 'Payout to recruiter',
      companyWalletId: wallet.id,
      referenceType: 'submission',
      referenceId: submissionId,
      metadata: { roleId },
    },
  });
}

// ────────────────────────────────────────────────────────────
// Transaction listing
// ────────────────────────────────────────────────────────────

export async function listCompanyTransactions(
  userId: string,
  opts: { page?: number; pageSize?: number; type?: string; search?: string },
): Promise<{ transactions: WalletTransactionResponse[]; total: number; page: number; pageSize: number }> {
  const companyId = await resolveCompanyId(userId);
  const wallet = await getOrCreateWallet(companyId);

  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.WalletTransactionWhereInput = {
    companyWalletId: wallet.id,
    // Hide platform_commission from company view — net amounts already reflected
    transactionType: { not: 'platform_commission' as TransactionType },
  };

  if (opts.type) {
    where.transactionType = { not: 'platform_commission' as TransactionType, equals: opts.type as TransactionType };
  }

  if (opts.search) {
    const term = opts.search.trim();
    if (term) {
      // Find submissions matching search (candidate name, role title, recruiter name)
      const [matchingSubs, matchingRoles] = await Promise.all([
        prisma.submission.findMany({
          where: {
            OR: [
              { candidateName: { contains: term, mode: 'insensitive' } },
              { role: { title: { contains: term, mode: 'insensitive' } } },
              { recruiter: { fullName: { contains: term, mode: 'insensitive' } } },
            ],
          },
          select: { id: true },
        }),
        prisma.role.findMany({
          where: { title: { contains: term, mode: 'insensitive' } },
          select: { id: true },
        }),
      ]);

      const subIds = matchingSubs.map((s) => s.id);
      const rIds = matchingRoles.map((r) => r.id);

      const orConditions: Prisma.WalletTransactionWhereInput[] = [
        { description: { contains: term, mode: 'insensitive' } },
      ];
      if (subIds.length > 0) {
        orConditions.push({ referenceType: 'submission', referenceId: { in: subIds } });
      }
      if (rIds.length > 0) {
        orConditions.push({ referenceType: 'role', referenceId: { in: rIds } });
      }

      where.OR = orConditions;
    }
  }

  const [items, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  // Enrich transactions that reference submissions with role/recruiter info
  const submissionIds = items
    .filter((t) => t.referenceType === 'submission' && t.referenceId)
    .map((t) => t.referenceId!);

  const roleIds = items
    .filter((t) => t.referenceType === 'role' && t.referenceId)
    .map((t) => t.referenceId!);

  const submissionMap = new Map<string, { candidateName: string; roleTitle: string; recruiterName: string }>();
  const roleMap = new Map<string, { title: string }>();

  if (submissionIds.length > 0) {
    const subs = await prisma.submission.findMany({
      where: { id: { in: submissionIds } },
      select: {
        id: true,
        candidateName: true,
        role: { select: { title: true } },
        recruiter: { select: { fullName: true } },
      },
    });
    for (const s of subs) {
      submissionMap.set(s.id, {
        candidateName: s.candidateName,
        roleTitle: s.role.title,
        recruiterName: s.recruiter.fullName,
      });
    }
  }

  if (roleIds.length > 0) {
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, title: true },
    });
    for (const r of roles) {
      roleMap.set(r.id, { title: r.title });
    }
  }

  return {
    transactions: items.map((t) => {
      const base = projectTransaction(t);
      if (t.referenceType === 'submission' && t.referenceId) {
        const info = submissionMap.get(t.referenceId);
        if (info) {
          base.metadata = { ...((base.metadata as Record<string, unknown>) ?? {}), ...info };
        }
      }
      if (t.referenceType === 'role' && t.referenceId) {
        const info = roleMap.get(t.referenceId);
        if (info) {
          base.metadata = { ...((base.metadata as Record<string, unknown>) ?? {}), roleTitle: info.title };
        }
      }
      return base;
    }),
    total,
    page,
    pageSize,
  };
}

// ────────────────────────────────────────────────────────────
// Projection
// ────────────────────────────────────────────────────────────

function projectTransaction(row: any): WalletTransactionResponse {
  return {
    id: row.id,
    transactionType: row.transactionType,
    amount: row.amount.toString(),
    balanceBefore: row.balanceBefore.toString(),
    balanceAfter: row.balanceAfter.toString(),
    description: row.description,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
