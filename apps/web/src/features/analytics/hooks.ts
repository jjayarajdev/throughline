import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import type { DateRangeFilter } from './types';
import * as api from './api';

const STALE = 60_000; // 1 min — analytics data is not rapidly changing

// ── Company hooks ───────────────────────────────────────────

export function useCompanyFunnel(filter: DateRangeFilter & { roleId?: string } = {}) {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ['analytics', 'funnel', filter],
    queryFn: () => api.fetchFunnel(filter),
    enabled: role === 'company',
    staleTime: STALE,
  });
}

export function useTimeToFill(
  filter: DateRangeFilter & { groupBy?: 'month' | 'quarter' | 'roleType' } = {},
) {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ['analytics', 'time-to-fill', filter],
    queryFn: () => api.fetchTimeToFill(filter),
    enabled: role === 'company' || role === 'admin',
    staleTime: STALE,
  });
}

export function useCompanyCostMetrics(filter: DateRangeFilter = {}) {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ['analytics', 'cost-metrics', filter],
    queryFn: () => api.fetchCostMetrics(filter),
    enabled: role === 'company',
    staleTime: STALE,
  });
}

// ── Recruiter hooks ─────────────────────────────────────────

export function useRecruiterScorecard(filter: DateRangeFilter = {}) {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ['analytics', 'scorecard', filter],
    queryFn: () => api.fetchScorecard(filter),
    enabled: role === 'recruiter',
    staleTime: STALE,
  });
}

// ── Admin hooks ─────────────────────────────────────────────

export function usePlatformHealth(filter: DateRangeFilter = {}) {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ['analytics', 'platform-health', filter],
    queryFn: () => api.fetchPlatformHealth(filter),
    enabled: role === 'admin',
    staleTime: STALE,
  });
}
