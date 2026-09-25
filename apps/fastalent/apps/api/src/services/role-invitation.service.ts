import {
  Prisma,
  RoleVisibility as PrismaRoleVisibility,
} from '@prisma/client';
import type { RoleInvitationResponse } from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import { AppError } from '../lib/app-error.js';
import { notify } from '../lib/notify.js';
import { NotificationType } from '@gigcruite/types';

// --------------------------------------------------------------------
// Projection
// --------------------------------------------------------------------

function projectInvitation(row: any): RoleInvitationResponse {
  return {
    id: row.id,
    roleId: row.roleId,
    recruiterProfileId: row.recruiterProfileId,
    invitedByUserId: row.invitedByUserId,
    status: row.status,
    message: row.message,
    respondedAt: row.respondedAt ? row.respondedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    ...(row.recruiterProfile
      ? {
          recruiter: {
            id: row.recruiterProfile.id,
            fullName: row.recruiterProfile.fullName,
            specializations: row.recruiterProfile.specializations ?? [],
            reputationTier: row.recruiterProfile.reputationTier,
            reputationScore: row.recruiterProfile.reputationScore,
          },
        }
      : {}),
    ...(row.role
      ? {
          role: {
            id: row.role.id,
            title: row.role.title,
          },
        }
      : {}),
  };
}

// --------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------

async function resolveCompanyId(userId: string): Promise<string> {
  const profile = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw AppError.internal('Company profile missing for authenticated company user');
  }
  return profile.id;
}

async function resolveRecruiterProfileId(userId: string): Promise<string> {
  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw AppError.internal('Recruiter profile missing for authenticated recruiter user');
  }
  return profile.id;
}

// --------------------------------------------------------------------
// Mutations
// --------------------------------------------------------------------

/**
 * Company invites a recruiter to an invite_only (or preferred) role.
 */
export async function createInvitation(
  userId: string,
  roleId: string,
  recruiterProfileId: string,
  message?: string | null,
): Promise<RoleInvitationResponse> {
  const companyId = await resolveCompanyId(userId);

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role || role.companyId !== companyId) {
    throw AppError.notFound('Role not found');
  }

  if (role.visibility === PrismaRoleVisibility.open) {
    throw AppError.badRequest('Open roles do not require invitations');
  }

  // Verify the recruiter profile exists
  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { id: recruiterProfileId },
    select: { id: true },
  });
  if (!recruiter) {
    throw AppError.notFound('Recruiter not found');
  }

  try {
    const created = await prisma.roleInvitation.create({
      data: {
        roleId,
        recruiterProfileId,
        invitedByUserId: userId,
        message: message ?? null,
      },
      include: {
        recruiterProfile: {
          select: {
            id: true,
            fullName: true,
            specializations: true,
            reputationTier: true,
            reputationScore: true,
          },
        },
      },
    });
    // Notify the recruiter about the invitation
    const recruiterUser = await prisma.recruiterProfile.findUnique({
      where: { id: recruiterProfileId },
      select: { userId: true },
    });
    if (recruiterUser) {
      void notify({
        userId: recruiterUser.userId,
        type: NotificationType.ROLE_INVITATION,
        title: 'New role invitation',
        body: `You have been invited to a role: ${role.title ?? 'Untitled'}.`,
        resourceType: 'role_invitation',
        resourceId: created.id,
      });
    }

    return projectInvitation(created);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw AppError.conflict('This recruiter has already been invited to this role');
    }
    throw err;
  }
}

/**
 * Recruiter accepts an invitation.
 */
export async function acceptInvitation(
  userId: string,
  invitationId: string,
): Promise<RoleInvitationResponse> {
  const recruiterProfileId = await resolveRecruiterProfileId(userId);

  const invitation = await prisma.roleInvitation.findUnique({
    where: { id: invitationId },
  });
  if (!invitation || invitation.recruiterProfileId !== recruiterProfileId) {
    throw AppError.notFound('Invitation not found');
  }
  if (invitation.status !== 'pending') {
    throw AppError.conflict(`Invitation is already ${invitation.status}`);
  }

  const updated = await prisma.roleInvitation.update({
    where: { id: invitationId },
    data: { status: 'accepted', respondedAt: new Date() },
    include: {
      role: { select: { id: true, title: true } },
    },
  });
  return projectInvitation(updated);
}

/**
 * Recruiter declines an invitation.
 */
export async function declineInvitation(
  userId: string,
  invitationId: string,
): Promise<RoleInvitationResponse> {
  const recruiterProfileId = await resolveRecruiterProfileId(userId);

  const invitation = await prisma.roleInvitation.findUnique({
    where: { id: invitationId },
  });
  if (!invitation || invitation.recruiterProfileId !== recruiterProfileId) {
    throw AppError.notFound('Invitation not found');
  }
  if (invitation.status !== 'pending') {
    throw AppError.conflict(`Invitation is already ${invitation.status}`);
  }

  const updated = await prisma.roleInvitation.update({
    where: { id: invitationId },
    data: { status: 'declined', respondedAt: new Date() },
    include: {
      role: { select: { id: true, title: true } },
    },
  });
  return projectInvitation(updated);
}

// --------------------------------------------------------------------
// Reads
// --------------------------------------------------------------------

/**
 * List invitations for a role (company view).
 */
export async function listRoleInvitations(
  userId: string,
  roleId: string,
): Promise<RoleInvitationResponse[]> {
  const companyId = await resolveCompanyId(userId);

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role || role.companyId !== companyId) {
    throw AppError.notFound('Role not found');
  }

  const invitations = await prisma.roleInvitation.findMany({
    where: { roleId },
    orderBy: { createdAt: 'desc' },
    include: {
      recruiterProfile: {
        select: {
          id: true,
          fullName: true,
          specializations: true,
          reputationTier: true,
          reputationScore: true,
        },
      },
    },
  });

  return invitations.map(projectInvitation);
}

/**
 * List invitations for the authenticated recruiter (their pending/accepted invites).
 */
export async function listMyInvitations(
  userId: string,
): Promise<RoleInvitationResponse[]> {
  const recruiterProfileId = await resolveRecruiterProfileId(userId);

  const invitations = await prisma.roleInvitation.findMany({
    where: { recruiterProfileId },
    orderBy: { createdAt: 'desc' },
    include: {
      role: { select: { id: true, title: true } },
    },
  });

  return invitations.map(projectInvitation);
}

/**
 * Search recruiters by name (for company to invite). Returns basic profile info.
 */
export async function searchRecruiters(
  query: string,
  limit: number = 10,
): Promise<Array<{ id: string; fullName: string; specializations: string[]; reputationTier: string; reputationScore: number }>> {
  const profiles = await prisma.recruiterProfile.findMany({
    where: {
      fullName: { contains: query.trim(), mode: 'insensitive' },
      user: { status: 'active' },
    },
    select: {
      id: true,
      fullName: true,
      specializations: true,
      reputationTier: true,
      reputationScore: true,
    },
    take: Math.min(limit, 20),
    orderBy: { fullName: 'asc' },
  });

  return profiles.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    specializations: p.specializations ?? [],
    reputationTier: p.reputationTier,
    reputationScore: p.reputationScore,
  }));
}
