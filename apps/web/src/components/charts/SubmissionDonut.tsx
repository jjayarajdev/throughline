import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { TOOLTIP_STYLE } from './_chart-theme';

interface SubmissionDonutProps {
  data: Array<{ status: string; count: number; fill: string }>;
}

export function SubmissionDonut({ data }: SubmissionDonutProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart accessibilityLayer>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="80%"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => <span className="text-sm">{value}</span>}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-2xl font-semibold"
        >
          {total}
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}
