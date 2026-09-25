import { Router } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from './auth.js';
import { recruiterProfileRouter } from './recruiter-profile.js';
import { companyProfileRouter } from './company-profile.js';
import { roleRouter } from './role.js';
import { uploadRouter } from './upload.js';
import { submissionRouter } from './submission.js';
import { walletRouter } from './wallet.js';
import { webhookRouter } from './webhooks.js';
import { earningsRouter } from './earnings.js';
import { payoutsRouter } from './payouts.js';
import { adminSettingsRouter } from './admin-settings.js';
import { roleInvitationRouter } from './role-invitation.js';
import { notificationRouter } from './notification.js';
import { rateLimitPublic } from '../middleware/rate-limit.js';
import { isDev } from '../config/env.js';
import { adminDevRouter } from './admin-dev.js';
import { publicRouter } from './public.js';
import { analyticsRouter } from './analytics.js';
import { analyticsAiRouter } from './analytics-ai.js';
import { matchingRouter } from './matching.js';
import { featureFlagRouter } from './feature-flags.js';

/**
 * Root API router — mounted at /api/v1 by the app factory.
 *
 * Middleware ordering is deliberate:
 *   1. `rateLimitPublic` runs first for every /api/v1 request, but its
 *      `skipHealth` predicate exempts `/health` and `/health/*` so
 *      monitoring probes are never throttled.
 *   2. Feature routers mount after the limiter. Individual authenticated
 *      endpoints layer `rateLimitAuthenticated` after `authenticate` so
 *      the per-user bucket is keyed by `req.userId` rather than by IP.
 */
const api = Router();

api.use(rateLimitPublic);

api.use('/health', healthRouter);
api.use('/auth', authRouter);
api.use('/recruiters', recruiterProfileRouter);
api.use('/companies', companyProfileRouter);
api.use('/roles', roleRouter);
api.use('/upload', uploadRouter);
api.use('/submissions', submissionRouter);
api.use('/wallet', walletRouter);
api.use('/earnings', earningsRouter);
api.use('/payouts', payoutsRouter);
api.use('/admin', adminSettingsRouter);
api.use('/', roleInvitationRouter);
api.use('/notifications', notificationRouter);
api.use('/analytics', analyticsRouter);
api.use('/analytics/ai', analyticsAiRouter);
api.use('/matching', matchingRouter);
api.use('/feature-flags', featureFlagRouter);
api.use('/webhooks', webhookRouter);
api.use('/', publicRouter);
if (isDev) {
  api.use('/admin/dev', adminDevRouter);
  console.log('[startup] Dev-only admin endpoints mounted at /api/v1/admin/dev');
}

export { api as apiRouter };
