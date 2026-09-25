import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TOOLTIP_STYLE, AXIS_STYLE } from './_chart-theme';

interface SubmissionFunnelProps {
  data: Array<{ stage: string; count: number; fill: string }>;
}

export function SubmissionFunnel({ data }: SubmissionFunnelProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" accessibilityLayer>
        <XAxis type="number" {...AXIS_STYLE} />
        <YAxis type="category" dataKey="stage" {...AXIS_STYLE} width={100} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="count" barSize={20} radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
