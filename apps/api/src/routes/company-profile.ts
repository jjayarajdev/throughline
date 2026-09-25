import { Router } from 'express';
import { UserRole } from '@gigcruite/types';
import { AppError } from '../lib/app-error.js';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import * as companyProfileService from '../services/company-profile.service.js';
import * as savingsService from '../services/savings.service.js';
import {
  UpdateCompanyProfileSchema,
  type UpdateCompanyProfileInput,
} from '../validators/company-profile.js';

/**
 * Company profile routes — all mounted at /api/v1/companies.
 *
 * All endpoints gated by `authorize('company')`. Admin lookup of other
 * companies is deferred to the Phase 4 admin panel.
 */
const router = Router();

router.get(
  '/me',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const profile = await companyProfileService.getCompanyProfile(req.userId);
    ok(res, profile);
  },
);

router.put(
  '/me',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  validate(UpdateCompanyProfileSchema),
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const input = req.body as UpdateCompanyProfileInput;
    const profile = await companyProfileService.updateCompanyProfile(
      req.userId,
      input,
    );
    ok(res, profile);
  },
);

// ---- Savings dashboard ----

router.get(
  '/savings',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const savings = await savingsService.getCompanySavings(req.userId);
    ok(res, savings);
  },
);

export { router as companyProfileRouter };
