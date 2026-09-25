import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TOOLTIP_STYLE, TOOLTIP_CURSOR, AXIS_STYLE, BAR_RADIUS } from './_chart-theme';

interface EarningChartProps {
  data: Array<{ month: string; amount: number }>;
}

export function EarningChart({ data }: EarningChartProps) {
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
        <Bar dataKey="amount" fill="var(--primary)" radius={BAR_RADIUS} />
      </BarChart>
    </ResponsiveContainer>
  );
}
