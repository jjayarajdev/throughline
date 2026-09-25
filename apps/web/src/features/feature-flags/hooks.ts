import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FeatureFlags, FeatureFlagRecord } from './types';
import { fetchFeatureFlags, fetchAdminFeatureFlags, flushFeatureFlagCache } from './api';

const ALL_FALSE: FeatureFlags = {
  analytics_dashboards: false,
  analytics_ai: false,
  matching_ai: false,
};

export function useFeatureFlags(): FeatureFlags {
  const { data } = useQuery<FeatureFlags>({
    queryKey: ['feature-flags'],
    queryFn: fetchFeatureFlags,
    staleTime: 5 * 60 * 1000,
  });
  return data ?? ALL_FALSE;
}

export function useAdminFeatureFlags() {
  return useQuery<FeatureFlagRecord[]>({
    queryKey: ['admin', 'feature-flags'],
    queryFn: fetchAdminFeatureFlags,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFlushFeatureFlagCache() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: flushFeatureFlagCache,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
    },
  });
}
