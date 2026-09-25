import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';
import { AppError } from '../lib/app-error.js';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

const DEFAULT_DAYS = 90;

function defaultDateRange(startDate?: string, endDate?: string) {
  const to = endDate ? new Date(endDate) : new Date();
  const from = startDate
    ? new Date(startDate)
    : new Date(to.getTime() - DEFAULT_DAYS * 24 * 60 * 60 * 1000);
  return { from, to };
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return '0.00';
  return ((numerator / denominator) * 100).toFixed(2);
}

/** Redis get-or-compute with simple TTL. */
async function cached<T>(key: string, ttlSec: number, compute: () => Promise<T>): Promise<T> {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit) as T;
  const data = await compute();
  await redis.setex(key, ttlSec, JSON.stringify(data));
  return data;
}

// ────────────────────────────────────────────────────────────
// ANLY-01 — Submission Funnel (Company)
// ────────────────────────────────────────────────────────────

export interface FunnelFilters {
  companyId: string;
  roleId?: string;
  startDate?: string;
  endDate?: string;
}

export async function getCompanyFunnel(filters: FunnelFilters) {
  const { from, to } = defaultDateRange(filters.startDate, filters.endDate);

  const roleWhere: Prisma.RoleWhereInput = {
    companyId: filters.companyId,
    publishedAt: { gte: from, lte: to },
  };
  if (filters.roleId) {
    roleWhere.id = filters.roleId;
  }

  const roles = await prisma.role.findMany({
    where: roleWhere,
    select: { id: true },
  });

  const roleIds = roles.map((r) => r.id);
  if (roleIds.length === 0) {
    return {
      roleCount: 0,
      funnel: { submitted: 0, shortlisted: 0, interview: 0, hired: 0, joined: 0, rejected: 0, withdrawn: 0 },
      conversionRates: {
        submittedToShortlisted: '0.00',
        shortlistedToInterview: '0.00',
        interviewToHired: '0.00',
        hiredToJoined: '0.00',
        endToEnd: '0.00',
      },
      dateRange: { from: from.toISOString(), to: to.toISOString() },
    };
  }

  // Count submissions that EVER reached each status (use statusEvents for accuracy)
  const [submitted, shortlisted, interview, hired, joined, rejected, withdrawn] =
    await Promise.all([
      prisma.submission.count({ where: { roleId: { in: roleIds } } }),
      prisma.submission.count({ where: { roleId: { in: roleIds }, status: { in: ['shortlisted', 'interview', 'hired', 'joined'] } } }),
      prisma.submission.count({ where: { roleId: { in: roleIds }, status: { in: ['interview', 'hired', 'joined'] } } }),
      prisma.submission.count({ where: { roleId: { in: roleIds }, status: { in: ['hired', 'joined'] } } }),
      prisma.submission.count({ where: { roleId: { in: roleIds }, status: 'joined' } }),
      prisma.submission.count({ where: { roleId: { in: roleIds }, status: 'rejected' } }),
      prisma.submission.count({ where: { roleId: { in: roleIds }, status: 'withdrawn' } }),
    ]);

  return {
    roleCount: roleIds.length,
    funnel: { submitted, shortlisted, interview, hired, joined, rejected, withdrawn },
    conversionRates: {
      submittedToShortlisted: pct(shortlisted, submitted),
      shortlistedToInterview: pct(interview, shortlisted),
      interviewToHired: pct(hired, interview),
      hiredToJoined: pct(joined, hired),
      endToEnd: pct(joined, submitted),
    },
    dateRange: { from: from.toISOString(), to: to.toISOString() },
  };
}

// ────────────────────────────────────────────────────────────
// ANLY-02 — Time-to-Fill Statistics
// ────────────────────────────────────────────────────────────

export interface TimeToFillFilters {
  companyId?: string; // null = platform-wide (admin)
  groupBy?: 'month' | 'quarter' | 'roleType';
  startDate?: string;
  endDate?: string;
}

export async function getTimeToFill(filters: TimeToFillFilters) {
  const { from, to } = defaultDateRange(filters.startDate, filters.endDate);

  const where: Prisma.HiringMetricWhereInput = {
    createdAt: { gte: from, lte: to },
    daysToFill: { not: null },
  };
  if (filters.companyId) {
    where.role = { companyId: filters.companyId };
  }

  const metrics = await prisma.hiringMetric.findMany({
    where,
    select: {
      daysToFill: true,
      createdAt: true,
      role: { select: { roleType: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (metrics.length === 0) {
    return {
      count: 0,
      average: null,
      median: null,
      p25: null,
      p75: null,
      p90: null,
      stddev: null,
      trend: [],
      dateRange: { from: from.toISOString(), to: to.toISOString() },
    };
  }

  const values = metrics.map((m) => m.daysToFill!).sort((a, b) => a - b);
  const n = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / n;
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / n;

  const percentile = (arr: number[], p: number) => {
    const idx = (p / 100) * (arr.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return arr[lo]!;
    return arr[lo]! + (arr[hi]! - arr[lo]!) * (idx - lo);
  };

  // Build trend grouped by month or roleType
  const trend: { label: string; average: number; count: number }[] = [];
  if (filters.groupBy === 'roleType') {
    const groups = new Map<string, number[]>();
    for (const m of metrics) {
      const key = m.role.roleType;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m.daysToFill!);
    }
    for (const [label, vals] of groups) {
      trend.push({
        label,
        average: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        count: vals.length,
      });
    }
  } else {
    // Default: group by month
    const groups = new Map<string, number[]>();
    for (const m of metrics) {
      const d = m.createdAt;
      const label =
        filters.groupBy === 'quarter'
          ? `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(m.daysToFill!);
    }
    for (const [label, vals] of groups) {
      trend.push({
        label,
        average: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        count: vals.length,
      });
    }
  }

  return {
    count: n,
    average: Math.round(avg * 10) / 10,
    median: Math.round(percentile(values, 50) * 10) / 10,
    p25: Math.round(percentile(values, 25) * 10) / 10,
    p75: Math.round(percentile(values, 75) * 10) / 10,
    p90: Math.round(percentile(values, 90) * 10) / 10,
    stddev: Math.round(Math.sqrt(variance) * 10) / 10,
    trend,
    dateRange: { from: from.toISOString(), to: to.toISOString() },
  };
}

// ────────────────────────────────────────────────────────────
// ANLY-03 — Recruiter Scorecard
// ────────────────────────────────────────────────────────────

export interface ScorecardFilters {
  recruiterId: string;
  startDate?: string;
  endDate?: string;
}

export async function getRecruiterScorecard(filters: ScorecardFilters) {
  const { from, to } = defaultDateRange(filters.startDate, filters.endDate);

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { id: filters.recruiterId },
    select: {
      id: true,
      fullName: true,
      reputationTier: true,
      totalPlacements: true,
      successfulPlacements: true,
    },
  });
  if (!recruiter) throw AppError.notFound('Recruiter not found');

  const dateWhere = { createdAt: { gte: from, lte: to } };

  // Recruiter's own metrics
  const [totalSubs, shortlisted, hired, joined, earnings] = await Promise.all([
    prisma.submission.count({
      where: { recruiterId: filters.recruiterId, ...dateWhere },
    }),
    prisma.submission.count({
      where: {
        recruiterId: filters.recruiterId,
        status: { in: ['shortlisted', 'interview', 'hired', 'joined'] },
        ...dateWhere,
      },
    }),
    prisma.submission.count({
      where: {
        recruiterId: filters.recruiterId,
        status: { in: ['hired', 'joined'] },
        ...dateWhere,
      },
    }),
    prisma.submission.count({
      where: {
        recruiterId: filters.recruiterId,
        status: 'joined',
        ...dateWhere,
      },
    }),
    prisma.earning.aggregate({
      where: { recruiterId: filters.recruiterId, createdAt: { gte: from, lte: to } },
      _sum: { netAmount: true },
      _count: true,
    }),
  ]);

  const conversionRate = pct(hired, totalSubs);
  const earningsTotal = (earnings._sum.netAmount ?? new Prisma.Decimal(0)).toString();

  // Consistency score: stddev of monthly submission counts (lower = more consistent)
  const monthlyCounts = await prisma.$queryRaw<{ month: string; cnt: bigint }[]>`
    SELECT to_char(created_at, 'YYYY-MM') AS month, COUNT(*)::bigint AS cnt
    FROM submissions
    WHERE recruiter_id = ${filters.recruiterId}::uuid
      AND created_at >= ${from}
      AND created_at <= ${to}
    GROUP BY to_char(created_at, 'YYYY-MM')
    ORDER BY month
  `;

  let consistencyScore: number | null = null;
  if (monthlyCounts.length >= 2) {
    const counts = monthlyCounts.map((r) => Number(r.cnt));
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((s, v) => s + (v - mean) ** 2, 0) / counts.length;
    const stddev = Math.sqrt(variance);
    // Normalize: 100 = perfectly consistent, 0 = wildly inconsistent
    // Using coefficient of variation: lower CV = more consistent
    const cv = mean > 0 ? stddev / mean : 0;
    consistencyScore = Math.max(0, Math.round((1 - Math.min(cv, 1)) * 100));
  }

  // Platform averages for comparison
  const [platformTotalSubs, platformHired] = await Promise.all([
    prisma.submission.count({ where: dateWhere }),
    prisma.submission.count({ where: { status: { in: ['hired', 'joined'] }, ...dateWhere } }),
  ]);
  const platformConversionRate = pct(platformHired, platformTotalSubs);

  // Recruiter's avg time-to-hire (from submission creation to hired status event)
  const avgTimeToHire = await prisma.$queryRaw<{ avg_days: number | null }[]>`
    SELECT AVG(
      EXTRACT(EPOCH FROM (sse.created_at - s.created_at)) / 86400.0
    )::float AS avg_days
    FROM submission_status_events sse
    JOIN submissions s ON s.id = sse.submission_id
    WHERE s.recruiter_id = ${filters.recruiterId}::uuid
      AND sse.to_status = 'hired'
      AND s.created_at >= ${from}
      AND s.created_at <= ${to}
  `;

  return {
    recruiter: {
      id: recruiter.id,
      fullName: recruiter.fullName,
      reputationTier: recruiter.reputationTier,
      totalPlacements: recruiter.totalPlacements,
    },
    metrics: {
      totalSubmissions: totalSubs,
      shortlisted,
      hired,
      joined,
      conversionRate,
      avgDaysToHire: avgTimeToHire[0]?.avg_days
        ? Math.round(avgTimeToHire[0].avg_days * 10) / 10
        : null,
      earningsTotal,
      earningsCount: earnings._count,
      consistencyScore,
    },
    platformComparison: {
      platformConversionRate,
      isAboveAverage: parseFloat(conversionRate) > parseFloat(platformConversionRate),
    },
    dateRange: { from: from.toISOString(), to: to.toISOString() },
  };
}

// ────────────────────────────────────────────────────────────
// ANLY-04 — Company Cost Metrics
// ────────────────────────────────────────────────────────────

export interface CostMetricsFilters {
  companyId: string;
  startDate?: string;
  endDate?: string;
}

export async function getCompanyCostMetrics(filters: CostMetricsFilters) {
  const { from, to } = defaultDateRange(filters.startDate, filters.endDate);

  // Get roles with hiring metrics in date range
  const rolesWithMetrics = await prisma.role.findMany({
    where: {
      companyId: filters.companyId,
      publishedAt: { gte: from, lte: to },
    },
    select: {
      id: true,
      title: true,
      roleType: true,
      ctcMin: true,
      ctcMax: true,
      platformCommissionPct: true,
      vendorBenchmarkPct: true,
      hiredCount: true,
      submissionsCount: true,
      hiringMetric: {
        select: {
          daysToFill: true,
          costPerHire: true,
          totalPayoutAmount: true,
          submissionToHireRatio: true,
          uniqueRecruiters: true,
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
  });

  // Aggregate earnings for the company
  const earningsAgg = await prisma.earning.aggregate({
    where: {
      role: { companyId: filters.companyId },
      createdAt: { gte: from, lte: to },
    },
    _sum: { grossAmount: true, platformCommission: true },
    _count: true,
  });

  const totalSpend = (earningsAgg._sum.grossAmount ?? new Prisma.Decimal(0));
  const totalCommission = (earningsAgg._sum.platformCommission ?? new Prisma.Decimal(0));

  // Savings calculation — compare platform commission % vs vendor benchmark %
  let totalSavings = new Prisma.Decimal(0);
  for (const r of rolesWithMetrics) {
    if (r.vendorBenchmarkPct && r.platformCommissionPct && r.hiringMetric?.totalPayoutAmount) {
      const benchmarkCost = r.hiringMetric.totalPayoutAmount
        .mul(r.vendorBenchmarkPct)
        .div(r.platformCommissionPct);
      const saved = benchmarkCost.sub(r.hiringMetric.totalPayoutAmount);
      if (saved.greaterThan(0)) totalSavings = totalSavings.add(saved);
    }
  }

  // Per-role breakdown
  const roleBreakdown = rolesWithMetrics.map((r) => ({
    id: r.id,
    title: r.title,
    roleType: r.roleType,
    hiredCount: r.hiredCount,
    submissionsCount: r.submissionsCount,
    costPerHire: r.hiringMetric?.costPerHire?.toString() ?? null,
    totalPayout: r.hiringMetric?.totalPayoutAmount?.toString() ?? null,
    submissionToHireRatio: r.hiringMetric?.submissionToHireRatio?.toString() ?? null,
    uniqueRecruiters: r.hiringMetric?.uniqueRecruiters ?? 0,
    effectiveCommissionPct: r.platformCommissionPct?.toString() ?? null,
  }));

  // Submission quality ratio across company
  const totalSubs = rolesWithMetrics.reduce((s, r) => s + r.submissionsCount, 0);
  const totalHired = rolesWithMetrics.reduce((s, r) => s + r.hiredCount, 0);

  return {
    summary: {
      totalSpend: totalSpend.toString(),
      totalCommission: totalCommission.toString(),
      totalSavings: totalSavings.toString(),
      rolesCount: rolesWithMetrics.length,
      totalHired,
      avgCostPerHire:
        totalHired > 0
          ? totalSpend.div(totalHired).toFixed(2)
          : null,
      submissionQualityRatio: pct(totalHired, totalSubs),
    },
    roles: roleBreakdown,
    dateRange: { from: from.toISOString(), to: to.toISOString() },
  };
}

// ────────────────────────────────────────────────────────────
// ANLY-05 — Platform Health (Admin)
// ────────────────────────────────────────────────────────────

export interface PlatformHealthFilters {
  startDate?: string;
  endDate?: string;
}

export async function getPlatformHealth(filters: PlatformHealthFilters) {
  const { from, to } = defaultDateRange(filters.startDate, filters.endDate);

  // Cache key includes date range for consistency
  const cacheKey = `analytics:platform-health:${from.toISOString()}:${to.toISOString()}`;

  return cached(cacheKey, 300, async () => {
    const dateWhere = { createdAt: { gte: from, lte: to } };

    const [
      totalCompanies,
      totalRecruiters,
      totalRoles,
      activeRoles,
      totalSubmissions,
      totalHires,
      activeUsers,
      earningsAgg,
      payoutsAgg,
      tierDistribution,
    ] = await Promise.all([
      prisma.companyProfile.count(),
      prisma.recruiterProfile.count(),
      prisma.role.count({ where: { publishedAt: { gte: from, lte: to } } }),
      prisma.role.count({ where: { status: 'published' } }),
      prisma.submission.count({ where: dateWhere }),
      prisma.submission.count({ where: { status: { in: ['hired', 'joined'] }, ...dateWhere } }),
      prisma.user.count({ where: { lastLoginAt: { gte: from } } }),
      prisma.earning.aggregate({
        where: { ...dateWhere },
        _sum: { grossAmount: true, platformCommission: true, netAmount: true },
      }),
      prisma.payoutRequest.aggregate({
        where: { status: 'completed', ...dateWhere },
        _sum: { amount: true },
      }),
      prisma.recruiterProfile.groupBy({
        by: ['reputationTier'],
        _count: true,
      }),
    ]);

    // Marketplace funnel for date range
    const [shortlisted, interview] = await Promise.all([
      prisma.submission.count({
        where: { status: { in: ['shortlisted', 'interview', 'hired', 'joined'] }, ...dateWhere },
      }),
      prisma.submission.count({
        where: { status: { in: ['interview', 'hired', 'joined'] }, ...dateWhere },
      }),
    ]);

    return {
      overview: {
        totalCompanies,
        totalRecruiters,
        totalRoles,
        activeRoles,
        activeUsers,
      },
      funnel: {
        submitted: totalSubmissions,
        shortlisted,
        interview,
        hired: totalHires,
        conversionRate: pct(totalHires, totalSubmissions),
      },
      financials: {
        totalRevenue: (earningsAgg._sum.grossAmount ?? new Prisma.Decimal(0)).toString(),
        platformCommission: (earningsAgg._sum.platformCommission ?? new Prisma.Decimal(0)).toString(),
        recruiterPayouts: (earningsAgg._sum.netAmount ?? new Prisma.Decimal(0)).toString(),
        completedPayouts: (payoutsAgg._sum.amount ?? new Prisma.Decimal(0)).toString(),
      },
      recruiterTiers: Object.fromEntries(
        tierDistribution.map((t) => [t.reputationTier, t._count]),
      ),
      dateRange: { from: from.toISOString(), to: to.toISOString() },
    };
  });
}
