import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import type { CountryConfigResponse } from '@gigcruite/types';
import { useCountryConfigs, useCreateCountryConfig, useUpdateCountryConfig } from '@/features/admin/hooks';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { extractErrorMessage } from '@/lib/error';

type FormState = {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  shortlistFlatMin: string;
  shortlistFlatMax: string;
  shortlistPctMin: string;
  shortlistPctMax: string;
  hireFlatMin: string;
  hireFlatMax: string;
  hirePctMin: string;
  hirePctMax: string;
  vendorBenchmarkPct: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  countryCode: '', countryName: '', currencyCode: '', currencySymbol: '',
  shortlistFlatMin: '0', shortlistFlatMax: '0', shortlistPctMin: '0', shortlistPctMax: '0',
  hireFlatMin: '0', hireFlatMax: '0', hirePctMin: '0', hirePctMax: '0',
  vendorBenchmarkPct: '8.33', isActive: true,
};

function toForm(c: CountryConfigResponse): FormState {
  return {
    countryCode: c.countryCode, countryName: c.countryName,
    currencyCode: c.currencyCode, currencySymbol: c.currencySymbol ?? '',
    shortlistFlatMin: c.shortlistFlatMin, shortlistFlatMax: c.shortlistFlatMax,
    shortlistPctMin: c.shortlistPctMin, shortlistPctMax: c.shortlistPctMax,
    hireFlatMin: c.hireFlatMin, hireFlatMax: c.hireFlatMax,
    hirePctMin: c.hirePctMin, hirePctMax: c.hirePctMax,
    vendorBenchmarkPct: c.vendorBenchmarkPct, isActive: c.isActive,
  };
}

function Field({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </div>
  );
}

export default function AdminCountryConfig() {
  const { data: configs, isLoading } = useCountryConfigs();
  const create = useCreateCountryConfig();
  const update = useUpdateCountryConfig();
  const [dialog, setDialog] = useState<{ mode: 'create' | 'edit'; form: FormState } | null>(null);

  const handleSave = () => {
    if (!dialog) return;
    const f = dialog.form;
    const numFields = {
      shortlistFlatMin: Number(f.shortlistFlatMin), shortlistFlatMax: Number(f.shortlistFlatMax),
      shortlistPctMin: Number(f.shortlistPctMin), shortlistPctMax: Number(f.shortlistPctMax),
      hireFlatMin: Number(f.hireFlatMin), hireFlatMax: Number(f.hireFlatMax),
      hirePctMin: Number(f.hirePctMin), hirePctMax: Number(f.hirePctMax),
      vendorBenchmarkPct: Number(f.vendorBenchmarkPct),
    };

    if (dialog.mode === 'create') {
      create.mutate(
        { countryCode: f.countryCode, countryName: f.countryName, currencyCode: f.currencyCode, currencySymbol: f.currencySymbol || null, isActive: f.isActive, ...numFields } as any,
        {
          onSuccess: () => { toast.success('Country config created'); setDialog(null); },
          onError: (err) => toast.error(extractErrorMessage(err, 'Failed to create')),
        },
      );
    } else {
      update.mutate(
        { code: f.countryCode, input: { countryName: f.countryName, currencyCode: f.currencyCode, currencySymbol: f.currencySymbol || null, isActive: f.isActive, ...numFields } as any },
        {
          onSuccess: () => { toast.success('Country config updated'); setDialog(null); },
          onError: (err) => toast.error(extractErrorMessage(err, 'Failed to update')),
        },
      );
    }
  };

  const updateField = (key: keyof FormState, value: string | boolean) => {
    if (!dialog) return;
    setDialog({ ...dialog, form: { ...dialog.form, [key]: value } });
  };

  const columns = useMemo<ColumnDef<CountryConfigResponse>[]>(
    () => [
      { accessorKey: 'countryCode', header: 'Code' },
      { accessorKey: 'countryName', header: 'Country' },
      { accessorKey: 'currencyCode', header: 'Currency' },
      {
        id: 'shortlistRange',
        header: 'Shortlist Range',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {Number(row.original.shortlistFlatMin).toLocaleString()}-{Number(row.original.shortlistFlatMax).toLocaleString()} flat, {row.original.shortlistPctMin}-{row.original.shortlistPctMax}%
          </span>
        ),
      },
      {
        id: 'hireRange',
        header: 'Hire Range',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {Number(row.original.hireFlatMin).toLocaleString()}-{Number(row.original.hireFlatMax).toLocaleString()} flat, {row.original.hirePctMin}-{row.original.hirePctMax}%
          </span>
        ),
      },
      { accessorKey: 'vendorBenchmarkPct', header: 'Benchmark %' },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => setDialog({ mode: 'edit', form: toForm(row.original) })}>
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Country Configuration</h1>
          <p className="text-sm text-muted-foreground">Manage payout ranges and vendor benchmarks per country.</p>
        </div>
        <Button onClick={() => setDialog({ mode: 'create', form: EMPTY_FORM })}>
          <Plus className="h-4 w-4" aria-hidden />
          Add Country
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={configs ?? []}
        loading={isLoading}
        emptyTitle="No country configs"
        emptyDescription="Add your first country configuration."
      />

      {dialog ? (
        <Dialog open onOpenChange={() => setDialog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{dialog.mode === 'create' ? 'Add Country' : `Edit ${dialog.form.countryCode}`}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Country Code (2-letter)" value={dialog.form.countryCode} onChange={(v) => updateField('countryCode', v)} disabled={dialog.mode === 'edit'} />
              <Field label="Country Name" value={dialog.form.countryName} onChange={(v) => updateField('countryName', v)} />
              <Field label="Currency Code" value={dialog.form.currencyCode} onChange={(v) => updateField('currencyCode', v)} />
              <Field label="Currency Symbol" value={dialog.form.currencySymbol} onChange={(v) => updateField('currencySymbol', v)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Shortlist Flat Min" value={dialog.form.shortlistFlatMin} onChange={(v) => updateField('shortlistFlatMin', v)} />
              <Field label="Shortlist Flat Max" value={dialog.form.shortlistFlatMax} onChange={(v) => updateField('shortlistFlatMax', v)} />
              <Field label="Shortlist % Min" value={dialog.form.shortlistPctMin} onChange={(v) => updateField('shortlistPctMin', v)} />
              <Field label="Shortlist % Max" value={dialog.form.shortlistPctMax} onChange={(v) => updateField('shortlistPctMax', v)} />
              <Field label="Hire Flat Min" value={dialog.form.hireFlatMin} onChange={(v) => updateField('hireFlatMin', v)} />
              <Field label="Hire Flat Max" value={dialog.form.hireFlatMax} onChange={(v) => updateField('hireFlatMax', v)} />
              <Field label="Hire % Min" value={dialog.form.hirePctMin} onChange={(v) => updateField('hirePctMin', v)} />
              <Field label="Hire % Max" value={dialog.form.hirePctMax} onChange={(v) => updateField('hirePctMax', v)} />
            </div>
            <Field label="Vendor Benchmark %" value={dialog.form.vendorBenchmarkPct} onChange={(v) => updateField('vendorBenchmarkPct', v)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={dialog.form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} className="h-4 w-4" />
              Active
            </label>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
                {create.isPending || update.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
