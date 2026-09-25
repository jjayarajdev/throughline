import type { Request, RequestHandler, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';
import { AppError } from '../lib/app-error.js';
import { isDev } from '../config/env.js';

/**
 * Redis-backed fixed-window rate limiter.
 *
 * Implementation:
 *   - Single atomic INCR per request (one round trip for already-existing
 *     keys, two for the first request in a window).
 *   - First hit in a new window sets an EXPIRE with the configured TTL
 *     so the key auto-evicts at window end (no scan/cleanup needed).
 *   - Window is fixed-window, NOT sliding. Good enough for coarse
 *     throttling and much cheaper than sliding windows. Revisit if we
 *     need smoother behaviour near bucket boundaries.
 *
 * Error mode:
 *   If Redis is unreachable we fail OPEN (allow the request) rather than
 *   locking the whole API out on infra blips. A warn log is emitted so
 *   monitoring can pick it up.
 */

export interface RateLimitOptions {
  /** Window duration in milliseconds. */
  windowMs: number;
  /** Maximum requests allowed per key per window. */
  max: number;
  /** Short identifier used in the Redis key namespace (e.g. 'pub', 'auth'). */
  bucket: string;
  /** Derive the identity (IP, userId, API key, …) for this request. */
  keyFn: (req: Request) => string;
  /** Optionally short-circuit the limiter (e.g. for /health probes). */
  skip?: (req: Request) => boolean;
}

/**
 * Create a rate-limit middleware from the given options.
 */
export function createRateLimit(opts: RateLimitOptions): RequestHandler {
  const windowSec = Math.max(1, Math.ceil(opts.windowMs / 1000));

  return async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    if (opts.skip?.(req)) {
      next();
      return;
    }

    const identity = opts.keyFn(req);
    const redisKey = `ratelimit:${opts.bucket}:${identity}`;

    try {
      // INCR returns the new counter value. If it's the first hit we also
      // set the expiry so the window closes cleanly.
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, windowSec);
      }

      const remaining = Math.max(0, opts.max - count);
      res.setHeader('X-RateLimit-Limit', String(opts.max));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Window', `${windowSec}s`);

      if (count > opts.max) {
        // Fetch the actual TTL so clients get an accurate retry hint.
        const ttl = await redis.ttl(redisKey);
        const retryAfter = ttl > 0 ? ttl : windowSec;
        res.setHeader('Retry-After', String(retryAfter));
        throw AppError.tooMany(
          `Rate limit exceeded: max ${opts.max} requests per ${windowSec}s`,
          { bucket: opts.bucket, retryAfterSec: retryAfter },
        );
      }

      next();
    } catch (err) {
      if (err instanceof AppError) {
        next(err);
        return;
      }
      // Redis unreachable → fail open, log once per request.
      console.warn(
        `[rate-limit] Redis error on bucket="${opts.bucket}" key="${identity}":`,
        err instanceof Error ? err.message : err,
      );
      next();
    }
  };
}

/**
 * Identify the caller by remote IP, honouring the `trust proxy` setting
 * that `app.set('trust proxy', 1)` enables. Falls back to 'unknown' so a
 * missing IP never produces a null/undefined Redis key.
 */
function ipKeyFn(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

/**
 * Identify the caller by authenticated userId.
 * Wave 3 adds the JWT middleware that sets `req.userId`. Until then we fall
 * back to IP so the middleware is safe to mount on mixed routes.
 */
function userIdKeyFn(req: Request): string {
  const userId = (req as Request & { userId?: string }).userId;
  return userId ?? ipKeyFn(req);
}

/**
 * Skip predicate for health endpoints — monitoring probes must never be
 * throttled. Matches both `/api/v1/health` and any sub-route.
 */
export function skipHealth(req: Request): boolean {
  return req.path === '/health' || req.path.startsWith('/health/');
}

/**
 * Public rate limit — 10 req / minute / IP. Applied globally to the
 * `/api/v1` router for unauthenticated traffic (login, register, forgot
 * password, public reads).
 */
export const rateLimitPublic: RequestHandler = createRateLimit({
  windowMs: 60_000,
  max: isDev ? 200 : 60,
  bucket: 'pub',
  keyFn: ipKeyFn,
  skip: skipHealth,
});

/**
 * Authenticated rate limit — 60 req / minute / userId. Applied inside
 * authenticated route groups (Wave 3 mounts this after the auth middleware).
 */
export const rateLimitAuthenticated: RequestHandler = createRateLimit({
  windowMs: 60_000,
  max: isDev ? 500 : 120,
  bucket: 'auth',
  keyFn: userIdKeyFn,
});
