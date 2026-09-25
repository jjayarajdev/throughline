import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { LazyMotion, m } from 'framer-motion';
import loadFeatures from '@/lib/motion-features';
import { STAGGER } from '@/lib/motion-config';
import { useAuthStore } from '@/stores/auth-store';
import {
  useUnreadCount,
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from '@/features/notification/hooks';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { NotificationResponse } from '@gigcruite/types';

/**
 * NotificationBell — topbar bell icon with Sheet-based slide-over panel.
 * Replaces the old dropdown pattern with proper focus trap and Escape handling.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const user = useAuthStore((s) => s.user);

  const { data: unreadData } = useUnreadCount();
  const { data: notifData, isPending } = useNotifications({ pageSize: 15 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const unreadCount = unreadData?.unreadCount ?? 0;
  const notifications = notifData?.items ?? [];

  const filteredNotifications =
    tab === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const rolePrefix =
    user?.role === 'recruiter' ? '/r' : user?.role === 'company' ? '/c' : '/a';

  const handleNotifClick = (n: NotificationResponse) => {
    if (!n.isRead) {
      markRead.mutate(n.id);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative rounded-full p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent className="overflow-y-auto sm:w-[400px] p-0">
        <SheetHeader className="border-b px-4 py-3 pr-12">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Tab bar */}
        <div className="flex border-b">
          <button
            onClick={() => setTab('all')}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === 'all'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            All
          </button>
          <button
            onClick={() => setTab('unread')}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2',
              tab === 'unread'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </button>
        </div>

        {/* Notification list */}
        <LazyMotion features={loadFeatures} strict>
          <m.div
            className="divide-y"
            variants={STAGGER.container}
            initial="hidden"
            animate="show"
            key={tab}
          >
            {isPending ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                {tab === 'unread'
                  ? 'No unread notifications'
                  : 'No notifications yet'}
              </p>
            ) : (
              filteredNotifications.map((n) => (
                <m.button
                  key={n.id}
                  variants={STAGGER.item}
                  type="button"
                  onClick={() => handleNotifClick(n)}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-colors hover:bg-accent/50',
                    !n.isRead && 'bg-accent/20',
                  )}
                >
                  <div className="flex items-start gap-3">
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm', !n.isRead && 'font-medium')}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {n.body}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatRelative(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </m.button>
              ))
            )}
          </m.div>
        </LazyMotion>

        {/* Footer */}
        <div className="sticky bottom-0 border-t bg-background px-4 py-2 text-center">
          <Link
            to={`${rolePrefix}/notifications`}
            viewTransition
            onClick={() => setOpen(false)}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
