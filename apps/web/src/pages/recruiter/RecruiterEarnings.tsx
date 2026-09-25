import { useState, useMemo, useEffect } from 'react';
import { EarningStatus, EarningType, type EarningResponse } from '@gigcruite/types';
import { useEarnings, useEarningSummary, type EarningFilters } from '@/features/earning';
import { PageHeader, PageTitle, PageDescription } from '@/components/custom/PageHeader';
import { StatCardV2 } from '@/components/custom/StatCardV2';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Clock, Banknote, CheckCircle2, TrendingUp, Search } from 'lucide-react';
import { EarningQuickView } from '@/components/slide-overs/EarningQuickView';
import { formatCurrency } from '@/lib/format-currency';
import type { ColumnDef } from '@tanstack/react-table';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const typeLabel = (t: string) =>
  t === EarningType.SHORTLIST_PAYOUT ? 'Shortlist' : t === EarningType.HIRE_PAYOUT ? 'Hire' : t;

const PAGE_SIZE = 10;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Badge variant mapping from Phase 7 standardization
const earningStatusVariant = (status: EarningStatus): BadgeProps['variant'] => {
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

const earningStatusLabel = (status: EarningStatus): string => {
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

export default function RecruiterEarnings() {
  const [filters, setFilters] = useState<EarningFilters>({ page: 1, pageSize: PAGE_SIZE });
  const [searchInput, setSearchInput] = useState('');
  const [selectedEarning, setSelectedEarning] = useState<EarningResponse | null>(null);
  const debouncedSearch = useDebounce(searchInput, 300);
  const earningsQ = useEarnings({
    ...filters,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const summaryQ = useEarningSummary();
  const s = summaryQ.data;
  const pageCount = earningsQ.data ? Math.ceil(earningsQ.data.total / PAGE_SIZE) : 0;
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });

  // Sync pagination with filters
  const handlePaginationChange = (updater: any) => {
    const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
    setPagination(newPagination);
    setFilters((f) => ({ ...f, page: newPagination.pageIndex + 1 }));
  };

  const columns = useMemo<ColumnDef<EarningResponse>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => fmtDate(row.original.createdAt),
      },
      {
        accessorKey: 'role.title',
        header: 'Role',
        cell: ({ row }) => (
          <span className="max-w-xs truncate" title={row.original.role?.title}>
            {row.original.role?.title ?? '-'}
          </span>
        ),
      },
      {
        accessorKey: 'earningType',
        header: 'Type',
        cell: ({ row }) => <Badge variant="secondary">{typeLabel(row.original.earningType)}</Badge>,
      },
      {
        accessorKey: 'grossAmount',
        header: 'Gross',
        cell: ({ row }) => <div className="text-right">{formatCurrency(row.original.grossAmount)}</div>,
      },
      {
        accessorKey: 'platformCommission',
        header: 'Commission',
        cell: ({ row }) => (
          <div className="text-right text-destructive">{formatCurrency(row.original.platformCommission)}</div>
        ),
      },
      {
        accessorKey: 'netAmount',
        header: 'Net',
        cell: ({ row }) => (
          <div className="text-right font-medium">{formatCurrency(row.original.netAmount)}</div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={earningStatusVariant(row.original.status)}>
            {earningStatusLabel(row.original.status)}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageTitle>Earnings</PageTitle>
          <PageDescription>Track your earnings from successful placements</PageDescription>
        </div>
      </PageHeader>

      {/* Summary cards */}
      {summaryQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : s ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardV2
            label="Total Earned"
            value={formatCurrency(s.totalEarned)}
            variant="gradient"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCardV2
            label="Pending"
            value={formatCurrency(s.totalPending)}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatCardV2
            label="Payable"
            value={formatCurrency(s.totalPayable)}
            icon={<Banknote className="h-5 w-5" />}
          />
          <StatCardV2
            label="Paid"
            value={formatCurrency(s.totalPaid)}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search role, candidate, company..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPagination({ pageIndex: 0, pageSize: PAGE_SIZE });
              setFilters((f) => ({ ...f, page: 1 }));
            }}
            className="pl-9 h-9"
          />
        </div>

        <Select
          value={filters.status ?? ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: e.target.value ? (e.target.value as EarningStatus) : undefined,
              page: 1,
            }))
          }
          className="w-[180px]"
        >
          <option value="">All Statuses</option>
          {Object.values(EarningStatus).map((s) => (
            <option key={s} value={s}>
              {earningStatusLabel(s)}
            </option>
          ))}
        </Select>

        <Select
          value={filters.earningType ?? ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              earningType: e.target.value ? (e.target.value as EarningType) : undefined,
              page: 1,
            }))
          }
          className="w-[180px]"
        >
          <option value="">All Types</option>
          <option value={EarningType.SHORTLIST_PAYOUT}>Shortlist</option>
          <option value={EarningType.HIRE_PAYOUT}>Hire</option>
        </Select>
      </div>

      {/* Table */}
      <Card className="p-6">
        {earningsQ.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : earningsQ.data && earningsQ.data.earnings.length > 0 ? (
          <DataTable
            columns={columns}
            data={earningsQ.data.earnings}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            onRowClick={(row) => setSelectedEarning(row)}
          />
        ) : (
          <EmptyState
            title="No earnings yet"
            description="Submit candidates to roles to start earning."
            icon={<TrendingUp />}
            action={
              <Button asChild>
                <Link to="/r/roles" viewTransition>
                  Browse Roles
                </Link>
              </Button>
            }
          />
        )}
      </Card>

      <EarningQuickView
        earning={selectedEarning}
        open={!!selectedEarning}
        onOpenChange={(open) => { if (!open) setSelectedEarning(null); }}
      />
    </div>
  );
}
