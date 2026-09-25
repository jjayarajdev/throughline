import { useState } from 'react';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/features/notification/hooks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { NotificationResponse } from '@gigcruite/types';

type Tab = 'all' | 'unread' | 'read';

export default function Notifications() {
  const [tab, setTab] = useState<Tab>('all');
  const [cursor, setCursor] = useState<string | undefined>();

  const filters = {
    ...(tab === 'unread' ? { isRead: false } : tab === 'read' ? { isRead: true } : {}),
    cursor,
    pageSize: 20,
  };

  const { data, isLoading } = useNotifications(filters);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.items ?? [];

  const handleClick = (n: NotificationResponse) => {
    if (!n.isRead) markRead.mutate(n.id);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          Mark all read
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setTab(t.key); setCursor(undefined); }}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3 rounded-lg border p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleClick(n)}
              className={cn(
                'w-full px-4 py-3 text-left transition-colors hover:bg-accent/50',
                !n.isRead && 'bg-accent/20',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm', !n.isRead && 'font-medium')}>{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                </div>
                {!n.isRead && (
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                )}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Load more */}
      {data?.hasMore && data.nextCursor && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(data.nextCursor!)}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
