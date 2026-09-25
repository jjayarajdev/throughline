import { createApp } from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma, prisma } from './config/prisma.js';
import { disconnectRedis, redis } from './config/redis.js';
import { startPayoutScheduler } from './lib/payout-scheduler.js';
import { shutdownQueues } from './config/queue.js';
import { startAnomalyWorker } from './workers/anomaly.worker.js';
import { startMatchingWorker } from './workers/matching.worker.js';

async function bootstrap(): Promise<void> {
  const app = createApp();

  // Verify infra connectivity on startup (fail fast if AWS unreachable)
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[startup] ✅ PostgreSQL connected');
  } catch (err) {
    console.error('[startup] ❌ PostgreSQL connection failed:', err);
    process.exit(1);
  }

  try {
    const pong = await redis.ping();
    if (pong !== 'PONG') throw new Error(`unexpected PING response: ${pong}`);
    console.log('[startup] ✅ Redis connected');
  } catch (err) {
    console.error('[startup] ❌ Redis connection failed:', err);
    process.exit(1);
  }

  const server = app.listen(env.API_PORT, () => {
    console.log(`[startup] ✅ GigCruite API listening on http://localhost:${env.API_PORT}`);
    console.log(`[startup]    Health: http://localhost:${env.API_PORT}/api/v1/health`);
    console.log(`[startup]    Env:    ${env.NODE_ENV}`);

    // Start payout batch scheduler after server is listening
    startPayoutScheduler().catch((err) => {
      console.error('[startup] Payout scheduler failed:', err);
    });

    // Start anomaly detection worker (BullMQ)
    startAnomalyWorker().catch((err) => {
      console.error('[startup] Anomaly worker failed:', err);
    });

    // Start matching AI worker (BullMQ — Phase 16)
    startMatchingWorker().catch((err) => {
      console.error('[startup] Matching worker failed:', err);
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[shutdown] received ${signal}, closing...`);
    server.close(async () => {
      await shutdownQueues();
      await disconnectPrisma();
      await disconnectRedis();
      console.log('[shutdown] done');
      process.exit(0);
    });

    // Force-exit after 10s if server.close hangs
    setTimeout(() => {
      console.error('[shutdown] timeout — force exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('[bootstrap] fatal error:', err);
  process.exit(1);
});
