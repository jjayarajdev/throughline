import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import * as api from './api';

const STALE = 60_000;

// ── Anomaly hooks ────────────────────────────────────────────

export function useAnomalies(filter: {
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ['analytics-ai', 'anomalies', filter],
    queryFn: () => api.fetchAnomalies(filter),
    enabled: !!role,
    staleTime: STALE,
  });
}

export function useAnomalySummary() {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ['analytics-ai', 'anomaly-summary'],
    queryFn: () => api.fetchAnomalySummary(),
    enabled: !!role,
    staleTime: STALE,
  });
}

export function useAcknowledgeAnomaly() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.acknowledgeAnomaly(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['analytics-ai'] });
    },
  });
}

export function useResolveAnomaly() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.resolveAnomaly(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['analytics-ai'] });
    },
  });
}

// ── Admin hooks ──────────────────────────────────────────────

export function useAiUsage(filter: { startDate?: string; endDate?: string } = {}) {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ['analytics-ai', 'ai-usage', filter],
    queryFn: () => api.fetchAiUsage(filter),
    enabled: role === 'admin',
    staleTime: STALE,
  });
}

export function useAiStatus() {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ['analytics-ai', 'ai-status'],
    queryFn: () => api.fetchAiStatus(),
    enabled: role === 'admin',
    staleTime: 5 * 60_000,
  });
}

export function useTriggerAnomalySweep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.triggerAnomalySweep(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['analytics-ai'] });
    },
  });
}
