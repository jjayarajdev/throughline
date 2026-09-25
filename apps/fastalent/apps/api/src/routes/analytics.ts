import { Router } from 'express';
import { UserRole } from '@gigcruite/types';
import { AppError } from '../lib/app-error.js';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../config/prisma.js';
import * as analyticsService from '../services/analytics.service.js';
import {
  CompanyFunnelQuerySchema,
  TimeToFillQuerySchema,
  RecruiterScorecardQuerySchema,
  CompanyCostMetricsQuerySchema,
  PlatformHealthQuerySchema,
  type CompanyFunnelQuery,
  type TimeToFillQuery,
  type RecruiterScorecardQuery,
  type CompanyCostMetricsQuery,
  type PlatformHealthQuery,
} from '../validators/analytics.js';

const router = Router();

// ---- Helpers ----

async function resolveCompanyId(userId: string): Promise<string> {
  const profile = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw AppError.notFound('Company profile not found');
  return profile.id;
}

async function resolveRecruiterId(userId: string): Promise<string> {
  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw AppError.notFound('Recruiter profile not found');
  return profile.id;
}

// ---- ANLY-01: Company Submission Funnel ----

router.get(
  '/funnel',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  validate(CompanyFunnelQuerySchema, 'query'),
  async (req, res) => {
    const companyId = await resolveCompanyId(req.userId!);
    const query = req.query as unknown as CompanyFunnelQuery;
    const result = await analyticsService.getCompanyFunnel({
      companyId,
      roleId: query.roleId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    return ok(res, result);
  },
);

// ---- ANLY-02: Time-to-Fill Statistics ----
// Company sees their own, Admin sees platform-wide

router.get(
  '/time-to-fill',
  ...authorize(UserRole.COMPANY, UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(TimeToFillQuerySchema, 'query'),
  async (req, res) => {
    const query = req.query as unknown as TimeToFillQuery;
    let companyId: string | undefined;
    if (req.userRole === 'company') {
      companyId = await resolveCompanyId(req.userId!);
    }
    // Admin: no companyId filter → platform-wide
    const result = await analyticsService.getTimeToFill({
      companyId,
      groupBy: query.groupBy,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    return ok(res, result);
  },
);

// ---- ANLY-03: Recruiter Scorecard ----

router.get(
  '/scorecard',
  ...authorize(UserRole.RECRUITER),
  rateLimitAuthenticated,
  validate(RecruiterScorecardQuerySchema, 'query'),
  async (req, res) => {
    const recruiterId = await resolveRecruiterId(req.userId!);
    const query = req.query as unknown as RecruiterScorecardQuery;
    const result = await analyticsService.getRecruiterScorecard({
      recruiterId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    return ok(res, result);
  },
);

// ---- ANLY-04: Company Cost Metrics ----

router.get(
  '/cost-metrics',
  ...authorize(UserRole.COMPANY),
  rateLimitAuthenticated,
  validate(CompanyCostMetricsQuerySchema, 'query'),
  async (req, res) => {
    const companyId = await resolveCompanyId(req.userId!);
    const query = req.query as unknown as CompanyCostMetricsQuery;
    const result = await analyticsService.getCompanyCostMetrics({
      companyId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    return ok(res, result);
  },
);

// ---- ANLY-05: Platform Health (Admin) ----

router.get(
  '/platform-health',
  ...authorize(UserRole.ADMIN),
  rateLimitAuthenticated,
  validate(PlatformHealthQuerySchema, 'query'),
  async (req, res) => {
    const query = req.query as unknown as PlatformHealthQuery;
    const result = await analyticsService.getPlatformHealth({
      startDate: query.startDate,
      endDate: query.endDate,
    });
    return ok(res, result);
  },
);

export { router as analyticsRouter };
