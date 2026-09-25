import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type ColumnDef, type PaginationState } from '@tanstack/react-table';
import { useAdminRoles } from '@/features/admin/hooks';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

const STATUSES = ['', 'draft', 'submitted', 'published', 'rejected', 'paused', 'closed', 'filled'] as const;

type AdminRole = {
  id: string;
  title: string;
  status: string;
  roleType: string;
  ctcMin: string;
  ctcMax: string;
  submissionsCount: number;
  hiredCount: number;
  createdAt: string;
  company: {
    companyName: string;
  };
};

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'draft':
      return 'secondary';
    case 'submitted':
      return 'warning';
    case 'published':
      return 'success';
    case 'rejected':
      return 'destructive';
    case 'paused':
      return 'warning';
    case 'closed':
      return 'destructive';
    case 'filled':
      return 'default';
    default:
      return 'secondary';
  }
}

export default function AdminRoles() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const filters = {
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  };

  const { data, isLoading } = useAdminRoles(filters);

  const columns = useMemo<ColumnDef<AdminRole>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
        cell: ({ row }) => (
          <Link
            to={`/a/roles/${row.original.id}`}
            className="text-left font-semibold hover:underline"
          >
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
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const s = row.getValue('status') as string;
          return <Badge variant={getStatusBadgeVariant(s)}>{s}</Badge>;
        },
      },
      {
        id: 'ctcRange',
        header: 'CTC Range',
        cell: ({ row }) => {
          const role = row.original;
          return (
            <span className="text-muted-foreground">
              {Number(role.ctcMin).toLocaleString('en-IN')} - {Number(role.ctcMax).toLocaleString('en-IN')}
            </span>
          );
        },
      },
      {
        accessorKey: 'submissionsCount',
        header: 'Subs',
      },
      {
        accessorKey: 'hiredCount',
        header: 'Hired',
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.getValue('createdAt')).toLocaleDateString('en-IN')}
          </span>
        ),
      },
    ],
    [],
  );

  const tableData = useMemo(() => data?.roles ?? [], [data?.roles]);
  const pageCount = data ? Math.ceil(data.total / pagination.pageSize) : 0;

  const toolbar = (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
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
      <Select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPagination((p) => ({ ...p, pageIndex: 0 }));
        }}
      >
        <option value="">All statuses</option>
        {STATUSES.filter(Boolean).map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">All Roles</h1>

      <DataTable
        columns={columns}
        data={tableData}
        pageCount={pageCount}
        rowCount={data?.total}
        pagination={pagination}
        onPaginationChange={setPagination}
        loading={isLoading}
        toolbar={toolbar}
        emptyTitle="No roles found"
        emptyDescription="Try adjusting your search or filters."
      />

    </div>
  );
}
