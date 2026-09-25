import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TOOLTIP_STYLE, TOOLTIP_CURSOR, AXIS_STYLE, BAR_RADIUS } from './_chart-theme';

interface PlatformRevenueProps {
  data: Array<{ month: string; revenue: number; commission: number }>;
}

export function PlatformRevenue({ data }: PlatformRevenueProps) {
  const formatTooltip = (value: unknown): string => {
    if (typeof value !== 'number') return String(value);
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} accessibilityLayer>
        <XAxis dataKey="month" {...AXIS_STYLE} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={TOOLTIP_CURSOR}
          formatter={formatTooltip}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="rect"
          formatter={(value) => <span className="text-sm capitalize">{value}</span>}
        />
        <Bar dataKey="revenue" fill="var(--primary)" radius={BAR_RADIUS} />
        <Bar dataKey="commission" fill="var(--teal-300)" radius={BAR_RADIUS} />
      </BarChart>
    </ResponsiveContainer>
  );
}
