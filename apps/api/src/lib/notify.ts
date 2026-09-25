import type { NotificationType } from '@gigcruite/types';
import * as notificationService from '../services/notification.service.js';

/**
 * Fire-and-forget notification helper.
 *
 * Never throws — logs errors to stderr so callers can safely
 * `void notify(...)` without try/catch or awaiting.
 */
export async function notify(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceType?: string;
  resourceId?: string;
}): Promise<void> {
  try {
    await notificationService.createNotification(params);
  } catch (err) {
    console.error('[notify] Failed to create notification:', err);
  }
}
