import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { TrendingDown, TrendingUp, DollarSign, Users, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { SavingsResponse, SavingsRoleBreakdown } from '@gigcruite/types';
import { apiGet } from '@/lib/api-client';
import { DataTable } from '@/components/data-table';
import { StatCardV2 } from '@/components/custom';
import { Skeleton } from '@/components/ui/skeleton';

function useSavings() {
  return useQuery<SavingsResponse>({
    queryKey: ['company', 'savings'],
    queryFn: () => apiGet<SavingsResponse>('/companies/savings'),
    staleTime: 60_000,
  });
}

function fmt(value: string, symbol?: string | null): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const prefix = symbol ?? '₹';
  return `${prefix}${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function CompanySavings() {
  const { data, isPending } = useSavings();

  const columns = useMemo<ColumnDef<SavingsRoleBreakdown>[]>(
    () => [
      { accessorKey: 'roleTitle', header: 'Role' },
      { accessorKey: 'hires', header: 'Hires' },
      {
        accessorKey: 'totalCtc',
        header: 'Total CTC',
        cell: ({ row }) => fmt(row.original.totalCtc, data?.currencySymbol),
      },
      {
        accessorKey: 'traditionalCost',
        header: 'Vendor Cost',
        cell: ({ row }) => (
          <span title={`Benchmark: ${row.original.vendorBenchmarkPct}%`}>
            {fmt(row.original.traditionalCost, data?.currencySymbol)}{' '}
            <span className="text-xs text-muted-foreground">({row.original.vendorBenchmarkPct}%)</span>
          </span>
        ),
      },
      {
        accessorKey: 'actualCost',
        header: 'Platform Cost',
        cell: ({ row }) => fmt(row.original.actualCost, data?.currencySymbol),
      },
      {
        accessorKey: 'saved',
        header: 'Saved',
        cell: ({ row }) => {
          const n = Number(row.original.saved);
          return (
            <span className={`font-medium ${n < 0 ? 'text-destructive' : 'text-success'}`}>
              {fmt(row.original.saved, data?.currencySymbol)}
            </span>
          );
        },
      },
    ],
    [data?.currencySymbol],
  );

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return null;
  const sym = data.currencySymbol;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hiring Savings</h1>
        <p className="text-sm text-muted-foreground">
          Compares your platform hiring cost against the industry-standard vendor fee
          ({data.vendorBenchmarkPct}% of CTC for your country), which is the typical charge
          from traditional staffing agencies.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardV2
          icon={<Users className="h-4 w-4" aria-hidden />}
          label="Total Hires"
          value={String(data.totalHires)}
        />
        <StatCardV2
          icon={<DollarSign className="h-4 w-4" aria-hidden />}
          label="Traditional Cost"
          value={fmt(data.traditionalCost, sym)}
          helper={`${data.vendorBenchmarkPct}% of total CTC`}
        />
        <StatCardV2
          icon={<TrendingDown className="h-4 w-4" aria-hidden />}
          label="Platform Cost"
          value={fmt(data.actualCost, sym)}
          helper="Actual amount paid on fastalent"
        />
        <StatCardV2
          icon={<TrendingUp className="h-4 w-4" aria-hidden />}
          label="Total Savings"
          value={fmt(data.savings, sym)}
          helper={
            Number(data.savings) < 0
              ? `${data.savingsPct}% — higher than vendor benchmark`
              : `${data.savingsPct}% saved`
          }
          variant="gradient"
        />
      </section>

      {/* Calculation breakdown */}
      <div className="rounded-md border bg-muted/20 px-4 py-4 text-sm space-y-2">
        <p className="font-semibold text-foreground">How vendor cost is calculated</p>
        <div className="grid gap-1 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Vendor Cost</span> = Total Accepted CTC of hired candidates
            {' '}x {data.vendorBenchmarkPct}% (industry benchmark for your country)
          </p>
          <p>
            = {fmt(data.totalAcceptedCtc, sym)} x {data.vendorBenchmarkPct}% = <span className="font-medium text-foreground">{fmt(data.traditionalCost, sym)}</span>
          </p>
          <p className="mt-1">
            <span className="font-medium text-foreground">Platform Cost</span> = Actual payouts made to recruiters through fastalent = <span className="font-medium text-foreground">{fmt(data.actualCost, sym)}</span>
          </p>
          <p>
            <span className="font-medium text-foreground">Your Savings</span> = {fmt(data.traditionalCost, sym)} − {fmt(data.actualCost, sym)} = <span className={`font-semibold ${Number(data.savings) < 0 ? 'text-destructive' : 'text-success'}`}>{fmt(data.savings, sym)}</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          The {data.vendorBenchmarkPct}% benchmark is set by your platform admin based on typical staffing agency fees in your country.
          This can be managed from Admin &gt; Country Configuration.
        </p>
      </div>

      {data.perRoleBreakdown.some((r) => Number(r.saved) < 0) && (
        <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            Negative savings on a role means the platform payout rate exceeded the{' '}
            {data.vendorBenchmarkPct}% vendor benchmark. This typically happens with
            premium headhunting roles where higher recruiter fees reflect the difficulty
            of the search.
          </span>
        </div>
      )}

      {data.perRoleBreakdown.length > 0 ? (
        <DataTable
          columns={columns}
          data={data.perRoleBreakdown}
          emptyTitle="No hiring data yet"
          emptyDescription="Savings will appear once hires are completed."
        />
      ) : (
        <div className="rounded-md border border-dashed bg-muted/30 px-4 py-12 text-center text-sm text-muted-foreground">
          No completed hires yet. Savings data will appear once candidates are hired through the platform.
        </div>
      )}
    </div>
  );
}
