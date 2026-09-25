import { Router } from 'express';
import { UserRole } from '@gigcruite/types';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import * as jdExtractionService from '../services/jd-extraction.service.js';
import * as matchingService from '../services/matching.service.js';
import { enqueueJdExtraction } from '../workers/matching.worker.js';
import {
  MatchCheckBodySchema,
  BiasAuditBodySchema,
  RoleIdParamSchema,
  type MatchCheckBody,
  type BiasAuditBody,
} from '../validators/matching.js';

const router = Router();

// ── MTCH-01: Trigger JD extraction (admin / company owner) ──

router.post(
  '/roles/:id/extract-jd',
  ...authorize(UserRole.COMPANY, UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(RoleIdParamSchema, 'params'),
  async (req, res) => {
    const { id } = req.params as { id: string };
    await enqueueJdExtraction(id);
    return ok(res, { message: 'JD extraction queued', roleId: id });
  },
);

// ── MTCH-02: Get extracted JD crux ──────────────────────────

router.get(
  '/roles/:id/jd-crux',
  ...authorize(UserRole.RECRUITER, UserRole.COMPANY, UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(RoleIdParamSchema, 'params'),
  async (req, res) => {
    const { id } = req.params as { id: string };
    const crux = await jdExtractionService.getJdCrux(id);
    return ok(res, crux);
  },
);

// ── MTCH-03: Pre-submission match check ─────────────────────

router.post(
  '/roles/:id/match-check',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  validate(RoleIdParamSchema, 'params'),
  validate(MatchCheckBodySchema),
  async (req, res) => {
    const { id } = req.params as { id: string };
    const body = req.body as MatchCheckBody;
    const result = await matchingService.checkMatch(
      id,
      body.cvS3Key,
      body.cvMimeType,
      body.candidateName,
      body.candidateEmail,
      body.candidatePhone,
    );
    return ok(res, result);
  },
);

// ── MTCH-05: Bias audit (admin only) ────────────────────────

router.post(
  '/matching/bias-audit',
  ...authorize(UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(BiasAuditBodySchema),
  async (req, res) => {
    const body = req.body as BiasAuditBody;
    const result = await matchingService.runBiasAudit(
      body.roleId,
      body.cvS3Key,
      body.cvMimeType,
    );
    return ok(res, result);
  },
);

export { router as matchingRouter };
