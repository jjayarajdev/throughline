import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TOOLTIP_STYLE, AXIS_STYLE } from './_chart-theme';

interface TrustTrendProps {
  data: Array<{ date: string; score: number }>;
}

export function TrustTrend({ data }: TrustTrendProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} accessibilityLayer>
        <XAxis dataKey="date" {...AXIS_STYLE} />
        <YAxis domain={[0, 100]} {...AXIS_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={{ fill: 'var(--primary)' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
