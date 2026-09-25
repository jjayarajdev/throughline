import { Router } from 'express';
import { UserRole } from '@gigcruite/types';
import { AppError } from '../lib/app-error.js';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../config/prisma.js';
import * as s3Service from '../services/s3.service.js';
import {
  CvUploadIntentSchema,
  type CvUploadIntentBody,
} from '../validators/submission.js';
import {
  JdUploadIntentSchema,
  type JdUploadIntentBody,
} from '../validators/role.js';

/**
 * Upload routes — mounted at /api/v1/upload.
 *
 * Only one endpoint in Wave 2: `POST /cv-intent`, which hands the
 * recruiter a pre-signed PUT URL bound to the declared filename +
 * size + MIME. The recruiter uploads directly to S3 and then calls
 * POST /submissions with the returned s3Key.
 */

const router = Router();

router.post(
  '/cv-intent',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  validate(CvUploadIntentSchema),
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    // Resolve the recruiter profile inline — this is the only place in
    // the upload router that needs it, so an explicit lookup is
    // clearer than importing the service helper.
    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId: req.userId },
      select: { id: true },
    });
    if (!profile) {
      throw AppError.internal(
        'Recruiter profile missing for authenticated recruiter user',
      );
    }

    const input = req.body as CvUploadIntentBody;
    const result = await s3Service.createUploadIntent(profile.id, input);
    ok(res, result, 201);
  },
);

router.post(
  '/jd-intent',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  validate(JdUploadIntentSchema),
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const profile = await prisma.companyProfile.findUnique({
      where: { userId: req.userId },
      select: { id: true },
    });
    if (!profile) {
      throw AppError.internal(
        'Company profile missing for authenticated company user',
      );
    }

    const input = req.body as JdUploadIntentBody;
    const result = await s3Service.createJdUploadIntent(profile.id, input);
    ok(res, result, 201);
  },
);

export { router as uploadRouter };
