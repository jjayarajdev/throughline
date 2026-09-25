import { useQuery, useMutation } from '@tanstack/react-query';
import type { MatchCheckInput } from '@gigcruite/types';
import * as matchingApi from './api';

export function useJdCrux(roleId: string | undefined) {
  return useQuery({
    queryKey: ['jd-crux', roleId],
    queryFn: () => matchingApi.getJdCrux(roleId!),
    enabled: !!roleId,
    staleTime: 5 * 60_000,
  });
}

export function useMatchCheck(roleId: string | undefined) {
  return useMutation({
    mutationFn: (input: MatchCheckInput) => matchingApi.checkMatch(roleId!, input),
  });
}

export function useTriggerJdExtraction() {
  return useMutation({
    mutationFn: (roleId: string) => matchingApi.triggerJdExtraction(roleId),
  });
}
