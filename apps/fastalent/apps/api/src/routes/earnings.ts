import { Router } from 'express';
import { UserRole } from '@gigcruite/types';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import * as earningService from '../services/earning.service.js';
import {
  ListEarningsQuerySchema,
  type ListEarningsQuery,
} from '../validators/earning.js';

const router = Router();

// ────────────────────────────────────────────────────────────
// GET /earnings — recruiter's earnings list
// ────────────────────────────────────────────────────────────

router.get(
  '/',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  validate(ListEarningsQuerySchema, 'query'),
  async (req, res) => {
    const userId = (req as any).userId as string;
    const query = req.query as unknown as ListEarningsQuery;
    const result = await earningService.listRecruiterEarnings(userId, query);
    return ok(res, result);
  },
);

// ────────────────────────────────────────────────────────────
// GET /earnings/summary — aggregated stats
// ────────────────────────────────────────────────────────────

router.get(
  '/summary',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  async (req, res) => {
    const userId = (req as any).userId as string;
    const summary = await earningService.getEarningSummary(userId);
    return ok(res, summary);
  },
);

// ────────────────────────────────────────────────────────────
// GET /earnings/company — company sees their payouts
// ────────────────────────────────────────────────────────────

router.get(
  '/company',
  ...authorize(UserRole.COMPANY, UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(ListEarningsQuerySchema, 'query'),
  async (req, res) => {
    const userId = (req as any).userId as string;
    const query = req.query as unknown as ListEarningsQuery;
    const result = await earningService.listCompanyEarnings(userId, query);
    return ok(res, result);
  },
);

export { router as earningsRouter };
