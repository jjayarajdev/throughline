import { Suspense, lazy, useState, useMemo } from 'react';
import {
  Activity,
  Building2,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import {
  StatCardV2,
  ChartCard,
  AnimatedMetric,
  DateRangeSelect,
  useDateRange,
  AiAlertPanel,
  type DatePreset,
} from '@/components/custom';
import {
  usePlatformHealth,
  useTimeToFill,
} from '@/features/analytics/hooks';

// Lazy charts
const FunnelSteps = lazy(() =>
  import('@/components/charts/FunnelSteps').then((m) => ({ default: m.FunnelSteps })),
);
const TimeToFillTrend = lazy(() =>
  import('@/components/charts/TimeToFillTrend').then((m) => ({
    default: m.TimeToFillTrend,
  })),
);
const TierDistribution = lazy(() =>
  import('@/components/charts/TierDistribution').then((m) => ({
    default: m.TierDistribution,
  })),
);

type TtfGroupBy = 'month' | 'quarter' | 'roleType';

function fmt(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return '₹0';
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function AdminIntelligence() {
  const [preset, setPreset] = useState<DatePreset>('90d');
  const [ttfGroup, setTtfGroup] = useState<TtfGroupBy>('month');
  const dateRange = useDateRange(preset);

  const health = usePlatformHealth(dateRange);
  const ttf = useTimeToFill({ ...dateRange, groupBy: ttfGroup });

  const h = health.data;
  const isPending = health.isPending;

  // Platform funnel chart data
  const funnelData = useMemo(() => {
    if (!h) return [];
    return [
      { stage: 'Submitted', count: h.funnel.submitted, fill: 'var(--primary)' },
      { stage: 'Shortlisted', count: h.funnel.shortlisted, fill: 'var(--color-warning)' },
      { stage: 'Interview', count: h.funnel.interview, fill: 'oklch(0.65 0.15 250)' },
      { stage: 'Hired', count: h.funnel.hired, fill: 'var(--color-success)' },
    ].filter((d) => d.count > 0);
  }, [h]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Platform-wide hiring analytics
          </p>
        </div>
        <DateRangeSelect value={preset} onChange={setPreset} />
      </header>

      {/* Overview stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardV2
          icon={<Activity className="h-4 w-4" aria-hidden />}
          label="Active roles"
          loading={isPending}
          value={
            h ? <AnimatedMetric end={h.overview.activeRoles} separator="," /> : '—'
          }
          helper={h ? `${h.overview.totalRoles} roles in period` : undefined}
        />
        <StatCardV2
          icon={<Users className="h-4 w-4" aria-hidden />}
          label="Conversion rate"
          loading={isPending}
          value={h ? `${h.funnel.conversionRate}%` : '—'}
          helper={
            h
              ? `${h.funnel.submitted} → ${h.funnel.hired} hired`
              : undefined
          }
        />
        <StatCardV2
          icon={<Clock className="h-4 w-4" aria-hidden />}
          label="Avg time-to-fill"
          loading={ttf.isPending}
          value={
            ttf.data?.average != null ? (
              <AnimatedMetric end={ttf.data.average} suffix="d" decimals={1} />
            ) : (
              '—'
            )
          }
          helper={
            ttf.data?.stddev != null
              ? `σ = ${ttf.data.stddev}d · Median: ${ttf.data.median}d`
              : undefined
          }
        />
        <StatCardV2
          variant="gradient"
          icon={<DollarSign className="h-4 w-4" aria-hidden />}
          label="Platform commission"
          loading={isPending}
          value={h ? fmt(h.financials.platformCommission) : '—'}
          helper={h ? `Revenue: ${fmt(h.financials.totalRevenue)}` : undefined}
        />
      </section>

      {/* Row 2: Entity counts */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCardV2
          icon={<Building2 className="h-4 w-4" aria-hidden />}
          label="Companies"
          loading={isPending}
          value={
            h ? <AnimatedMetric end={h.overview.totalCompanies} separator="," /> : '—'
          }
        />
        <StatCardV2
          icon={<Users className="h-4 w-4" aria-hidden />}
          label="Recruiters"
          loading={isPending}
          value={
            h ? <AnimatedMetric end={h.overview.totalRecruiters} separator="," /> : '—'
          }
        />
        <StatCardV2
          icon={<TrendingUp className="h-4 w-4" aria-hidden />}
          label="Active users"
          loading={isPending}
          value={
            h ? <AnimatedMetric end={h.overview.activeUsers} separator="," /> : '—'
          }
          helper="Logged in within period"
        />
      </section>

      {/* AI Insights — admin sees all platform-wide alerts */}
      <AiAlertPanel limit={8} />

      {/* Charts row 1 */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Platform hiring funnel"
          description={
            h
              ? `${h.funnel.submitted} submissions · ${h.funnel.conversionRate}% end-to-end`
              : undefined
          }
          loading={isPending}
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <FunnelSteps data={funnelData} />
          </Suspense>
        </ChartCard>

        <ChartCard
          title="Time-to-fill trend"
          description={
            ttf.data
              ? `${ttf.data.count} roles filled · Avg ${ttf.data.average ?? '—'}d`
              : undefined
          }
          loading={ttf.isPending}
          action={
            <Select
              value={ttfGroup}
              onChange={(e) => setTtfGroup(e.target.value as TtfGroupBy)}
              style={{ width: 'auto', minWidth: 120 }}
            >
              <option value="month">By month</option>
              <option value="quarter">By quarter</option>
              <option value="roleType">By role type</option>
            </Select>
          }
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <TimeToFillTrend
              data={ttf.data?.trend ?? []}
              platformAverage={ttf.data?.average}
            />
          </Suspense>
        </ChartCard>
      </section>

      {/* Charts row 2 */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Recruiter tier distribution"
          description={
            h
              ? `${h.overview.totalRecruiters} total recruiters`
              : undefined
          }
          loading={isPending}
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <TierDistribution data={h?.recruiterTiers ?? {}} />
          </Suspense>
        </ChartCard>

        {/* Financials summary card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6" />
                ))}
              </div>
            ) : h ? (
              <div className="space-y-4">
                <FinRow label="Total revenue" value={fmt(h.financials.totalRevenue)} />
                <FinRow
                  label="Platform commission"
                  value={fmt(h.financials.platformCommission)}
                  highlight
                />
                <FinRow
                  label="Recruiter payouts"
                  value={fmt(h.financials.recruiterPayouts)}
                />
                <FinRow
                  label="Completed payouts"
                  value={fmt(h.financials.completedPayouts)}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      {/* Time-to-fill percentiles card */}
      {ttf.data && ttf.data.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Time-to-fill distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-5">
              <Percentile label="P25" value={ttf.data.p25} />
              <Percentile label="Median" value={ttf.data.median} />
              <Percentile label="Average" value={ttf.data.average} />
              <Percentile label="P75" value={ttf.data.p75} />
              <Percentile label="P90" value={ttf.data.p90} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Based on {ttf.data.count} filled roles · Standard deviation:{' '}
              {ttf.data.stddev ?? '—'} days
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FinRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-semibold tabular-nums ${highlight ? 'text-primary' : 'text-foreground'}`}
      >
        {value}
      </span>
    </div>
  );
}

function Percentile({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tabular-nums">
        {value != null ? `${value}d` : '—'}
      </p>
    </div>
  );
}
