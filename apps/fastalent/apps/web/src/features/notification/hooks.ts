import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import type { NotificationResponse, NotificationUnreadCountResponse, CursorPaginatedData } from '@gigcruite/types';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationFilters,
} from './api';
import { useEventInvalidator } from '@/lib/cache-registry';

export function useNotifications(filters: NotificationFilters) {
  return useQuery<CursorPaginatedData<NotificationResponse>>({
    queryKey: ['notifications', 'list', filters],
    queryFn: () => fetchNotifications(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useUnreadCount() {
  return useQuery<NotificationUnreadCountResponse>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const invalidate = useEventInvalidator();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      invalidate('notification.read');
    },
  });
}

export function useMarkAllRead() {
  const invalidate = useEventInvalidator();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      invalidate('notification.read-all');
    },
  });
}
