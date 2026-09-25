import { useState, useMemo } from 'react';
import { PayoutRequestStatus, type PayoutRequestResponse } from '@gigcruite/types';
import { usePayoutRequests, useCreatePayoutRequest } from '@/features/payout';
import { useWalletBalance } from '@/features/wallet';
import { PageHeader, PageTitle } from '@/components/custom/PageHeader';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import WithdrawalDialog from '@/components/wallet/WithdrawalDialog';
import { PayoutQuickView } from '@/components/slide-overs/PayoutQuickView';
import { ArrowDownToLine, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';
import type { ColumnDef } from '@tanstack/react-table';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const PAGE_SIZE = 10;

// Badge variant mapping from Phase 7 standardization
const payoutStatusVariant = (status: PayoutRequestStatus): BadgeProps['variant'] => {
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

const payoutStatusLabel = (status: PayoutRequestStatus): string => {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function RecruiterPayouts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequestResponse | null>(null);
  const page = pagination.pageIndex + 1;
  const requestsQ = usePayoutRequests({
    page,
    pageSize: PAGE_SIZE,
    ...(statusFilter ? { status: statusFilter } : {}),
  });
  const balanceQ = useWalletBalance();
  const createMutation = useCreatePayoutRequest();
  const pageCount = requestsQ.data ? Math.ceil(requestsQ.data.total / PAGE_SIZE) : 0;
  const available = balanceQ.data
    ? (Number(balanceQ.data.balance) - Number(balanceQ.data.lockedBalance)).toFixed(2)
    : '0';

  function handleSubmit(amount: number) {
    createMutation.mutate(amount, {
      onSuccess: () => {
        setDialogOpen(false);
        requestsQ.refetch();
        balanceQ.refetch();
      },
    });
  }

  const columns = useMemo<ColumnDef<PayoutRequestResponse>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => fmtDate(row.original.createdAt),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <div className="text-right font-medium">{formatCurrency(row.original.amount)}</div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={payoutStatusVariant(row.original.status)}>
            {payoutStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: 'adminNote',
        header: 'Admin Note',
        cell: ({ row }) => row.original.adminNote ?? '—',
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader>
          <PageTitle>Payouts</PageTitle>
        </PageHeader>
        <Button onClick={() => setDialogOpen(true)}>
          <ArrowDownToLine className="h-4 w-4" />
          Request Withdrawal
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination({ pageIndex: 0, pageSize: PAGE_SIZE });
          }}
          className="w-[200px]"
        >
          <option value="">All Statuses</option>
          {Object.values(PayoutRequestStatus).map((s) => (
            <option key={s} value={s}>
              {payoutStatusLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      {/* Request history */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Payout Requests</h2>
        {requestsQ.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : requestsQ.data && requestsQ.data.requests.length > 0 ? (
          <DataTable
            columns={columns}
            data={requestsQ.data.requests}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            onRowClick={(row) => setSelectedPayout(row)}
          />
        ) : (
          <EmptyState
            title="No payout requests yet"
            description="Request your first withdrawal to see payout history here."
            icon={<Wallet />}
            action={
              <Button onClick={() => setDialogOpen(true)}>
                <ArrowDownToLine className="h-4 w-4" />
                Request Withdrawal
              </Button>
            }
          />
        )}
      </Card>

      <PayoutQuickView
        payout={selectedPayout}
        open={!!selectedPayout}
        onOpenChange={(open) => { if (!open) setSelectedPayout(null); }}
      />

      <WithdrawalDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        availableBalance={available}
        bankVerified={true}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
