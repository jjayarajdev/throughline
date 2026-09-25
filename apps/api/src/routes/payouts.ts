import { Router } from 'express';
import { UserRole } from '@gigcruite/types';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import * as payoutService from '../services/payout.service.js';
import {
  PayoutRequestSchema, RejectPayoutSchema, ListPayoutRequestsQuerySchema,
  type PayoutRequestBody, type RejectPayoutBody, type ListPayoutRequestsQuery,
} from '../validators/payout.js';

const router = Router();

router.post('/request', ...authorize(UserRole.RECRUITER), rateLimitAuthenticated, validate(PayoutRequestSchema), async (req, res) => {
  const result = await payoutService.createPayoutRequest((req as any).userId, (req.body as PayoutRequestBody).amount);
  return ok(res, result, 201);
});

router.get('/requests', ...authorize(UserRole.RECRUITER, UserRole.ADMIN), rateLimitAuthenticated, validate(ListPayoutRequestsQuerySchema, 'query'), async (req, res) => {
  const query = req.query as unknown as ListPayoutRequestsQuery;
  const result = await payoutService.listPayoutRequests((req as any).userId, (req as any).userRole, query);
  return ok(res, result);
});

router.get('/requests/:id', ...authorize(UserRole.RECRUITER, UserRole.ADMIN), rateLimitAuthenticated, async (req, res) => {
  const result = await payoutService.getPayoutRequest(req.params['id'] as string, (req as any).userId, (req as any).userRole);
  return ok(res, result);
});

router.post('/requests/:id/approve', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, async (req, res) => {
  const result = await payoutService.approvePayoutRequest(req.params['id'] as string, (req as any).userId);
  return ok(res, result);
});

router.post('/requests/:id/reject', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, validate(RejectPayoutSchema), async (req, res) => {
  const result = await payoutService.rejectPayoutRequest(req.params['id'] as string, (req as any).userId, (req.body as RejectPayoutBody).reason);
  return ok(res, result);
});

router.post('/batch/run', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, async (req, res) => {
  const result = await payoutService.runPayoutBatch((req as any).userId);
  return ok(res, result);
});

router.get('/batches', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, validate(ListPayoutRequestsQuerySchema, 'query'), async (req, res) => {
  const query = req.query as unknown as ListPayoutRequestsQuery;
  const result = await payoutService.listPayoutBatches(query);
  return ok(res, result);
});

export { router as payoutsRouter };
