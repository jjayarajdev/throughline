import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonListProps {
  count?: number;
  variant?: 'card' | 'row' | 'stat';
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b px-4 py-3">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-1/6 ml-auto" />
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="rounded-xl border bg-card px-5 py-4 shadow">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-2/5" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="mt-3 h-8 w-1/3" />
      <Skeleton variant="text" className="mt-2 h-3 w-3/4" />
    </div>
  );
}

export function SkeletonList({ count = 5, variant = 'row' }: SkeletonListProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'stat') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      {items.map((i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
