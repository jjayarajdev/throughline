import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TOOLTIP_STYLE, AXIS_STYLE } from './_chart-theme';

interface TimeToFillTrendProps {
  data: Array<{ label: string; average: number; count: number }>;
  platformAverage?: number | null;
}

export function TimeToFillTrend({ data, platformAverage }: TimeToFillTrendProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No time-to-fill data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} accessibilityLayer>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" {...AXIS_STYLE} />
        <YAxis {...AXIS_STYLE} unit="d" />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: unknown) => [`${value} days`, 'Avg time-to-fill']}
          labelFormatter={(label: unknown) => String(label)}
        />
        {platformAverage != null && (
          <ReferenceLine
            y={platformAverage}
            stroke="var(--muted-foreground)"
            strokeDasharray="5 5"
            label={{ value: `Avg: ${platformAverage}d`, position: 'right', fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
        )}
        <Line
          type="monotone"
          dataKey="average"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'var(--primary)' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
