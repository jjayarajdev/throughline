import { cn } from '@/lib/utils';

interface MetricBadgeProps {
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const trendConfig = {
  up: { arrow: '\u2191', className: 'text-success bg-success/10' },
  down: { arrow: '\u2193', className: 'text-error bg-error/10' },
  neutral: { arrow: '\u2192', className: 'text-muted-foreground bg-muted' },
} as const;

const sizeConfig = { sm: 'text-xs px-1.5 py-0.5 gap-1', md: 'text-sm px-2 py-1 gap-1.5' } as const;

export function MetricBadge({ value, trend, label, size = 'sm', className }: MetricBadgeProps) {
  const trendStyle = trend ? trendConfig[trend] : null;
  return (
    <span className={cn('inline-flex items-center rounded-md font-medium tabular-nums', sizeConfig[size], trendStyle?.className ?? 'text-foreground bg-muted', className)}>
      {trendStyle && <span aria-hidden>{trendStyle.arrow}</span>}
      <span>{value}</span>
      {label && <span className="text-muted-foreground font-normal">{label}</span>}
    </span>
  );
}
