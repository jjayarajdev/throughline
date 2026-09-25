import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, Wallet, Lock, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';
import { TransactionType, type WalletTransactionResponse } from '@gigcruite/types';
import { useWalletBalance, useWalletTransactions } from '@/features/wallet';
import { PageHeader } from '@/components/custom/PageHeader';
import { StatCardV2 } from '@/components/custom/StatCardV2';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TransactionQuickView } from '@/components/slide-overs/TransactionQuickView';
import { formatCurrency } from '@/lib/format-currency';
import type { ColumnDef } from '@tanstack/react-table';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const PAGE_SIZE = 10;

// For recruiter wallet, credit types are: RECRUITER_CREDIT, REFUND
// Debit types are: RECRUITER_WITHDRAWAL, PLATFORM_COMMISSION
const isCreditType = (type: TransactionType) =>
  type === TransactionType.RECRUITER_CREDIT || type === TransactionType.REFUND;

export default function RecruiterWallet() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const page = pagination.pageIndex + 1;
  const balanceQ = useWalletBalance();
  const txQ = useWalletTransactions(
    page,
    PAGE_SIZE,
    typeFilter || undefined,
    debouncedSearch || undefined,
  );

  const columns = useMemo<ColumnDef<WalletTransactionResponse>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => row.original.description || row.original.transactionType,
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const isCredit = isCreditType(row.original.transactionType);
          return (
            <Badge variant={isCredit ? 'success' : 'destructive'}>
              {isCredit ? (
                <>
                  <ArrowDownLeft className="mr-1 h-3 w-3" />
                  Credit
                </>
              ) : (
                <>
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  Debit
                </>
              )}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
          const isCredit = isCreditType(row.original.transactionType);
          return (
            <span className={isCredit ? 'text-success' : 'text-destructive'}>
              {formatCurrency(row.original.amount)}
            </span>
          );
        },
      },
      {
        accessorKey: 'balanceAfter',
        header: 'Balance After',
        cell: ({ row }) => formatCurrency(row.original.balanceAfter),
      },
    ],
    []
  );

  const balance = balanceQ.data?.balance ? Number(balanceQ.data.balance) : 0;
  const locked = balanceQ.data?.lockedBalance ? Number(balanceQ.data.lockedBalance) : 0;
  const available = balance - locked;

  const pageCount = txQ.data ? Math.ceil(txQ.data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Wallet" />
        <Button asChild>
          <Link to="/r/payouts" viewTransition>
            <ArrowDownToLine className="h-4 w-4" />
            Withdraw
          </Link>
        </Button>
      </div>

      {/* Balance Cards */}
      {balanceQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : balanceQ.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCardV2 icon={<Wallet className="h-5 w-5" />} label="Available Balance" value={formatCurrency(available)} />
          <StatCardV2 icon={<Lock className="h-5 w-5" />} label="Locked Balance" value={formatCurrency(locked)} />
          <StatCardV2 label="Total Balance" value={formatCurrency(balance)} variant="gradient" />
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search transactions..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPagination({ pageIndex: 0, pageSize: PAGE_SIZE });
            }}
            className="pl-9 h-9"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPagination({ pageIndex: 0, pageSize: PAGE_SIZE });
          }}
          className="w-[160px]"
        >
          <option value="">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </Select>
      </div>

      {/* Transactions */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Transactions</h2>
        {txQ.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : txQ.data && txQ.data.transactions.length > 0 ? (
          <DataTable
            columns={columns}
            data={txQ.data.transactions}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            onRowClick={(row) => setSelectedTxId(row.id)}
          />
        ) : (
          <EmptyState
            title="No transactions yet"
            description="Fund your wallet or earn from placements to see transactions here."
            icon={<Wallet />}
          />
        )}
      </Card>

      <TransactionQuickView
        transactionId={selectedTxId}
        open={!!selectedTxId}
        onOpenChange={(open) => { if (!open) setSelectedTxId(null); }}
      />
    </div>
  );
}
