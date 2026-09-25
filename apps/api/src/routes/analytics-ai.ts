import { Router } from 'express';
import { UserRole } from '@gigcruite/types';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import * as anomalyService from '../services/anomaly.service.js';
import { getAiUsageStats, isAiAvailable } from '../lib/ai-provider.js';
import { triggerAnomalySweep } from '../workers/anomaly.worker.js';
import {
  AnomalyListQuerySchema,
  AnomalyActionParamSchema,
  AiUsageQuerySchema,
  type AnomalyListQuery,
  type AiUsageQuery,
} from '../validators/analytics-ai.js';

const router = Router();

// ── AIAI-01: List anomaly alerts for the current user ────────

router.get(
  '/anomalies',
  ...authorize(UserRole.COMPANY, UserRole.RECRUITER, UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(AnomalyListQuerySchema, 'query'),
  async (req, res) => {
    const query = req.query as unknown as AnomalyListQuery;
    // Non-admin users only see their own anomalies
    const userId = req.userRole === 'admin' ? undefined : req.userId!;
    const result = await anomalyService.listAnomalies({
      userId,
      type: query.type,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
    return ok(res, result);
  },
);

// ── AIAI-02: Get anomaly summary/counts ──────────────────────

router.get(
  '/anomalies/summary',
  ...authorize(UserRole.COMPANY, UserRole.RECRUITER, UserRole.ADMIN),
  rateLimitAuthenticated,
  async (req, res) => {
    const userId = req.userRole === 'admin' ? undefined : req.userId!;
    const result = await anomalyService.getAnomalySummary(userId);
    return ok(res, result);
  },
);

// ── AIAI-03: Acknowledge an anomaly ──────────────────────────

router.patch(
  '/anomalies/:id/acknowledge',
  ...authorize(UserRole.COMPANY, UserRole.RECRUITER, UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(AnomalyActionParamSchema, 'params'),
  async (req, res) => {
    const result = await anomalyService.acknowledgeAnomaly(req.params.id as string, req.userId!);
    if (!result) return ok(res, null, 404);
    return ok(res, { id: result.id, status: result.status });
  },
);

// ── AIAI-04: Resolve an anomaly ──────────────────────────────

router.patch(
  '/anomalies/:id/resolve',
  ...authorize(UserRole.COMPANY, UserRole.RECRUITER, UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(AnomalyActionParamSchema, 'params'),
  async (req, res) => {
    const result = await anomalyService.resolveAnomaly(req.params.id as string, req.userId!);
    if (!result) return ok(res, null, 404);
    return ok(res, { id: result.id, status: result.status });
  },
);

// ── AINF-01: AI usage stats (Admin only) ─────────────────────

router.get(
  '/ai-usage',
  ...authorize(UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(AiUsageQuerySchema, 'query'),
  async (req, res) => {
    const query = req.query as unknown as AiUsageQuery;
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    const result = await getAiUsageStats(startDate, endDate);
    return ok(res, result);
  },
);

// ── AINF-02: AI system status (Admin only) ───────────────────

router.get(
  '/ai-status',
  ...authorize(UserRole.ADMIN),
  rateLimitAuthenticated,
  async (_req, res) => {
    return ok(res, {
      aiAvailable: isAiAvailable(),
      provider: process.env.AI_PROVIDER ?? 'openai',
      model: process.env.AI_MODEL ?? 'gpt-4o-mini',
      anomalyIntervalHours: Number(process.env.AI_ANOMALY_INTERVAL_HOURS ?? 6),
    });
  },
);

// ── AINF-03: Trigger manual anomaly sweep (Admin only) ───────

router.post(
  '/anomalies/sweep',
  ...authorize(UserRole.ADMIN),
  rateLimitAuthenticated,
  async (_req, res) => {
    await triggerAnomalySweep();
    return ok(res, { message: 'Anomaly sweep queued' });
  },
);

export { router as analyticsAiRouter };
