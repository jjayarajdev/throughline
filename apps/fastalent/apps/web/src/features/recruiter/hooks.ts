import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  UpdateRecruiterBankDetailsInput,
  UpdateRecruiterProfileInput,
} from '@gigcruite/types';
import { invalidateByEvent } from '@/lib/cache-registry';
import { useAuthStore } from '@/stores/auth-store';
import { recruiterApi } from './api';

/**
 * Recruiter profile hooks.
 *
 * The query is gated by `isAuthenticated` to prevent spurious fetches
 * from unauthenticated tabs. Mutations emit domain events through the
 * cache-invalidation registry so the profile view refetches automatically
 * after a successful update.
 */

const PROFILE_QUERY_KEY = ['recruiters', 'profile'] as const;

export function useRecruiterProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => recruiterApi.getProfile(),
    // Only fetch if the signed-in user is actually a recruiter — saves a
    // pointless 403 round-trip for other roles.
    enabled: isAuthenticated && role === 'recruiter',
    staleTime: 60_000,
  });
}

export function useUpdateRecruiterProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRecruiterProfileInput) =>
      recruiterApi.updateProfile(payload),
    onSuccess: (data) => {
      // Seed the cache directly so the UI reflects the change immediately
      // without waiting for the invalidation refetch.
      qc.setQueryData(PROFILE_QUERY_KEY, data);
      invalidateByEvent(qc, 'recruiter.profile.updated');
    },
  });
}

export function useUpdateBankDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRecruiterBankDetailsInput) =>
      recruiterApi.updateBankDetails(payload),
    onSuccess: (data) => {
      qc.setQueryData(PROFILE_QUERY_KEY, data);
      invalidateByEvent(qc, 'recruiter.bank-details.updated');
    },
  });
}
