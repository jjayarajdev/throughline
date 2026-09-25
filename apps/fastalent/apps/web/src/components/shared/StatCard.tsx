import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  helper?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

const trendConfig = {
  up: { arrow: '\u2191', className: 'text-success' },
  down: { arrow: '\u2193', className: 'text-destructive' },
  neutral: { arrow: '\u2192', className: 'text-muted-foreground' },
} as const;

export function StatCard({ icon, label, value, helper, trend }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon && (
          <div className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {trend && (
          <span className={cn('text-sm font-medium', trendConfig[trend].className)}>
            {trendConfig[trend].arrow}
          </span>
        )}
      </div>
      {helper && (
        <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
      )}
    </div>
  );
}
