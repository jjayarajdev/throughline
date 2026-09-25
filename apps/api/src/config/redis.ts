import { Redis } from 'ioredis';
import { env, isDev } from './env.js';

// Singleton pattern — survives tsx watch hot reloads
declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

function createRedis(): Redis {
  const client = new Redis(env.REDIS_URL, {
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
  });

  client.on('connect', () => {
    console.log('[redis] connecting...');
  });

  client.on('ready', () => {
    console.log('[redis] ready');
  });

  client.on('error', (err) => {
    console.error('[redis] error:', err.message);
  });

  client.on('end', () => {
    console.log('[redis] connection closed');
  });

  return client;
}

export const redis: Redis = global.__redis ?? createRedis();

if (isDev) {
  global.__redis = redis;
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
