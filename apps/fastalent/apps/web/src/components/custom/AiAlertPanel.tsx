import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Sparkles,
  TrendingDown,
  Clock,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAnomalies,
  useAnomalySummary,
  useAcknowledgeAnomaly,
  useResolveAnomaly,
} from '@/features/analytics-ai';
import type { AnomalyAlert, AnomalySeverity, AnomalyType } from '@/features/analytics-ai';

const TYPE_META: Record<AnomalyType, { icon: typeof AlertTriangle; label: string; color: string }> =
  {
    stale_role: { icon: Clock, label: 'Stale Role', color: 'text-warning' },
    declining_activity: {
      icon: TrendingDown,
      label: 'Activity Drop',
      color: 'text-destructive',
    },
    high_rejection_rate: {
      icon: XCircle,
      label: 'High Rejection',
      color: 'text-destructive',
    },
  };

const SEVERITY_BADGE: Record<AnomalySeverity, 'destructive' | 'warning' | 'info'> = {
  high: 'destructive',
  medium: 'warning',
  low: 'info',
};

function AlertItem({ alert }: { alert: AnomalyAlert }) {
  const [expanded, setExpanded] = useState(false);
  const ack = useAcknowledgeAnomaly();
  const resolve = useResolveAnomaly();

  const meta = TYPE_META[alert.type];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors',
        alert.status === 'active' && 'border-warning/30 bg-warning/5',
        alert.status === 'acknowledged' && 'border-muted bg-muted/30',
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', meta.color)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium leading-tight">{alert.title}</span>
            <Badge variant={SEVERITY_BADGE[alert.severity]} className="text-[10px] px-1.5 py-0">
              {alert.severity}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {meta.label}
            </Badge>
          </div>

          {expanded && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {alert.explanation}
              </p>
              {alert.factors.length > 0 && (
                <div className="grid gap-1">
                  {alert.factors.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className="font-medium tabular-nums">
                        {f.value}
                        {f.comparison && (
                          <span className="ml-1.5 text-muted-foreground">
                            ({f.comparison})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {alert.status === 'active' && (
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => ack.mutate(alert.id)}
                    disabled={ack.isPending}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    Acknowledge
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => resolve.mutate(alert.id)}
                    disabled={resolve.isPending}
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Resolve
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

interface AiAlertPanelProps {
  className?: string;
  /** Max alerts to show (default 5) */
  limit?: number;
}

export function AiAlertPanel({ className, limit = 5 }: AiAlertPanelProps) {
  const summary = useAnomalySummary();
  const anomalies = useAnomalies({ status: 'active', pageSize: limit });

  const activeCount = summary.data?.activeCount ?? 0;
  const items = anomalies.data?.items ?? [];
  const isLoading = summary.isPending || anomalies.isPending;

  // Don't render if no alerts and not loading
  if (!isLoading && activeCount === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Insights
          {activeCount > 0 && (
            <Badge variant="warning" className="ml-1 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
