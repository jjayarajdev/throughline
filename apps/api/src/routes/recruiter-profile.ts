import { Router } from 'express';
import { UserRole } from '@gigcruite/types';
import { AppError } from '../lib/app-error.js';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import * as recruiterProfileService from '../services/recruiter-profile.service.js';
import * as trustScoreService from '../services/trust-score.service.js';
import {
  UpdateRecruiterBankDetailsSchema,
  UpdateRecruiterProfileSchema,
  type UpdateRecruiterBankDetailsInput,
  type UpdateRecruiterProfileInput,
} from '../validators/recruiter-profile.js';

/**
 * Recruiter profile routes — all mounted at /api/v1/recruiters.
 *
 * Access control:
 *   Every endpoint is gated by `authorize('recruiter')`, which composes
 *   `authenticate → requireRole('recruiter')`. The owning user is read from
 *   `req.userId` — we deliberately do NOT expose a `/recruiters/:id/...`
 *   surface here because recruiter profiles are self-service only in
 *   Phase 1; admin lookup of other recruiters arrives in Phase 4.
 *
 * Rate limiting:
 *   `rateLimitAuthenticated` runs AFTER `authorize` so the bucket is keyed
 *   by the verified `userId` rather than by IP — shared-office NAT users
 *   don't throttle each other.
 */
const router = Router();

// ---- GET /recruiters/me ----------------------------------------------------

router.get(
  '/me',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const profile = await recruiterProfileService.getRecruiterProfile(
      req.userId,
    );
    ok(res, profile);
  },
);

// ---- PUT /recruiters/me ----------------------------------------------------

router.put(
  '/me',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  validate(UpdateRecruiterProfileSchema),
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const input = req.body as UpdateRecruiterProfileInput;
    const profile = await recruiterProfileService.updateRecruiterProfile(
      req.userId,
      input,
    );
    ok(res, profile);
  },
);

// ---- PUT /recruiters/me/bank-details ---------------------------------------

router.put(
  '/me/bank-details',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  validate(UpdateRecruiterBankDetailsSchema),
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const input = req.body as UpdateRecruiterBankDetailsInput;
    const profile = await recruiterProfileService.updateRecruiterBankDetails(
      req.userId,
      input,
    );
    ok(res, profile);
  },
);

// ---- GET /recruiters/trust-score (own score) --------------------------------

router.get(
  '/trust-score',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const profile = await recruiterProfileService.getRecruiterProfile(
      req.userId,
    );
    const trust = await trustScoreService.getTrustScore(profile.id);
    ok(res, trust);
  },
);

// ---- GET /recruiters/:id/trust (public — any authenticated user) ------------

router.get(
  '/:id/trust',
  ...authorize(),
  rateLimitAuthenticated,
  async (req, res) => {
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Recruiter profile ID is required');
    }
    const trust = await trustScoreService.getTrustScore(id);
    ok(res, trust);
  },
);

export { router as recruiterProfileRouter };
