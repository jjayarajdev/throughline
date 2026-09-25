import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  ThumbsUp,
} from 'lucide-react';
import { PayoutRequestStatus, type PayoutRequestResponse } from '@gigcruite/types';
import { formatCurrency } from '@/lib/format-currency';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge, type BadgeProps } from '@/components/ui/badge';

interface PayoutQuickViewProps {
  payout: PayoutRequestResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fmtDate = (iso: string | null) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const statusVariant = (status: PayoutRequestStatus): BadgeProps['variant'] => {
  switch (status) {
    case PayoutRequestStatus.PENDING_APPROVAL:
      return 'warning';
    case PayoutRequestStatus.APPROVED:
    case PayoutRequestStatus.COMPLETED:
      return 'success';
    case PayoutRequestStatus.PROCESSING:
      return 'default';
    case PayoutRequestStatus.FAILED:
    case PayoutRequestStatus.CANCELLED:
      return 'destructive';
    default:
      return 'secondary';
  }
};

const statusLabel = (status: PayoutRequestStatus): string =>
  status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const STATUS_ICON: Record<string, typeof Clock> = {
  [PayoutRequestStatus.PENDING_APPROVAL]: Clock,
  [PayoutRequestStatus.APPROVED]: ThumbsUp,
  [PayoutRequestStatus.PROCESSING]: Loader2,
  [PayoutRequestStatus.COMPLETED]: CheckCircle2,
  [PayoutRequestStatus.FAILED]: AlertTriangle,
  [PayoutRequestStatus.CANCELLED]: XCircle,
};

interface TimelineEntry {
  label: string;
  date: string | null;
  icon: typeof Clock;
  active: boolean;
}

function buildTimeline(payout: PayoutRequestResponse): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    { label: 'Requested', date: payout.createdAt, icon: ArrowDownToLine, active: true },
  ];

  if (payout.approvedAt) {
    entries.push({ label: 'Approved', date: payout.approvedAt, icon: ThumbsUp, active: true });
  }

  if (payout.rejectedAt) {
    entries.push({ label: 'Rejected', date: payout.rejectedAt, icon: XCircle, active: true });
  }

  if (payout.completedAt) {
    entries.push({ label: 'Completed', date: payout.completedAt, icon: CheckCircle2, active: true });
  }

  if (payout.status === PayoutRequestStatus.FAILED) {
    entries.push({ label: 'Failed', date: payout.updatedAt, icon: AlertTriangle, active: true });
  }

  return entries;
}

export function PayoutQuickView({ payout, open, onOpenChange }: PayoutQuickViewProps) {
  if (!payout) return null;

  const Icon = STATUS_ICON[payout.status] ?? Clock;
  const timeline = buildTimeline(payout);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:w-[480px]">
        <SheetHeader className="space-y-3 pr-8">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg leading-snug">
                Payout Request
              </SheetTitle>
              <SheetDescription className="mt-0.5">
                {fmtDate(payout.createdAt)}
              </SheetDescription>
              <Badge variant={statusVariant(payout.status)} className="mt-2">
                {statusLabel(payout.status)}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-6">
          {/* Amount */}
          <section className="rounded-lg border bg-muted/30 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              Withdrawal Amount
            </p>
            <p className="text-2xl font-bold">{formatCurrency(payout.amount)}</p>
          </section>

          {/* Timeline */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Timeline
            </h3>
            <div className="relative space-y-0">
              {timeline.map((entry, i) => {
                const EntryIcon = entry.icon;
                return (
                  <div key={entry.label} className="flex items-start gap-3 pb-4 last:pb-0">
                    <div className="relative flex flex-col items-center">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border bg-background">
                        <EntryIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      {i < timeline.length - 1 && (
                        <div className="absolute top-7 w-px h-full bg-border" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm font-medium">{entry.label}</p>
                      {entry.date && (
                        <p className="text-xs text-muted-foreground">{fmtDate(entry.date)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Admin Note */}
          {payout.adminNote && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Admin Note
              </h3>
              <div className="rounded-lg border bg-muted/30 px-4 py-3">
                <p className="text-sm">{payout.adminNote}</p>
              </div>
            </section>
          )}

          {/* IDs */}
          <section className="border-t pt-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground shrink-0">Request ID</span>
                <span className="font-mono text-muted-foreground truncate ml-4">
                  {payout.id.slice(0, 12)}...
                </span>
              </div>
              {payout.payoutBatchId && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground shrink-0">Payout Batch</span>
                  <span className="font-mono text-muted-foreground truncate ml-4">
                    {payout.payoutBatchId.slice(0, 12)}...
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
