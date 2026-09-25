import { Queue, Worker, type ConnectionOptions, type Processor } from 'bullmq';
import { env } from './env.js';

// BullMQ needs its own ioredis connections (blocking commands).
// Parse the REDIS_URL to get connection options.
function parseRedisUrl(): ConnectionOptions {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    db: url.pathname ? Number(url.pathname.slice(1)) || 0 : 0,
  };
}

const connection = parseRedisUrl();

// ── Queue names ──────────────────────────────────────────────
export const QUEUE_ANOMALY = 'anomaly-detection';
export const QUEUE_AI = 'ai-processing';

// ── Queues ───────────────────────────────────────────────────
export const anomalyQueue = new Queue(QUEUE_ANOMALY, { connection });
export const aiQueue = new Queue(QUEUE_AI, { connection });

// ── Worker factory ───────────────────────────────────────────
export function createWorker<T = any>(
  queueName: string,
  processor: Processor<T>,
  concurrency = 1,
): Worker<T> {
  const worker = new Worker<T>(queueName, processor, {
    connection,
    concurrency,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  });

  worker.on('failed', (job, err) => {
    console.error(`[queue:${queueName}] job ${job?.id} failed:`, err.message);
  });

  worker.on('completed', (job) => {
    console.log(`[queue:${queueName}] job ${job.id} completed`);
  });

  return worker;
}

// ── Graceful shutdown ────────────────────────────────────────
const workers: Worker[] = [];

export function registerWorker(worker: Worker): void {
  workers.push(worker);
}

export async function shutdownQueues(): Promise<void> {
  await Promise.all([
    ...workers.map((w) => w.close()),
    anomalyQueue.close(),
    aiQueue.close(),
  ]);
  console.log('[queue] all queues and workers closed');
}
