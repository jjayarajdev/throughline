import { Router } from 'express';
import { UserRole } from '@gigcruite/types';
import { AppError } from '../lib/app-error.js';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import * as roleService from '../services/role.service.js';
import * as submissionService from '../services/submission.service.js';
import {
  CreateRoleSchema,
  ListOwnerRolesQuerySchema,
  ListPublicRolesQuerySchema,
  UpdateRoleSchema,
  AdminRoleActionSchema,
  AdminRejectRoleSchema,
  type CreateRoleBody,
  type ListOwnerRolesQuery,
  type ListPublicRolesQuery,
  type UpdateRoleBody,
} from '../validators/role.js';
import {
  ListRoleSubmissionsQuerySchema,
  type ListRoleSubmissionsQuery,
} from '../validators/submission.js';

/**
 * Role routes — mounted at /api/v1/roles by the root router.
 *
 * Surface:
 *   - Company-owned CRUD + status transitions (POST, PATCH, GET /me, ...publish/pause/resume/close)
 *   - Shared detail (GET /:id) — access gated inside the service
 *   - Admin listing (GET /admin) — cross-company
 *
 * Recruiter-facing browsing (`GET /roles` list + public detail view)
 * is deliberately deferred to Wave 3, which is when we extend the
 * service with filters + pagination for the recruiter experience.
 */

const router = Router();

// --------------------------------------------------------------------
// Public browse (recruiter + admin — active roles only)
// --------------------------------------------------------------------

router.get(
  '/',
  ...authorize(UserRole.RECRUITER, UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(ListPublicRolesQuerySchema, 'query'),
  async (req, res) => {
    const filters = req.query as unknown as ListPublicRolesQuery;

    // Resolve recruiter profile for visibility + country filtering (admins see all).
    let recruiterProfileId: string | undefined;
    let recruiterCountry: string | undefined;
    if (req.userRole === 'recruiter' && req.userId) {
      const profile = await submissionService.resolveRecruiterProfile(req.userId!);
      recruiterProfileId = profile.id;
      recruiterCountry = profile.country;
    }

    const result = await roleService.listPublicRoles(
      {
        ...(filters.search !== undefined ? { search: filters.search } : {}),
        ...(filters.roleType !== undefined ? { roleType: filters.roleType } : {}),
        ...(filters.skills !== undefined ? { skills: filters.skills } : {}),
        ...(filters.minCtc !== undefined ? { minCtc: filters.minCtc } : {}),
        ...(filters.maxCtc !== undefined ? { maxCtc: filters.maxCtc } : {}),
        ...(filters.isRemote !== undefined ? { isRemote: filters.isRemote } : {}),
        ...(filters.employmentType !== undefined
          ? { employmentType: filters.employmentType }
          : {}),
        ...(filters.status !== undefined ? { status: filters.status } : {}),
        ...(filters.cursor !== undefined ? { cursor: filters.cursor } : {}),
        ...(filters.pageSize !== undefined ? { pageSize: filters.pageSize } : {}),
      },
      recruiterProfileId,
      recruiterCountry,
    );
    ok(res, result);
  },
);

// --------------------------------------------------------------------
// Company-only endpoints
// --------------------------------------------------------------------

router.post(
  '/',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  validate(CreateRoleSchema),
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const input = req.body as CreateRoleBody;
    const role = await roleService.createRole(req.userId, input);
    ok(res, role, 201);
  },
);

router.get(
  '/me',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  validate(ListOwnerRolesQuerySchema, 'query'),
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const filters = req.query as unknown as ListOwnerRolesQuery;
    const result = await roleService.listCompanyRoles(req.userId, {
      ...(filters.status !== undefined ? { status: filters.status } : {}),
      ...(filters.search !== undefined ? { search: filters.search } : {}),
      ...(filters.page !== undefined ? { page: filters.page } : {}),
      ...(filters.pageSize !== undefined ? { pageSize: filters.pageSize } : {}),
    });
    ok(res, result);
  },
);

router.patch(
  '/:id',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  validate(UpdateRoleSchema),
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Role id is required');
    }
    const patch = req.body as UpdateRoleBody;
    const role = await roleService.updateRole(req.userId, id, patch);
    ok(res, role);
  },
);

router.post(
  '/:id/submit',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Role id is required');
    }
    const role = await roleService.submitRole(req.userId, id);
    ok(res, role);
  },
);

router.post(
  '/:id/pause',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Role id is required');
    }
    const role = await roleService.pauseRole(req.userId, id);
    ok(res, role);
  },
);

router.post(
  '/:id/resume',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Role id is required');
    }
    const role = await roleService.resumeRole(req.userId, id);
    ok(res, role);
  },
);

router.post(
  '/:id/close',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Role id is required');
    }
    const role = await roleService.closeRole(req.userId, id);
    ok(res, role);
  },
);

// --------------------------------------------------------------------
// Admin approve / reject
// --------------------------------------------------------------------

router.post(
  '/:id/approve',
  ...authorize(UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(AdminRoleActionSchema),
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Role id is required');
    }
    const body = req.body as { comment?: string; platformCommissionPct?: number };
    const role = await roleService.approveRole(req.userId, id, body.comment, body.platformCommissionPct);
    ok(res, role);
  },
);

router.post(
  '/:id/reject',
  ...authorize(UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(AdminRejectRoleSchema),
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Role id is required');
    }
    const role = await roleService.rejectRole(req.userId, id, (req.body as { comment: string }).comment);
    ok(res, role);
  },
);

router.get(
  '/:id/status-history',
  ...authorize(),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Role id is required');
    }
    const history = await roleService.getRoleStatusHistory(id);
    ok(res, history);
  },
);

// --------------------------------------------------------------------
// Admin endpoints (mounted BEFORE the generic /:id so the literal
// path wins the router match).
// --------------------------------------------------------------------

router.get(
  '/admin',
  ...authorize(UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(ListOwnerRolesQuerySchema, 'query'),
  async (req, res) => {
    const filters = req.query as unknown as ListOwnerRolesQuery;
    const result = await roleService.listAllRolesForAdmin({
      ...(filters.status !== undefined ? { status: filters.status } : {}),
      ...(filters.search !== undefined ? { search: filters.search } : {}),
      ...(filters.page !== undefined ? { page: filters.page } : {}),
      ...(filters.pageSize !== undefined ? { pageSize: filters.pageSize } : {}),
    });
    ok(res, result);
  },
);

// --------------------------------------------------------------------
// Company-scoped submissions for a specific role
// --------------------------------------------------------------------

router.get(
  '/:id/submissions',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  validate(ListRoleSubmissionsQuerySchema, 'query'),
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Role id is required');
    }
    const filters = req.query as unknown as ListRoleSubmissionsQuery;
    const result = await submissionService.listRoleSubmissions(
      req.userId,
      id,
      {
        ...(filters.status !== undefined ? { status: filters.status } : {}),
        ...(filters.page !== undefined ? { page: filters.page } : {}),
        ...(filters.pageSize !== undefined ? { pageSize: filters.pageSize } : {}),
      },
    );
    ok(res, result);
  },
);

// --------------------------------------------------------------------
// JD download (any authenticated user who can see the role)
// --------------------------------------------------------------------

router.post(
  '/:id/jd-download',
  ...authorize(),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId || !req.userRole) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Role id is required');
    }
    const result = await roleService.downloadJd(id, {
      userId: req.userId,
      role: req.userRole,
    });
    ok(res, result);
  },
);

// --------------------------------------------------------------------
// Public (recruiter-facing) detail endpoint. Mounted BEFORE the
// generic `/:id` so the literal `/public` suffix wins the route
// match. Returns 404 for any non-active role.
// --------------------------------------------------------------------

router.get(
  '/:id/public',
  ...authorize(),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) {
      throw AppError.unauthorized('Missing user context');
    }
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw AppError.badRequest('Role id is required');
    }
    const role = await roleService.getPublicRoleById(id);
    ok(res, role);
  },
);

// --------------------------------------------------------------------
// Shared detail endpoint — access-gated inside the service
// --------------------------------------------------------------------

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
      throw AppError.badRequest('Role id is required');
    }
    const role = await roleService.getRoleById(id, {
      userId: req.userId,
      role: req.userRole,
    });
    ok(res, role);
  },
);

export { router as roleRouter };
