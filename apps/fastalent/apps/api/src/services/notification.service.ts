import { Prisma } from '@prisma/client';
import type {
  NotificationResponse,
  NotificationUnreadCountResponse,
  ListNotificationsFilters,
  CursorPaginatedData,
} from '@gigcruite/types';
import { NotificationType } from '@gigcruite/types';
import { prisma } from '../config/prisma.js';

// --------------------------------------------------------------------
// Projection
// --------------------------------------------------------------------

function projectNotification(row: any): NotificationResponse {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as unknown as NotificationType,
    title: row.title,
    body: row.body,
    resourceType: row.resourceType ?? null,
    resourceId: row.resourceId ?? null,
    isRead: row.isRead,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

// --------------------------------------------------------------------
// Cursor helpers
// --------------------------------------------------------------------

function encodeCursor(createdAt: Date, id: string): string {
  const json = JSON.stringify({ c: createdAt.toISOString(), i: id });
  return Buffer.from(json).toString('base64url');
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json) as { c: string; i: string };
    const createdAt = new Date(parsed.c);
    if (isNaN(createdAt.getTime())) return null;
    return { createdAt, id: parsed.i };
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------
// Service methods
// --------------------------------------------------------------------

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceType?: string;
  resourceId?: string;
}, tx?: Pick<typeof prisma, 'notification'>): Promise<NotificationResponse> {
  const client = tx ?? prisma;
  const row = await client.notification.create({
    data: {
      userId: data.userId,
      type: data.type as any,
      title: data.title,
      body: data.body,
      resourceType: data.resourceType ?? null,
      resourceId: data.resourceId ?? null,
    },
  });
  return projectNotification(row);
}

export async function listNotifications(
  userId: string,
  filters: ListNotificationsFilters,
): Promise<CursorPaginatedData<NotificationResponse>> {
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));
  const take = pageSize + 1; // fetch one extra to detect hasMore

  const where: Prisma.NotificationWhereInput = { userId };
  if (filters.isRead !== undefined) {
    where.isRead = filters.isRead;
  }

  // Cursor-based pagination (newest first)
  if (filters.cursor) {
    const decoded = decodeCursor(filters.cursor);
    if (decoded) {
      where.OR = [
        { createdAt: { lt: decoded.createdAt } },
        { createdAt: decoded.createdAt, id: { lt: decoded.id } },
      ];
    }
  }

  const rows = await prisma.notification.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take,
  });

  const hasMore = rows.length > pageSize;
  const items = hasMore ? rows.slice(0, pageSize) : rows;

  const nextCursor =
    hasMore && items.length > 0
      ? encodeCursor(items[items.length - 1]!.createdAt, items[items.length - 1]!.id)
      : null;

  return {
    items: items.map(projectNotification),
    nextCursor,
    hasMore,
  };
}

export async function getUnreadCount(
  userId: string,
): Promise<NotificationUnreadCountResponse> {
  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { unreadCount };
}

export async function markAsRead(
  userId: string,
  notificationId: string,
): Promise<NotificationResponse> {
  const row = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
  if (row.count === 0) {
    throw new Error('Notification not found');
  }
  const updated = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  return projectNotification(updated!);
}

export async function markAllRead(userId: string): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { count: result.count };
}
