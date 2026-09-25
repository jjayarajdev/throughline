import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { UserRole } from '@gigcruite/types';
import { isDev } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { ok } from '../lib/response.js';
import { AppError } from '../lib/app-error.js';
import { encrypt } from '../lib/crypto.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { getOrCreateWallet } from '../services/company-wallet.service.js';
import {
  SeedWalletSchema,
  SeedRecruiterBankSchema,
  SetUserStatusSchema,
  type SeedWalletBody,
  type SeedRecruiterBankBody,
  type SetUserStatusBody,
} from '../validators/admin-dev.js';

const router = Router();

// Belt-and-suspenders: even if someone imports this router in prod,
// every handler rejects immediately.
const devOnly = (_req: any, _res: any, next: any) => {
  if (!isDev) return next(AppError.notFound('Not found'));
  next();
};

router.use(devOnly);

// ────────────────────────────────────────────────────────────
// POST /admin/dev/seed-wallet — credit a company wallet (dev only)
// ────────────────────────────────────────────────────────────

router.post(
  '/seed-wallet',
  ...authorize(UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(SeedWalletSchema),
  async (req, res) => {
    const { companyUserId, amount } = req.body as SeedWalletBody;

    const profile = await prisma.companyProfile.findUnique({
      where: { userId: companyUserId },
      select: { id: true },
    });
    if (!profile) {
      throw AppError.notFound('Company profile not found for the given user ID');
    }

    const amountDecimal = new Prisma.Decimal(amount);
    const referenceId = randomUUID();

    const txn = await prisma.$transaction(
      async (tx) => {
        const wallet = await getOrCreateWallet(profile.id, tx as any);
        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore.add(amountDecimal);

        await tx.companyWallet.update({
          where: { companyId: profile.id },
          data: { balance: balanceAfter },
        });

        return tx.walletTransaction.create({
          data: {
            transactionType: 'company_deposit',
            amount: amountDecimal,
            balanceBefore,
            balanceAfter,
            description: 'Dev seed deposit',
            companyWalletId: wallet.id,
            referenceType: 'dev_seed',
            referenceId,
            metadata: { source: 'admin-dev', seededAt: new Date().toISOString() },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return ok(res, {
      id: txn.id,
      amount: txn.amount.toString(),
      balanceAfter: txn.balanceAfter.toString(),
      referenceId,
    }, 201);
  },
);

// ────────────────────────────────────────────────────────────
// POST /admin/dev/seed-recruiter-bank — set fake bank details (dev only)
// ────────────────────────────────────────────────────────────

router.post(
  '/seed-recruiter-bank',
  ...authorize(UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(SeedRecruiterBankSchema),
  async (req, res) => {
    const { recruiterUserId } = req.body as SeedRecruiterBankBody;

    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId: recruiterUserId },
      select: { id: true },
    });
    if (!profile) {
      throw AppError.notFound('Recruiter profile not found for the given user ID');
    }

    await prisma.recruiterProfile.update({
      where: { id: profile.id },
      data: {
        bankAccountEncrypted: encrypt('1234567890123456'),
        bankIfscEncrypted: encrypt('SBIN0001234'),
        bankAccountHolderName: 'Test Account',
        bankVerified: true,
        bankVerifiedAt: new Date(),
      },
    });

    return ok(res, {
      recruiterId: profile.id,
      bankVerified: true,
      message: 'Test bank details seeded successfully',
    });
  },
);

// ────────────────────────────────────────────────────────────
// POST /admin/dev/set-user-status — force user status (dev only)
// ────────────────────────────────────────────────────────────

router.post(
  '/set-user-status',
  ...authorize(UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(SetUserStatusSchema),
  async (req, res) => {
    const { userId, status, emailVerified } = req.body as SetUserStatusBody;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw AppError.notFound('User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        ...(emailVerified !== undefined
          ? {
              emailVerified,
              emailVerifiedAt: emailVerified ? new Date() : null,
            }
          : {}),
      },
    });

    return ok(res, { userId, status, emailVerified: emailVerified ?? null });
  },
);

export { router as adminDevRouter };
