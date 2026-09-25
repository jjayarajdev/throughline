import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TOOLTIP_STYLE } from './_chart-theme';

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#A0A0A0',
  gold: '#DAA520',
  platinum: '#4FC3F7',
};

interface TierDistributionProps {
  data: Record<string, number>;
}

export function TierDistribution({ data }: TierDistributionProps) {
  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([tier, count]) => ({
      name: tier.charAt(0).toUpperCase() + tier.slice(1),
      value: count,
      fill: TIER_COLORS[tier] ?? 'var(--muted-foreground)',
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No recruiter data
      </div>
    );
  }

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          dataKey="value"
          stroke="var(--card)"
          strokeWidth={2}
          label={({ name, value }) => `${name}: ${value}`}
        >
          {chartData.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: unknown, name: unknown) => {
            const n = typeof value === 'number' ? value : Number(value);
            return [`${n} (${((n / total) * 100).toFixed(0)}%)`, String(name)];
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
