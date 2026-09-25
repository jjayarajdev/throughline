import {
  Briefcase,
  TrendingUp,
  User,
} from 'lucide-react';
import type { EarningResponse } from '@gigcruite/types';
import { EarningStatus, EarningType } from '@gigcruite/types';
import { formatCurrency } from '@/lib/format-currency';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge, type BadgeProps } from '@/components/ui/badge';

interface EarningQuickViewProps {
  earning: EarningResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fmtDate = (iso: string) => {
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

const statusVariant = (status: EarningStatus): BadgeProps['variant'] => {
  switch (status) {
    case EarningStatus.PENDING:
      return 'warning';
    case EarningStatus.PAYABLE:
    case EarningStatus.PAID:
      return 'success';
    case EarningStatus.PROCESSING:
      return 'default';
    case EarningStatus.CANCELLED:
      return 'destructive';
    default:
      return 'secondary';
  }
};

const statusLabel = (status: EarningStatus): string => {
  switch (status) {
    case EarningStatus.PENDING:
      return 'Pending';
    case EarningStatus.PAYABLE:
      return 'Payable';
    case EarningStatus.PROCESSING:
      return 'Processing';
    case EarningStatus.PAID:
      return 'Paid';
    case EarningStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status;
  }
};

export function EarningQuickView({ earning, open, onOpenChange }: EarningQuickViewProps) {
  if (!earning) return null;

  const typeLabel = earning.earningType === EarningType.SHORTLIST_PAYOUT ? 'Shortlist' : 'Hire';
  const commissionPct = Number(earning.platformCommissionPct);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:w-[480px]">
        <SheetHeader className="space-y-3 pr-8">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg leading-snug">
                {typeLabel} Earning
              </SheetTitle>
              <SheetDescription className="mt-0.5">
                {fmtDate(earning.createdAt)}
              </SheetDescription>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={statusVariant(earning.status)}>
                  {statusLabel(earning.status)}
                </Badge>
                <Badge variant="secondary">{typeLabel}</Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-6">
          {/* Net Amount */}
          <section className="rounded-lg border bg-muted/30 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              Net Earning
            </p>
            <p className="text-2xl font-bold text-success">
              {formatCurrency(earning.netAmount)}
            </p>
          </section>

          {/* Breakdown */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Breakdown
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  Gross Amount
                </span>
                <span className="font-medium">{formatCurrency(earning.grossAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  Platform Commission ({commissionPct}%)
                </span>
                <span className="font-medium text-destructive">
                  -{formatCurrency(earning.platformCommission)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                <span>Net Amount</span>
                <span className="text-success">{formatCurrency(earning.netAmount)}</span>
              </div>
            </div>
          </section>

          {/* Role Details */}
          {earning.role && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Role
              </h3>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{earning.role.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{earning.role.companyName}</p>
                </div>
              </div>
            </section>
          )}

          {/* Candidate */}
          {earning.submission && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Candidate
              </h3>
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{earning.submission.candidateName}</span>
                <Badge variant="outline" className="ml-auto capitalize text-xs">
                  {earning.submission.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </section>
          )}

          {/* IDs */}
          <section className="border-t pt-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground shrink-0">Earning ID</span>
                <span className="font-mono text-muted-foreground truncate ml-4">
                  {earning.id.slice(0, 12)}...
                </span>
              </div>
              {earning.payoutBatchId && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground shrink-0">Payout Batch</span>
                  <span className="font-mono text-muted-foreground truncate ml-4">
                    {earning.payoutBatchId.slice(0, 12)}...
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
