import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env, isDev } from './env.js';

/**
 * Prisma 7 PostgreSQL client.
 *
 * In Prisma 7 the connection URL no longer lives in schema.prisma — at runtime
 * we construct a driver adapter (PrismaPg over node-postgres) and pass it to
 * the PrismaClient constructor.
 *
 * Singleton via globalThis so tsx watch hot-reloads don't exhaust the connection pool.
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrisma(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    // 'query' logging is intentionally OFF in dev. It's useful when
    // debugging a specific SQL issue but otherwise drowns out human-
    // facing output (email provider link boxes, console.log probes,
    // server start messages). To temporarily enable it, add 'query'
    // back to this array.
    log: isDev ? ['error', 'warn'] : ['error'],
  });
}

export const prisma: PrismaClient = global.__prisma ?? createPrisma();

if (isDev) {
  global.__prisma = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
