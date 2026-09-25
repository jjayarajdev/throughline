import { useEffect, useMemo, useState } from 'react';
import { type ColumnDef, type PaginationState } from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { useAdminEarnings } from '@/features/admin/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatCurrency } from '@/lib/format-currency';

const STATUSES = ['', 'pending', 'payable', 'processing', 'paid', 'cancelled'] as const;

type AdminEarning = {
  id: string;
  grossAmount: string;
  platformCommission: string;
  platformCommissionPct: string;
  netAmount: string;
  status: string;
  earningType: string;
  createdAt: string;
  recruiter: {
    fullName: string;
  };
  role: {
    title: string;
    company: {
      companyName: string;
    };
  };
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'destructive' | 'default' {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'payable':
    case 'paid':
      return 'success';
    case 'cancelled':
      return 'destructive';
    case 'processing':
    default:
      return 'default';
  }
}

export default function AdminEarnings() {
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const filters = {
    ...(status ? { status } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  };

  const { data, isLoading } = useAdminEarnings(filters);

  const columns = useMemo<ColumnDef<AdminEarning>[]>(
    () => [
      {
        accessorKey: 'recruiter.fullName',
        header: 'Recruiter',
        cell: ({ row }) => <span>{row.original.recruiter.fullName}</span>,
      },
      {
        accessorKey: 'role.title',
        header: 'Role',
        cell: ({ row }) => <span className="font-medium">{row.original.role.title}</span>,
      },
      {
        accessorKey: 'role.company.companyName',
        header: 'Company',
        cell: ({ row }) => <span>{row.original.role.company.companyName}</span>,
      },
      {
        accessorKey: 'earningType',
        header: 'Type',
        cell: ({ row }) => (
          <span className="capitalize text-xs">
            {(row.getValue('earningType') as string).replace(/_/g, ' ')}
          </span>
        ),
      },
      {
        accessorKey: 'grossAmount',
        header: 'Gross',
        cell: ({ row }) => <span>{formatCurrency(row.getValue('grossAmount'))}</span>,
      },
      {
        id: 'commission',
        header: 'Commission',
        cell: ({ row }) => {
          const e = row.original;
          return (
            <span>
              {formatCurrency(e.platformCommission)} ({e.platformCommissionPct}%)
            </span>
          );
        },
      },
      {
        accessorKey: 'netAmount',
        header: 'Net',
        cell: ({ row }) => <span>{formatCurrency(row.getValue('netAmount'))}</span>,
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
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.getValue('createdAt')).toLocaleDateString('en-IN')}
          </span>
        ),
      },
    ],
    [],
  );

  const tableData = useMemo(() => data?.earnings ?? [], [data?.earnings]);
  const pageCount = data ? Math.ceil(data.total / pagination.pageSize) : 0;

  const toolbar = (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search recruiter, role, company..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="pl-9 h-9"
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
      <h1 className="text-2xl font-semibold tracking-tight">Platform Earnings</h1>

      {data?.totals && (
        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gross earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.totals.grossAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platform commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.totals.platformCommission)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net to recruiters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.totals.netAmount)}</div>
            </CardContent>
          </Card>
        </section>
      )}

      <DataTable
        columns={columns}
        data={tableData}
        pageCount={pageCount}
        rowCount={data?.total}
        pagination={pagination}
        onPaginationChange={setPagination}
        loading={isLoading}
        toolbar={toolbar}
        emptyTitle="No earnings found"
        emptyDescription="Try adjusting your filters."
      />
    </div>
  );
}
