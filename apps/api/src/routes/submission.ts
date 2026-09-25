import { Router } from 'express';
import { UserRole } from '@gigcruite/types';
import { AppError } from '../lib/app-error.js';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import * as submissionService from '../services/submission.service.js';
import * as submissionStatusService from '../services/submission-status.service.js';
import {
  CreateSubmissionSchema,
  ListRecruiterSubmissionsQuerySchema,
  TransitionSubmissionSchema,
  type CreateSubmissionBody,
  type ListRecruiterSubmissionsQuery,
  type TransitionSubmissionBody,
} from '../validators/submission.js';

/**
 * Submission routes — mounted at /api/v1/submissions.
 *
 * Wave 2 scope:
 *   - POST /            Recruiter creates a submission (role + CV + candidate)
 *   - GET  /:id         Any authenticated user; access gated inside the service
 *
 * Wave 3 adds listing (recruiter's own + company's own per-role) and
 * the company-side pre-signed download endpoint. Wave 4 adds status
 * transitions.
 */

const router = Router();

router.post(
  '/',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  validate(CreateSubmissionSchema),
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const input = req.body as CreateSubmissionBody;
    const submission = await submissionService.createSubmission(
      req.userId,
      input,
    );
    ok(res, submission, 201);
  },
);

router.get(
  '/me',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  validate(ListRecruiterSubmissionsQuerySchema, 'query'),
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const filters = req.query as unknown as ListRecruiterSubmissionsQuery;
    const result = await submissionService.listRecruiterSubmissions(
      req.userId,
      {
        ...(filters.roleId !== undefined ? { roleId: filters.roleId } : {}),
        ...(filters.status !== undefined ? { status: filters.status } : {}),
        ...(filters.page !== undefined ? { page: filters.page } : {}),
        ...(filters.pageSize !== undefined ? { pageSize: filters.pageSize } : {}),
      },
    );
    ok(res, result);
  },
);

router.post(
  '/:id/download',
  ...authorize(UserRole.COMPANY, UserRole.RECRUITER),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId || !req.userRole) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Submission id is required');
    }
    const result = await submissionService.downloadCv(
      req.userId,
      id,
      req.userRole as 'company' | 'recruiter',
    );
    ok(res, result);
  },
);

// Wave 4 — status transition
router.post(
  '/:id/status',
  ...authorize(),
  rateLimitAuthenticated,
  validate(TransitionSubmissionSchema),
  async (req, res) => {
    if (!req.userId || !req.userRole) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Submission id is required');
    }
    const input = req.body as TransitionSubmissionBody;
    const result = await submissionStatusService.transitionStatus(
      req.userId,
      req.userRole,
      id,
      input,
    );
    ok(res, result);
  },
);

// Wave 4 — status events timeline
router.get(
  '/:id/events',
  ...authorize(),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId || !req.userRole) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Submission id is required');
    }
    const events = await submissionStatusService.listStatusEvents(
      req.userId,
      req.userRole,
      id,
    );
    ok(res, events);
  },
);

router.get(
  '/:id',
  ...authorize(),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId || !req.userRole) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Submission id is required');
    }
    const submission = await submissionService.getSubmissionById(id, {
      userId: req.userId,
      role: req.userRole,
    });
    ok(res, submission);
  },
);

export { router as submissionRouter };
