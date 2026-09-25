import { SubmissionStatus } from '@gigcruite/types';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type DotColor = 'green' | 'amber' | 'red' | 'blue';

const DOT_CLASSES: Record<DotColor, string> = {
  green: 'bg-success',
  amber: 'bg-warning',
  red: 'bg-error',
  blue: 'bg-primary',
};

const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; variant: BadgeProps['variant']; dot: DotColor }
> = {
  [SubmissionStatus.SUBMITTED]: { label: 'Submitted', variant: 'secondary', dot: 'blue' },
  [SubmissionStatus.SHORTLISTED]: { label: 'Shortlisted', variant: 'default', dot: 'blue' },
  [SubmissionStatus.INTERVIEW]: { label: 'Interview', variant: 'warning', dot: 'blue' },
  [SubmissionStatus.HIRED]: { label: 'Hired', variant: 'success', dot: 'green' },
  [SubmissionStatus.JOINED]: { label: 'Joined', variant: 'success', dot: 'green' },
  [SubmissionStatus.REJECTED]: { label: 'Rejected', variant: 'destructive', dot: 'red' },
  [SubmissionStatus.WITHDRAWN]: { label: 'Withdrawn', variant: 'outline', dot: 'amber' },
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: 'secondary' as const,
    dot: 'amber' as DotColor,
  };
  return (
    <Badge variant={config.variant} className="gap-1.5">
      <span
        className={cn('inline-block h-1 w-1 rounded-full', DOT_CLASSES[config.dot])}
        aria-hidden="true"
      />
      {config.label}
    </Badge>
  );
}
