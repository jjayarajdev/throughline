import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { TOOLTIP_STYLE, AXIS_STYLE, BAR_RADIUS } from './_chart-theme';

interface FunnelStep {
  stage: string;
  count: number;
  fill: string;
  rate?: string;
}

interface FunnelStepsProps {
  data: FunnelStep[];
}

/**
 * Vertical bar chart showing funnel stages from left to right.
 * Each bar is colored per-stage. Conversion rates shown as labels.
 */
export function FunnelSteps({ data }: FunnelStepsProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No funnel data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} accessibilityLayer>
        <XAxis dataKey="stage" {...AXIS_STYLE} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: unknown) => [String(value), 'Count']}
        />
        <Bar dataKey="count" radius={BAR_RADIUS} barSize={36}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <LabelList dataKey="count" position="top" fontSize={11} fill="var(--foreground)" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
