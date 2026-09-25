import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Loader2, MapPin, Search } from 'lucide-react';
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table';
import { RoleStatus, RoleType, type ListPublicRolesFilters } from '@gigcruite/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable, DataTableColumnHeader } from '@/components/data-table';
import { useBrowseRoles } from '@/features/role';
import { formatCurrency } from '@/lib/format-currency';

interface RoleRow {
  id: string;
  title: string;
  company: { companyName: string; industry: string | null };
  location: string;
  isRemote: boolean;
  roleType: RoleType;
  ctcMin: string;
  ctcMax: string;
  shortlistPayoutValue: string | null;
  hirePayoutValue: string | null;
  skills: string[];
  slotsRemaining: number;
  status: RoleStatus;
  employmentType: string;
  currency?: string;
  jdOriginalFilename?: string | null;
}

function formatPayout(
  shortlistPayoutValue: string | null,
  hirePayoutValue: string | null,
  currency?: string,
): string {
  const parts: string[] = [];
  if (shortlistPayoutValue) parts.push(`${formatCurrency(shortlistPayoutValue, currency)}/shortlist`);
  if (hirePayoutValue) parts.push(`${formatCurrency(hirePayoutValue, currency)}/hire`);
  return parts.length > 0 ? parts.join(' + ') : '—';
}

export default function BrowseRoles() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleType, setRoleType] = useState<RoleType | undefined>();
  const [statusFilter, setStatusFilter] = useState<RoleStatus | undefined>();
  const [isRemote, setIsRemote] = useState<boolean | undefined>();

  // Table state (client-side)
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filters = useMemo<Omit<ListPublicRolesFilters, 'cursor'>>(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(roleType !== undefined ? { roleType } : {}),
      ...(statusFilter !== undefined ? { status: statusFilter } : {}),
      ...(isRemote !== undefined ? { isRemote } : {}),
    }),
    [debouncedSearch, roleType, statusFilter, isRemote],
  );

  const query = useBrowseRoles(filters);

  // Flatten infinite query pages into a single array for DataTable client-side pagination
  const allRoles = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  const columns = useMemo<ColumnDef<RoleRow>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Role Title" />
        ),
        cell: ({ row }) => (
          <Link
            to={`/r/roles/${row.original.id}`}
            viewTransition
            className="inline-flex items-center gap-1.5 font-medium hover:text-primary hover:underline"
          >
            {row.original.title}
            {row.original.jdOriginalFilename && (
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="JD attached" />
            )}
          </Link>
        ),
      },
      {
        id: 'company',
        accessorFn: (row) => row.company.companyName,
        header: 'Company',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm">{row.original.company.companyName}</p>
            {row.original.company.industry && (
              <p className="truncate text-xs text-muted-foreground">
                {row.original.company.industry}
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'location',
        accessorFn: (row) => row.location,
        header: 'Location',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3 text-muted-foreground" aria-hidden />
            <span className="truncate">{row.original.location}</span>
            {row.original.isRemote && (
              <Badge variant="secondary" className="ml-1 text-[10px]">
                Remote
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'roleType',
        header: 'Type',
        cell: ({ row }) => {
          const isHeadhunting = row.original.roleType === RoleType.HEADHUNTING;
          return (
            <Badge variant={isHeadhunting ? 'warning' : 'secondary'}>
              {isHeadhunting ? 'Headhunting' : 'Regular'}
            </Badge>
          );
        },
      },
      {
        id: 'ctc',
        accessorFn: (row) => Number(row.ctcMin),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="CTC Range" />
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            {formatCurrency(row.original.ctcMin, row.original.currency)} – {formatCurrency(row.original.ctcMax, row.original.currency)}
          </div>
        ),
      },
      {
        id: 'payout',
        accessorFn: (row) =>
          Number(row.shortlistPayoutValue ?? 0) + Number(row.hirePayoutValue ?? 0),
        header: 'Payout',
        cell: ({ row }) => (
          <div className="text-sm">
            {formatPayout(row.original.shortlistPayoutValue, row.original.hirePayoutValue, row.original.currency)}
          </div>
        ),
      },
      {
        id: 'skills',
        accessorFn: (row) => row.skills.join(', '),
        header: 'Skills',
        cell: ({ row }) => {
          const skills = row.original.skills;
          if (skills.length === 0) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 3).map((s) => (
                <Badge key={s} variant="secondary" className="text-[10px]">
                  {s}
                </Badge>
              ))}
              {skills.length > 3 && (
                <Badge variant="outline" className="text-[10px]">
                  +{skills.length - 3}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'slotsRemaining',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Slots" />
        ),
        cell: ({ row }) => {
          const slots = row.original.slotsRemaining;
          if (row.original.status === RoleStatus.FILLED) {
            return <Badge variant="secondary">Filled</Badge>;
          }
          return (
            <div className="text-sm">
              {slots} slot{slots !== 1 ? 's' : ''}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const isFilled = row.original.status === RoleStatus.FILLED;
          return (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/r/roles/${row.original.id}`} viewTransition>
                  Details
                </Link>
              </Button>
              {isFilled ? (
                <Button size="sm" disabled>
                  Filled
                </Button>
              ) : (
                <Button
                  size="sm"
                  asChild
                  disabled={row.original.slotsRemaining === 0}
                >
                  <Link to={`/r/roles/${row.original.id}/submit`} viewTransition>
                    Submit
                  </Link>
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Browse Roles</h1>
        <p className="text-sm text-muted-foreground">
          Roles open for candidate submissions.
        </p>
      </header>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roles..."
          className="pl-9"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Type
          </span>
          <Select
            value={roleType ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setRoleType(val === '' ? undefined : (val as RoleType));
            }}
            className="w-40"
          >
            <option value="">All</option>
            <option value={RoleType.REGULAR}>Regular</option>
            <option value={RoleType.HEADHUNTING}>Headhunting</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </span>
          <Select
            value={statusFilter ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setStatusFilter(val === '' ? undefined : (val as RoleStatus));
            }}
            className="w-32"
          >
            <option value="">All</option>
            <option value={RoleStatus.PUBLISHED}>Published</option>
            <option value={RoleStatus.FILLED}>Filled</option>
          </Select>
        </div>

        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={isRemote === true}
            onChange={(e) => setIsRemote(e.target.checked ? true : undefined)}
            className="h-4 w-4 rounded border-border"
          />
          Remote only
        </label>
      </div>

      <DataTable
        columns={columns}
        data={allRoles}
        loading={query.isPending}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        emptyIcon={<Search className="h-10 w-10 text-muted-foreground/40" />}
        emptyTitle="No active roles match your filters"
        emptyDescription="Try adjusting your search or filters to find open roles."
      />

      {/* Load more button (if there are more pages) */}
      {query.hasNextPage && !query.isPending && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load more roles'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
