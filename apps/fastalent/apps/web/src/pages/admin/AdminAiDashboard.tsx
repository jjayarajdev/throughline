import { useState } from 'react';
import {
  Activity,
  Bot,
  Coins,
  Play,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  StatCardV2,
  AnimatedMetric,
  DateRangeSelect,
  useDateRange,
  AiAlertPanel,
  type DatePreset,
} from '@/components/custom';
import {
  useAiStatus,
  useAiUsage,
  useAnomalySummary,
  useTriggerAnomalySweep,
} from '@/features/analytics-ai';

export default function AdminAiDashboard() {
  const [preset, setPreset] = useState<DatePreset>('30d');
  const dateRange = useDateRange(preset);

  const status = useAiStatus();
  const usage = useAiUsage(dateRange);
  const summary = useAnomalySummary();
  const sweep = useTriggerAnomalySweep();

  const s = status.data;
  const u = usage.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Management</h1>
          <p className="text-sm text-muted-foreground">
            System status, token usage, and anomaly detection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelect value={preset} onChange={setPreset} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => sweep.mutate()}
            disabled={sweep.isPending}
          >
            {sweep.isPending ? (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="mr-1.5 h-3.5 w-3.5" />
            )}
            Run Sweep
          </Button>
        </div>
      </header>

      {/* System status */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardV2
          icon={<Bot className="h-4 w-4" aria-hidden />}
          label="AI Provider"
          loading={status.isPending}
          value={s ? `${s.provider}` : '—'}
          helper={s ? `Model: ${s.model}` : undefined}
        />
        <StatCardV2
          icon={<Activity className="h-4 w-4" aria-hidden />}
          label="Status"
          loading={status.isPending}
          value={
            s ? (
              <Badge variant={s.aiAvailable ? 'success' : 'warning'}>
                {s.aiAvailable ? 'Connected' : 'No API key'}
              </Badge>
            ) : (
              '—'
            )
          }
          helper={
            s
              ? `Sweep interval: ${s.anomalyIntervalHours === 0 ? 'disabled' : `${s.anomalyIntervalHours}h`}`
              : undefined
          }
        />
        <StatCardV2
          icon={<Sparkles className="h-4 w-4" aria-hidden />}
          label="Active Anomalies"
          loading={summary.isPending}
          value={
            summary.data ? (
              <AnimatedMetric end={summary.data.activeCount} />
            ) : (
              '—'
            )
          }
          helper={
            summary.data
              ? Object.entries(summary.data.bySeverity)
                  .map(([k, v]) => `${v} ${k}`)
                  .join(' · ') || 'None'
              : undefined
          }
        />
        <StatCardV2
          variant="gradient"
          icon={<Coins className="h-4 w-4" aria-hidden />}
          label="Token cost"
          loading={usage.isPending}
          value={u ? `$${Number(u.totals.costUsd).toFixed(4)}` : '—'}
          helper={u ? `${u.totals.calls} API calls` : undefined}
        />
      </section>

      {/* Token usage breakdown */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage by Operation</CardTitle>
          </CardHeader>
          <CardContent>
            {usage.isPending ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-6" />
                ))}
              </div>
            ) : u && u.byOperation.length > 0 ? (
              <div className="space-y-3">
                {u.byOperation.map((op) => (
                  <div key={op.operation} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{op.operation.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{op.calls} calls</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {op.totalTokens.toLocaleString()} tokens
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${Number(op.costUsd).toFixed(4)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No AI operations in this period</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            {usage.isPending ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-6" />
                ))}
              </div>
            ) : u && u.byProvider.length > 0 ? (
              <div className="space-y-3">
                {u.byProvider.map((p) => (
                  <div key={`${p.provider}-${p.model}`} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.provider}</p>
                      <p className="text-xs text-muted-foreground">{p.model}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {p.totalTokens.toLocaleString()} tokens
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.calls} calls · ${Number(p.costUsd).toFixed(4)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No provider usage in this period</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent AI logs */}
      {u && u.recentLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              Recent AI Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Operation</th>
                    <th className="pb-2 font-medium">Provider</th>
                    <th className="pb-2 font-medium text-right">Tokens</th>
                    <th className="pb-2 font-medium text-right">Cost</th>
                    <th className="pb-2 font-medium text-right">Latency</th>
                    <th className="pb-2 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {u.recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2">{log.operation.replace(/_/g, ' ')}</td>
                      <td className="py-2 text-muted-foreground">
                        {log.provider}/{log.model}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {log.totalTokens.toLocaleString()}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        ${Number(log.costUsd).toFixed(4)}
                      </td>
                      <td className="py-2 text-right tabular-nums">{log.latencyMs}ms</td>
                      <td className="py-2 text-right text-muted-foreground">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active anomalies */}
      <AiAlertPanel limit={20} />
    </div>
  );
}
