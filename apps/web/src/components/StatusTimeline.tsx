import type { SubmissionStatusEventResponse } from '@gigcruite/types';
import { Badge } from '@/components/ui/badge';

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function transitionLabel(from: string, to: string): string {
  if (from === to) return 'Submission created';
  return `${from} → ${to}`;
}

export function StatusTimeline({
  events,
}: {
  events: SubmissionStatusEventResponse[];
}) {
  if (events.length === 0) return null;

  return (
    <ol className="relative border-l border-border pl-4 space-y-4">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-[calc(1rem+4.5px)] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">
              {transitionLabel(event.fromStatus, event.toStatus)}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {event.actorRole}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatRelative(event.createdAt)}
            </span>
          </div>
          {event.reason ? (
            <p className="mt-1 text-xs text-muted-foreground">{event.reason}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
