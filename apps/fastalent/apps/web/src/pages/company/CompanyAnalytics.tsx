import { Suspense, lazy, useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Clock,
  DollarSign,
  Filter,
  PiggyBank,
} from 'lucide-react';
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
import { DataTable } from '@/components/data-table';
import {
  useCompanyFunnel,
  useTimeToFill,
  useCompanyCostMetrics,
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
const CostBreakdownBar = lazy(() =>
  import('@/components/charts/CostBreakdownBar').then((m) => ({
    default: m.CostBreakdownBar,
  })),
);

interface RoleRow {
  id: string;
  title: string;
  roleType: string;
  hiredCount: number;
  submissionsCount: number;
  costPerHire: string | null;
  totalPayout: string | null;
  submissionToHireRatio: string | null;
  uniqueRecruiters: number;
  effectiveCommissionPct: string | null;
}

function fmt(value: string | null): string {
  if (!value) return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function CompanyAnalytics() {
  const [preset, setPreset] = useState<DatePreset>('90d');
  const dateRange = useDateRange(preset);

  const funnel = useCompanyFunnel(dateRange);
  const ttf = useTimeToFill({ ...dateRange, groupBy: 'month' });
  const cost = useCompanyCostMetrics(dateRange);

  // Build funnel chart data
  const funnelData = useMemo(() => {
    const f = funnel.data?.funnel;
    if (!f) return [];
    return [
      { stage: 'Submitted', count: f.submitted, fill: 'var(--primary)' },
      { stage: 'Shortlisted', count: f.shortlisted, fill: 'var(--color-warning)' },
      { stage: 'Interview', count: f.interview, fill: 'oklch(0.65 0.15 250)' },
      { stage: 'Hired', count: f.hired, fill: 'var(--color-success)' },
      { stage: 'Joined', count: f.joined, fill: 'oklch(0.55 0.18 155)' },
    ].filter((d) => d.count > 0);
  }, [funnel.data]);

  // Cost per role for bar chart (only roles with hires)
  const costChartData = useMemo(() => {
    if (!cost.data?.roles) return [];
    return cost.data.roles
      .filter((r) => r.costPerHire != null && r.hiredCount > 0)
      .map((r) => ({
        title: r.title,
        costPerHire: Number(r.costPerHire),
      }))
      .slice(0, 10); // top 10
  }, [cost.data]);

  const columns = useMemo<ColumnDef<RoleRow>[]>(
    () => [
      { accessorKey: 'title', header: 'Role' },
      { accessorKey: 'roleType', header: 'Type', cell: ({ getValue }) => String(getValue()).replace('_', ' ') },
      { accessorKey: 'hiredCount', header: 'Hires' },
      { accessorKey: 'submissionsCount', header: 'Submissions' },
      {
        accessorKey: 'costPerHire',
        header: 'Cost / Hire',
        cell: ({ getValue }) => fmt(getValue() as string | null),
      },
      {
        accessorKey: 'totalPayout',
        header: 'Total Payout',
        cell: ({ getValue }) => fmt(getValue() as string | null),
      },
      {
        accessorKey: 'submissionToHireRatio',
        header: 'Sub:Hire',
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return v ? `${Number(v).toFixed(1)}:1` : '—';
        },
      },
      { accessorKey: 'uniqueRecruiters', header: 'Recruiters' },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header + date filter */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hiring Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Performance metrics across your roles
          </p>
        </div>
        <DateRangeSelect value={preset} onChange={setPreset} />
      </header>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            ttf.data?.median != null
              ? `Median: ${ttf.data.median}d · P75: ${ttf.data.p75}d`
              : undefined
          }
        />
        <StatCardV2
          icon={<Filter className="h-4 w-4" aria-hidden />}
          label="Conversion rate"
          loading={funnel.isPending}
          value={
            funnel.data ? `${funnel.data.conversionRates.endToEnd}%` : '—'
          }
          helper={
            funnel.data
              ? `${funnel.data.funnel.submitted} submitted → ${funnel.data.funnel.joined} joined`
              : undefined
          }
        />
        <StatCardV2
          icon={<DollarSign className="h-4 w-4" aria-hidden />}
          label="Avg cost / hire"
          loading={cost.isPending}
          value={fmt(cost.data?.summary.avgCostPerHire ?? null)}
          helper={
            cost.data
              ? `${cost.data.summary.totalHired} hires · ${cost.data.summary.rolesCount} roles`
              : undefined
          }
        />
        <StatCardV2
          variant="gradient"
          icon={<PiggyBank className="h-4 w-4" aria-hidden />}
          label="Total savings"
          loading={cost.isPending}
          value={fmt(cost.data?.summary.totalSavings ?? null)}
          helper="vs vendor benchmark"
        />
      </section>

      {/* AI Insights */}
      <AiAlertPanel />

      {/* Charts row 1 */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Submission funnel"
          description={
            funnel.data
              ? `${funnel.data.roleCount} roles · ${funnel.data.funnel.submitted} submissions`
              : undefined
          }
          loading={funnel.isPending}
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <FunnelSteps data={funnelData} />
          </Suspense>
        </ChartCard>

        <ChartCard
          title="Time-to-fill trend"
          description={
            ttf.data?.stddev != null
              ? `σ = ${ttf.data.stddev} days (consistency)`
              : 'Monthly average'
          }
          loading={ttf.isPending}
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
      {costChartData.length > 0 && (
        <section>
          <ChartCard
            title="Cost per hire by role"
            description={`Total spend: ${fmt(cost.data?.summary.totalSpend ?? null)}`}
            loading={cost.isPending}
            height={Math.max(200, costChartData.length * 40)}
          >
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <CostBreakdownBar data={costChartData} />
            </Suspense>
          </ChartCard>
        </section>
      )}

      {/* Per-role cost table */}
      {cost.data && cost.data.roles.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Role-by-role breakdown</h2>
          <DataTable
            columns={columns}
            data={cost.data.roles}
            emptyTitle="No roles in this period"
            emptyDescription="Adjust the date range to see data."
          />
        </section>
      )}
    </div>
  );
}
