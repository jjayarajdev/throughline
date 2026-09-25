import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type ColumnDef, type PaginationState } from '@tanstack/react-table';
import { useAdminUsers, useUpdateUserStatus } from '@/features/admin/hooks';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

const ROLES = ['', 'admin', 'recruiter', 'company'] as const;
const STATUSES = ['', 'active', 'inactive', 'blocked', 'pending_verification'] as const;

type AdminUser = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  recruiterProfile?: { fullName: string } | null;
  companyProfile?: { companyName: string } | null;
};

function getStatusBadgeVariant(status: string): 'success' | 'secondary' | 'destructive' | 'warning' {
  switch (status) {
    case 'active':
      return 'success';
    case 'blocked':
      return 'destructive';
    case 'pending_verification':
      return 'warning';
    case 'inactive':
    default:
      return 'secondary';
  }
}

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const filters = {
    ...(search ? { search } : {}),
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  };

  const { data, isLoading } = useAdminUsers(filters);
  const updateStatus = useUpdateUserStatus();

  const handleStatusChange = (userId: string, newStatus: string) => {
    updateStatus.mutate({ userId, status: newStatus });
  };

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
        cell: ({ row }) => (
          <Link to={`/a/users/${row.original.id}`} className="font-medium hover:underline">
            {row.getValue('email')}
          </Link>
        ),
      },
      {
        id: 'name',
        accessorFn: (row) =>
          row.recruiterProfile?.fullName ?? row.companyProfile?.companyName ?? '--',
        header: 'Name / Company',
        cell: ({ row }) => <span>{row.getValue('name')}</span>,
      },
      {
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
        cell: ({ row }) => <span className="capitalize">{row.getValue('role')}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const s = row.getValue('status') as string;
          return (
            <Badge variant={getStatusBadgeVariant(s)}>
              {s.replace(/_/g, ' ')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.getValue('createdAt')).toLocaleDateString('en-IN')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const user = row.original;
          return user.role !== 'admin' ? (
            <Select
              value={user.status}
              onChange={(e) => handleStatusChange(user.id, e.target.value)}
              disabled={updateStatus.isPending}
              className="h-8 text-xs"
            >
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="inactive">Inactive</option>
            </Select>
          ) : null;
        },
      },
    ],
    [updateStatus.isPending],
  );

  const tableData = useMemo(() => data?.users ?? [], [data?.users]);
  const pageCount = data ? Math.ceil(data.total / pagination.pageSize) : 0;

  const toolbar = (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        />
      </div>
      <Select
        value={role}
        onChange={(e) => {
          setRole(e.target.value);
          setPagination((p) => ({ ...p, pageIndex: 0 }));
        }}
      >
        <option value="">All roles</option>
        {ROLES.filter(Boolean).map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </Select>
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
            {s.replace(/_/g, ' ')}
          </option>
        ))}
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>

      <DataTable
        columns={columns}
        data={tableData}
        pageCount={pageCount}
        rowCount={data?.total}
        pagination={pagination}
        onPaginationChange={setPagination}
        loading={isLoading}
        toolbar={toolbar}
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filters."
      />
    </div>
  );
}
