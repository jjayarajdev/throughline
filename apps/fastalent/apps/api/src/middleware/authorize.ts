import type { RequestHandler } from 'express';
import type { UserRole } from '@gigcruite/types';
import { authenticate, requireRole } from './authenticate.js';

/**
 * RBAC composition helper.
 *
 * Wraps the two-step `authenticate → requireRole(...)` chain into a single
 * middleware array that can be splatted onto any route:
 *
 *   router.get('/me', ...authorize('recruiter'), handler);
 *   router.put('/me/bank-details', ...authorize('recruiter'), validate(...), handler);
 *
 * Passing no roles restricts the route to any authenticated user regardless
 * of role — useful for endpoints like `/users/me` that only need an
 * identified caller.
 *
 * Error contract (both emitted through the global error handler):
 *   - 401 UNAUTHORIZED — missing / invalid / expired bearer token.
 *   - 403 FORBIDDEN    — valid token but the caller's role is not permitted.
 *
 * Mount order matters: `authorize` must come BEFORE `rateLimitAuthenticated`
 * on protected routes so `req.userId` is populated when the limiter reads it.
 */
export function authorize(...roles: UserRole[]): RequestHandler[] {
  if (roles.length === 0) {
    return [authenticate];
  }
  return [authenticate, requireRole(...roles)];
}
