import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { PayoutRequestResponse } from '@gigcruite/types';
import { useRef } from 'react';
import { createPayoutRequest, fetchPayoutRequests, type PayoutFilters, type PaginatedPayoutRequests } from './api';
import { invalidateByEvent } from '@/lib/cache-registry';

export function usePayoutRequests(filters: PayoutFilters) {
  return useQuery<PaginatedPayoutRequests>({
    queryKey: ['payouts', 'requests', filters],
    queryFn: () => fetchPayoutRequests(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCreatePayoutRequest() {
  const qc = useQueryClient();
  // StrictMode double-invoke guard
  const inflight = useRef(false);

  return useMutation<PayoutRequestResponse, Error, number>({
    mutationFn: async (amount: number) => {
      if (inflight.current) throw new Error('Duplicate payout request blocked');
      inflight.current = true;
      try {
        return await createPayoutRequest(amount);
      } finally {
        inflight.current = false;
      }
    },
    onSuccess: () => {
      invalidateByEvent(qc, 'payout.requested');
    },
  });
}
