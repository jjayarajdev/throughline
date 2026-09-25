import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';
import { ok, fail } from '../lib/response.js';

const router = Router();

/**
 * GET /api/v1/health
 * Liveness probe — fast, no external calls.
 */
router.get('/', (_req: Request, res: Response) => {
  ok(res, {
    status: 'ok',
    service: 'gigcruite-api',
    version: '0.1.0',
    uptimeSec: Math.round(process.uptime()),
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/health/db
 * Readiness probe — verifies PostgreSQL connectivity.
 */
router.get('/db', async (_req: Request, res: Response) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    ok(res, {
      status: 'ok',
      latencyMs: Date.now() - start,
    });
  } catch (err) {
    fail(res, {
      statusCode: 503,
      code: 'DB_UNAVAILABLE',
      message: 'Database connectivity check failed',
      details: { error: err instanceof Error ? err.message : String(err) },
    });
  }
});

/**
 * GET /api/v1/health/redis
 * Readiness probe — verifies Redis connectivity.
 */
router.get('/redis', async (_req: Request, res: Response) => {
  try {
    const start = Date.now();
    const pong = await redis.ping();
    ok(res, {
      status: pong === 'PONG' ? 'ok' : 'degraded',
      latencyMs: Date.now() - start,
      response: pong,
    });
  } catch (err) {
    fail(res, {
      statusCode: 503,
      code: 'REDIS_UNAVAILABLE',
      message: 'Redis connectivity check failed',
      details: { error: err instanceof Error ? err.message : String(err) },
    });
  }
});

export { router as healthRouter };
