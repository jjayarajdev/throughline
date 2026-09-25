import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { UserRole } from '@gigcruite/types';
import { AppError } from '../lib/app-error.js';
import { verifyAccessToken } from '../lib/jwt.js';

/**
 * Augment Express.Request globally so downstream handlers can read
 * `req.userId` / `req.userRole` without per-file casts.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
    }
  }
}

/**
 * JWT authentication middleware.
 *
 * Verifies `Authorization: Bearer <token>`, decodes the access token,
 * and attaches `userId` / `userRole` onto the request object.
 *
 * On failure it returns a structured 401 via the global error handler —
 * the axios client interceptor on the web app treats 401 as the trigger
 * to run the single-flight refresh flow.
 */
export const authenticate: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return next(AppError.unauthorized('Missing or invalid Authorization header'));
  }

  const token = header.slice(7).trim();
  if (!token) {
    return next(AppError.unauthorized('Missing access token'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Role-gating middleware factory.
 *
 * Usage:
 *   router.get('/admin/users', authenticate, requireRole('admin'), handler)
 *
 * Must be mounted AFTER `authenticate` so `req.userRole` is populated.
 */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(AppError.forbidden('Insufficient permissions'));
    }
    next();
  };
}
