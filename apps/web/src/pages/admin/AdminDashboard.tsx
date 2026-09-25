import { Suspense, lazy, useMemo } from 'react';
import {
  Activity,
  Building2,
  Briefcase,
  DollarSign,
  FileText,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCardV2, ChartCard, AnimatedMetric } from '@/components/custom';
import { useAuthStore } from '@/stores/auth-store';
import { useAdminMetrics } from '@/features/admin/hooks';

// Lazy-load chart components
const PlatformRevenue = lazy(() => import('@/components/charts/PlatformRevenue').then(m => ({ default: m.PlatformRevenue })));
const UserGrowth = lazy(() => import('@/components/charts/UserGrowth').then(m => ({ default: m.UserGrowth })));

/**
 * AdminDashboard
 * --------------
 * Redesigned admin console with platform metrics, revenue charts, and user growth visualization.
 * Shows 8 animated stat cards in 2 rows (entities + financials) and 2 charts.
 * Charts use mock time-series data derived from aggregate totals until real time-series endpoints exist.
 */
export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: metrics, isLoading } = useAdminMetrics();

  // Generate mock 6-month platform revenue data
  // TODO(v2.1): Replace mock time-series with real API endpoint when available
  const revenueChartData = useMemo(() => {
    const totalRevenue = Number(metrics?.totalEarnings || 0);
    const totalCommission = Number(metrics?.totalPlatformCommission || 0);
    if (totalRevenue === 0) return [];

    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const baseRevenue = totalRevenue / 6;
    const baseCommission = totalCommission / 6;

    return months.map((month) => ({
      month,
      revenue: Math.round(baseRevenue * (0.6 + Math.random() * 0.8)),
      commission: Math.round(baseCommission * (0.6 + Math.random() * 0.8)),
    }));
  }, [metrics?.totalEarnings, metrics?.totalPlatformCommission]);

  // Generate mock 6-month user growth data
  // TODO(v2.1): Replace mock time-series with real API endpoint when available
  const userGrowthData = useMemo(() => {
    const totalCompanies = metrics?.totalCompanies || 0;
    const totalRecruiters = metrics?.totalRecruiters || 0;
    if (totalCompanies === 0 && totalRecruiters === 0) return [];

    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const stepCompanies = totalCompanies / 6;
    const stepRecruiters = totalRecruiters / 6;

    return months.map((month, i) => ({
      month,
      companies: Math.round(stepCompanies * (i + 1) + Math.random() * 2),
      recruiters: Math.round(stepRecruiters * (i + 1) + Math.random() * 5),
    }));
  }, [metrics?.totalCompanies, metrics?.totalRecruiters]);

  // Calculate active/total ratio as percentage for trend
  const activeRolePercent = metrics?.totalRoles
    ? Math.round(((metrics.activeRoles || 0) / metrics.totalRoles) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Admin console</h1>
        <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
      </header>

      {/* Entity stats row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardV2
          icon={<Building2 className="h-4 w-4" aria-hidden />}
          label="Companies"
          value={
            isLoading ? undefined : (
              <AnimatedMetric end={metrics?.totalCompanies || 0} separator="," />
            )
          }
          loading={isLoading}
          helper="Registered on platform"
        />
        <StatCardV2
          icon={<Users className="h-4 w-4" aria-hidden />}
          label="Recruiters"
          value={
            isLoading ? undefined : (
              <AnimatedMetric end={metrics?.totalRecruiters || 0} separator="," />
            )
          }
          loading={isLoading}
          helper="Active recruiters"
        />
        <StatCardV2
          icon={<Briefcase className="h-4 w-4" aria-hidden />}
          label="Total roles"
          value={
            isLoading ? undefined : (
              <AnimatedMetric end={metrics?.totalRoles || 0} separator="," />
            )
          }
          loading={isLoading}
          helper="All time"
        />
        <StatCardV2
          icon={<Activity className="h-4 w-4" aria-hidden />}
          label="Active roles"
          value={
            isLoading ? undefined : (
              <AnimatedMetric end={metrics?.activeRoles || 0} separator="," />
            )
          }
          loading={isLoading}
          helper={`${activeRolePercent}% of total`}
        />
      </section>

      {/* Financial stats row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardV2
          icon={<FileText className="h-4 w-4" aria-hidden />}
          label="Submissions"
          value={
            isLoading ? undefined : (
              <AnimatedMetric end={metrics?.totalSubmissions || 0} separator="," />
            )
          }
          loading={isLoading}
          helper="All submissions"
        />
        <StatCardV2
          variant="gradient"
          icon={<TrendingUp className="h-4 w-4" aria-hidden />}
          label="Total earnings"
          value={
            isLoading ? undefined : (
              <AnimatedMetric
                end={Number(metrics?.totalEarnings || 0)}
                prefix={Number(metrics?.totalEarnings || 0) < 1_00_000 ? '₹' : undefined}
                suffix={Number(metrics?.totalEarnings || 0) >= 1_00_000 ? 'L' : undefined}
                separator=","
                decimals={Number(metrics?.totalEarnings || 0) >= 1_00_000 ? 2 : 0}
              />
            )
          }
          loading={isLoading}
          helper="Gross platform earnings"
        />
        <StatCardV2
          icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
          label="Platform commission"
          value={
            isLoading ? undefined : (
              <AnimatedMetric
                end={Number(metrics?.totalPlatformCommission || 0)}
                prefix={Number(metrics?.totalPlatformCommission || 0) < 1_00_000 ? '₹' : undefined}
                suffix={Number(metrics?.totalPlatformCommission || 0) >= 1_00_000 ? 'L' : undefined}
                separator=","
                decimals={Number(metrics?.totalPlatformCommission || 0) >= 1_00_000 ? 2 : 0}
              />
            )
          }
          loading={isLoading}
          helper="Platform revenue"
        />
        <StatCardV2
          icon={<DollarSign className="h-4 w-4" aria-hidden />}
          label="Payouts completed"
          value={
            isLoading ? undefined : (
              <AnimatedMetric
                end={Number(metrics?.totalPayouts || 0)}
                prefix={Number(metrics?.totalPayouts || 0) < 1_00_000 ? '₹' : undefined}
                suffix={Number(metrics?.totalPayouts || 0) >= 1_00_000 ? 'L' : undefined}
                separator=","
                decimals={Number(metrics?.totalPayouts || 0) >= 1_00_000 ? 2 : 0}
              />
            )
          }
          loading={isLoading}
          helper="Total payouts processed"
        />
      </section>

      {/* Charts row */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Platform revenue"
          description="Monthly revenue vs commission"
          loading={isLoading}
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <PlatformRevenue data={revenueChartData} />
          </Suspense>
        </ChartCard>

        <ChartCard
          title="User growth"
          description="Companies and recruiters over time"
          loading={isLoading}
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <UserGrowth data={userGrowthData} />
          </Suspense>
        </ChartCard>
      </section>
    </div>
  );
}
