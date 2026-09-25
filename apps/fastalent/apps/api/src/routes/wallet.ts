import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { UserRole } from '@gigcruite/types';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../config/prisma.js';
import * as companyWalletService from '../services/company-wallet.service.js';
import * as razorpayService from '../services/razorpay.service.js';
import * as walletTransactionService from '../services/wallet-transaction.service.js';
import {
  DepositCreateOrderSchema,
  DepositVerifySchema,
  WalletTransactionsQuerySchema,
  type DepositCreateOrderBody,
  type DepositVerifyBody,
  type WalletTransactionsQuery,
} from '../validators/wallet.js';

const router = Router();

// ────────────────────────────────────────────────────────────
// GET /wallet/balance — company or recruiter wallet balance
// ────────────────────────────────────────────────────────────

router.get(
  '/balance',
  ...authorize(UserRole.COMPANY, UserRole.RECRUITER, UserRole.ADMIN),
  rateLimitAuthenticated,
  async (req, res) => {
    const userId = (req as any).userId as string;
    const userRole = (req as any).userRole as string;

    if (userRole === 'company') {
      const balance = await companyWalletService.getWalletBalance(userId);
      return ok(res, balance);
    }

    if (userRole === 'recruiter') {
      // Recruiter wallet balance is on their profile
      const profile = await prisma.recruiterProfile.findUnique({
        where: { userId },
        select: { id: true, walletBalance: true, lockedBalance: true },
      });
      return ok(res, {
        balance: profile?.walletBalance.toString() ?? '0',
        lockedBalance: profile?.lockedBalance.toString() ?? '0',
      });
    }

    // Admin — no personal wallet
    return ok(res, { message: 'Admin users do not have a wallet' });
  },
);

// ────────────────────────────────────────────────────────────
// POST /wallet/deposit/create-order — company creates Razorpay order
// ────────────────────────────────────────────────────────────

router.post(
  '/deposit/create-order',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  validate(DepositCreateOrderSchema),
  async (req, res) => {
    const userId = (req as any).userId as string;
    const { amount } = req.body as DepositCreateOrderBody;

    // Get company profile for receipt
    const profile = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true, companyName: true },
    });
    if (!profile) {
      return ok(res, { error: 'Company profile not found' }, 400);
    }

    const receipt = `gcw_${profile.id.slice(0, 8)}_${Date.now()}`;
    const order = await razorpayService.createOrder(amount, receipt);

    return ok(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env['RAZORPAY_KEY_ID'] ?? '',
    });
  },
);

// ────────────────────────────────────────────────────────────
// POST /wallet/deposit/verify — company submits payment verification
// ────────────────────────────────────────────────────────────

router.post(
  '/deposit/verify',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  validate(DepositVerifySchema),
  async (req, res) => {
    const userId = (req as any).userId as string;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      req.body as DepositVerifyBody;

    // Verify signature
    const valid = razorpayService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
    if (!valid) {
      return ok(res, { error: 'Invalid payment signature' }, 400);
    }

    // Fetch payment details for amount
    const payment = await razorpayService.fetchPayment(razorpayPaymentId);
    const amountPaise = payment['amount'] as number;
    const amountInr = new Prisma.Decimal(amountPaise).div(100);

    const profile = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      return ok(res, { error: 'Company profile not found' }, 400);
    }

    // Credit wallet inside serializable TX
    const txn = await prisma.$transaction(
      async (tx) => {
        return companyWalletService.depositFromRazorpay(
          profile.id,
          amountInr,
          razorpayOrderId,
          razorpayPaymentId,
          tx as any,
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return ok(res, txn, 201);
  },
);

// ────────────────────────────────────────────────────────────
// GET /wallet/transactions — paginated ledger
// ────────────────────────────────────────────────────────────

router.get(
  '/transactions',
  ...authorize(UserRole.COMPANY, UserRole.RECRUITER, UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(WalletTransactionsQuerySchema, 'query'),
  async (req, res) => {
    const userId = (req as any).userId as string;
    const userRole = (req as any).userRole as string;
    const query = req.query as unknown as WalletTransactionsQuery;

    if (userRole === 'company') {
      const result = await companyWalletService.listCompanyTransactions(userId, query);
      return ok(res, result);
    }

    if (userRole === 'recruiter') {
      const profile = await prisma.recruiterProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!profile) return ok(res, { transactions: [], total: 0, page: 1, pageSize: 20 });

      const page = Math.max(1, query.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
      const skip = (page - 1) * pageSize;

      const where: any = {
        recruiterProfileId: profile.id,
        // Hide platform_commission from recruiter wallet — net amounts already reflected
        transactionType: { not: 'platform_commission' },
      };

      // Type filter: "credit" or "debit" → map to TransactionType values
      if (query.type === 'credit') {
        where.transactionType = { in: ['recruiter_credit', 'refund'] };
      } else if (query.type === 'debit') {
        where.transactionType = { in: ['recruiter_withdrawal'] };
      }

      // Search filter: match description case-insensitively
      if (query.search?.trim()) {
        where.description = { contains: query.search.trim(), mode: 'insensitive' };
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

      return ok(res, {
        transactions: items.map((t) => ({
          id: t.id,
          transactionType: t.transactionType,
          amount: t.amount.toString(),
          balanceBefore: t.balanceBefore.toString(),
          balanceAfter: t.balanceAfter.toString(),
          description: t.description,
          referenceType: t.referenceType,
          referenceId: t.referenceId,
          metadata: (t.metadata as Record<string, unknown>) ?? null,
          createdAt: t.createdAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    }

    return ok(res, { transactions: [], total: 0, page: 1, pageSize: 20 });
  },
);

// ────────────────────────────────────────────────────────────
// GET /wallet/transactions/:id — single transaction
// ────────────────────────────────────────────────────────────

router.get(
  '/transactions/:id',
  ...authorize(UserRole.COMPANY, UserRole.RECRUITER, UserRole.ADMIN),
  rateLimitAuthenticated,
  async (req, res) => {
    const userId = (req as any).userId as string;
    const userRole = (req as any).userRole as string;
    const txn = await walletTransactionService.getTransactionById(
      req.params['id'] as string,
      userId,
      userRole,
    );
    return ok(res, txn);
  },
);

export { router as walletRouter };
