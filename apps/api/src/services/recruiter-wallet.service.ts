import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';

/**
 * Recruiter wallet service — Phase 3 Wave 2.
 *
 * The recruiter wallet lives on RecruiterProfile (walletBalance, lockedBalance).
 * All mutations happen inside Serializable transactions provided by the caller.
 */

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/**
 * Credit recruiter wallet — used when an earning becomes PAYABLE.
 * Creates a WalletTransaction entry for audit.
 */
export async function creditRecruiterWallet(
  recruiterId: string,
  amount: Prisma.Decimal,
  submissionId: string,
  earningType: string,
  tx: TxClient,
): Promise<void> {
  const profile = await tx.recruiterProfile.findUnique({
    where: { id: recruiterId },
    select: { id: true, walletBalance: true },
  });
  if (!profile) throw new Error(`RecruiterProfile ${recruiterId} not found`);

  const balanceBefore = profile.walletBalance;
  const balanceAfter = balanceBefore.add(amount);

  await tx.recruiterProfile.update({
    where: { id: recruiterId },
    data: { walletBalance: balanceAfter },
  });

  await tx.walletTransaction.create({
    data: {
      transactionType: 'recruiter_credit',
      amount,
      balanceBefore,
      balanceAfter,
      description: `Earning: ${earningType}`,
      recruiterProfileId: recruiterId,
      referenceType: 'submission',
      referenceId: submissionId,
      metadata: { earningType },
    },
  });
}

/**
 * Debit recruiter wallet — used for withdrawals (W3).
 *
 * Also reduces lockedBalance atomically to avoid violating the
 * DB check constraint `locked_balance_le_wallet`. The caller
 * should NOT do a separate lockedBalance update after calling this.
 */
export async function debitRecruiterWallet(
  recruiterId: string,
  amount: Prisma.Decimal,
  payoutRequestId: string,
  tx: TxClient,
): Promise<void> {
  const profile = await tx.recruiterProfile.findUnique({
    where: { id: recruiterId },
    select: { id: true, walletBalance: true, lockedBalance: true },
  });
  if (!profile) throw new Error(`RecruiterProfile ${recruiterId} not found`);

  const balanceBefore = profile.walletBalance;
  const balanceAfter = balanceBefore.sub(amount);
  const newLocked = Prisma.Decimal.max(
    profile.lockedBalance.sub(amount),
    new Prisma.Decimal(0),
  );

  // Single atomic update: debit wallet + unlock in one statement
  // so the DB check constraint (locked_balance <= wallet_balance) is never violated.
  await tx.recruiterProfile.update({
    where: { id: recruiterId },
    data: { walletBalance: balanceAfter, lockedBalance: newLocked },
  });

  await tx.walletTransaction.create({
    data: {
      transactionType: 'recruiter_withdrawal',
      amount,
      balanceBefore,
      balanceAfter,
      description: 'Payout withdrawal',
      recruiterProfileId: recruiterId,
      referenceType: 'payout_request',
      referenceId: payoutRequestId,
    },
  });
}

/**
 * Get recruiter wallet balance info.
 */
export async function getRecruiterWalletBalance(userId: string) {
  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId },
    select: { id: true, walletBalance: true, lockedBalance: true },
  });

  if (!profile) {
    return { walletBalance: '0', lockedBalance: '0', availableBalance: '0' };
  }

  return {
    walletBalance: profile.walletBalance.toString(),
    lockedBalance: profile.lockedBalance.toString(),
    availableBalance: profile.walletBalance.sub(profile.lockedBalance).toString(),
  };
}
