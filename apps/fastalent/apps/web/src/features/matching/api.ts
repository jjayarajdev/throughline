import type { MatchResult, JdCruxResponse, MatchCheckInput } from '@gigcruite/types';
import { apiGet, apiPost } from '@/lib/api-client';

export async function getJdCrux(roleId: string): Promise<JdCruxResponse | null> {
  return apiGet<JdCruxResponse | null>(`/matching/roles/${roleId}/jd-crux`);
}

export async function checkMatch(roleId: string, input: MatchCheckInput): Promise<MatchResult> {
  return apiPost<MatchResult, MatchCheckInput>(`/matching/roles/${roleId}/match-check`, input);
}

export async function triggerJdExtraction(roleId: string): Promise<{ message: string }> {
  return apiPost<{ message: string }>(`/matching/roles/${roleId}/extract-jd`);
}
