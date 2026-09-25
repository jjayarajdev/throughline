import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TOOLTIP_STYLE, AXIS_STYLE, BAR_RADIUS } from './_chart-theme';

interface CostBreakdownBarProps {
  data: Array<{
    title: string;
    costPerHire: number;
  }>;
}

export function CostBreakdownBar({ data }: CostBreakdownBarProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No cost data for this period
      </div>
    );
  }

  // Truncate role titles for the Y axis
  const chartData = data.map((d) => ({
    ...d,
    name: d.title.length > 25 ? `${d.title.slice(0, 22)}...` : d.title,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" accessibilityLayer>
        <XAxis type="number" {...AXIS_STYLE} tickFormatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
        <YAxis type="category" dataKey="name" {...AXIS_STYLE} width={140} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: unknown) => {
            const n = typeof value === 'number' ? value : Number(value);
            return [`₹${n.toLocaleString('en-IN')}`, 'Cost per hire'];
          }}
        />
        <Bar dataKey="costPerHire" fill="var(--primary)" radius={[0, ...BAR_RADIUS.slice(1)] as [number, number, number, number]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
