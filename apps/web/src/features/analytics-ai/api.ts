import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type {
  AnomalyListResponse,
  AnomalySummary,
  AiUsageStats,
  AiStatus,
} from './types';

function toQs(filter: object): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (v != null && String(v) !== '') p.set(k, String(v));
  }
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

// ── Anomalies ────────────────────────────────────────────────

export function fetchAnomalies(filter: {
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  return apiGet<AnomalyListResponse>(`/analytics/ai/anomalies${toQs(filter)}`);
}

export function fetchAnomalySummary() {
  return apiGet<AnomalySummary>('/analytics/ai/anomalies/summary');
}

export function acknowledgeAnomaly(id: string) {
  return apiPatch<{ id: string; status: string }>(`/analytics/ai/anomalies/${id}/acknowledge`);
}

export function resolveAnomaly(id: string) {
  return apiPatch<{ id: string; status: string }>(`/analytics/ai/anomalies/${id}/resolve`);
}

// ── AI Admin ─────────────────────────────────────────────────

export function fetchAiUsage(filter: { startDate?: string; endDate?: string } = {}) {
  return apiGet<AiUsageStats>(`/analytics/ai/ai-usage${toQs(filter)}`);
}

export function fetchAiStatus() {
  return apiGet<AiStatus>('/analytics/ai/ai-status');
}

export function triggerAnomalySweep() {
  return apiPost<{ message: string }>('/analytics/ai/anomalies/sweep');
}
