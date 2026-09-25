import type { EarningResponse, EarningSummaryResponse } from '@gigcruite/types';
import { apiGet } from '@/lib/api-client';

export interface EarningFilters {
  status?: string;
  earningType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedEarnings {
  earnings: EarningResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export function fetchEarnings(filters: EarningFilters): Promise<PaginatedEarnings> {
  return apiGet<PaginatedEarnings>('/earnings', { params: filters });
}

export function fetchEarningSummary(): Promise<EarningSummaryResponse> {
  return apiGet<EarningSummaryResponse>('/earnings/summary');
}
