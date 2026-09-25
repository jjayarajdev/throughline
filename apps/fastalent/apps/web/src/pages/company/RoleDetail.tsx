import { useMemo, useState, lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileDown,
  Loader2,
  Pause,
  Play,
  Send,
  SquarePen,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import {
  PayoutMode,
  RoleStatus,
  RoleVisibility,
  SubmissionStatus,
  type RoleOwnerResponse,
} from '@gigcruite/types';
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
import { extractErrorMessage } from '@/lib/error';
import { formatCurrency } from '@/lib/format-currency';
import { StatCardV2 } from '@/components/custom';
import {
  useCloseRole,
  useDownloadJd,
  usePauseRole,
  useSubmitRole,
  useResumeRole,
  useRole,
} from '@/features/role/hooks';
import { useRoleSubmissions, useDownloadCv } from '@/features/submission';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusActionModal } from '@/components/StatusActionModal';
import { useRoleInvitations } from '@/features/role-invitation';

const InviteRecruiterDialog = lazy(() => import('@/components/InviteRecruiterDialog'));

/**
 * RoleDetail — single-role view for the owning company. Status badge,
 * stat cards, lifecycle actions, and a W3 placeholder where the
 * submissions tab will land.
 */

function statusBadgeVariant(
  status: RoleStatus,
): 'default' | 'secondary' | 'success' | 'warning' | 'outline' | 'destructive' {
  switch (status) {
    case RoleStatus.DRAFT:
      return 'secondary';
    case RoleStatus.SUBMITTED:
      return 'warning';
    case RoleStatus.PUBLISHED:
      return 'success';
    case RoleStatus.REJECTED:
      return 'destructive';
    case RoleStatus.PAUSED:
      return 'warning';
    case RoleStatus.CLOSED:
      return 'outline';
    case RoleStatus.FILLED:
      return 'default';
    default:
      return 'secondary';
  }
}

function estimateCommittedPayout(role: RoleOwnerResponse): number {
  const avgCtc = (Number(role.ctcMin) + Number(role.ctcMax)) / 2;
  let total = 0;
  if (role.shortlistPayoutValue) {
    const val = Number(role.shortlistPayoutValue);
    total += role.shortlistedCount * (
      role.shortlistPayoutMode === PayoutMode.PERCENTAGE ? (val / 100) * avgCtc : val
    );
  }
  if (role.hirePayoutValue) {
    const val = Number(role.hirePayoutValue);
    total += role.hiredCount * (
      role.hirePayoutMode === PayoutMode.PERCENTAGE ? (val / 100) * avgCtc : val
    );
  }
  return total;
}

function formatPayoutField(mode: PayoutMode | null, value: string | null, label: string, currency: string): string | null {
  if (!value) return null;
  if (mode === PayoutMode.PERCENTAGE) return `${value}% of CTC/${label}`;
  return `${formatCurrency(value, currency)}/${label}`;
}

function formatPayout(role: RoleOwnerResponse): string {
  const cur = role.currency ?? 'INR';
  const parts: string[] = [];
  const shortlist = formatPayoutField(role.shortlistPayoutMode, role.shortlistPayoutValue, 'shortlist', cur);
  if (shortlist) parts.push(shortlist);
  const hire = formatPayoutField(role.hirePayoutMode, role.hirePayoutValue, 'hire', cur);
  if (hire) parts.push(hire);
  return parts.length > 0 ? parts.join(' + ') : '—';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
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

export default function RoleDetail() {
  const { id } = useParams<{ id: string }>();
  const query = useRole(id);
  const submit = useSubmitRole();
  const pause = usePauseRole();
  const resume = useResumeRole();
  const close = useCloseRole();
  const downloadJd = useDownloadJd();

  const statusActionRunning =
    submit.isPending || pause.isPending || resume.isPending || close.isPending;

  const runAction = (
    action: typeof submit | typeof pause | typeof resume | typeof close,
    roleId: string,
    successMessage: string,
    failureMessage: string,
    confirmPrompt?: string,
  ) => {
    if (confirmPrompt && !window.confirm(confirmPrompt)) return;
    action.mutate(roleId, {
      onSuccess: () => toast.success(successMessage),
      onError: (err: Error) => toast.error(extractErrorMessage(err, failureMessage)),
    });
  };

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/c/roles" viewTransition>
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

  const canSubmit =
    role.status === RoleStatus.DRAFT || role.status === RoleStatus.REJECTED;
  const canPause = role.status === RoleStatus.PUBLISHED;
  const canResume = role.status === RoleStatus.PAUSED;
  const canEdit =
    role.status === RoleStatus.DRAFT ||
    role.status === RoleStatus.PAUSED ||
    role.status === RoleStatus.REJECTED;
  const canClose =
    role.status === RoleStatus.PUBLISHED || role.status === RoleStatus.PAUSED;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/c/roles" viewTransition>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to roles
          </Link>
        </Button>
      </div>

      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {role.title}
            </h1>
            <Badge variant={statusBadgeVariant(role.status)}>
              {role.status}
            </Badge>
            <Badge variant="outline">{role.roleType}</Badge>
            {role.visibility !== RoleVisibility.OPEN && (
              <Badge variant="secondary">
                {role.visibility === RoleVisibility.PREFERRED ? 'Preferred Network' : 'Invite Only'}
              </Badge>
            )}
          </div>
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

        <div className="flex flex-wrap items-center gap-2">
          {canSubmit ? (
            <Button
              disabled={statusActionRunning}
              onClick={() =>
                runAction(
                  submit,
                  role.id,
                  'Role submitted for review',
                  'Could not submit role',
                )
              }
            >
              <Send className="h-4 w-4" aria-hidden />
              Submit for Review
            </Button>
          ) : null}
          {canPause ? (
            <Button
              variant="outline"
              disabled={statusActionRunning}
              onClick={() =>
                runAction(pause, role.id, 'Role paused', 'Could not pause role')
              }
            >
              <Pause className="h-4 w-4" aria-hidden />
              Pause
            </Button>
          ) : null}
          {canResume ? (
            <Button
              variant="outline"
              disabled={statusActionRunning}
              onClick={() =>
                runAction(
                  resume,
                  role.id,
                  'Role resumed',
                  'Could not resume role',
                )
              }
            >
              <Play className="h-4 w-4" aria-hidden />
              Resume
            </Button>
          ) : null}
          {canEdit ? (
            <Button variant="outline" asChild>
              <Link to={`/c/roles/${role.id}/edit`} viewTransition>
                <SquarePen className="h-4 w-4" aria-hidden />
                Edit
              </Link>
            </Button>
          ) : null}
          {canClose ? (
            <Button
              variant="destructive"
              disabled={statusActionRunning}
              onClick={() =>
                runAction(
                  close,
                  role.id,
                  'Role closed',
                  'Could not close role',
                  'Close this role? Existing submissions will continue through their lifecycle, but no new submissions will be accepted.',
                )
              }
            >
              <XCircle className="h-4 w-4" aria-hidden />
              Close role
            </Button>
          ) : null}
        </div>
      </header>

      {/* Status banners */}
      {role.status === RoleStatus.SUBMITTED && (
        <div className="flex items-start gap-3 rounded-md border border-warning bg-warning/10 p-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
          <div className="text-sm">
            <p className="font-medium text-warning">Pending admin review</p>
            <p className="text-muted-foreground">
              Your role has been submitted and is awaiting approval. You'll be notified once it's reviewed.
            </p>
          </div>
        </div>
      )}
      {role.status === RoleStatus.REJECTED && (
        <div className="flex items-start gap-3 rounded-md border border-destructive bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
          <div className="text-sm">
            <p className="font-medium text-destructive">Role rejected by admin</p>
            <p className="text-muted-foreground">
              Please review the feedback, edit your role, and re-submit for review.
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardV2
          icon={<Briefcase className="h-4 w-4" aria-hidden />}
          label="Submissions"
          value={`${role.submissionsCount} / ${role.maxSubmissions}`}
          helper={`Per recruiter cap: ${role.maxPerRecruiter}`}
        />
        <StatCardV2
          icon={<Users className="h-4 w-4" aria-hidden />}
          label="Shortlisted"
          value={String(role.shortlistedCount)}
          helper="Advanced to interview"
        />
        <StatCardV2
          icon={<UserCheck className="h-4 w-4" aria-hidden />}
          label="Hired"
          value={role.openPositions > 1 ? `${role.hiredCount} / ${role.openPositions}` : String(role.hiredCount)}
          helper={role.openPositions > 1 ? `${role.openPositions} openings` : 'Joined successfully'}
        />
        <StatCardV2
          icon={<DollarSign className="h-4 w-4" aria-hidden />}
          label="Payout"
          value={formatPayout(role)}
          helper={
            <>
              {role.payoutType.replace('_', ' ')}
              {' · Est. committed: '}
              {formatCurrency(estimateCommittedPayout(role), role.currency)}
              {(role.shortlistPayoutMode === PayoutMode.PERCENTAGE || role.hirePayoutMode === PayoutMode.PERCENTAGE) && (
                <span className="text-[10px]"> (avg CTC)</span>
              )}
            </>
          }
        />
      </section>

      {/* Role details card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role details</CardTitle>
          <CardDescription>
            Posted {formatDate(role.createdAt)}
            {role.closedAt ? ` · Closed ${formatDate(role.closedAt)}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Job Description
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-6">
              {role.description}
            </p>
          </section>

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
                Payout Type
              </h2>
              <p className="text-sm capitalize">{role.payoutType.replace(/_/g, ' ')}</p>
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

      {/* Payout details card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout Details</CardTitle>
          <CardDescription>
            Fee structure for recruiters on this role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {role.shortlistPayoutValue && (
              <div className="rounded-md border bg-muted/30 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Per Shortlist</div>
                <div className="text-lg font-semibold">
                  {role.shortlistPayoutMode === PayoutMode.PERCENTAGE
                    ? `${role.shortlistPayoutValue}% of CTC`
                    : formatCurrency(role.shortlistPayoutValue, role.currency)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {role.shortlistPayoutMode === PayoutMode.PERCENTAGE ? 'Percentage' : 'Flat amount'} per shortlisted candidate
                </div>
              </div>
            )}
            {role.hirePayoutValue && (
              <div className="rounded-md border bg-muted/30 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Per Hire</div>
                <div className="text-lg font-semibold">
                  {role.hirePayoutMode === PayoutMode.PERCENTAGE
                    ? `${role.hirePayoutValue}% of CTC`
                    : formatCurrency(role.hirePayoutValue, role.currency)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {role.hirePayoutMode === PayoutMode.PERCENTAGE ? 'Percentage' : 'Flat amount'} per confirmed hire
                </div>
              </div>
            )}
            <div className="rounded-md border bg-muted/30 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Platform Commission</div>
              <div className="text-lg font-semibold">
                {role.platformCommissionPct ? `${role.platformCommissionPct}%` : 'Not set'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Deducted from recruiter payout
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Estimated committed:</span>{' '}
            {formatCurrency(estimateCommittedPayout(role), role.currency)}
            {(role.shortlistPayoutMode === PayoutMode.PERCENTAGE || role.hirePayoutMode === PayoutMode.PERCENTAGE) && (
              <span className="text-xs"> (based on avg CTC)</span>
            )}
            {' — '}
            based on {role.shortlistedCount} shortlisted and {role.hiredCount} hired so far.
          </div>
        </CardContent>
      </Card>

      {role.jdOriginalFilename ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Job Description</CardTitle>
            <Button
              variant="outline"
              size="sm"
              disabled={downloadJd.isPending}
              onClick={() => {
                downloadJd.mutate(role.id, {
                  onSuccess: (data) => {
                    window.open(data.downloadUrl, '_blank');
                  },
                  onError: (err) => toast.error(extractErrorMessage(err, 'Could not download JD')),
                });
              }}
            >
              <FileDown className="h-3.5 w-3.5" aria-hidden />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{role.jdOriginalFilename}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Invitations (for preferred/invite_only roles) */}
      {role.visibility !== RoleVisibility.OPEN && (
        <InvitationsSection roleId={role.id} />
      )}

      {/* Submissions */}
      <SubmissionsSection roleId={role.id} />
    </div>
  );
}

function InvitationsSection({ roleId }: { roleId: string }) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const query = useRoleInvitations(roleId);
  const invitations = query.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Invitations</CardTitle>
        <Button size="sm" onClick={() => setShowInviteDialog(true)}>
          Invite Recruiter
        </Button>
      </CardHeader>
      <CardContent>
        {query.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invitations yet.</p>
        ) : (
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded border border-border p-3 text-sm"
              >
                <div>
                  <span className="font-medium">{inv.recruiter?.fullName ?? 'Unknown'}</span>
                  {inv.recruiter?.specializations && inv.recruiter.specializations.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {inv.recruiter.specializations.slice(0, 3).join(', ')}
                    </span>
                  )}
                </div>
                <Badge
                  variant={
                    inv.status === 'accepted'
                      ? 'success'
                      : inv.status === 'declined'
                        ? 'outline'
                        : 'secondary'
                  }
                >
                  {inv.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <Suspense fallback={null}>
        <InviteRecruiterDialog
          roleId={roleId}
          open={showInviteDialog}
          onClose={() => setShowInviteDialog(false)}
        />
      </Suspense>
    </Card>
  );
}

const SUBMISSION_STATUS_TABS: Array<{ label: string; value: SubmissionStatus | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Submitted', value: SubmissionStatus.SUBMITTED },
  { label: 'Shortlisted', value: SubmissionStatus.SHORTLISTED },
  { label: 'Interview', value: SubmissionStatus.INTERVIEW },
  { label: 'Hired', value: SubmissionStatus.HIRED },
  { label: 'Rejected', value: SubmissionStatus.REJECTED },
];

function SubmissionsSection({ roleId }: { roleId: string }) {
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | undefined>();
  const [modalState, setModalState] = useState<{
    open: boolean;
    submissionId: string;
    candidateName: string;
    currentStatus: SubmissionStatus;
    targetStatus: SubmissionStatus;
  } | null>(null);
  const filters = useMemo(
    () => ({ ...(statusFilter !== undefined ? { status: statusFilter } : {}) }),
    [statusFilter],
  );
  const query = useRoleSubmissions(roleId, filters);
  const downloadCv = useDownloadCv();

  const handleDownload = (submissionId: string) => {
    downloadCv.mutate(submissionId, {
      onSuccess: (data) => {
        window.open(data.downloadUrl, '_blank');
      },
    });
  };

  const getCompanyActions = (status: SubmissionStatus): Array<{ label: string; target: SubmissionStatus; variant?: 'default' | 'outline' | 'destructive' }> => {
    const actions: Array<{ label: string; target: SubmissionStatus; variant?: 'default' | 'outline' | 'destructive' }> = [];
    if (status === SubmissionStatus.SUBMITTED) {
      actions.push({ label: 'Shortlist', target: SubmissionStatus.SHORTLISTED });
      actions.push({ label: 'Reject', target: SubmissionStatus.REJECTED, variant: 'destructive' });
    } else if (status === SubmissionStatus.SHORTLISTED) {
      actions.push({ label: 'Interview', target: SubmissionStatus.INTERVIEW });
      actions.push({ label: 'Hire', target: SubmissionStatus.HIRED });
      actions.push({ label: 'Reject', target: SubmissionStatus.REJECTED, variant: 'destructive' });
    } else if (status === SubmissionStatus.INTERVIEW) {
      actions.push({ label: 'Hire', target: SubmissionStatus.HIRED });
      actions.push({ label: 'Reject', target: SubmissionStatus.REJECTED, variant: 'destructive' });
    } else if (status === SubmissionStatus.HIRED) {
      actions.push({ label: 'Joined', target: SubmissionStatus.JOINED });
      actions.push({ label: 'Reject', target: SubmissionStatus.REJECTED, variant: 'destructive' });
    }
    return actions;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Submissions</CardTitle>
        <CardDescription>
          Candidates submitted by recruiters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {SUBMISSION_STATUS_TABS.map((tab) => (
            <Button
              key={tab.label}
              variant={statusFilter === tab.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {query.isPending ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !query.data || query.data.items.length === 0 ? (
          <div className="rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No submissions{statusFilter ? ` with status "${statusFilter}"` : ''} yet.
          </div>
        ) : (
          <div className="space-y-2">
            {query.data.items.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-4 rounded-lg border p-3"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{sub.candidateName}</span>
                    <StatusBadge status={sub.status} />
                    {sub.contactViewedByCompany ? (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" aria-hidden />
                        Viewed
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>{sub.candidateEmail}</span>
                    <span>CTC: {formatCurrency(sub.expectedCtc)}</span>
                    <span>{formatDate(sub.createdAt)}</span>
                    {sub.recruiter ? (
                      <span>via {sub.recruiter.name}</span>
                    ) : null}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={downloadCv.isPending}
                  onClick={() => handleDownload(sub.id)}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  CV
                </Button>
                {getCompanyActions(sub.status).map((action) => (
                  <Button
                    key={action.target}
                    variant={action.variant ?? 'outline'}
                    size="sm"
                    onClick={() =>
                      setModalState({
                        open: true,
                        submissionId: sub.id,
                        candidateName: sub.candidateName,
                        currentStatus: sub.status,
                        targetStatus: action.target,
                      })
                    }
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            ))}
            {query.data.total > query.data.items.length ? (
              <p className="text-center text-xs text-muted-foreground pt-2">
                Showing {query.data.items.length} of {query.data.total}
              </p>
            ) : null}
          </div>
        )}
        {modalState ? (
          <StatusActionModal
            open={modalState.open}
            onClose={() => setModalState(null)}
            submissionId={modalState.submissionId}
            candidateName={modalState.candidateName}
            currentStatus={modalState.currentStatus}
            targetStatus={modalState.targetStatus}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
