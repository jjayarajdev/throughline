import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateCompanyProfileInput } from '@gigcruite/types';
import { invalidateByEvent } from '@/lib/cache-registry';
import { useAuthStore } from '@/stores/auth-store';
import { companyApi } from './api';

const PROFILE_QUERY_KEY = ['companies', 'profile'] as const;

export function useCompanyProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => companyApi.getProfile(),
    enabled: isAuthenticated && role === 'company',
    staleTime: 60_000,
  });
}

export function useUpdateCompanyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCompanyProfileInput) =>
      companyApi.updateProfile(payload),
    onSuccess: (data) => {
      qc.setQueryData(PROFILE_QUERY_KEY, data);
      invalidateByEvent(qc, 'company.profile.updated');
    },
  });
}
