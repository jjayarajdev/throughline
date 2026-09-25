import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TOOLTIP_STYLE, AXIS_STYLE } from './_chart-theme';

interface UserGrowthProps {
  data: Array<{ month: string; companies: number; recruiters: number }>;
}

export function UserGrowth({ data }: UserGrowthProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} accessibilityLayer>
        <XAxis dataKey="month" {...AXIS_STYLE} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="line"
          formatter={(value) => <span className="text-sm capitalize">{value}</span>}
        />
        <Line
          type="monotone"
          dataKey="companies"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={{ fill: 'var(--primary)' }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="recruiters"
          stroke="var(--teal-300)"
          strokeWidth={2}
          dot={{ fill: 'var(--teal-300)' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
