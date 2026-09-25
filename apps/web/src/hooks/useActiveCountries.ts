import { useQuery } from '@tanstack/react-query';
import type { CountryConfigResponse } from '@gigcruite/types';
import { fetchActiveCountryConfigs } from '@/features/admin/api';

/**
 * Fetches active country configs for authenticated users.
 * Used on profile pages to populate country/currency dropdowns.
 */
export function useActiveCountries() {
  return useQuery<CountryConfigResponse[]>({
    queryKey: ['admin', 'countries', 'active'],
    queryFn: () => fetchActiveCountryConfigs(),
    staleTime: 5 * 60_000,
  });
}
