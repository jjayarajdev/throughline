import { Suspense, lazy, useMemo } from 'react';
import { Briefcase, DollarSign, UserCheck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCardV2, ChartCard, AnimatedMetric } from '@/components/custom';
import { useCompanyProfile } from '@/features/company/hooks';
import { useMyRoles } from '@/features/role/hooks';
import { useAuthStore } from '@/stores/auth-store';

// Lazy-load chart components
const SubmissionFunnel = lazy(() => import('@/components/charts/SubmissionFunnel').then(m => ({ default: m.SubmissionFunnel })));
const RoleFillRate = lazy(() => import('@/components/charts/RoleFillRate').then(m => ({ default: m.RoleFillRate })));

/**
 * CompanyDashboard
 * ----------------
 * Redesigned dashboard with charts and animated metrics.
 * Shows role stats, submission pipeline funnel, and role fill rate trends.
 * Charts use mock time-series data derived from aggregate totals until
 * real time-series endpoints exist.
 */
export default function CompanyDashboard() {
  const user = useAuthStore((s) => s.user);
  const profile = useCompanyProfile();
  const myRoles = useMyRoles({ pageSize: 100 });

  // Calculate aggregates from role list
  const stats = useMemo(() => {
    if (!myRoles.data?.items) {
      return {
        activeRoles: 0,
        totalSubmissions: 0,
        totalShortlisted: 0,
        totalHired: 0,
        totalFilled: 0,
      };
    }

    return myRoles.data.items.reduce(
      (acc, role) => ({
        activeRoles: acc.activeRoles + (role.status === 'published' ? 1 : 0),
        totalSubmissions: acc.totalSubmissions + (role.submissionsCount || 0),
        totalShortlisted: acc.totalShortlisted + (role.shortlistedCount || 0),
        totalHired: acc.totalHired + (role.hiredCount || 0),
        totalFilled: acc.totalFilled + (role.status === 'filled' ? 1 : 0),
      }),
      { activeRoles: 0, totalSubmissions: 0, totalShortlisted: 0, totalHired: 0, totalFilled: 0 },
    );
  }, [myRoles.data?.items]);

  // Generate submission funnel data (aggregate stages)
  // Mock intermediate stages from known totals
  const funnelData = useMemo(() => {
    const { totalSubmissions, totalShortlisted, totalHired } = stats;
    if (totalSubmissions === 0) return [];

    // Estimate under_review and interviewing from gaps
    const underReview = Math.round((totalSubmissions - totalShortlisted) * 0.6);
    const interviewing = Math.round((totalShortlisted - totalHired) * 0.7);

    return [
      { stage: 'Submitted', count: totalSubmissions, fill: 'var(--primary)' },
      { stage: 'Under Review', count: underReview, fill: 'var(--muted-foreground)' },
      { stage: 'Shortlisted', count: totalShortlisted, fill: 'var(--color-warning)' },
      { stage: 'Interviewing', count: interviewing, fill: 'var(--color-success)' },
      { stage: 'Hired', count: totalHired, fill: 'var(--color-success)' },
    ].filter((item) => item.count > 0);
  }, [stats]);

  // Generate mock 6-month role fill rate trend
  // TODO(v2.1): Replace mock time-series with real API endpoint when available
  const fillRateData = useMemo(() => {
    const { activeRoles, totalFilled } = stats;
    if (activeRoles === 0 && totalFilled === 0) return [];

    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const baseFilled = totalFilled / 6;
    const baseOpen = activeRoles / 6;

    return months.map((month) => ({
      month,
      filled: Math.max(0, Math.round(baseFilled * (0.5 + Math.random() * 1))),
      open: Math.max(0, Math.round(baseOpen * (0.7 + Math.random() * 0.6))),
    }));
  }, [stats.activeRoles, stats.totalFilled]);

  const isPending = profile.isPending || myRoles.isPending;
  const isProfileComplete = Boolean(profile.data?.companyName && profile.data?.gstNumber);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile.isPending ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            `${profile.data?.companyName ?? 'Company'} dashboard`
          )}
        </h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </header>

      {/* Stat cards row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardV2
          icon={<Briefcase className="h-4 w-4" aria-hidden />}
          label="Active roles"
          value={
            isPending ? undefined : (
              <AnimatedMetric end={stats.activeRoles} separator="," />
            )
          }
          loading={isPending}
          helper={`${myRoles.data?.total || 0} total roles`}
        />
        <StatCardV2
          icon={<Users className="h-4 w-4" aria-hidden />}
          label="Total submissions"
          value={
            isPending ? undefined : (
              <AnimatedMetric end={stats.totalSubmissions} separator="," />
            )
          }
          loading={isPending}
          helper={`${stats.totalShortlisted} shortlisted`}
        />
        <StatCardV2
          icon={<UserCheck className="h-4 w-4" aria-hidden />}
          label="Hires"
          value={
            isPending ? undefined : (
              <AnimatedMetric end={stats.totalHired} separator="," />
            )
          }
          loading={isPending}
          helper={`${stats.totalFilled} roles filled`}
        />
        <StatCardV2
          icon={<DollarSign className="h-4 w-4" aria-hidden />}
          label="Total spend"
          value="—"
          helper="Wallet tracking in v2.1"
        />
      </section>

      {/* Charts row */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Submission pipeline"
          description={`${stats.totalSubmissions} total submissions`}
          loading={myRoles.isPending}
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <SubmissionFunnel data={funnelData} />
          </Suspense>
        </ChartCard>

        <ChartCard
          title="Role fill rate"
          description="Last 6 months"
          loading={myRoles.isPending}
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <RoleFillRate data={fillRateData} />
          </Suspense>
        </ChartCard>
      </section>

      {/* Getting started card (hide when complete) */}
      {!isProfileComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Getting started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <Checklist
              done={Boolean(profile.data?.companyName)}
              label="Verify your company profile"
            />
            <Checklist
              done={Boolean(profile.data?.gstNumber)}
              label="Add GSTIN for tax-compliant invoices"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Checklist({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          done
            ? 'inline-block h-2 w-2 rounded-full bg-success'
            : 'inline-block h-2 w-2 rounded-full bg-muted-foreground/30'
        }
        aria-hidden
      />
      <span className={done ? 'line-through' : undefined}>{label}</span>
    </div>
  );
}
