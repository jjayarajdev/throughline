import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ConsistencyGaugeProps {
  score: number | null; // 0-100
  label?: string;
}

export function ConsistencyGauge({ score, label = 'Consistency' }: ConsistencyGaugeProps) {
  const value = score ?? 0;
  const data = [
    { name: 'filled', value },
    { name: 'empty', value: 100 - value },
  ];

  const color =
    value >= 70
      ? 'var(--color-success)'
      : value >= 40
        ? 'var(--color-warning)'
        : 'var(--color-destructive)';

  const rating = value >= 70 ? 'High' : value >= 40 ? 'Medium' : 'Low';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 180, height: 90 }}>
        <ResponsiveContainer width="100%" height={90}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={50}
              outerRadius={75}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="var(--muted)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>
            {score != null ? score : '—'}
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="ml-1.5 text-xs text-muted-foreground">({rating})</span>
      </div>
    </div>
  );
}
