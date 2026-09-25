import { Router } from 'express';
import { UserRole } from '@gigcruite/types';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import * as featureFlagService from '../services/feature-flag.service.js';
import { prisma } from '../config/prisma.js';

const router = Router();

/**
 * GET /api/v1/feature-flags
 *
 * Returns resolved feature flags for the calling user.
 * All roles (including admin) respect the DB flags.
 * - Admin: resolves GLOBAL flags (no entity scope)
 * - Company: resolve by companyProfileId (entity > global)
 * - Recruiter: resolve by recruiterProfileId (entity > global)
 */
router.get('/', ...authorize(), rateLimitAuthenticated, async (req, res) => {
  const userId = req.userId!;
  const role = req.userRole!;

  // Admin resolves global flags directly
  if (role === UserRole.ADMIN) {
    const flags = await featureFlagService.getGlobalFlags();
    return ok(res, flags);
  }

  if (role === UserRole.COMPANY) {
    const profile = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      return ok(res, { analytics_dashboards: false, analytics_ai: false, matching_ai: false });
    }
    const flags = await featureFlagService.getResolvedFlags('COMPANY', profile.id);
    return ok(res, flags);
  }

  if (role === UserRole.RECRUITER) {
    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      return ok(res, { analytics_dashboards: false, analytics_ai: false, matching_ai: false });
    }
    const flags = await featureFlagService.getResolvedFlags('RECRUITER', profile.id);
    return ok(res, flags);
  }

  // Fallback: all disabled
  return ok(res, { analytics_dashboards: false, analytics_ai: false, matching_ai: false });
});

export { router as featureFlagRouter };
