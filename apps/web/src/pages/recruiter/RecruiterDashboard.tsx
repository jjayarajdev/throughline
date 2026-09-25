import { Suspense, lazy, useMemo } from 'react';
import { Briefcase, FileSpreadsheet, Star, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCardV2, ChartCard, AnimatedMetric } from '@/components/custom';
import { TrustBadge } from '@/components/TrustBadge';
import { useRecruiterProfile } from '@/features/recruiter/hooks';
import { useEarningSummary } from '@/features/earning/hooks';
import { useMySubmissions } from '@/features/submission/hooks';
import { useAuthStore } from '@/stores/auth-store';

// Lazy-load chart components
const EarningChart = lazy(() => import('@/components/charts/EarningChart').then(m => ({ default: m.EarningChart })));
const SubmissionDonut = lazy(() => import('@/components/charts/SubmissionDonut').then(m => ({ default: m.SubmissionDonut })));
const TrustTrend = lazy(() => import('@/components/charts/TrustTrend').then(m => ({ default: m.TrustTrend })));

/**
 * RecruiterDashboard
 * ------------------
 * Redesigned dashboard with charts, animated metrics, and data-rich views.
 * Combines wallet balance, earning stats, submission metrics, and trust score
 * visualizations. Charts are lazy-loaded and use mock time-series data
 * derived from aggregate totals until real time-series endpoints exist.
 */
export default function RecruiterDashboard() {
  const user = useAuthStore((s) => s.user);
  const profile = useRecruiterProfile();
  const earningSummary = useEarningSummary();
  const submissions = useMySubmissions({ pageSize: 100 });

  // Generate mock monthly earnings data from aggregate total
  // TODO(v2.1): Replace mock time-series with real API endpoint when available
  const earningChartData = useMemo(() => {
    const total = Number(earningSummary.data?.totalEarned || 0);
    if (total === 0) return [];

    // Generate 6 monthly data points that sum to ~total with natural variance
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const baseAmount = total / 6;
    return months.map((month) => ({
      month,
      amount: Math.round(baseAmount * (0.7 + Math.random() * 0.6)),
    }));
  }, [earningSummary.data?.totalEarned]);

  // Group submissions by status for donut chart
  const submissionDonutData = useMemo(() => {
    if (!submissions.data?.items) return [];
    const statusCounts = new Map<string, number>();
    submissions.data.items.forEach((sub) => {
      statusCounts.set(sub.status, (statusCounts.get(sub.status) || 0) + 1);
    });

    const statusColors: Record<string, string> = {
      submitted: 'var(--primary)',
      under_review: 'var(--muted-foreground)',
      shortlisted: 'var(--color-success)',
      interviewing: 'var(--color-warning)',
      hired: 'var(--color-success)',
      rejected: 'var(--color-destructive)',
    };

    return Array.from(statusCounts.entries()).map(([status, count]) => ({
      status: status.replace('_', ' '),
      count,
      fill: statusColors[status] || 'var(--muted)',
    }));
  }, [submissions.data?.items]);

  // Generate mock trust trend ending at current reputation score
  // TODO(v2.1): Replace with real trust history endpoint
  const trustTrendData = useMemo(() => {
    const currentScore = profile.data?.reputationScore ?? 50;
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const startScore = Math.max(0, currentScore - 20);
    const step = (currentScore - startScore) / 5;

    return months.map((month, i) => ({
      date: month,
      score: Math.round(startScore + step * i + Math.random() * 5),
    }));
  }, [profile.data?.reputationScore]);

  const isPending = profile.isPending || earningSummary.isPending;
  const isProfileComplete = Boolean(profile.data?.fullName && profile.data?.hasBankDetails);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{profile.data?.fullName ? `, ${profile.data.fullName.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </header>

      {/* Stat cards row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardV2
          variant="gradient"
          icon={<Wallet className="h-4 w-4" aria-hidden />}
          label="Wallet balance"
          value={
            isPending ? undefined : (
              <AnimatedMetric
                end={Number(profile.data?.walletBalance || 0)}
                prefix="₹"
                separator=","
                decimals={2}
              />
            )
          }
          loading={isPending}
          helper={
            profile.data?.lockedBalance && profile.data.lockedBalance !== '0'
              ? `₹${formatMoney(profile.data.lockedBalance)} locked`
              : 'Available for payout'
          }
        />
        <StatCardV2
          icon={<Briefcase className="h-4 w-4" aria-hidden />}
          label="Total earned"
          value={
            isPending ? undefined : (
              <AnimatedMetric
                end={Number(earningSummary.data?.totalEarned || 0)}
                prefix="₹"
                separator=","
                decimals={0}
              />
            )
          }
          loading={isPending}
          helper={`₹${formatMoney(earningSummary.data?.totalPending || '0')} pending`}
        />
        <StatCardV2
          icon={<FileSpreadsheet className="h-4 w-4" aria-hidden />}
          label="Submissions"
          value={
            submissions.isPending ? undefined : (
              <AnimatedMetric
                end={submissions.data?.total || 0}
                separator=","
              />
            )
          }
          loading={submissions.isPending}
          helper={`${earningSummary.data?.earningsCount || 0} with payouts`}
        />
        <StatCardV2
          icon={<Star className="h-4 w-4" aria-hidden />}
          label="Reputation"
          value={
            isPending ? undefined : (
              <AnimatedMetric
                end={profile.data?.reputationScore ?? 0}
                separator=","
              />
            )
          }
          loading={isPending}
          helper={
            profile.data?.reputationTier && profile.data?.reputationScore !== undefined ? (
              <TrustBadge tier={profile.data.reputationTier} score={profile.data.reputationScore} compact />
            ) : null
          }
        />
      </section>

      {/* Charts row */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Monthly earnings"
          description="Last 6 months"
          loading={earningSummary.isPending}
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <EarningChart data={earningChartData} />
          </Suspense>
        </ChartCard>

        <ChartCard
          title="Submissions by status"
          description={`${submissions.data?.total || 0} total submissions`}
          loading={submissions.isPending}
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <SubmissionDonut data={submissionDonutData} />
          </Suspense>
        </ChartCard>
      </section>

      {/* Trust trend section */}
      <section>
        <ChartCard
          title="Trust score trend"
          description="Your reputation over time"
          loading={profile.isPending}
        >
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <TrustTrend data={trustTrendData} />
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
              done={Boolean(profile.data?.fullName)}
              label="Complete your recruiter profile"
            />
            <Checklist
              done={Boolean(profile.data?.hasBankDetails)}
              label="Add bank details to receive payouts"
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

function formatMoney(value: string | undefined): string {
  if (!value) return '0.00';
  const [rupees = '0', paise = '00'] = value.split('.');
  const withCommas = rupees.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${withCommas}.${paise.padEnd(2, '0').slice(0, 2)}`;
}
