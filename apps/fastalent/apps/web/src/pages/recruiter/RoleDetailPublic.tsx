import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileDown, Loader2 } from 'lucide-react';
import { RoleStatus, PayoutMode } from '@gigcruite/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';
import { StatusBadge } from '@/components/StatusBadge';
import { extractErrorMessage } from '@/lib/error';
import { useRolePublic, useDownloadJd } from '@/features/role';
import { useMyRoleSubmissions } from '@/features/submission';
import { FeeCalculator } from '@/features/role/components/FeeCalculator';
import { formatCurrency } from '@/lib/format-currency';
import { JdCruxPanel } from '@/components/custom/JdCruxPanel';
import { useFeatureFlags } from '@/features/feature-flags';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function RoleDetailPublic() {
  const { id } = useParams<{ id: string }>();
  const query = useRolePublic(id);
  const downloadJd = useDownloadJd();
  const flags = useFeatureFlags();

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/r/roles" viewTransition>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to roles
          </Link>
        </Button>
        <Card>
          <CardContent className="py-8 text-sm text-destructive">
            {extractErrorMessage(query.error, 'Could not load role')}
          </CardContent>
        </Card>
      </div>
    );
  }

  const role = query.data;
  if (!role) return null;

  const formatPayout = (mode: string | null | undefined, value: string | number | null | undefined, label: string) => {
    if (!value) return null;
    if (mode === PayoutMode.PERCENTAGE) return `${value}% of CTC/${label}`;
    return `${formatCurrency(value, role.currency)}/${label}`;
  };

  const payoutParts: string[] = [];
  const sp = formatPayout(role.shortlistPayoutMode, role.shortlistPayoutValue, 'shortlist');
  if (sp) payoutParts.push(sp);
  const hp = formatPayout(role.hirePayoutMode, role.hirePayoutValue, 'hire');
  if (hp) payoutParts.push(hp);
  const payoutDisplay = payoutParts.length > 0 ? payoutParts.join(' + ') : '—';

  const hasFlatPayout =
    (role.shortlistPayoutValue && role.shortlistPayoutMode !== PayoutMode.PERCENTAGE) ||
    (role.hirePayoutValue && role.hirePayoutMode !== PayoutMode.PERCENTAGE);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/r/roles">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to roles
        </Link>
      </Button>

      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {role.title}
            </h1>
            <Badge variant="outline">{role.roleType}</Badge>
            {role.status === RoleStatus.FILLED ? (
              <Badge variant="secondary">Filled</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {role.company.companyName}
            {role.company.industry ? ` · ${role.company.industry}` : ''}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              {role.location}
              {role.isRemote ? ' · Remote' : ''}
            </span>
            <span>{role.employmentType}</span>
            <span>
              {role.experienceMin}–{role.experienceMax} yrs
            </span>
          </div>
        </div>

        {role.status === RoleStatus.FILLED ? (
          <Button disabled>
            Role Filled
          </Button>
        ) : (
          <Button
            asChild
            disabled={role.slotsRemaining === 0}
          >
            <Link to={`/r/roles/${role.id}/submit`} viewTransition>
              {role.slotsRemaining === 0 ? 'No slots available' : 'Submit Candidate'}
            </Link>
          </Button>
        )}
      </header>

      {/* Job Description — always prominent */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Job Description</CardTitle>
            <CardDescription>
              {role.status === RoleStatus.FILLED
                ? 'Role filled'
                : `${role.slotsRemaining} slot${role.slotsRemaining !== 1 ? 's' : ''} remaining`}
              {role.openPositions > 1 ? ` · ${role.openPositions} openings` : ''}
            </CardDescription>
          </div>
          {role.jdOriginalFilename ? (
            <Button
              variant="outline"
              size="sm"
              disabled={downloadJd.isPending}
              onClick={() => {
                downloadJd.mutate(role.id, {
                  onSuccess: (data) => {
                    window.open(data.downloadUrl, '_blank');
                  },
                  onError: (err) =>
                    toast.error(extractErrorMessage(err, 'Could not download JD')),
                });
              }}
            >
              <FileDown className="h-3.5 w-3.5" aria-hidden />
              {role.jdOriginalFilename}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="whitespace-pre-wrap text-sm leading-6">
            {role.description}
          </p>

          <Separator />

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Compensation
              </h2>
              <p className="text-sm">
                {formatCurrency(role.ctcMin, role.currency)} – {formatCurrency(role.ctcMax, role.currency)} per year
              </p>
            </div>
            <div>
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your Payout
              </h2>
              <p className="text-sm">{payoutDisplay}</p>
            </div>
            <div>
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Experience
              </h2>
              <p className="text-sm">
                {role.experienceMin}–{role.experienceMax} years
              </p>
            </div>
            <div>
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Employment type
              </h2>
              <p className="text-sm">{role.employmentType}</p>
            </div>
            <div>
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Open positions
              </h2>
              <p className="text-sm">{role.openPositions}</p>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Skills
            </h2>
            {role.skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No skills listed.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {role.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </section>
        </CardContent>
      </Card>

      {/* AI-extracted JD crux — Phase 16 (gated by matching_ai flag) */}
      {flags.matching_ai && <JdCruxPanel roleId={role.id} />}

      {/* Fee Calculator — only shown for flat payout modes */}
      {hasFlatPayout && (
        <FeeCalculator
          payoutAmount={Number(role.hirePayoutValue || role.shortlistPayoutValue || 0)}
          feeType={role.roleType === 'headhunting' ? 'headhunting' : 'regular'}
        />
      )}

      {/* My submissions for this role */}
      <MySubmissionsSection roleId={role.id} />
    </div>
  );
}

function MySubmissionsSection({ roleId }: { roleId: string }) {
  const query = useMyRoleSubmissions(roleId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My Submissions</CardTitle>
        <CardDescription>Candidates you submitted for this role.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isPending ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !query.data || query.data.items.length === 0 ? (
          <div className="rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            You haven't submitted any candidates to this role yet.
          </div>
        ) : (
          <div className="space-y-2">
            {query.data.items.map((sub) => (
              <Link
                key={sub.id}
                to={`/r/submissions/${sub.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{sub.candidateName}</span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>CTC: {formatCurrency(sub.expectedCtc)}</span>
                    <span>{formatDate(sub.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
