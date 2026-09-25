import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, FileText, Search } from 'lucide-react';
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table';
import { SubmissionStatus, type SubmissionListItem } from '@gigcruite/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTable, DataTableColumnHeader } from '@/components/data-table';
import { SubmissionQuickView } from '@/components/slide-overs/SubmissionQuickView';
import { useMySubmissions } from '@/features/submission';
import { formatCurrency } from '@/lib/format-currency';

interface PostSubmitState {
  submittedId?: string;
  candidateName?: string;
  companyName?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function MySubmissions() {
  const location = useLocation();
  const state = (location.state ?? null) as PostSubmitState | null;
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | undefined>();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);

  // Table state (client-side)
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  const filters = useMemo(
    () => ({
      ...(statusFilter !== undefined ? { status: statusFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [statusFilter, debouncedSearch],
  );

  const query = useMySubmissions(filters);
  const submissions = useMemo(() => query.data?.items ?? [], [query.data]);

  const columns = useMemo<ColumnDef<SubmissionListItem>[]>(
    () => [
      {
        accessorKey: 'candidateName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Candidate" />
        ),
        cell: ({ row }) => (
          <button
            onClick={() => setQuickViewId(row.original.id)}
            className="font-medium text-left hover:text-primary hover:underline"
          >
            {row.original.candidateName}
          </button>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        filterFn: 'equals',
      },
      {
        id: 'role',
        accessorFn: (row) => row.role?.title ?? '—',
        header: 'Role',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">
              {row.original.role?.title ?? '—'}
            </p>
            {row.original.role?.companyName && (
              <p className="truncate text-xs text-muted-foreground">
                {row.original.role.companyName}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'expectedCtc',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Expected CTC" />
        ),
        cell: ({ row }) => formatCurrency(row.original.expectedCtc),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Submitted" />
        ),
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">My Submissions</h1>
        <p className="text-sm text-muted-foreground">
          Candidates you've submitted to open roles.
        </p>
      </header>

      {state?.submittedId ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-4"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-success"
            aria-hidden
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-success">
              Candidate submitted successfully!
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {state.candidateName ? (
                <>
                  <span className="font-medium">{state.candidateName}</span>{' '}
                </>
              ) : null}
              has been submitted
              {state.companyName ? (
                <>
                  {' '}to <span className="font-medium">{state.companyName}</span>
                </>
              ) : null}
              . We'll notify you when they review.
            </p>
          </div>
        </div>
      ) : null}

      {/* Toolbar with search + status filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search candidate, role, company..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            className="pl-9 h-9"
          />
        </div>
        <Select
          value={statusFilter ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setStatusFilter(val === '' ? undefined : (val as SubmissionStatus));
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="w-48"
        >
          <option value="">All</option>
          <option value={SubmissionStatus.SUBMITTED}>Submitted</option>
          <option value={SubmissionStatus.SHORTLISTED}>Shortlisted</option>
          <option value={SubmissionStatus.INTERVIEW}>Interview</option>
          <option value={SubmissionStatus.HIRED}>Hired</option>
          <option value={SubmissionStatus.JOINED}>Joined</option>
          <option value={SubmissionStatus.REJECTED}>Rejected</option>
          <option value={SubmissionStatus.WITHDRAWN}>Withdrawn</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={submissions}
        loading={query.isPending}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        emptyIcon={<FileText className="h-10 w-10 text-muted-foreground/40" />}
        emptyTitle="No submissions yet"
        emptyDescription="Your candidate submissions will appear here. Browse active roles to get started."
        emptyCta={
          <Button size="sm" asChild>
            <Link to="/r/roles" viewTransition>
              Browse Roles
            </Link>
          </Button>
        }
      />

      {/* Quick view slide-over */}
      <SubmissionQuickView
        submissionId={quickViewId}
        open={!!quickViewId}
        onOpenChange={(open) => !open && setQuickViewId(null)}
      />
    </div>
  );
}
