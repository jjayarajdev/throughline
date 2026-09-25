import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowRight, ArrowUpRight, ArrowDownLeft, Lock, Info } from 'lucide-react';
import { useWalletBalance, useWalletTransactions } from '@/features/wallet/hooks';
import type { WalletTransactionResponse } from '@gigcruite/types';
import { PageHeader, PageTitle, PageActions } from '@/components/custom/PageHeader';
import { StatCardV2 } from '@/components/custom/StatCardV2';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/shared/EmptyState';
import { TransactionQuickView } from '@/components/slide-overs/TransactionQuickView';
import { formatCurrency } from '@/lib/format-currency';

type BalancePanel = 'available' | 'locked' | 'total' | null;

export default function CompanyWallet() {
  const { data: bal, isLoading: balLoading } = useWalletBalance();
  const { data: txns, isLoading: txLoading } = useWalletTransactions(1, 10);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [balancePanel, setBalancePanel] = useState<BalancePanel>(null);

  const totalBalance = bal ? Number(bal.balance) : 0;
  const lockedBalance = bal ? Number(bal.lockedBalance) : 0;
  const availableBalance = totalBalance - lockedBalance;

  return (
    <div className="space-y-6">
      <PageHeader>
        <PageTitle>Wallet</PageTitle>
        <PageActions>
          <Button asChild>
            <Link to="/c/wallet/fund" viewTransition>
              Add Funds <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      {/* Balance cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {balLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : bal ? (
          <>
            <button type="button" className="text-left" onClick={() => setBalancePanel('available')}>
              <StatCardV2
                label="Available"
                value={formatCurrency(availableBalance)}
                icon={<Wallet />}
                helper="Click for details"
              />
            </button>
            <button type="button" className="text-left" onClick={() => setBalancePanel('locked')}>
              <StatCardV2
                label="Locked"
                value={formatCurrency(lockedBalance)}
                icon={<Lock />}
                helper="Click for details"
              />
            </button>
            <button type="button" className="text-left" onClick={() => setBalancePanel('total')}>
              <StatCardV2
                label="Total Balance"
                value={formatCurrency(totalBalance)}
                variant="gradient"
                icon={<Wallet />}
                helper="Click for details"
              />
            </button>
          </>
        ) : (
          <p className="col-span-3 text-muted-foreground">Unable to load balance.</p>
        )}
      </div>

      {/* Recent transactions */}
      <section>
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-lg font-semibold">Recent transactions</h2>
          <Button asChild variant="link" size="sm">
            <Link to="/c/transactions" viewTransition>
              View all
            </Link>
          </Button>
        </div>
        {txLoading ? (
          <Skeleton className="h-40" />
        ) : txns?.transactions.length ? (
          <Card>
            <div className="divide-y divide-border">
              {txns.transactions.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  onSelect={() => setSelectedTxId(tx.id)}
                />
              ))}
            </div>
          </Card>
        ) : (
          <EmptyState
            title="No transactions yet"
            description="Fund your wallet to get started."
            action={
              <Button asChild>
                <Link to="/c/wallet/fund" viewTransition>
                  Add Funds
                </Link>
              </Button>
            }
            icon={<Wallet />}
          />
        )}
      </section>

      <TransactionQuickView
        transactionId={selectedTxId}
        open={!!selectedTxId}
        onOpenChange={(open) => { if (!open) setSelectedTxId(null); }}
      />

      {/* Balance breakdown sheet */}
      <Sheet open={!!balancePanel} onOpenChange={(open) => { if (!open) setBalancePanel(null); }}>
        <SheetContent className="overflow-y-auto sm:w-[440px]">
          <SheetHeader>
            <SheetTitle>
              {balancePanel === 'available' && 'Available Balance'}
              {balancePanel === 'locked' && 'Locked Balance'}
              {balancePanel === 'total' && 'Total Balance'}
            </SheetTitle>
            <SheetDescription>How this number is calculated</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6 px-6">
            {balancePanel === 'available' && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Balance</span>
                    <span className="font-medium">{formatCurrency(totalBalance)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">– Locked (escrow)</span>
                    <span className="font-medium text-destructive">-{formatCurrency(lockedBalance)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Available</span>
                    <span>{formatCurrency(availableBalance)}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Available balance is what you can use to publish new roles or add funds.
                    It equals your total balance minus any funds locked as escrow for active roles.
                  </span>
                </div>
              </>
            )}

            {balancePanel === 'locked' && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Total Locked</span>
                    <span>{formatCurrency(lockedBalance)}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Locked funds are escrow held against your active roles. When you publish a role,
                    the estimated maximum payout is locked from your balance. As recruiters get paid
                    (shortlist or hire payouts), the locked amount decreases. When a role is closed,
                    any remaining locked funds are released back to available.
                  </span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">How escrow works:</p>
                  <ol className="list-decimal space-y-1 pl-4">
                    <li>You publish a role with payout terms (e.g. ₹50K/shortlist + ₹2L/hire)</li>
                    <li>The system calculates the maximum possible payout and locks that amount</li>
                    <li>When a recruiter earns a payout, funds move from locked → paid</li>
                    <li>When the role is closed/filled, remaining escrow unlocks back to available</li>
                  </ol>
                </div>
              </>
            )}

            {balancePanel === 'total' && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-medium">{formatCurrency(availableBalance)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">+ Locked (escrow)</span>
                    <span className="font-medium">{formatCurrency(lockedBalance)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Total Balance</span>
                    <span>{formatCurrency(totalBalance)}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Total balance is the sum of your available and locked funds. This is the full
                    amount in your wallet including escrow held for active roles. It increases when
                    you add funds and decreases when recruiter payouts are processed.
                  </span>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function txMeta(tx: WalletTransactionResponse) {
  const m = (tx.metadata ?? {}) as Record<string, unknown>;
  return {
    roleTitle: m.roleTitle as string | undefined,
    recruiterName: m.recruiterName as string | undefined,
    candidateName: m.candidateName as string | undefined,
    submissionStatus: m.submissionStatus as string | undefined,
  };
}

function TxRow({ tx, onSelect }: { tx: WalletTransactionResponse; onSelect: () => void }) {
  const isCredit = tx.transactionType === 'company_deposit';
  const meta = txMeta(tx);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        {isCredit ? (
          <ArrowDownLeft className="h-5 w-5 text-success" />
        ) : (
          <ArrowUpRight className="h-5 w-5 text-destructive" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium">{tx.description ?? tx.transactionType}</p>
          {meta.roleTitle && (
            <p className="text-xs text-muted-foreground truncate">
              {meta.roleTitle}
              {meta.recruiterName ? ` · via ${meta.recruiterName}` : ''}
              {meta.candidateName ? ` · ${meta.candidateName}` : ''}
              {meta.submissionStatus ? ` (${meta.submissionStatus})` : ''}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {new Date(tx.createdAt).toLocaleDateString('en-IN')}
          </p>
        </div>
      </div>
      <span
        className={`text-sm font-semibold shrink-0 ${isCredit ? 'text-success' : 'text-destructive'}`}
      >
        {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
      </span>
    </button>
  );
}
