import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'heading' | 'avatar' | 'button';
}

export function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-muted relative overflow-hidden',
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-muted-foreground/10 before:to-transparent before:animate-[shimmer_1.5s_ease-in-out_infinite]",
        variant === 'text' && 'h-4 w-full',
        variant === 'heading' && 'h-6 w-3/5',
        variant === 'avatar' && 'h-10 w-10 rounded-full',
        variant === 'button' && 'h-9 w-24 rounded-md',
        className,
      )}
      {...props}
    />
  );
}
