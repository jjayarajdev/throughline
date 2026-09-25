import { useEffect, useMemo, useState } from 'react';
import { type ColumnDef, type PaginationState } from '@tanstack/react-table';
import { ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';
import { useWalletTransactions } from '@/features/wallet/hooks';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PageHeader, PageTitle } from '@/components/custom/PageHeader';
import { TransactionQuickView } from '@/components/slide-overs/TransactionQuickView';
import { formatCurrency } from '@/lib/format-currency';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type WalletTransaction = {
  id: string;
  transactionType: string;
  amount: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export default function CompanyTransactions() {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const { data, isLoading } = useWalletTransactions(
    pagination.pageIndex + 1,
    pagination.pageSize,
    typeFilter || undefined,
    debouncedSearch || undefined,
  );

  const columns = useMemo<ColumnDef<WalletTransaction>[]>(
    () => [
      {
        id: 'type',
        header: '',
        cell: ({ row }) => {
          const tx = row.original;
          const isCredit = tx.transactionType === 'company_deposit';
          return isCredit ? (
            <ArrowDownLeft className="h-5 w-5 text-success" />
          ) : (
            <ArrowUpRight className="h-5 w-5 text-destructive" />
          );
        },
        size: 50,
      },
      {
        id: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const tx = row.original;
          const m = (tx.metadata ?? {}) as Record<string, string | undefined>;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {tx.description ?? tx.transactionType.replace(/_/g, ' ')}
              </span>
              {m.roleTitle && (
                <span className="text-xs text-muted-foreground">
                  {m.roleTitle}
                  {m.recruiterName ? ` · via ${m.recruiterName}` : ''}
                  {m.candidateName ? ` · ${m.candidateName}` : ''}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(tx.createdAt).toLocaleString('en-IN')}
              </span>
            </div>
          );
        },
      },
      {
        id: 'context',
        header: 'Type',
        cell: ({ row }) => {
          const m = (row.original.metadata ?? {}) as Record<string, string | undefined>;
          const status = m.submissionStatus;
          if (!status) return <span className="text-muted-foreground">—</span>;
          const label = status === 'shortlisted' ? 'Shortlist' : status === 'hired' ? 'Hire' : status;
          return (
            <Badge variant={status === 'hired' ? 'default' : 'secondary'} className="capitalize">
              {label}
            </Badge>
          );
        },
        size: 100,
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
        cell: ({ row }) => {
          const tx = row.original;
          const isCredit = tx.transactionType === 'company_deposit';
          return (
            <span
              className={`text-sm font-semibold ${
                isCredit ? 'text-success' : 'text-destructive'
              }`}
            >
              {isCredit ? '+' : '-'}
              {formatCurrency(tx.amount)}
            </span>
          );
        },
      },
    ],
    [],
  );

  const pageCount = data ? Math.ceil(data.total / pagination.pageSize) : 0;

  const toolbar = (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search role, recruiter, candidate..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="pl-9 h-9"
        />
      </div>
      <Select
        value={typeFilter}
        onChange={(e) => {
          setTypeFilter(e.target.value);
          setPagination((p) => ({ ...p, pageIndex: 0 }));
        }}
      >
        <option value="">All types</option>
        <option value="company_deposit">Credits</option>
        <option value="company_debit">Debits</option>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader>
        <PageTitle>Transactions</PageTitle>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.transactions ?? []}
        pageCount={pageCount}
        rowCount={data?.total}
        pagination={pagination}
        onPaginationChange={setPagination}
        loading={isLoading}
        toolbar={toolbar}
        emptyTitle="No transactions found"
        emptyDescription="Try adjusting your filters or make your first transaction."
        onRowClick={(row) => setSelectedTxId(row.id)}
      />

      <TransactionQuickView
        transactionId={selectedTxId}
        open={!!selectedTxId}
        onOpenChange={(open) => { if (!open) setSelectedTxId(null); }}
      />
    </div>
  );
}
