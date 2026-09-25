import { useState, useMemo } from 'react';
import { CheckCircle, XCircle, Play, Banknote } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useAdminPayoutRequests,
  useApprovePayoutRequest,
  useRejectPayoutRequest,
  useRunPayoutBatch,
  usePayoutBatches,
} from '@/features/admin/hooks';
import { PageHeader, PageTitle, PageActions } from '@/components/custom/PageHeader';
import { DataTable } from '@/components/data-table/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatCurrency } from '@/lib/format-currency';

type PayoutRequest = {
  id: string;
  recruiterId: string;
  amount: string;
  status: string;
  createdAt: string;
};

export default function AdminPayouts() {
  const [statusFilter, setStatusFilter] = useState<string>('pending_approval');
  const [page, setPage] = useState(1);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useAdminPayoutRequests({ status: statusFilter || undefined, page, pageSize: 20 });
  const { data: batches } = usePayoutBatches({ page: 1, pageSize: 5 });
  const approve = useApprovePayoutRequest();
  const reject = useRejectPayoutRequest();
  const runBatch = useRunPayoutBatch();

  const columns = useMemo<ColumnDef<PayoutRequest>[]>(
    () => [
      {
        accessorKey: 'recruiterId',
        header: 'Recruiter',
        cell: ({ row }) => (
          <span className="truncate font-mono text-xs">{row.original.recruiterId.slice(0, 8)}</span>
        ),
      },
      {
        accessorKey: 'amount',
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">{formatCurrency(row.original.amount)}</div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const variant =
            status === 'pending_approval' ? 'warning' :
            status === 'approved' ? 'success' :
            status === 'cancelled' ? 'destructive' :
            'secondary';
          return <Badge variant={variant}>{status}</Badge>;
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString('en-IN')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          if (row.original.status !== 'pending_approval') return null;
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => approve.mutate(row.original.id)}
                disabled={approve.isPending}
              >
                <CheckCircle className="h-3 w-3" /> Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setRejectId(row.original.id)}
              >
                <XCircle className="h-3 w-3" /> Reject
              </Button>
            </div>
          );
        },
      },
    ],
    [approve]
  );

  function handleRejectSubmit() {
    if (!rejectId || !rejectReason.trim()) return;
    reject.mutate({ id: rejectId, reason: rejectReason });
    setRejectId(null);
    setRejectReason('');
  }

  function handleRejectClose(open: boolean) {
    if (!open) {
      setRejectId(null);
      setRejectReason('');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader>
        <PageTitle>Payout Management</PageTitle>
        <PageActions>
          <Button onClick={() => runBatch.mutate()} disabled={runBatch.isPending}>
            <Play className="h-4 w-4" />
            {runBatch.isPending ? 'Running...' : 'Run batch'}
          </Button>
        </PageActions>
      </PageHeader>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Label htmlFor="status-filter" className="text-sm">Status:</Label>
        <Select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="pending_approval">Pending</option>
          <option value="approved">Approved</option>
          <option value="cancelled">Rejected</option>
          <option value="completed">Processed</option>
          <option value="">All</option>
        </Select>
      </div>

      {/* Requests table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : data?.requests.length ? (
        <DataTable
          columns={columns}
          data={data.requests}
          pageCount={Math.ceil(data.total / 20)}
          pagination={{
            pageIndex: page - 1,
            pageSize: 20,
          }}
          onPaginationChange={(updater) => {
            const newState = typeof updater === 'function'
              ? updater({ pageIndex: page - 1, pageSize: 20 })
              : updater;
            setPage(newState.pageIndex + 1);
          }}
        />
      ) : (
        <EmptyState title="No payout requests found" icon={<Banknote />} />
      )}

      {/* Reject modal */}
      <Dialog open={!!rejectId} onOpenChange={handleRejectClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject payout request</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => handleRejectClose(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch history */}
      {batches?.batches.length ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Recent batches</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.id.slice(0, 8)}</TableCell>
                    <TableCell>{b.requestCount}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(b.totalAmount)}</TableCell>
                    <TableCell>{b.status}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(b.createdAt).toLocaleDateString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
