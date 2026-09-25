import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const statCardVariants = cva('relative overflow-hidden', {
  variants: {
    variant: {
      default: '',
      teal: 'ring-1 ring-primary/20 bg-primary/5',
      gradient: 'bg-brand-gradient text-white border-0',
    },
  },
  defaultVariants: { variant: 'default' },
});

interface StatCardV2Props extends VariantProps<typeof statCardVariants> {
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  helper?: React.ReactNode;
  trend?: { direction: 'up' | 'down' | 'neutral'; label: string };
  loading?: boolean;
  className?: string;
}

const trendStyles = {
  up: { arrow: '\u2191', className: 'text-success' },
  down: { arrow: '\u2193', className: 'text-error' },
  neutral: { arrow: '\u2192', className: 'text-muted-foreground' },
} as const;

export function StatCardV2({
  icon, label, value, helper, trend,
  variant = 'default', loading = false, className,
}: StatCardV2Props) {
  const isGradient = variant === 'gradient';

  if (loading) {
    return (
      <Card className={cn('px-5 py-4', className)}>
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-2/5" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <Skeleton className="mt-3 h-8 w-1/3" />
        <Skeleton variant="text" className="mt-2 w-3/4 h-3" />
      </Card>
    );
  }

  return (
    <Card className={cn(statCardVariants({ variant }), 'px-5 py-4', className)}>
      <div className="flex items-center justify-between">
        <span className={cn('text-sm font-medium', isGradient ? 'text-white/80' : 'text-muted-foreground')}>
          {label}
        </span>
        {icon && (
          <div className={cn('[&>svg]:h-4 [&>svg]:w-4', isGradient ? 'text-white/60' : 'text-muted-foreground')}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={cn('text-2xl font-bold tabular-nums', isGradient ? 'text-white' : 'text-foreground')}>
          {value}
        </span>
        {trend && (
          <span className={cn('text-sm font-medium', isGradient ? 'text-white/80' : trendStyles[trend.direction].className)}>
            {trendStyles[trend.direction].arrow} {trend.label}
          </span>
        )}
      </div>
      {helper && (
        <div className={cn('mt-1 text-xs', isGradient ? 'text-white/70' : 'text-muted-foreground')}>
          {helper}
        </div>
      )}
    </Card>
  );
}
