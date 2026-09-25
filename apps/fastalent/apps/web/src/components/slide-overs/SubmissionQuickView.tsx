import { Link } from 'react-router-dom';
import { FileText, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';
import { useSubmission } from '@/features/submission';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/StatusBadge';

interface SubmissionQuickViewProps {
  submissionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

/**
 * SubmissionQuickView — Sheet-based slide-over panel for recruiter submission preview.
 * Opens from MySubmissions table row clicks.
 */
export function SubmissionQuickView({
  submissionId,
  open,
  onOpenChange,
}: SubmissionQuickViewProps) {
  const { data: submission, isPending } = useSubmission(submissionId ?? undefined);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:w-[500px]">
        {isPending || !submission ? (
          <>
            <SheetHeader>
              <SheetTitle className="sr-only">Loading submission</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-xl">{submission.candidateName}</SheetTitle>
                  <SheetDescription className="mt-1">
                    {submission.role?.title}
                  </SheetDescription>
                </div>
                <StatusBadge status={submission.status} />
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6 px-6">
              {/* Role Info */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Role
                </h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium">{submission.role?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {submission.role?.companyName}
                  </p>
                </div>
              </section>

              {/* Candidate Details */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Candidate Details
                </h3>
                <dl className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Expected CTC</dt>
                    <dd className="font-medium">{formatCurrency(submission.expectedCtc)}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Notice Period</dt>
                    <dd className="font-medium">{submission.noticePeriodDays} days</dd>
                  </div>
                  {submission.currentLocation && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Current Location</dt>
                      <dd className="font-medium">{submission.currentLocation}</dd>
                    </div>
                  )}
                  {submission.currentCompany && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Current Company</dt>
                      <dd className="font-medium">{submission.currentCompany}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Submitted</dt>
                    <dd className="font-medium">{formatDate(submission.createdAt)}</dd>
                  </div>
                </dl>
              </section>

              {/* CV Section */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  CV
                </h3>
                <div className="mt-2 flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {submission.cvOriginalFilename}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(submission.cvSizeBytes / 1024).toFixed(0)} KB
                  </span>
                </div>
              </section>

              {/* Status Timeline (if available) */}
              {submission.statusEvents && submission.statusEvents.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Status History
                  </h3>
                  <div className="mt-2 space-y-2">
                    {submission.statusEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium capitalize">
                            {event.toStatus.toLowerCase().replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(event.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 left-0 right-0 mt-6 border-t bg-background px-6 pt-4 pb-4">
              <Button asChild className="w-full">
                <Link
                  to={`/r/submissions/${submission.id}`}
                  viewTransition
                  onClick={() => onOpenChange(false)}
                >
                  View Full Details
                  <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
