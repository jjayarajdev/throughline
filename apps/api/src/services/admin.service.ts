import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../lib/app-error.js';
import { sendPasswordResetEmail } from './email.service.js';

// ---- Platform Metrics ----

export async function getMetrics() {
  const [
    totalCompanies,
    totalRecruiters,
    totalRoles,
    activeRoles,
    totalSubmissions,
    earningsAgg,
    payoutsAgg,
  ] = await Promise.all([
    prisma.companyProfile.count(),
    prisma.recruiterProfile.count(),
    prisma.role.count(),
    prisma.role.count({ where: { status: 'published' } }),
    prisma.submission.count(),
    prisma.earning.aggregate({
      _sum: { grossAmount: true, platformCommission: true },
    }),
    prisma.payoutRequest.aggregate({
      _sum: { amount: true },
      where: { status: 'completed' },
    }),
  ]);

  return {
    totalCompanies,
    totalRecruiters,
    totalRoles,
    activeRoles,
    totalSubmissions,
    totalEarnings: (earningsAgg._sum.grossAmount ?? new Prisma.Decimal(0)).toString(),
    totalPlatformCommission: (earningsAgg._sum.platformCommission ?? new Prisma.Decimal(0)).toString(),
    totalPayouts: (payoutsAgg._sum.amount ?? new Prisma.Decimal(0)).toString(),
  };
}

// ---- User Listing ----

export interface ListUsersFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listUsers(filters: ListUsersFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.UserWhereInput = {};

  if (filters.role) {
    where.role = filters.role as Prisma.EnumUserRoleFilter['equals'];
  }

  if (filters.status) {
    where.status = filters.status as Prisma.EnumUserStatusFilter['equals'];
  }

  if (filters.search) {
    const term = filters.search;
    where.OR = [
      { email: { contains: term, mode: 'insensitive' } },
      { recruiterProfile: { fullName: { contains: term, mode: 'insensitive' } } },
      { companyProfile: { companyName: { contains: term, mode: 'insensitive' } } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        recruiterProfile: {
          select: { fullName: true, phone: true, reputationTier: true, totalPlacements: true },
        },
        companyProfile: {
          select: { companyName: true, industry: true, companySize: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, pageSize };
}

// ---- Update User Status ----

export async function updateUserStatus(userId: string, status: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: status as Prisma.EnumUserStatusFilter['equals'] },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
  });
  return user;
}

// ---- All Roles (admin view) ----

export interface ListRolesFilters {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listAllRoles(filters: ListRolesFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.RoleWhereInput = {};

  if (filters.status) {
    where.status = filters.status as Prisma.EnumRoleStatusFilter['equals'];
  }

  if (filters.search) {
    where.title = { contains: filters.search, mode: 'insensitive' };
  }

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        roleType: true,
        location: true,
        ctcMin: true,
        ctcMax: true,
        submissionsCount: true,
        shortlistedCount: true,
        hiredCount: true,
        createdAt: true,
        company: { select: { companyName: true } },
      },
    }),
    prisma.role.count({ where }),
  ]);

  // Decimal → string at JSON boundary
  const serialized = roles.map((r) => ({
    ...r,
    ctcMin: r.ctcMin.toString(),
    ctcMax: r.ctcMax.toString(),
  }));

  return { roles: serialized, total, page, pageSize };
}

// ---- Platform Earnings (admin view) ----

export interface ListEarningsFilters {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listPlatformEarnings(filters: ListEarningsFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.EarningWhereInput = {};

  if (filters.status) {
    where.status = filters.status as Prisma.EnumEarningStatusFilter['equals'];
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { recruiter: { fullName: { contains: term, mode: 'insensitive' } } },
      { role: { title: { contains: term, mode: 'insensitive' } } },
      { role: { company: { companyName: { contains: term, mode: 'insensitive' } } } },
    ];
  }

  const [earnings, total, agg] = await Promise.all([
    prisma.earning.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        earningType: true,
        status: true,
        grossAmount: true,
        platformCommission: true,
        platformCommissionPct: true,
        netAmount: true,
        createdAt: true,
        recruiter: { select: { fullName: true } },
        role: { select: { title: true, company: { select: { companyName: true } } } },
      },
    }),
    prisma.earning.count({ where }),
    prisma.earning.aggregate({
      where,
      _sum: { grossAmount: true, platformCommission: true, netAmount: true },
    }),
  ]);

  const serialized = earnings.map((e) => ({
    ...e,
    grossAmount: e.grossAmount.toString(),
    platformCommission: e.platformCommission.toString(),
    platformCommissionPct: e.platformCommissionPct.toString(),
    netAmount: e.netAmount.toString(),
  }));

  return {
    earnings: serialized,
    total,
    page,
    pageSize,
    totals: {
      grossAmount: (agg._sum.grossAmount ?? new Prisma.Decimal(0)).toString(),
      platformCommission: (agg._sum.platformCommission ?? new Prisma.Decimal(0)).toString(),
      netAmount: (agg._sum.netAmount ?? new Prisma.Decimal(0)).toString(),
    },
  };
}

// ---- User Detail ----

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companyProfile: {
        include: {
          wallet: true,
        },
      },
      recruiterProfile: true,
    },
  });

  if (!user) throw AppError.notFound('User not found');

  // Fetch recent activity based on role
  let recentRoles: { id: string; title: string; status: string; createdAt: Date }[] = [];
  let recentSubmissionsCount = 0;

  if (user.companyProfile) {
    recentRoles = await prisma.role.findMany({
      where: { companyId: user.companyProfile.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, title: true, status: true, createdAt: true },
    });
  }

  if (user.recruiterProfile) {
    recentSubmissionsCount = await prisma.submission.count({
      where: { recruiterId: user.recruiterProfile.id },
    });
  }

  // Serialize decimals
  const cp = user.companyProfile;
  const rp = user.recruiterProfile;

  const companyProfile = cp
    ? {
        id: cp.id,
        companyName: cp.companyName,
        industry: cp.industry,
        companySize: cp.companySize,
        headquarters: cp.headquarters,
        country: cp.country,
        currency: cp.currency,
        defaultCommissionPct: cp.defaultCommissionPct?.toString() ?? null,
        wallet: cp.wallet
          ? {
              balance: cp.wallet.balance.toString(),
              lockedBalance: cp.wallet.lockedBalance.toString(),
            }
          : null,
      }
    : null;

  const recruiterProfile = rp
    ? {
        id: rp.id,
        fullName: rp.fullName,
        phone: rp.phone,
        specializations: rp.specializations,
        yearsOfExperience: rp.yearsOfExperience,
        reputationTier: rp.reputationTier,
        totalPlacements: rp.totalPlacements,
        country: rp.country,
        currency: rp.currency,
        walletBalance: rp.walletBalance.toString(),
      }
    : null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    companyProfile,
    recruiterProfile,
    recentRoles: recentRoles.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    recentSubmissionsCount,
  };
}

// ---- Update Company Commission ----

export async function updateCompanyCommission(
  companyId: string,
  pct: number | null,
) {
  const profile = await prisma.companyProfile.findUnique({
    where: { id: companyId },
    select: { id: true },
  });
  if (!profile) throw AppError.notFound('Company not found');

  const updated = await prisma.companyProfile.update({
    where: { id: companyId },
    data: {
      defaultCommissionPct: pct !== null ? new Prisma.Decimal(pct) : null,
    },
    select: { id: true, companyName: true, defaultCommissionPct: true },
  });

  return {
    ...updated,
    defaultCommissionPct: updated.defaultCommissionPct?.toString() ?? null,
  };
}

// ---- Force Password Reset ----

const RESET_TOKEN_BYTES = 32;
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function forcePasswordReset(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) throw AppError.notFound('User not found');

  const { randomBytes: rb } = await import('node:crypto');
  const token = rb(RESET_TOKEN_BYTES).toString('hex');
  const expiry = new Date(Date.now() + RESET_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: token,
      passwordResetExpiry: expiry,
      refreshTokenHash: null, // force logout all sessions
    },
  });

  try {
    await sendPasswordResetEmail(user.email, token);
  } catch (err) {
    console.warn('[admin] password reset email failed (non-fatal):', (err as Error).message);
  }

  return { success: true, email: user.email };
}
