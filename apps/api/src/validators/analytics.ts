import { z } from 'zod';

// ---- Shared ----

const dateRangeFields = {
  startDate: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() !== '' ? v : undefined),
      z.string().datetime({ offset: true }).or(z.string().date()).optional(),
    )
    .optional(),
  endDate: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() !== '' ? v : undefined),
      z.string().datetime({ offset: true }).or(z.string().date()).optional(),
    )
    .optional(),
};

// ---- Company Funnel ----

export const CompanyFunnelQuerySchema = z
  .object({
    roleId: z.string().uuid().optional(),
    ...dateRangeFields,
  })
  .strict();

export type CompanyFunnelQuery = z.infer<typeof CompanyFunnelQuerySchema>;

// ---- Time-to-Fill ----

export const TimeToFillQuerySchema = z
  .object({
    groupBy: z.enum(['month', 'quarter', 'roleType']).optional(),
    ...dateRangeFields,
  })
  .strict();

export type TimeToFillQuery = z.infer<typeof TimeToFillQuerySchema>;

// ---- Recruiter Scorecard ----

export const RecruiterScorecardQuerySchema = z
  .object({
    ...dateRangeFields,
  })
  .strict();

export type RecruiterScorecardQuery = z.infer<typeof RecruiterScorecardQuerySchema>;

// ---- Company Cost Metrics ----

export const CompanyCostMetricsQuerySchema = z
  .object({
    ...dateRangeFields,
  })
  .strict();

export type CompanyCostMetricsQuery = z.infer<typeof CompanyCostMetricsQuerySchema>;

// ---- Platform Health (Admin) ----

export const PlatformHealthQuerySchema = z
  .object({
    ...dateRangeFields,
  })
  .strict();

export type PlatformHealthQuery = z.infer<typeof PlatformHealthQuerySchema>;
