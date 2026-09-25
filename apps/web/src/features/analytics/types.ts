// ────────────────────────────────────────────────────────────
// Analytics API response types — mirrors analytics.service.ts
// ────────────────────────────────────────────────────────────

/** Shared date-range filter used by all analytics hooks. */
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

// ── ANLY-01: Company Submission Funnel ───────────────────────

export interface FunnelResponse {
  roleCount: number;
  funnel: {
    submitted: number;
    shortlisted: number;
    interview: number;
    hired: number;
    joined: number;
    rejected: number;
    withdrawn: number;
  };
  conversionRates: {
    submittedToShortlisted: string;
    shortlistedToInterview: string;
    interviewToHired: string;
    hiredToJoined: string;
    endToEnd: string;
  };
  dateRange: { from: string; to: string };
}

// ── ANLY-02: Time-to-Fill ───────────────────────────────────

export interface TimeToFillResponse {
  count: number;
  average: number | null;
  median: number | null;
  p25: number | null;
  p75: number | null;
  p90: number | null;
  stddev: number | null;
  trend: Array<{ label: string; average: number; count: number }>;
  dateRange: { from: string; to: string };
}

// ── ANLY-03: Recruiter Scorecard ────────────────────────────

export interface ScorecardResponse {
  recruiter: {
    id: string;
    fullName: string;
    reputationTier: string;
    totalPlacements: number;
  };
  metrics: {
    totalSubmissions: number;
    shortlisted: number;
    hired: number;
    joined: number;
    conversionRate: string;
    avgDaysToHire: number | null;
    earningsTotal: string;
    earningsCount: number;
    consistencyScore: number | null;
  };
  platformComparison: {
    platformConversionRate: string;
    isAboveAverage: boolean;
  };
  dateRange: { from: string; to: string };
}

// ── ANLY-04: Company Cost Metrics ───────────────────────────

export interface CostMetricsResponse {
  summary: {
    totalSpend: string;
    totalCommission: string;
    totalSavings: string;
    rolesCount: number;
    totalHired: number;
    avgCostPerHire: string | null;
    submissionQualityRatio: string;
  };
  roles: Array<{
    id: string;
    title: string;
    roleType: string;
    hiredCount: number;
    submissionsCount: number;
    costPerHire: string | null;
    totalPayout: string | null;
    submissionToHireRatio: string | null;
    uniqueRecruiters: number;
    effectiveCommissionPct: string | null;
  }>;
  dateRange: { from: string; to: string };
}

// ── ANLY-05: Platform Health (Admin) ────────────────────────

export interface PlatformHealthResponse {
  overview: {
    totalCompanies: number;
    totalRecruiters: number;
    totalRoles: number;
    activeRoles: number;
    activeUsers: number;
  };
  funnel: {
    submitted: number;
    shortlisted: number;
    interview: number;
    hired: number;
    conversionRate: string;
  };
  financials: {
    totalRevenue: string;
    platformCommission: string;
    recruiterPayouts: string;
    completedPayouts: string;
  };
  recruiterTiers: Record<string, number>;
  dateRange: { from: string; to: string };
}
