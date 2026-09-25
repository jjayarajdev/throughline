// Phase 15 — Analytics AI frontend types

export type AnomalyType = 'stale_role' | 'declining_activity' | 'high_rejection_rate';
export type AnomalySeverity = 'low' | 'medium' | 'high';
export type AnomalyStatus = 'active' | 'acknowledged' | 'resolved' | 'expired';

export interface AnomalyFactor {
  label: string;
  value: string;
  comparison?: string;
}

export interface AnomalyAlert {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  targetType: string;
  targetId: string;
  title: string;
  explanation: string;
  factors: AnomalyFactor[];
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  expiresAt: string | null;
}

export interface AnomalyListResponse {
  items: AnomalyAlert[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AnomalySummary {
  activeCount: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface AiUsageStats {
  totals: {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: string;
    avgLatencyMs: number;
  };
  byOperation: Array<{
    operation: string;
    calls: number;
    totalTokens: number;
    costUsd: string;
  }>;
  byProvider: Array<{
    provider: string;
    model: string;
    calls: number;
    totalTokens: number;
    costUsd: string;
  }>;
  recentLogs: Array<{
    id: string;
    provider: string;
    model: string;
    operation: string;
    totalTokens: number;
    costUsd: string;
    latencyMs: number;
    createdAt: string;
  }>;
}

export interface AiStatus {
  aiAvailable: boolean;
  provider: string;
  model: string;
  anomalyIntervalHours: number;
}
