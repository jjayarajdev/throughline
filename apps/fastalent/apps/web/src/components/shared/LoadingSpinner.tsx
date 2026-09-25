import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  /** If true, center on the full viewport — used as a router fallback. */
  fullScreen?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
} as const;

/**
 * Spinner with an accessible label. `fullScreen` variant covers the
 * viewport and is used as the router's pending-navigation fallback.
 */
export function LoadingSpinner({
  size = 'md',
  label = 'Loading',
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <Loader2
      className={cn('animate-spin text-muted-foreground', sizeMap[size], className)}
      aria-hidden
    />
  );
  if (fullScreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center"
      >
        {spinner}
        <span className="sr-only">{label}…</span>
      </div>
    );
  }
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
      {spinner}
      <span className="sr-only">{label}…</span>
    </span>
  );
}
