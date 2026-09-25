import { apiGet, apiPost } from '@/lib/api-client';
import type { FeatureFlags, FeatureFlagRecord } from './types';

export function fetchFeatureFlags(): Promise<FeatureFlags> {
  return apiGet<FeatureFlags>('/feature-flags');
}

export function fetchAdminFeatureFlags(): Promise<FeatureFlagRecord[]> {
  return apiGet<FeatureFlagRecord[]>('/admin/feature-flags');
}

export function flushFeatureFlagCache(): Promise<{ flushed: number }> {
  return apiPost<{ flushed: number }>('/admin/feature-flags/flush-cache');
}
