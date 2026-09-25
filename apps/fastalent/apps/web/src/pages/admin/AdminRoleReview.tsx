import { useMemo, useState } from 'react';
import { type ColumnDef, type PaginationState } from '@tanstack/react-table';
import { Check, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminRoles, useApproveRole, useRejectRole } from '@/features/admin/hooks';
import { DataTable, DataTableColumnHeader } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { extractErrorMessage } from '@/lib/error';

type ReviewRole = {
  id: string;
  title: string;
  status: string;
  roleType: string;
  location: string;
  ctcMin: string;
  ctcMax: string;
  submissionsCount: number;
  createdAt: string;
  company: { companyName: string };
};

export default function AdminRoleReview() {
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; roleId: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    roleId: string;
    title: string;
    companyName: string;
    ctcMin: string;
    ctcMax: string;
    roleType: string;
  } | null>(null);
  const [commissionOverride, setCommissionOverride] = useState('');

  const approve = useApproveRole();
  const reject = useRejectRole();

  const filters = {
    status: 'submitted',
    ...(search ? { search } : {}),
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  };
  const { data, isLoading } = useAdminRoles(filters);

  const handleApprove = () => {
    if (!approveDialog) return;
    const pct = commissionOverride.trim() === '' ? undefined : Number(commissionOverride);
    if (pct !== undefined && (isNaN(pct) || pct < 0 || pct > 100)) {
      toast.error('Commission must be 0-100 or leave blank');
      return;
    }
    approve.mutate(
      { roleId: approveDialog.roleId, platformCommissionPct: pct },
      {
        onSuccess: () => {
          toast.success('Role approved and published');
          setApproveDialog(null);
          setCommissionOverride('');
        },
        onError: (err) => toast.error(extractErrorMessage(err, 'Could not approve role')),
      },
    );
  };

  const handleReject = () => {
    if (!rejectDialog || !rejectReason.trim()) return;
    reject.mutate(
      { roleId: rejectDialog.roleId, reason: rejectReason.trim() },
      {
        onSuccess: () => {
          toast.success('Role rejected');
          setRejectDialog(null);
          setRejectReason('');
        },
        onError: (err) => toast.error(extractErrorMessage(err, 'Could not reject role')),
      },
    );
  };

  const columns = useMemo<ColumnDef<ReviewRole>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
        cell: ({ row }) => (
          <Link to={`/a/roles/${row.original.id}`} className="font-medium hover:underline">
            {row.getValue('title')}
          </Link>
        ),
      },
      {
        accessorKey: 'company.companyName',
        header: 'Company',
        cell: ({ row }) => <span>{row.original.company.companyName}</span>,
      },
      {
        accessorKey: 'roleType',
        header: 'Type',
        cell: ({ row }) => (
          <span className="capitalize">{(row.getValue('roleType') as string).replace(/_/g, ' ')}</span>
        ),
      },
      {
        id: 'ctcRange',
        header: 'CTC Range',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {Number(row.original.ctcMin).toLocaleString('en-IN')} - {Number(row.original.ctcMax).toLocaleString('en-IN')}
          </span>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.getValue('createdAt')).toLocaleDateString('en-IN')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={approve.isPending || reject.isPending}
              onClick={() =>
                setApproveDialog({
                  open: true,
                  roleId: row.original.id,
                  title: row.original.title,
                  companyName: row.original.company.companyName,
                  ctcMin: row.original.ctcMin,
                  ctcMax: row.original.ctcMax,
                  roleType: row.original.roleType,
                })
              }
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={approve.isPending || reject.isPending}
              onClick={() =>
                setRejectDialog({ open: true, roleId: row.original.id, title: row.original.title })
              }
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Reject
            </Button>
          </div>
        ),
      },
    ],
    [approve.isPending, reject.isPending],
  );

  const tableData = useMemo(() => data?.roles ?? [], [data?.roles]);
  const pageCount = data ? Math.ceil(data.total / pagination.pageSize) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Role Review Queue</h1>
        <p className="text-sm text-muted-foreground">Approve or reject submitted roles before they go live.</p>
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        pageCount={pageCount}
        rowCount={data?.total}
        pagination={pagination}
        onPaginationChange={setPagination}
        loading={isLoading}
        toolbar={
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
        }
        emptyTitle="No roles pending review"
        emptyDescription="All submitted roles have been reviewed."
      />

      {/* Approve dialog */}
      {approveDialog ? (
        <Dialog open={approveDialog.open} onOpenChange={() => { setApproveDialog(null); setCommissionOverride(''); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Role</DialogTitle>
              <DialogDescription>
                Approving &ldquo;{approveDialog.title}&rdquo; for {approveDialog.companyName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize font-medium">{approveDialog.roleType.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CTC Range</span>
                <span className="font-medium">
                  {Number(approveDialog.ctcMin).toLocaleString('en-IN')} - {Number(approveDialog.ctcMax).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="approve-commission">Commission Override %</Label>
                <Input
                  id="approve-commission"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={commissionOverride}
                  onChange={(e) => setCommissionOverride(e.target.value)}
                  placeholder="Leave blank for company/global default"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use company default or global (20%).
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setApproveDialog(null); setCommissionOverride(''); }}>
                Cancel
              </Button>
              <Button disabled={approve.isPending} onClick={handleApprove}>
                {approve.isPending ? 'Approving...' : 'Approve & Publish'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* Reject dialog */}
      {rejectDialog ? (
        <Dialog open={rejectDialog.open} onOpenChange={() => setRejectDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Role</DialogTitle>
              <DialogDescription>
                Rejecting &ldquo;{rejectDialog.title}&rdquo;. The company will see this feedback.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!rejectReason.trim() || reject.isPending}
                onClick={handleReject}
              >
                {reject.isPending ? 'Rejecting...' : 'Reject Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
