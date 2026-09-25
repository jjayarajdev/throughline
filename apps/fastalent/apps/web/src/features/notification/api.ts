import type {
  NotificationResponse,
  NotificationUnreadCountResponse,
  CursorPaginatedData,
} from '@gigcruite/types';
import { apiGet, apiPatch } from '@/lib/api-client';

export interface NotificationFilters {
  isRead?: boolean;
  cursor?: string;
  pageSize?: number;
}

function buildQuery(filters: NotificationFilters): string {
  const params = new URLSearchParams();
  if (filters.isRead !== undefined) params.set('isRead', String(filters.isRead));
  if (filters.cursor) params.set('cursor', filters.cursor);
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function fetchNotifications(
  filters: NotificationFilters,
): Promise<CursorPaginatedData<NotificationResponse>> {
  return apiGet<CursorPaginatedData<NotificationResponse>>(
    `/notifications${buildQuery(filters)}`,
  );
}

export function fetchUnreadCount(): Promise<NotificationUnreadCountResponse> {
  return apiGet<NotificationUnreadCountResponse>('/notifications/unread-count');
}

export function markNotificationRead(id: string): Promise<NotificationResponse> {
  return apiPatch<NotificationResponse>(`/notifications/${id}/read`);
}

export function markAllNotificationsRead(): Promise<{ count: number }> {
  return apiPatch<{ count: number }>('/notifications/read-all');
}
