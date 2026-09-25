import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Eye } from 'lucide-react';
import { SubmissionStatus } from '@gigcruite/types';
import { StatusActionModal } from '@/components/StatusActionModal';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusTimeline } from '@/components/StatusTimeline';
import { extractErrorMessage } from '@/lib/error';
import { useSubmission, useDownloadCv } from '@/features/submission';
import { formatCurrency } from '@/lib/format-currency';

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

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const query = useSubmission(id);
  const downloadCv = useDownloadCv();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [cvPreviewUrl, setCvPreviewUrl] = useState<string | null>(null);
  const [cvPreviewName, setCvPreviewName] = useState('');

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
          <Link to="/r/submissions" viewTransition>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to submissions
          </Link>
        </Button>
        <Card>
          <CardContent className="py-8 text-sm text-destructive">
            {extractErrorMessage(query.error, 'Could not load submission')}
          </CardContent>
        </Card>
      </div>
    );
  }

  const sub = query.data;
  if (!sub) return null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/r/submissions">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to submissions
        </Link>
      </Button>

      <header className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {sub.candidateName}
        </h1>
        <StatusBadge status={sub.status} />
        {sub.status !== SubmissionStatus.HIRED &&
         sub.status !== SubmissionStatus.JOINED &&
         sub.status !== SubmissionStatus.REJECTED &&
         sub.status !== SubmissionStatus.WITHDRAWN ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setWithdrawOpen(true)}
          >
            Withdraw
          </Button>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: candidate info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Candidate info</CardTitle>
              <CardDescription>Submitted {formatDate(sub.createdAt)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Email" value={sub.candidateEmail} />
                <Field label="Phone" value={sub.candidatePhone} />
                <Field label="Expected CTC" value={formatCurrency(sub.expectedCtc)} />
                <Field
                  label="Notice period"
                  value={`${sub.noticePeriodDays} days`}
                />
                {sub.currentLocation ? (
                  <Field label="Location" value={sub.currentLocation} />
                ) : null}
                {sub.currentCompany ? (
                  <Field label="Current company" value={sub.currentCompany} />
                ) : null}
              </div>

              {sub.coverNote ? (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Cover note
                    </h3>
                    <p className="whitespace-pre-wrap text-sm">{sub.coverNote}</p>
                  </div>
                </>
              ) : null}

              <Separator />

              <div>
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  CV
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{sub.cvMimeType.split('/')[1]?.toUpperCase()}</Badge>
                  <span className="text-muted-foreground">
                    {sub.cvOriginalFilename} ·{' '}
                    {(sub.cvSizeBytes / 1024).toFixed(0)} KB
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={downloadCv.isPending}
                    onClick={() => {
                      downloadCv.mutate(sub.id, {
                        onSuccess: (data) => {
                          setCvPreviewName(data.filename);
                          setCvPreviewUrl(data.downloadUrl);
                        },
                        onError: (err) =>
                          toast.error(extractErrorMessage(err, 'Could not load CV')),
                      });
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={downloadCv.isPending}
                    onClick={() => {
                      downloadCv.mutate(sub.id, {
                        onSuccess: (data) => {
                          window.open(data.downloadUrl, '_blank');
                        },
                        onError: (err) =>
                          toast.error(extractErrorMessage(err, 'Could not download CV')),
                      });
                    }}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: role context + timeline */}
        <div className="space-y-6">
          {'role' in sub && sub.role ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{sub.role.title}</p>
                <p className="text-sm text-muted-foreground">
                  {sub.role.companyName}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{sub.role.roleType}</Badge>
                  <Badge variant="secondary">{sub.role.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {'role' in sub && sub.role?.payoutType ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Field
                  label="Payout type"
                  value={sub.role.payoutType.replace('_', ' ')}
                />
                {sub.role.shortlistPayoutValue ? (
                  <Field
                    label="Per shortlist"
                    value={sub.role.shortlistPayoutMode === 'percentage' ? `${sub.role.shortlistPayoutValue}% of CTC` : formatCurrency(sub.role.shortlistPayoutValue)}
                  />
                ) : null}
                {sub.role.hirePayoutValue ? (
                  <Field
                    label="Per hire"
                    value={sub.role.hirePayoutMode === 'percentage' ? `${sub.role.hirePayoutValue}% of CTC` : formatCurrency(sub.role.hirePayoutValue)}
                  />
                ) : null}
                {(sub.status === SubmissionStatus.HIRED ||
                  sub.status === SubmissionStatus.JOINED) &&
                sub.acceptedCtc ? (
                  <>
                    <Separator />
                    <Field label="Accepted CTC" value={formatCurrency(sub.acceptedCtc)} />
                    {sub.finalPayout ? (
                      <Field label="Final payout" value={formatCurrency(sub.finalPayout)} />
                    ) : null}
                  </>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {'statusEvents' in sub && sub.statusEvents?.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusTimeline events={sub.statusEvents} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {withdrawOpen && sub ? (
        <StatusActionModal
          open={withdrawOpen}
          onClose={() => setWithdrawOpen(false)}
          submissionId={sub.id}
          candidateName={sub.candidateName}
          currentStatus={sub.status}
          targetStatus={SubmissionStatus.WITHDRAWN}
        />
      ) : null}

      <Sheet open={Boolean(cvPreviewUrl)} onOpenChange={(open) => { if (!open) setCvPreviewUrl(null); }}>
        <SheetContent side="right" className="p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>CV Preview</SheetTitle>
            <SheetDescription>{cvPreviewName}</SheetDescription>
          </SheetHeader>
          {cvPreviewUrl ? (
            sub.cvMimeType === 'application/pdf' ? (
              <iframe
                src={cvPreviewUrl}
                title="CV Preview"
                className="flex-1 w-full border-0"
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Preview is not available for {sub.cvMimeType.split('/')[1]?.toUpperCase()} files.
                </p>
                <Button asChild>
                  <a href={cvPreviewUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" aria-hidden />
                    Download to view
                  </a>
                </Button>
              </div>
            )
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
