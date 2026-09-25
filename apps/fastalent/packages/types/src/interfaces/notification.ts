import type { NotificationType } from '../enums/notification.js';

/** Single notification response. */
export interface NotificationResponse {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceType: string | null;
  resourceId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

/** Unread count response. */
export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

/** Query filters for GET /notifications. */
export interface ListNotificationsFilters {
  isRead?: boolean;
  cursor?: string;
  pageSize?: number;
}
