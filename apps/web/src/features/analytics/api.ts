import { apiGet } from '@/lib/api-client';
import type {
  DateRangeFilter,
  FunnelResponse,
  TimeToFillResponse,
  ScorecardResponse,
  CostMetricsResponse,
  PlatformHealthResponse,
} from './types';

function toQs(filter: object): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (typeof v === 'string' && v !== '') p.set(k, v);
  }
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

// ANLY-01 — Company submission funnel
export function fetchFunnel(filter: DateRangeFilter & { roleId?: string }) {
  return apiGet<FunnelResponse>(`/analytics/funnel${toQs(filter)}`);
}

// ANLY-02 — Time-to-fill (company or admin)
export function fetchTimeToFill(
  filter: DateRangeFilter & { groupBy?: 'month' | 'quarter' | 'roleType' },
) {
  return apiGet<TimeToFillResponse>(`/analytics/time-to-fill${toQs(filter)}`);
}

// ANLY-03 — Recruiter scorecard
export function fetchScorecard(filter: DateRangeFilter) {
  return apiGet<ScorecardResponse>(`/analytics/scorecard${toQs(filter)}`);
}

// ANLY-04 — Company cost metrics
export function fetchCostMetrics(filter: DateRangeFilter) {
  return apiGet<CostMetricsResponse>(`/analytics/cost-metrics${toQs(filter)}`);
}

// ANLY-05 — Platform health (admin)
export function fetchPlatformHealth(filter: DateRangeFilter) {
  return apiGet<PlatformHealthResponse>(`/analytics/platform-health${toQs(filter)}`);
}
