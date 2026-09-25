import { useMemo } from 'react';
import { Select } from '@/components/ui/select';

export type DatePreset = '7d' | '30d' | '90d' | '180d' | '365d';

interface DateRangeSelectProps {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
  className?: string;
}

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '180d', label: 'Last 6 months' },
  { value: '365d', label: 'Last 12 months' },
];

/** Convert a preset to ISO start/end strings. */
export function presetToRange(preset: DatePreset) {
  const days = parseInt(preset, 10);
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toISOString().split('T')[0]!,
    endDate: end.toISOString().split('T')[0]!,
  };
}

export function useDateRange(preset: DatePreset) {
  return useMemo(() => presetToRange(preset), [preset]);
}

export function DateRangeSelect({ value, onChange, className }: DateRangeSelectProps) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as DatePreset)}
      className={className}
      style={{ width: 'auto', minWidth: 160 }}
    >
      {PRESETS.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </Select>
  );
}
