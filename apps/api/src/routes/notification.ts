import { Router } from 'express';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import * as notificationService from '../services/notification.service.js';
import { ListNotificationsQuerySchema, type ListNotificationsQuery } from '../validators/notification.js';
import { AppError } from '../lib/app-error.js';

const router = Router();

// GET /notifications — cursor-paginated list
router.get(
  '/',
  ...authorize(),
  rateLimitAuthenticated,
  validate(ListNotificationsQuerySchema, 'query'),
  async (req, res) => {
    const userId = (req as any).userId as string;
    const query = req.query as unknown as ListNotificationsQuery;
    const result = await notificationService.listNotifications(userId, query);
    return ok(res, result);
  },
);

// GET /notifications/unread-count
router.get(
  '/unread-count',
  ...authorize(),
  rateLimitAuthenticated,
  async (req, res) => {
    const userId = (req as any).userId as string;
    const result = await notificationService.getUnreadCount(userId);
    return ok(res, result);
  },
);

// PATCH /notifications/read-all — must be before :id route
router.patch(
  '/read-all',
  ...authorize(),
  rateLimitAuthenticated,
  async (req, res) => {
    const userId = (req as any).userId as string;
    const result = await notificationService.markAllRead(userId);
    return ok(res, result);
  },
);

// PATCH /notifications/:id/read
router.patch(
  '/:id/read',
  ...authorize(),
  rateLimitAuthenticated,
  async (req, res) => {
    const userId = (req as any).userId as string;
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) throw AppError.badRequest('Notification ID required');
    const result = await notificationService.markAsRead(userId, id);
    return ok(res, result);
  },
);

export { router as notificationRouter };
