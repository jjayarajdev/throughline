import { createHash } from 'node:crypto';
import { NotificationType } from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import { notify } from '../lib/notify.js';

// ── Types ────────────────────────────────────────────────────

interface AnomalyFactor {
  label: string;
  value: string;
  comparison?: string;
}

interface DetectedAnomaly {
  type: 'stale_role' | 'declining_activity' | 'high_rejection_rate';
  severity: 'low' | 'medium' | 'high';
  targetType: string;
  targetId: string;
  userId: string;
  title: string;
  explanation: string;
  factors: AnomalyFactor[];
  expiresAt?: Date;
}

// ── Helpers ──────────────────────────────────────────────────

function fingerprint(type: string, targetId: string): string {
  return createHash('sha256').update(`${type}:${targetId}`).digest('hex');
}

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Detector 1: Stale Roles ─────────────────────────────────
// Roles published 14+ days ago with zero submissions

async function detectStaleRoles(): Promise<DetectedAnomaly[]> {
  const threshold = new Date(Date.now() - 14 * DAY_MS);

  const staleRoles = await prisma.role.findMany({
    where: {
      status: 'published',
      publishedAt: { lte: threshold },
      submissionsCount: 0,
    },
    select: {
      id: true,
      title: true,
      publishedAt: true,
      company: { select: { id: true, userId: true, companyName: true } },
    },
  });

  if (staleRoles.length === 0) return [];

  // Get platform average days to first submission for comparison
  const avgResult = await prisma.hiringMetric.aggregate({
    where: { daysToFirstSubmission: { not: null } },
    _avg: { daysToFirstSubmission: true },
  });
  const platformAvgDays = avgResult._avg.daysToFirstSubmission ?? 5;

  return staleRoles.map((role) => {
    const daysSincePublished = Math.floor(
      (Date.now() - (role.publishedAt?.getTime() ?? Date.now())) / DAY_MS,
    );
    const severity = daysSincePublished > 30 ? 'high' : daysSincePublished > 21 ? 'medium' : 'low';

    return {
      type: 'stale_role' as const,
      severity,
      targetType: 'role',
      targetId: role.id,
      userId: role.company.userId,
      title: `No submissions for "${role.title}"`,
      explanation: `This role has had no submissions in ${daysSincePublished} days since publishing. Similar roles on the platform receive their first submission in an average of ${Math.round(platformAvgDays)} days.`,
      factors: [
        { label: 'Days since published', value: `${daysSincePublished}` },
        { label: 'Submissions received', value: '0' },
        { label: 'Platform avg first submission', value: `${Math.round(platformAvgDays)} days`, comparison: `${daysSincePublished}x slower` },
      ],
      expiresAt: new Date(Date.now() + 7 * DAY_MS),
    };
  });
}

// ── Detector 2: Declining Recruiter Activity ─────────────────
// 50%+ drop in 30-day submission rate vs previous 30 days

async function detectDecliningActivity(): Promise<DetectedAnomaly[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY_MS);

  // Get recruiters who had activity in the previous 30d window
  const recruiters = await prisma.$queryRaw<
    { id: string; user_id: string; full_name: string; recent: bigint; previous: bigint }[]
  >`
    SELECT
      rp.id,
      rp.user_id,
      rp.full_name,
      COUNT(CASE WHEN s.created_at >= ${thirtyDaysAgo} THEN 1 END)::bigint AS recent,
      COUNT(CASE WHEN s.created_at >= ${sixtyDaysAgo} AND s.created_at < ${thirtyDaysAgo} THEN 1 END)::bigint AS previous
    FROM recruiter_profiles rp
    JOIN submissions s ON s.recruiter_id = rp.id
    WHERE s.created_at >= ${sixtyDaysAgo}
    GROUP BY rp.id, rp.user_id, rp.full_name
    HAVING COUNT(CASE WHEN s.created_at >= ${sixtyDaysAgo} AND s.created_at < ${thirtyDaysAgo} THEN 1 END) >= 3
  `;

  const anomalies: DetectedAnomaly[] = [];

  for (const r of recruiters) {
    const recent = Number(r.recent);
    const previous = Number(r.previous);

    if (previous === 0) continue;
    const dropPct = ((previous - recent) / previous) * 100;
    if (dropPct < 50) continue;

    const severity = dropPct >= 80 ? 'high' : dropPct >= 65 ? 'medium' : 'low';

    anomalies.push({
      type: 'declining_activity',
      severity,
      targetType: 'recruiter',
      targetId: r.id,
      userId: r.user_id,
      title: `Submission rate dropped ${Math.round(dropPct)}%`,
      explanation: `Your submission rate dropped from ${previous} to ${recent} submissions compared to the previous 30-day period. This ${Math.round(dropPct)}% decline may affect your reputation tier.`,
      factors: [
        { label: 'Last 30 days', value: `${recent} submissions` },
        { label: 'Previous 30 days', value: `${previous} submissions`, comparison: `${Math.round(dropPct)}% drop` },
      ],
      expiresAt: new Date(Date.now() + 14 * DAY_MS),
    });
  }

  return anomalies;
}

// ── Detector 3: High Rejection Rate ──────────────────────────
// Roles with >80% rejection rate (minimum 5 submissions)

async function detectHighRejectionRate(): Promise<DetectedAnomaly[]> {
  const roles = await prisma.role.findMany({
    where: {
      status: { in: ['published', 'filled', 'closed'] },
      submissionsCount: { gte: 5 },
    },
    select: {
      id: true,
      title: true,
      submissionsCount: true,
      company: { select: { id: true, userId: true } },
      _count: {
        select: {
          submissions: { where: { status: 'rejected' } },
        },
      },
    },
  });

  // Platform average rejection rate for comparison
  const platformStats = await prisma.$queryRaw<{ avg_rate: number }[]>`
    SELECT AVG(
      CASE WHEN r.submissions_count > 0
        THEN (SELECT COUNT(*)::float FROM submissions s WHERE s.role_id = r.id AND s.status = 'rejected') / r.submissions_count * 100
        ELSE 0
      END
    )::float AS avg_rate
    FROM roles r
    WHERE r.submissions_count >= 3
  `;
  const platformAvgRate = platformStats[0]?.avg_rate ?? 30;

  const anomalies: DetectedAnomaly[] = [];

  for (const role of roles) {
    const rejectedCount = role._count.submissions;
    const rejectionRate = (rejectedCount / role.submissionsCount) * 100;

    if (rejectionRate < 80) continue;

    const severity = rejectionRate >= 95 ? 'high' : rejectionRate >= 90 ? 'medium' : 'low';

    anomalies.push({
      type: 'high_rejection_rate',
      severity,
      targetType: 'role',
      targetId: role.id,
      userId: role.company.userId,
      title: `${Math.round(rejectionRate)}% rejection rate on "${role.title}"`,
      explanation: `This role has a ${Math.round(rejectionRate)}% rejection rate (${rejectedCount} of ${role.submissionsCount} submissions rejected). The platform average is ${Math.round(platformAvgRate)}%. Consider revising the role requirements or providing clearer expectations.`,
      factors: [
        { label: 'Rejection rate', value: `${Math.round(rejectionRate)}%` },
        { label: 'Platform average', value: `${Math.round(platformAvgRate)}%`, comparison: `${Math.round(rejectionRate - platformAvgRate)}pp higher` },
        { label: 'Rejected', value: `${rejectedCount} of ${role.submissionsCount}` },
      ],
      expiresAt: new Date(Date.now() + 7 * DAY_MS),
    });
  }

  return anomalies;
}

// ── Main: Run all detectors ──────────────────────────────────

export async function runAnomalyDetection(): Promise<{
  detected: number;
  created: number;
  notified: number;
}> {
  console.log('[anomaly] Starting detection sweep...');
  const start = Date.now();

  const allAnomalies = (
    await Promise.all([
      detectStaleRoles(),
      detectDecliningActivity(),
      detectHighRejectionRate(),
    ])
  ).flat();

  console.log(`[anomaly] Detected ${allAnomalies.length} potential anomalies`);

  let created = 0;
  let notified = 0;

  // Expire old alerts first
  await prisma.anomalyAlert.updateMany({
    where: {
      status: 'active',
      expiresAt: { lte: new Date() },
    },
    data: { status: 'expired' },
  });

  for (const anomaly of allAnomalies) {
    const fp = fingerprint(anomaly.type, anomaly.targetId);

    // Upsert: only create if no active alert with same fingerprint
    const existing = await prisma.anomalyAlert.findUnique({
      where: { fingerprint: fp },
    });

    if (existing && existing.status === 'active') {
      continue; // Already reported, skip
    }

    // If resolved/expired, delete old and create fresh
    if (existing) {
      await prisma.anomalyAlert.delete({ where: { id: existing.id } });
    }

    await prisma.anomalyAlert.create({
      data: {
        type: anomaly.type as any,
        severity: anomaly.severity as any,
        targetType: anomaly.targetType,
        targetId: anomaly.targetId,
        userId: anomaly.userId,
        title: anomaly.title,
        explanation: anomaly.explanation,
        factors: anomaly.factors as any,
        fingerprint: fp,
        expiresAt: anomaly.expiresAt ?? null,
      },
    });
    created++;

    // Send notification
    void notify({
      userId: anomaly.userId,
      type: NotificationType.AI_ANOMALY_ALERT,
      title: anomaly.title,
      body: anomaly.explanation,
      resourceType: anomaly.targetType,
      resourceId: anomaly.targetId,
    });
    notified++;
  }

  const elapsed = Date.now() - start;
  console.log(`[anomaly] Sweep complete: ${created} new alerts, ${notified} notifications (${elapsed}ms)`);

  return { detected: allAnomalies.length, created, notified };
}

// ── Query APIs ───────────────────────────────────────────────

export interface AnomalyFilters {
  userId?: string;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listAnomalies(filters: AnomalyFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;

  const [items, total] = await Promise.all([
    prisma.anomalyAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.anomalyAlert.count({ where }),
  ]);

  return {
    items: items.map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      status: a.status,
      targetType: a.targetType,
      targetId: a.targetId,
      title: a.title,
      explanation: a.explanation,
      factors: a.factors as unknown as AnomalyFactor[],
      createdAt: a.createdAt.toISOString(),
      acknowledgedAt: a.acknowledgedAt?.toISOString() ?? null,
      resolvedAt: a.resolvedAt?.toISOString() ?? null,
      expiresAt: a.expiresAt?.toISOString() ?? null,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function acknowledgeAnomaly(alertId: string, userId: string) {
  const alert = await prisma.anomalyAlert.findFirst({
    where: { id: alertId, userId },
  });
  if (!alert) return null;

  return prisma.anomalyAlert.update({
    where: { id: alertId },
    data: { status: 'acknowledged', acknowledgedAt: new Date() },
  });
}

export async function resolveAnomaly(alertId: string, userId: string) {
  const alert = await prisma.anomalyAlert.findFirst({
    where: { id: alertId, userId },
  });
  if (!alert) return null;

  return prisma.anomalyAlert.update({
    where: { id: alertId },
    data: { status: 'resolved', resolvedAt: new Date() },
  });
}

export async function getAnomalySummary(userId?: string) {
  const where: any = userId ? { userId } : {};

  const [active, byType, bySeverity] = await Promise.all([
    prisma.anomalyAlert.count({ where: { ...where, status: 'active' } }),
    prisma.anomalyAlert.groupBy({
      by: ['type'],
      where: { ...where, status: 'active' },
      _count: true,
    }),
    prisma.anomalyAlert.groupBy({
      by: ['severity'],
      where: { ...where, status: 'active' },
      _count: true,
    }),
  ]);

  return {
    activeCount: active,
    byType: Object.fromEntries(byType.map((t) => [t.type, t._count])),
    bySeverity: Object.fromEntries(bySeverity.map((s) => [s.severity, s._count])),
  };
}
