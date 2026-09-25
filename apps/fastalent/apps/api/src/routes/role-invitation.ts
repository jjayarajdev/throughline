import { Router } from 'express';
import { UserRole } from '@gigcruite/types';
import { AppError } from '../lib/app-error.js';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import * as roleInvitationService from '../services/role-invitation.service.js';
import { CreateRoleInvitationSchema, type CreateRoleInvitationBody } from '../validators/role-invitation.js';

const router = Router();

// --------------------------------------------------------------------
// Company: invite a recruiter to a role
// --------------------------------------------------------------------

router.post(
  '/roles/:id/invite',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  validate(CreateRoleInvitationSchema),
  async (req, res) => {
    if (!req.userId) throw AppError.unauthorized('Missing user context');
    const roleId = req.params['id'];
    if (typeof roleId !== 'string' || !roleId) {
      throw AppError.badRequest('Role id is required');
    }
    const body = req.body as CreateRoleInvitationBody;
    const invitation = await roleInvitationService.createInvitation(
      req.userId,
      roleId,
      body.recruiterProfileId,
      body.message,
    );
    ok(res, invitation, 201);
  },
);

// --------------------------------------------------------------------
// Company: list invitations for a role
// --------------------------------------------------------------------

router.get(
  '/roles/:id/invitations',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) throw AppError.unauthorized('Missing user context');
    const roleId = req.params['id'];
    if (typeof roleId !== 'string' || !roleId) {
      throw AppError.badRequest('Role id is required');
    }
    const invitations = await roleInvitationService.listRoleInvitations(req.userId, roleId);
    ok(res, invitations);
  },
);

// --------------------------------------------------------------------
// Company: search recruiters to invite
// --------------------------------------------------------------------

router.get(
  '/recruiters/search',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  async (req, res) => {
    const q = typeof req.query['q'] === 'string' ? req.query['q'] : '';
    if (!q.trim()) {
      ok(res, []);
      return;
    }
    const results = await roleInvitationService.searchRecruiters(q);
    ok(res, results);
  },
);

// --------------------------------------------------------------------
// Recruiter: list my invitations
// --------------------------------------------------------------------

router.get(
  '/invitations/me',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) throw AppError.unauthorized('Missing user context');
    const invitations = await roleInvitationService.listMyInvitations(req.userId);
    ok(res, invitations);
  },
);

// --------------------------------------------------------------------
// Recruiter: accept an invitation
// --------------------------------------------------------------------

router.post(
  '/invitations/:id/accept',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) throw AppError.unauthorized('Missing user context');
    const invitationId = req.params['id'];
    if (typeof invitationId !== 'string' || !invitationId) {
      throw AppError.badRequest('Invitation id is required');
    }
    const invitation = await roleInvitationService.acceptInvitation(req.userId, invitationId);
    ok(res, invitation);
  },
);

// --------------------------------------------------------------------
// Recruiter: decline an invitation
// --------------------------------------------------------------------

router.post(
  '/invitations/:id/decline',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  async (req, res) => {
    if (!req.userId) throw AppError.unauthorized('Missing user context');
    const invitationId = req.params['id'];
    if (typeof invitationId !== 'string' || !invitationId) {
      throw AppError.badRequest('Invitation id is required');
    }
    const invitation = await roleInvitationService.declineInvitation(req.userId, invitationId);
    ok(res, invitation);
  },
);

export { router as roleInvitationRouter };
