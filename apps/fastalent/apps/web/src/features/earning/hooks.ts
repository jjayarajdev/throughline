import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { EarningSummaryResponse } from '@gigcruite/types';
import { fetchEarnings, fetchEarningSummary, type EarningFilters, type PaginatedEarnings } from './api';

export function useEarnings(filters: EarningFilters) {
  return useQuery<PaginatedEarnings>({
    queryKey: ['earnings', 'list', filters],
    queryFn: () => fetchEarnings(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useEarningSummary() {
  return useQuery<EarningSummaryResponse>({
    queryKey: ['earnings', 'summary'],
    queryFn: fetchEarningSummary,
    staleTime: 30_000,
  });
}
