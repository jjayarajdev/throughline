import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CreditCard,
  IndianRupee,
  Lock,
  LockOpen,
  Receipt,
  RefreshCw,
  User,
  Wallet,
} from 'lucide-react';
import { TransactionType } from '@gigcruite/types';
import { formatCurrency } from '@/lib/format-currency';
import { useTransaction } from '@/features/wallet/hooks';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TransactionQuickViewProps {
  transactionId: string | null;
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

const CREDIT_TYPES = new Set<string>([
  TransactionType.COMPANY_DEPOSIT,
  TransactionType.COMPANY_UNLOCK,
  TransactionType.RECRUITER_CREDIT,
  TransactionType.REFUND,
]);

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof Wallet; variant: 'success' | 'destructive' | 'secondary' | 'warning' }
> = {
  [TransactionType.COMPANY_DEPOSIT]: { label: 'Deposit', icon: CreditCard, variant: 'success' },
  [TransactionType.COMPANY_LOCK]: { label: 'Funds Locked', icon: Lock, variant: 'warning' },
  [TransactionType.COMPANY_UNLOCK]: { label: 'Funds Unlocked', icon: LockOpen, variant: 'secondary' },
  [TransactionType.COMPANY_DEBIT]: { label: 'Payout', icon: ArrowUpRight, variant: 'destructive' },
  [TransactionType.RECRUITER_CREDIT]: { label: 'Earning', icon: ArrowDownLeft, variant: 'success' },
  [TransactionType.RECRUITER_WITHDRAWAL]: { label: 'Withdrawal', icon: ArrowUpRight, variant: 'destructive' },
  [TransactionType.PLATFORM_COMMISSION]: { label: 'Commission', icon: Receipt, variant: 'secondary' },
  [TransactionType.REFUND]: { label: 'Refund', icon: RefreshCw, variant: 'success' },
};

export function TransactionQuickView({
  transactionId,
  open,
  onOpenChange,
}: TransactionQuickViewProps) {
  const { data: tx, isPending } = useTransaction(
    open && transactionId ? transactionId : undefined,
  );

  const meta = (tx?.metadata ?? {}) as Record<string, unknown>;
  const config = tx ? TYPE_CONFIG[tx.transactionType] ?? { label: tx.transactionType, icon: Wallet, variant: 'secondary' as const } : null;
  const isCredit = tx ? CREDIT_TYPES.has(tx.transactionType) : false;

  const roleTitle = meta.roleTitle as string | undefined;
  const recruiterName = meta.recruiterName as string | undefined;
  const candidateName = meta.candidateName as string | undefined;
  const companyName = meta.companyName as string | undefined;
  const roleStatus = meta.roleStatus as string | undefined;
  const earningType = meta.earningType as string | undefined;
  const razorpayPaymentId = meta.razorpayPaymentId as string | undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:w-[480px]">
        {isPending || !tx || !config ? (
          <>
            <SheetHeader>
              <SheetTitle className="sr-only">Loading transaction</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pt-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="space-y-3 pr-8">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <config.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-lg leading-snug">
                    {tx.description ?? config.label}
                  </SheetTitle>
                  <SheetDescription className="mt-0.5">
                    {fmtDate(tx.createdAt)}
                  </SheetDescription>
                  <Badge variant={config.variant} className="mt-2">
                    {config.label}
                  </Badge>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6 px-6">
              {/* Amount */}
              <section className="rounded-lg border bg-muted/30 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Amount
                </p>
                <p
                  className={`text-2xl font-bold ${isCredit ? 'text-success' : 'text-destructive'}`}
                >
                  {isCredit ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </p>
              </section>

              {/* Balance Change */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Balance
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md border bg-muted/30 px-3 py-2 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Before</div>
                    <div className="text-sm font-semibold flex items-center justify-center gap-0.5">
                      <IndianRupee className="h-3 w-3 shrink-0" />
                      {Number(tx.balanceBefore).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 rounded-md border bg-muted/30 px-3 py-2 text-center">
                    <div className="text-xs text-muted-foreground mb-1">After</div>
                    <div className="text-sm font-semibold flex items-center justify-center gap-0.5">
                      <IndianRupee className="h-3 w-3 shrink-0" />
                      {Number(tx.balanceAfter).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </section>

              {/* Role Details */}
              {roleTitle && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Role
                  </h3>
                  <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                    <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{roleTitle}</p>
                      {companyName && (
                        <p className="text-xs text-muted-foreground truncate">{companyName}</p>
                      )}
                      {roleStatus && (
                        <Badge variant="outline" className="mt-1 capitalize text-xs">
                          {roleStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Recruiter / Candidate */}
              {(recruiterName || candidateName) && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    People
                  </h3>
                  <div className="space-y-2">
                    {recruiterName && (
                      <div className="flex items-center gap-3 text-sm">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Recruiter</span>
                        <span className="ml-auto font-medium truncate max-w-[200px]">{recruiterName}</span>
                      </div>
                    )}
                    {candidateName && (
                      <div className="flex items-center gap-3 text-sm">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Candidate</span>
                        <span className="ml-auto font-medium truncate max-w-[200px]">{candidateName}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Earning Type */}
              {earningType && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Earning Details
                  </h3>
                  <Badge variant="outline" className="capitalize">
                    {earningType.replace(/_/g, ' ')}
                  </Badge>
                </section>
              )}

              {/* Payment Reference */}
              {razorpayPaymentId && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Payment
                  </h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment ID</span>
                    <span className="font-mono text-xs truncate max-w-[200px]">{razorpayPaymentId}</span>
                  </div>
                </section>
              )}

              {/* Transaction ID */}
              <section className="border-t pt-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground shrink-0">Transaction ID</span>
                    <span className="font-mono text-muted-foreground truncate ml-4">{tx.id.slice(0, 12)}...</span>
                  </div>
                  {tx.referenceType && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground shrink-0">Reference</span>
                      <span className="capitalize text-muted-foreground">
                        {tx.referenceType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
