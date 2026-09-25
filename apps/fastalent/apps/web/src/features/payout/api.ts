import type { PayoutRequestResponse } from '@gigcruite/types';
import { apiGet, apiPost } from '@/lib/api-client';

export interface PayoutFilters {
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedPayoutRequests {
  requests: PayoutRequestResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export function createPayoutRequest(amount: number): Promise<PayoutRequestResponse> {
  return apiPost<PayoutRequestResponse>('/payouts/request', { amount });
}

export function fetchPayoutRequests(filters: PayoutFilters): Promise<PaginatedPayoutRequests> {
  return apiGet<PaginatedPayoutRequests>('/payouts/requests', { params: filters });
}
