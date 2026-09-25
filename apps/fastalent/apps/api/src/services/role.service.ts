import type { Role as PrismaRole, CompanyProfile as PrismaCompanyProfile } from '@prisma/client';
import {
  Prisma,
  RoleStatus as PrismaRoleStatus,
  RoleType as PrismaRoleType,
  PayoutType as PrismaPayoutType,
  PayoutMode as PrismaPayoutMode,
  RoleVisibility as PrismaRoleVisibility,
  SubmissionStatus as PrismaSubmissionStatus,
} from '@prisma/client';
import {
  NotificationType,
} from '@gigcruite/types';
import type {
  CursorPaginatedData,
  JdDownloadResponse,
  ListOwnerRolesFilters,
  ListPublicRolesFilters,
  RoleOwnerResponse,
  RolePublicResponse,
  RoleStatus,
  RoleType,
  RoleVisibility,
  PayoutType,
  PayoutMode,
  RoleStatusHistoryEntry,
} from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import { AppError } from '../lib/app-error.js';
import * as s3Service from './s3.service.js';
import * as companyWalletService from './company-wallet.service.js';
import * as notificationService from './notification.service.js';
import * as platformSettingsService from './platform-settings.service.js';
import { enqueueJdExtraction } from '../workers/matching.worker.js';
import type {
  CreateRoleBody,
  UpdateRoleBody,
} from '../validators/role.js';

/**
 * Role service — Phase 2 + Phase 11/12 overhaul.
 *
 * Phase 11 changes:
 *   - payoutPerShortlist/payoutPerHire → shortlistPayoutMode/Value + hirePayoutMode/Value
 *   - country + currency on roles (inherited from company)
 *   - platformCommissionPct nullable (resolved at approve time)
 *   - active → published rename
 *   - New status flow: draft → submitted → published/rejected
 *   - RoleStatusHistory audit trail
 */

// --------------------------------------------------------------------
// Projection
// --------------------------------------------------------------------

function projectRole(row: PrismaRole): RoleOwnerResponse {
  return {
    id: row.id,
    companyId: row.companyId,
    title: row.title,
    description: row.description,
    roleType: row.roleType as unknown as RoleType,
    status: row.status as unknown as RoleStatus,
    visibility: row.visibility as unknown as RoleVisibility,
    country: row.country,
    currency: row.currency,
    location: row.location,
    isRemote: row.isRemote,
    employmentType: row.employmentType,
    experienceMin: row.experienceMin,
    experienceMax: row.experienceMax,
    skills: row.skills ?? [],
    ctcMin: row.ctcMin.toString(),
    ctcMax: row.ctcMax.toString(),
    payoutType: row.payoutType as unknown as PayoutType,
    shortlistPayoutMode: row.shortlistPayoutMode as unknown as PayoutMode | null,
    shortlistPayoutValue: row.shortlistPayoutValue?.toString() ?? null,
    hirePayoutMode: row.hirePayoutMode as unknown as PayoutMode | null,
    hirePayoutValue: row.hirePayoutValue?.toString() ?? null,
    platformCommissionPct: row.platformCommissionPct?.toString() ?? null,
    vendorBenchmarkPct: row.vendorBenchmarkPct?.toString() ?? null,
    maxSubmissions: row.maxSubmissions,
    maxPerRecruiter: row.maxPerRecruiter,
    openPositions: row.openPositions,
    submissionsCount: row.submissionsCount,
    shortlistedCount: row.shortlistedCount,
    hiredCount: row.hiredCount,
    jdOriginalFilename: row.jdOriginalFilename,
    jdSizeBytes: row.jdSizeBytes,
    jdMimeType: row.jdMimeType,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    firstSubmissionAt: row.firstSubmissionAt ? row.firstSubmissionAt.toISOString() : null,
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// --------------------------------------------------------------------
// Company scope helpers
// --------------------------------------------------------------------

async function resolveCompanyId(userId: string): Promise<string> {
  const profile = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw AppError.internal(
      'Company profile missing for authenticated company user',
    );
  }
  return profile.id;
}

async function resolveCompanyProfile(userId: string) {
  const profile = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { id: true, country: true, currency: true, defaultCommissionPct: true },
  });
  if (!profile) {
    throw AppError.internal(
      'Company profile missing for authenticated company user',
    );
  }
  return profile;
}

async function getOwnedRole(
  roleId: string,
  companyId: string,
): Promise<PrismaRole> {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role || role.companyId !== companyId) {
    throw AppError.notFound('Role not found');
  }
  return role;
}

// --------------------------------------------------------------------
// Status history helper
// --------------------------------------------------------------------

async function recordStatusChange(
  roleId: string,
  fromStatus: PrismaRoleStatus | null,
  toStatus: PrismaRoleStatus,
  changedBy: string,
  comment?: string | null,
  tx?: any,
): Promise<void> {
  const client = tx ?? prisma;
  await client.roleStatusHistory.create({
    data: {
      roleId,
      fromStatus,
      toStatus,
      changedBy,
      ...(comment ? { comment } : {}),
    },
  });
}

// --------------------------------------------------------------------
// Lock amount calculation
// --------------------------------------------------------------------

function calculateLockAmount(role: PrismaRole): Prisma.Decimal {
  let total = new Prisma.Decimal(0);

  // Shortlist payout lock
  if (
    role.shortlistPayoutMode && role.shortlistPayoutValue &&
    (role.payoutType === PrismaPayoutType.per_shortlist || role.payoutType === PrismaPayoutType.hybrid)
  ) {
    if (role.shortlistPayoutMode === PrismaPayoutMode.flat) {
      total = total.add(role.shortlistPayoutValue.mul(role.maxSubmissions));
    } else {
      // percentage: lock based on ctcMax * pct / 100 * maxSubmissions
      total = total.add(
        role.ctcMax.mul(role.shortlistPayoutValue).div(100).mul(role.maxSubmissions),
      );
    }
  }

  // Hire payout lock — based on openPositions (not maxSubmissions)
  if (
    role.hirePayoutMode && role.hirePayoutValue &&
    (role.payoutType === PrismaPayoutType.per_hire || role.payoutType === PrismaPayoutType.hybrid)
  ) {
    if (role.hirePayoutMode === PrismaPayoutMode.flat) {
      total = total.add(role.hirePayoutValue.mul(role.openPositions));
    } else {
      total = total.add(
        role.ctcMax.mul(role.hirePayoutValue).div(100).mul(role.openPositions),
      );
    }
  }

  return total;
}

// --------------------------------------------------------------------
// Mutations
// --------------------------------------------------------------------

export async function createRole(
  userId: string,
  input: CreateRoleBody,
): Promise<RoleOwnerResponse> {
  const companyProfile = await resolveCompanyProfile(userId);

  const created = await prisma.role.create({
    data: {
      companyId: companyProfile.id,
      title: input.title,
      description: input.description,
      roleType: input.roleType as unknown as PrismaRoleType,
      status: PrismaRoleStatus.draft,
      ...(input.visibility !== undefined
        ? { visibility: input.visibility as unknown as PrismaRoleVisibility }
        : {}),
      // Country: from input or inherit from company
      country: input.country ?? companyProfile.country,
      currency: companyProfile.currency,
      location: input.location,
      isRemote: input.isRemote,
      employmentType: input.employmentType,
      experienceMin: input.experienceMin,
      experienceMax: input.experienceMax,
      skills: input.skills,
      ctcMin: new Prisma.Decimal(input.ctcMin),
      ctcMax: new Prisma.Decimal(input.ctcMax),
      payoutType: input.payoutType as unknown as PrismaPayoutType,
      ...(input.shortlistPayoutMode !== undefined
        ? { shortlistPayoutMode: input.shortlistPayoutMode as unknown as PrismaPayoutMode }
        : {}),
      ...(input.shortlistPayoutValue !== undefined
        ? { shortlistPayoutValue: new Prisma.Decimal(input.shortlistPayoutValue) }
        : {}),
      ...(input.hirePayoutMode !== undefined
        ? { hirePayoutMode: input.hirePayoutMode as unknown as PrismaPayoutMode }
        : {}),
      ...(input.hirePayoutValue !== undefined
        ? { hirePayoutValue: new Prisma.Decimal(input.hirePayoutValue) }
        : {}),
      // platformCommissionPct: leave null at creation (resolved at approve time)
      ...(input.maxSubmissions !== undefined
        ? { maxSubmissions: input.maxSubmissions }
        : {}),
      ...(input.maxPerRecruiter !== undefined
        ? { maxPerRecruiter: input.maxPerRecruiter }
        : {}),
      ...(input.openPositions !== undefined
        ? { openPositions: input.openPositions }
        : {}),
      ...(input.jdS3Key !== undefined ? { jdS3Key: input.jdS3Key } : {}),
      ...(input.jdOriginalFilename !== undefined
        ? { jdOriginalFilename: input.jdOriginalFilename }
        : {}),
      ...(input.jdSizeBytes !== undefined
        ? { jdSizeBytes: input.jdSizeBytes }
        : {}),
      ...(input.jdMimeType !== undefined
        ? { jdMimeType: input.jdMimeType }
        : {}),
    },
  });

  return projectRole(created);
}

/**
 * PATCH /roles/:id — partial update. Only legal while role.status is
 * `draft`, `rejected`, or `paused`.
 */
export async function updateRole(
  userId: string,
  roleId: string,
  patch: UpdateRoleBody,
): Promise<RoleOwnerResponse> {
  const companyId = await resolveCompanyId(userId);
  const role = await getOwnedRole(roleId, companyId);

  if (
    role.status !== PrismaRoleStatus.draft &&
    role.status !== PrismaRoleStatus.rejected &&
    role.status !== PrismaRoleStatus.paused
  ) {
    throw AppError.conflict(
      `Role cannot be edited while in status "${role.status}". Pause it first if you need to make changes.`,
    );
  }

  const data: Prisma.RoleUpdateInput = {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.roleType !== undefined
      ? { roleType: patch.roleType as unknown as PrismaRoleType }
      : {}),
    ...(patch.visibility !== undefined
      ? { visibility: patch.visibility as unknown as PrismaRoleVisibility }
      : {}),
    ...(patch.country !== undefined ? { country: patch.country } : {}),
    ...(patch.location !== undefined ? { location: patch.location } : {}),
    ...(patch.isRemote !== undefined ? { isRemote: patch.isRemote } : {}),
    ...(patch.employmentType !== undefined
      ? { employmentType: patch.employmentType }
      : {}),
    ...(patch.experienceMin !== undefined
      ? { experienceMin: patch.experienceMin }
      : {}),
    ...(patch.experienceMax !== undefined
      ? { experienceMax: patch.experienceMax }
      : {}),
    ...(patch.skills !== undefined ? { skills: { set: patch.skills } } : {}),
    ...(patch.ctcMin !== undefined
      ? { ctcMin: new Prisma.Decimal(patch.ctcMin) }
      : {}),
    ...(patch.ctcMax !== undefined
      ? { ctcMax: new Prisma.Decimal(patch.ctcMax) }
      : {}),
    ...(patch.payoutType !== undefined
      ? { payoutType: patch.payoutType as unknown as PrismaPayoutType }
      : {}),
    ...(patch.shortlistPayoutMode !== undefined
      ? { shortlistPayoutMode: patch.shortlistPayoutMode as unknown as PrismaPayoutMode }
      : {}),
    ...(patch.shortlistPayoutValue !== undefined
      ? { shortlistPayoutValue: new Prisma.Decimal(patch.shortlistPayoutValue) }
      : {}),
    ...(patch.hirePayoutMode !== undefined
      ? { hirePayoutMode: patch.hirePayoutMode as unknown as PrismaPayoutMode }
      : {}),
    ...(patch.hirePayoutValue !== undefined
      ? { hirePayoutValue: new Prisma.Decimal(patch.hirePayoutValue) }
      : {}),
    ...(patch.maxSubmissions !== undefined
      ? { maxSubmissions: patch.maxSubmissions }
      : {}),
    ...(patch.maxPerRecruiter !== undefined
      ? { maxPerRecruiter: patch.maxPerRecruiter }
      : {}),
    ...(patch.openPositions !== undefined
      ? { openPositions: patch.openPositions }
      : {}),
    ...(patch.jdS3Key !== undefined ? { jdS3Key: patch.jdS3Key } : {}),
    ...(patch.jdOriginalFilename !== undefined
      ? { jdOriginalFilename: patch.jdOriginalFilename }
      : {}),
    ...(patch.jdSizeBytes !== undefined
      ? { jdSizeBytes: patch.jdSizeBytes }
      : {}),
    ...(patch.jdMimeType !== undefined
      ? { jdMimeType: patch.jdMimeType }
      : {}),
  };

  const updated = await prisma.role.update({
    where: { id: roleId },
    data,
  });

  return projectRole(updated);
}

// --------------------------------------------------------------------
// Status transitions
// --------------------------------------------------------------------

/**
 * Company submits role for admin review: draft/rejected → submitted.
 */
export async function submitRole(
  userId: string,
  roleId: string,
): Promise<RoleOwnerResponse> {
  const companyId = await resolveCompanyId(userId);
  const role = await getOwnedRole(roleId, companyId);

  if (
    role.status !== PrismaRoleStatus.draft &&
    role.status !== PrismaRoleStatus.rejected
  ) {
    throw AppError.conflict(
      `Only draft or rejected roles can be submitted for review (current status: "${role.status}").`,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.role.update({
      where: { id: roleId },
      data: { status: PrismaRoleStatus.submitted },
    });

    await recordStatusChange(roleId, role.status, PrismaRoleStatus.submitted, userId, null, tx);

    // Notify all admin users
    const admins = await tx.user.findMany({
      where: { role: 'admin', status: 'active' },
      select: { id: true },
    });
    for (const admin of admins) {
      await notificationService.createNotification(
        {
          userId: admin.id,
          type: NotificationType.ROLE_SUBMITTED_FOR_REVIEW,
          title: 'New role submitted for review',
          body: `Role "${role.title}" has been submitted for review.`,
          resourceType: 'role',
          resourceId: roleId,
        },
        tx as any,
      );
    }

    return result;
  });

  return projectRole(updated);
}

/**
 * Admin approves role: submitted → published.
 * Resolves commission (role > company > global) and locks wallet funds.
 */
export async function approveRole(
  adminUserId: string,
  roleId: string,
  comment?: string,
  overrideCommissionPct?: number,
): Promise<RoleOwnerResponse> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      company: { select: { id: true, userId: true, defaultCommissionPct: true } },
    },
  });
  if (!role) throw AppError.notFound('Role not found');

  if (role.status !== PrismaRoleStatus.submitted) {
    throw AppError.conflict(
      `Only submitted roles can be approved (current status: "${role.status}").`,
    );
  }

  // Resolve commission: admin override > role > company > global
  let commissionPct: Prisma.Decimal | null =
    overrideCommissionPct !== undefined
      ? new Prisma.Decimal(overrideCommissionPct)
      : role.platformCommissionPct;
  if (commissionPct === null) {
    commissionPct = role.company.defaultCommissionPct;
  }
  if (commissionPct === null) {
    const globalPct = await platformSettingsService.getSettingValue('default_commission_pct');
    commissionPct = new Prisma.Decimal(globalPct ?? '20');
  }

  // Snapshot vendor benchmark from CountryConfig so savings reports
  // remain historically accurate even if admin later changes it.
  const countryConfig = await prisma.countryConfig.findUnique({
    where: { countryCode: role.country },
    select: { vendorBenchmarkPct: true },
  });
  const vendorBenchmarkPct = countryConfig?.vendorBenchmarkPct ?? new Prisma.Decimal(8.33);

  const updated = await prisma.$transaction(
    async (tx) => {
      // Stamp resolved commission + vendor benchmark snapshot
      const result = await tx.role.update({
        where: { id: roleId },
        data: {
          status: PrismaRoleStatus.published,
          platformCommissionPct: commissionPct,
          vendorBenchmarkPct,
          publishedAt: new Date(),
          closedAt: null,
        },
      });

      // Lock funds
      const lockAmount = calculateLockAmount(result);
      if (lockAmount.greaterThan(0)) {
        await companyWalletService.lockFundsForRole(
          role.company.id,
          roleId,
          lockAmount,
          tx as any,
        );
      }

      await recordStatusChange(roleId, role.status, PrismaRoleStatus.published, adminUserId, comment, tx);

      // Notify company user
      await notificationService.createNotification(
        {
          userId: role.company.userId,
          type: NotificationType.ROLE_APPROVED,
          title: 'Role approved',
          body: `Your role "${role.title}" has been approved and is now live.${comment ? ` Admin note: ${comment}` : ''}`,
          resourceType: 'role',
          resourceId: roleId,
        },
        tx as any,
      );

      return result;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  // Phase 16: Auto-trigger JD extraction when role has a JD document
  if (role.jdS3Key) {
    void enqueueJdExtraction(roleId).catch((err) => {
      console.error(`[role.service] Failed to enqueue JD extraction for ${roleId}:`, err);
    });
  }

  return projectRole(updated);
}

/**
 * Admin rejects role: submitted → rejected. Comment is required.
 */
export async function rejectRole(
  adminUserId: string,
  roleId: string,
  comment: string,
): Promise<RoleOwnerResponse> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      company: { select: { userId: true } },
    },
  });
  if (!role) throw AppError.notFound('Role not found');

  if (role.status !== PrismaRoleStatus.submitted) {
    throw AppError.conflict(
      `Only submitted roles can be rejected (current status: "${role.status}").`,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.role.update({
      where: { id: roleId },
      data: { status: PrismaRoleStatus.rejected },
    });

    await recordStatusChange(roleId, role.status, PrismaRoleStatus.rejected, adminUserId, comment, tx);

    // Notify company user
    await notificationService.createNotification(
      {
        userId: role.company.userId,
        type: NotificationType.ROLE_REJECTED,
        title: 'Role rejected',
        body: `Your role "${role.title}" has been rejected. Reason: ${comment}`,
        resourceType: 'role',
        resourceId: roleId,
      },
      tx as any,
    );

    return result;
  });

  return projectRole(updated);
}

export async function pauseRole(
  userId: string,
  roleId: string,
): Promise<RoleOwnerResponse> {
  const companyId = await resolveCompanyId(userId);
  const role = await getOwnedRole(roleId, companyId);

  if (role.status !== PrismaRoleStatus.published) {
    throw AppError.conflict(
      `Only published roles can be paused (current status: "${role.status}").`,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.role.update({
      where: { id: roleId },
      data: { status: PrismaRoleStatus.paused },
    });
    await recordStatusChange(roleId, role.status, PrismaRoleStatus.paused, userId, null, tx);
    return result;
  });
  return projectRole(updated);
}

export async function resumeRole(
  userId: string,
  roleId: string,
): Promise<RoleOwnerResponse> {
  const companyId = await resolveCompanyId(userId);
  const role = await getOwnedRole(roleId, companyId);

  if (role.status !== PrismaRoleStatus.paused) {
    throw AppError.conflict(
      `Only paused roles can be resumed (current status: "${role.status}").`,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.role.update({
      where: { id: roleId },
      data: { status: PrismaRoleStatus.published },
    });
    await recordStatusChange(roleId, role.status, PrismaRoleStatus.published, userId, null, tx);
    return result;
  });
  return projectRole(updated);
}

/**
 * Manual close. Allowed from any non-terminal status (draft / published /
 * paused / submitted / rejected). Terminal statuses (closed / filled) are
 * a no-op 409.
 */
export async function closeRole(
  userId: string,
  roleId: string,
): Promise<RoleOwnerResponse> {
  const companyId = await resolveCompanyId(userId);
  const role = await getOwnedRole(roleId, companyId);

  if (
    role.status === PrismaRoleStatus.closed ||
    role.status === PrismaRoleStatus.filled
  ) {
    throw AppError.conflict(
      `Role is already in terminal status "${role.status}".`,
    );
  }

  const updated = await prisma.$transaction(
    async (tx) => {
      // Only unlock funds if role was published (had funds locked)
      if (role.status === PrismaRoleStatus.published || role.status === PrismaRoleStatus.paused) {
        const earningsAgg = await tx.earning.aggregate({
          where: {
            roleId,
            status: { not: 'cancelled' },
          },
          _sum: { grossAmount: true },
        });
        const spent = earningsAgg._sum.grossAmount ?? new Prisma.Decimal(0);
        const originalLock = calculateLockAmount(role);
        const remaining = originalLock.sub(spent);
        if (remaining.greaterThan(0)) {
          await companyWalletService.unlockFundsForRole(
            companyId,
            roleId,
            remaining,
            'Role closed — unused funds released',
            tx as any,
          );
        }
      }

      const result = await tx.role.update({
        where: { id: roleId },
        data: {
          status: PrismaRoleStatus.closed,
          closedAt: new Date(),
        },
      });
      await recordStatusChange(roleId, role.status, PrismaRoleStatus.closed, userId, null, tx);
      return result;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return projectRole(updated);
}

// --------------------------------------------------------------------
// Reads
// --------------------------------------------------------------------

export interface ListOwnerRolesResult {
  items: RoleOwnerResponse[];
  page: number;
  pageSize: number;
  total: number;
}

export async function listCompanyRoles(
  userId: string,
  filters: ListOwnerRolesFilters,
): Promise<ListOwnerRolesResult> {
  const companyId = await resolveCompanyId(userId);

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.RoleWhereInput = {
    companyId,
    ...(filters.status !== undefined
      ? { status: filters.status as unknown as PrismaRoleStatus }
      : {}),
    ...(filters.search && filters.search.trim().length > 0
      ? {
          OR: [
            {
              title: {
                contains: filters.search.trim(),
                mode: 'insensitive' as const,
              },
            },
            {
              description: {
                contains: filters.search.trim(),
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.role.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.role.count({ where }),
  ]);

  return {
    items: items.map(projectRole),
    page,
    pageSize,
    total,
  };
}

export async function getRoleById(
  roleId: string,
  viewer: { userId: string; role: 'recruiter' | 'company' | 'admin' },
): Promise<RoleOwnerResponse> {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw AppError.notFound('Role not found');
  }

  if (viewer.role === 'admin') {
    return projectRole(role);
  }

  if (viewer.role === 'company') {
    const companyId = await resolveCompanyId(viewer.userId);
    if (role.companyId !== companyId) {
      throw AppError.notFound('Role not found');
    }
    return projectRole(role);
  }

  throw AppError.forbidden(
    'Use GET /roles/:id/public for recruiter access to role detail.',
  );
}

// --------------------------------------------------------------------
// Role status history
// --------------------------------------------------------------------

export async function getRoleStatusHistory(roleId: string): Promise<RoleStatusHistoryEntry[]> {
  const entries = await prisma.roleStatusHistory.findMany({
    where: { roleId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true } },
    },
  });

  return entries.map((e) => ({
    id: e.id,
    fromStatus: e.fromStatus as unknown as RoleStatus | null,
    toStatus: e.toStatus as unknown as RoleStatus,
    changedBy: e.changedBy,
    changedByEmail: e.user?.email,
    comment: e.comment,
    createdAt: e.createdAt.toISOString(),
  }));
}

// --------------------------------------------------------------------
// Public (recruiter-facing) detail view
// --------------------------------------------------------------------

type CompanyMini = Pick<
  PrismaCompanyProfile,
  'id' | 'companyName' | 'logoUrl' | 'industry'
>;

function projectRolePublic(
  role: PrismaRole,
  company: CompanyMini,
): RolePublicResponse {
  return {
    id: role.id,
    title: role.title,
    description: role.description,
    roleType: role.roleType as unknown as RoleType,
    status: role.status as unknown as RoleStatus,
    visibility: role.visibility as unknown as RoleVisibility,
    country: role.country,
    currency: role.currency,
    location: role.location,
    isRemote: role.isRemote,
    employmentType: role.employmentType,
    experienceMin: role.experienceMin,
    experienceMax: role.experienceMax,
    skills: role.skills ?? [],
    ctcMin: role.ctcMin.toString(),
    ctcMax: role.ctcMax.toString(),
    payoutType: role.payoutType as unknown as PayoutType,
    shortlistPayoutMode: role.shortlistPayoutMode as unknown as PayoutMode | null,
    shortlistPayoutValue: role.shortlistPayoutValue?.toString() ?? null,
    hirePayoutMode: role.hirePayoutMode as unknown as PayoutMode | null,
    hirePayoutValue: role.hirePayoutValue?.toString() ?? null,
    slotsRemaining: Math.max(0, role.maxSubmissions - role.submissionsCount),
    openPositions: role.openPositions,
    jdOriginalFilename: role.jdOriginalFilename,
    jdSizeBytes: role.jdSizeBytes,
    jdMimeType: role.jdMimeType,
    company: {
      id: company.id,
      companyName: company.companyName,
      logoUrl: company.logoUrl,
      industry: company.industry,
    },
    createdAt: role.createdAt.toISOString(),
  };
}

/**
 * Public detail lookup used by recruiters during submission. Only
 * `published` roles are exposed.
 */
export async function getPublicRoleById(
  roleId: string,
): Promise<RolePublicResponse> {
  const row = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      company: {
        select: {
          id: true,
          companyName: true,
          logoUrl: true,
          industry: true,
        },
      },
    },
  });
  if (
    !row ||
    (row.status !== PrismaRoleStatus.published && row.status !== PrismaRoleStatus.filled)
  ) {
    throw AppError.notFound('Role not found');
  }
  return projectRolePublic(row, row.company);
}

// --------------------------------------------------------------------
// Cursor helpers (public browse)
// --------------------------------------------------------------------

function encodeCursor(createdAt: Date, id: string): string {
  const json = JSON.stringify({ c: createdAt.toISOString(), i: id });
  return Buffer.from(json).toString('base64url');
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json) as { c: string; i: string };
    const createdAt = new Date(parsed.c);
    if (isNaN(createdAt.getTime())) return null;
    return { createdAt, id: parsed.i };
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------
// Public browse (recruiter-facing list)
// --------------------------------------------------------------------

export async function listPublicRoles(
  filters: ListPublicRolesFilters,
  recruiterProfileId?: string,
  recruiterCountry?: string,
): Promise<CursorPaginatedData<RolePublicResponse>> {
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));

  const visibilityOr: Prisma.RoleWhereInput[] = [
    { visibility: PrismaRoleVisibility.open },
  ];

  if (recruiterProfileId) {
    visibilityOr.push({
      visibility: PrismaRoleVisibility.preferred,
      company: {
        roles: {
          some: {
            submissions: {
              some: {
                recruiterId: recruiterProfileId,
                status: PrismaSubmissionStatus.joined,
              },
            },
          },
        },
      },
    });

    visibilityOr.push({
      visibility: PrismaRoleVisibility.invite_only,
      invitations: {
        some: {
          recruiterProfileId,
          status: 'accepted',
        },
      },
    });
  }

  const andClauses: Prisma.RoleWhereInput[] = [
    { OR: visibilityOr },
    {
      status: filters.status !== undefined
        ? (filters.status as unknown as PrismaRoleStatus)
        : { in: [PrismaRoleStatus.published, PrismaRoleStatus.filled] },
    },
  ];

  // Country hard filter: recruiters only see roles matching their country
  if (recruiterCountry) {
    andClauses.push({ country: recruiterCountry });
  }

  if (filters.search && filters.search.trim().length > 0) {
    andClauses.push({
      OR: [
        { title: { contains: filters.search.trim(), mode: 'insensitive' as const } },
        { description: { contains: filters.search.trim(), mode: 'insensitive' as const } },
      ],
    });
  }
  if (filters.roleType !== undefined) {
    andClauses.push({ roleType: filters.roleType as unknown as PrismaRoleType });
  }
  if (filters.skills && filters.skills.length > 0) {
    andClauses.push({ skills: { hasSome: filters.skills } });
  }
  if (filters.minCtc !== undefined) {
    andClauses.push({ ctcMax: { gte: new Prisma.Decimal(filters.minCtc) } });
  }
  if (filters.maxCtc !== undefined) {
    andClauses.push({ ctcMin: { lte: new Prisma.Decimal(filters.maxCtc) } });
  }
  if (filters.isRemote !== undefined) {
    andClauses.push({ isRemote: filters.isRemote });
  }
  if (filters.employmentType !== undefined) {
    andClauses.push({ employmentType: filters.employmentType });
  }

  const where: Prisma.RoleWhereInput = { AND: andClauses };

  let cursorClause: Prisma.RoleWhereInput | undefined;
  if (filters.cursor) {
    const decoded = decodeCursor(filters.cursor);
    if (decoded) {
      cursorClause = {
        OR: [
          { createdAt: { lt: decoded.createdAt } },
          { createdAt: decoded.createdAt, id: { lt: decoded.id } },
        ],
      };
    }
  }

  const finalWhere: Prisma.RoleWhereInput = cursorClause
    ? { AND: [where, cursorClause] }
    : where;

  const rows = await prisma.role.findMany({
    where: finalWhere,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: pageSize + 1,
    include: {
      company: {
        select: {
          id: true,
          companyName: true,
          logoUrl: true,
          industry: true,
        },
      },
    },
  });

  const hasMore = rows.length > pageSize;
  const items = hasMore ? rows.slice(0, pageSize) : rows;

  const nextCursor =
    hasMore && items.length > 0
      ? encodeCursor(items[items.length - 1]!.createdAt, items[items.length - 1]!.id)
      : null;

  return {
    items: items.map((row) => projectRolePublic(row, row.company)),
    nextCursor,
  };
}

/**
 * Admin listing — no company filter.
 */
export async function listAllRolesForAdmin(
  filters: ListOwnerRolesFilters,
): Promise<ListOwnerRolesResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.RoleWhereInput = {
    ...(filters.status !== undefined
      ? { status: filters.status as unknown as PrismaRoleStatus }
      : {}),
    ...(filters.search && filters.search.trim().length > 0
      ? {
          OR: [
            {
              title: {
                contains: filters.search.trim(),
                mode: 'insensitive' as const,
              },
            },
            {
              description: {
                contains: filters.search.trim(),
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.role.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.role.count({ where }),
  ]);

  return {
    items: items.map(projectRole),
    page,
    pageSize,
    total,
  };
}

// --------------------------------------------------------------------
// JD download
// --------------------------------------------------------------------

export async function downloadJd(
  roleId: string,
  viewer: { userId: string; role: 'recruiter' | 'company' | 'admin' },
): Promise<JdDownloadResponse> {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw AppError.notFound('Role not found');
  }

  if (viewer.role === 'company') {
    const companyId = await resolveCompanyId(viewer.userId);
    if (role.companyId !== companyId) {
      throw AppError.notFound('Role not found');
    }
  } else if (viewer.role === 'recruiter') {
    if (role.status !== PrismaRoleStatus.published && role.status !== PrismaRoleStatus.filled) {
      throw AppError.notFound('Role not found');
    }
  }

  if (!role.jdS3Key || !role.jdOriginalFilename) {
    throw AppError.notFound('No JD attached to this role');
  }

  const { downloadUrl, expiresAt } = await s3Service.createDownloadUrl(
    role.jdS3Key,
  );

  return {
    downloadUrl,
    expiresAt,
    filename: role.jdOriginalFilename,
  };
}
