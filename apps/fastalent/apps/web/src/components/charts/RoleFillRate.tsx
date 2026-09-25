import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TOOLTIP_STYLE, TOOLTIP_CURSOR, AXIS_STYLE, BAR_RADIUS } from './_chart-theme';

interface RoleFillRateProps {
  data: Array<{ month: string; filled: number; open: number }>;
}

export function RoleFillRate({ data }: RoleFillRateProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} accessibilityLayer>
        <XAxis dataKey="month" {...AXIS_STYLE} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={TOOLTIP_CURSOR} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="rect"
          formatter={(value) => <span className="text-sm capitalize">{value}</span>}
        />
        <Bar dataKey="filled" fill="var(--color-success)" radius={BAR_RADIUS} />
        <Bar dataKey="open" fill="var(--primary)" radius={BAR_RADIUS} />
      </BarChart>
    </ResponsiveContainer>
  );
}
