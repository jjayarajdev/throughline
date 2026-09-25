import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Briefcase,
  FileText,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  SquarePen,
  XCircle,
} from 'lucide-react';
import {
  PayoutMode,
  RoleStatus,
  type ListOwnerRolesFilters,
  type RoleOwnerResponse,
} from '@gigcruite/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/sonner';
import { extractErrorMessage } from '@/lib/error';
import { formatCurrency } from '@/lib/format-currency';
import {
  useCloseRole,
  useMyRoles,
  usePauseRole,
  usePublishRole,
  useResumeRole,
} from '@/features/role/hooks';
import { DataTable } from '@/components/data-table';
import { RoleQuickView } from '@/components/slide-overs/RoleQuickView';

/**
 * RolesList — company-side roster of every role the company owns, across
 * all lifecycle statuses. Filter tabs + quick status actions + per-role
 * stat cards so the owner can triage at a glance.
 */

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type FilterKey = 'all' | RoleStatus;

const FILTER_TABS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: RoleStatus.DRAFT, label: 'Draft' },
  { key: RoleStatus.SUBMITTED, label: 'Submitted' },
  { key: RoleStatus.PUBLISHED, label: 'Published' },
  { key: RoleStatus.PAUSED, label: 'Paused' },
  { key: RoleStatus.CLOSED, label: 'Closed' },
  { key: RoleStatus.FILLED, label: 'Filled' },
];

function statusBadgeVariant(
  status: RoleStatus,
): 'default' | 'secondary' | 'success' | 'warning' | 'outline' | 'destructive' {
  switch (status) {
    case RoleStatus.DRAFT:
      return 'secondary';
    case RoleStatus.SUBMITTED:
      return 'warning';
    case RoleStatus.PUBLISHED:
      return 'success';
    case RoleStatus.REJECTED:
      return 'destructive';
    case RoleStatus.PAUSED:
      return 'warning';
    case RoleStatus.CLOSED:
      return 'outline';
    case RoleStatus.FILLED:
      return 'default';
    default:
      return 'secondary';
  }
}

function formatPayout(role: RoleOwnerResponse): string {
  const cur = role.currency ?? 'INR';
  const parts: string[] = [];
  if (role.shortlistPayoutValue) {
    parts.push(
      role.shortlistPayoutMode === PayoutMode.PERCENTAGE
        ? `${role.shortlistPayoutValue}% of CTC/shortlist`
        : `${formatCurrency(role.shortlistPayoutValue, cur)}/shortlist`,
    );
  }
  if (role.hirePayoutValue) {
    parts.push(
      role.hirePayoutMode === PayoutMode.PERCENTAGE
        ? `${role.hirePayoutValue}% of CTC/hire`
        : `${formatCurrency(role.hirePayoutValue, cur)}/hire`,
    );
  }
  return parts.length > 0 ? parts.join(' + ') : '—';
}

export default function RolesList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [quickViewRoleId, setQuickViewRoleId] = useState<string | null>(null);

  const filters: ListOwnerRolesFilters = useMemo(
    () => ({
      ...(filter === 'all' ? {} : { status: filter }),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [filter, debouncedSearch],
  );

  const query = useMyRoles(filters);
  const publish = usePublishRole();
  const pause = usePauseRole();
  const resume = useResumeRole();
  const close = useCloseRole();

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const statusActionRunning =
    publish.isPending || pause.isPending || resume.isPending || close.isPending;

  const runStatusAction = (
    action: typeof publish | typeof pause | typeof resume | typeof close,
    id: string,
    successMessage: string,
    failureMessage: string,
    confirmPrompt?: string,
  ) => {
    if (confirmPrompt && !window.confirm(confirmPrompt)) return;
    action.mutate(id, {
      onSuccess: () => toast.success(successMessage),
      onError: (err) => toast.error(extractErrorMessage(err, failureMessage)),
    });
  };

  const columns = useMemo<ColumnDef<RoleOwnerResponse>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 text-left font-semibold hover:underline"
            onClick={() => setQuickViewRoleId(row.original.id)}
          >
            {row.getValue('title')}
            {row.original.jdOriginalFilename && (
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="JD attached" />
            )}
          </button>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={statusBadgeVariant(row.getValue('status'))}>
            {row.getValue('status')}
          </Badge>
        ),
      },
      {
        accessorKey: 'roleType',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {(row.getValue('roleType') as string).replace(/_/g, ' ')}
          </Badge>
        ),
      },
      {
        id: 'location',
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => {
          const role = row.original;
          return (
            <span className="text-sm">
              {role.location}
              {role.isRemote ? ' · Remote' : ''}
            </span>
          );
        },
      },
      {
        id: 'ctc',
        header: 'CTC',
        cell: ({ row }) => {
          const role = row.original;
          return (
            <span className="text-sm text-muted-foreground">
              {formatCurrency(role.ctcMin, role.currency)} – {formatCurrency(role.ctcMax, role.currency)}
            </span>
          );
        },
      },
      {
        id: 'payout',
        header: 'Payout',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatPayout(row.original)}</span>
        ),
      },
      {
        id: 'stats',
        header: 'Stats',
        cell: ({ row }) => {
          const role = row.original;
          return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {role.submissionsCount}
                {role.maxSubmissions !== undefined && role.maxSubmissions !== null
                  ? `/${role.maxSubmissions}`
                  : ''}
                {' '}subs
              </span>
              <span>·</span>
              <span>{role.shortlistedCount} short</span>
              <span>·</span>
              <span>{role.hiredCount}/{role.openPositions} hired</span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const role = row.original;
          const canPublish = role.status === RoleStatus.DRAFT;
          const canPause = role.status === RoleStatus.PUBLISHED;
          const canResume = role.status === RoleStatus.PAUSED;
          const canEdit =
            role.status === RoleStatus.DRAFT || role.status === RoleStatus.PAUSED;
          const canClose =
            role.status === RoleStatus.PUBLISHED || role.status === RoleStatus.PAUSED;
          const isTerminal =
            role.status === RoleStatus.FILLED || role.status === RoleStatus.CLOSED;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Role actions"
                  disabled={statusActionRunning || isTerminal}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {canEdit ? (
                  <DropdownMenuItem onSelect={() => navigate(`/c/roles/${role.id}/edit`)}>
                    <SquarePen className="h-4 w-4" aria-hidden />
                    Edit
                  </DropdownMenuItem>
                ) : null}
                {canPublish ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      runStatusAction(
                        publish,
                        role.id,
                        'Role published',
                        'Could not publish role',
                      )
                    }
                  >
                    <Send className="h-4 w-4" aria-hidden />
                    Publish
                  </DropdownMenuItem>
                ) : null}
                {canPause ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      runStatusAction(pause, role.id, 'Role paused', 'Could not pause role')
                    }
                  >
                    <Pause className="h-4 w-4" aria-hidden />
                    Pause
                  </DropdownMenuItem>
                ) : null}
                {canResume ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      runStatusAction(resume, role.id, 'Role resumed', 'Could not resume role')
                    }
                  >
                    <Play className="h-4 w-4" aria-hidden />
                    Resume
                  </DropdownMenuItem>
                ) : null}
                {canClose ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() =>
                        runStatusAction(
                          close,
                          role.id,
                          'Role closed',
                          'Could not close role',
                          'Close this role? Existing submissions will continue through their lifecycle, but no new submissions will be accepted.',
                        )
                      }
                      className="text-destructive focus:text-destructive"
                    >
                      <XCircle className="h-4 w-4" aria-hidden />
                      Close role
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [navigate, statusActionRunning, publish, pause, resume, close],
  );

  const tableData = useMemo(() => items, [items]);

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 pb-3">
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search title or description..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
      {FILTER_TABS.map((tab) => {
        const active = filter === tab.key;
        return (
          <Button
            key={tab.key}
            variant={active ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </Button>
        );
      })}
      <span className="ml-auto text-xs text-muted-foreground">
        {query.isPending ? 'Loading…' : `${total} total`}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Post roles, publish them to recruiters, and track the pipeline.
          </p>
        </div>
        <Button asChild>
          <Link to="/c/roles/new" viewTransition>
            <Plus className="h-4 w-4" aria-hidden />
            New role
          </Link>
        </Button>
      </header>

      <DataTable
        columns={columns}
        data={tableData}
        loading={query.isPending}
        toolbar={toolbar}
        emptyIcon={<Briefcase className="h-8 w-8 text-muted-foreground" />}
        emptyTitle={
          filter === 'all' ? 'No roles yet' : `No roles in ${filter} status`
        }
        emptyDescription={
          filter === 'all'
            ? 'Post your first role to start receiving candidate submissions.'
            : 'Try a different filter or post a new role.'
        }
        emptyCta={
          <Button asChild>
            <Link to="/c/roles/new" viewTransition>
              <Plus className="h-4 w-4" aria-hidden />
              New role
            </Link>
          </Button>
        }
      />

      <RoleQuickView
        roleId={quickViewRoleId}
        open={!!quickViewRoleId}
        onOpenChange={(open) => !open && setQuickViewRoleId(null)}
      />
    </div>
  );
}
