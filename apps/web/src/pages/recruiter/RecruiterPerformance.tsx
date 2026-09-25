import { Suspense, lazy, useState, useMemo } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Award,
  Clock,
  DollarSign,
  Target,
} from 'lucide-react';
import { type ReputationTier } from '@gigcruite/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  StatCardV2,
  ChartCard,
  AnimatedMetric,
  DateRangeSelect,
  useDateRange,
  AiAlertPanel,
  type DatePreset,
} from '@/components/custom';
import { TrustBadge } from '@/components/TrustBadge';
import { useRecruiterScorecard } from '@/features/analytics/hooks';

// Lazy charts
const FunnelSteps = lazy(() =>
  import('@/components/charts/FunnelSteps').then((m) => ({ default: m.FunnelSteps })),
);
const ConsistencyGauge = lazy(() =>
  import('@/components/charts/ConsistencyGauge').then((m) => ({
    default: m.ConsistencyGauge,
  })),
);

export default function RecruiterPerformance() {
  const [preset, setPreset] = useState<DatePreset>('90d');
  const dateRange = useDateRange(preset);
  const { data, isPending } = useRecruiterScorecard(dateRange);

  const m = data?.metrics;
  const cmp = data?.platformComparison;

  // Build personal funnel
  const funnelData = useMemo(() => {
    if (!m) return [];
    return [
      { stage: 'Submitted', count: m.totalSubmissions, fill: 'var(--primary)' },
      { stage: 'Shortlisted', count: m.shortlisted, fill: 'var(--color-warning)' },
      { stage: 'Hired', count: m.hired, fill: 'var(--color-success)' },
      { stage: 'Joined', count: m.joined, fill: 'oklch(0.55 0.18 155)' },
    ].filter((d) => d.count > 0);
  }, [m]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
          <p className="text-sm text-muted-foreground">
            {data?.recruiter.fullName
              ? `${data.recruiter.fullName}'s scorecard`
              : 'Your hiring scorecard'}
          </p>
        </div>
        <DateRangeSelect value={preset} onChange={setPreset} />
      </header>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardV2
          icon={<Target className="h-4 w-4" aria-hidden />}
          label="Conversion rate"
          loading={isPending}
          value={m ? `${m.conversionRate}%` : '—'}
          trend={
            cmp
              ? {
                  direction: cmp.isAboveAverage ? 'up' : 'down',
                  label: `Platform avg: ${cmp.platformConversionRate}%`,
                }
              : undefined
          }
        />
        <StatCardV2
          icon={<Clock className="h-4 w-4" aria-hidden />}
          label="Avg days to hire"
          loading={isPending}
          value={
            m?.avgDaysToHire != null ? (
              <AnimatedMetric end={m.avgDaysToHire} suffix="d" decimals={1} />
            ) : (
              '—'
            )
          }
          helper="From submission to hire"
        />
        <StatCardV2
          variant="gradient"
          icon={<DollarSign className="h-4 w-4" aria-hidden />}
          label="Total earned"
          loading={isPending}
          value={
            m ? (
              <AnimatedMetric
                end={Number(m.earningsTotal)}
                prefix="₹"
                separator=","
                decimals={0}
              />
            ) : (
              '—'
            )
          }
          helper={m ? `${m.earningsCount} payouts` : undefined}
        />
        <StatCardV2
          icon={<Award className="h-4 w-4" aria-hidden />}
          label="Placements"
          loading={isPending}
          value={
            data ? (
              <AnimatedMetric end={data.recruiter.totalPlacements} separator="," />
            ) : (
              '—'
            )
          }
          helper={
            data?.recruiter.reputationTier ? (
              <TrustBadge tier={data.recruiter.reputationTier as ReputationTier} score={0} compact />
            ) : undefined
          }
        />
      </section>

      {/* AI Insights */}
      <AiAlertPanel />

      {/* Charts row */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Your hiring funnel"
          description={m ? `${m.totalSubmissions} submissions in period` : undefined}
          loading={isPending}
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <FunnelSteps data={funnelData} />
          </Suspense>
        </ChartCard>

        <ChartCard
          title="Consistency score"
          description="Measures regularity of your submission activity"
          loading={isPending}
          height={200}
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <div className="flex h-full items-center justify-center">
              <ConsistencyGauge score={m?.consistencyScore ?? null} />
            </div>
          </Suspense>
        </ChartCard>
      </section>

      {/* Platform comparison card */}
      {cmp && m && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <CompareMetric
                label="Your conversion"
                value={`${m.conversionRate}%`}
                platformValue={`${cmp.platformConversionRate}%`}
                isAbove={cmp.isAboveAverage}
              />
              <CompareMetric
                label="Submissions"
                value={String(m.totalSubmissions)}
                platformValue="—"
                isAbove={null}
              />
              <CompareMetric
                label="Hired"
                value={String(m.hired)}
                platformValue="—"
                isAbove={null}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CompareMetric({
  label,
  value,
  platformValue,
  isAbove,
}: {
  label: string;
  value: string;
  platformValue: string;
  isAbove: boolean | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold tabular-nums">{value}</span>
        {isAbove != null && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${isAbove ? 'text-success' : 'text-destructive'}`}
          >
            {isAbove ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {isAbove ? 'Above' : 'Below'} avg
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Platform: {platformValue}</p>
    </div>
  );
}
