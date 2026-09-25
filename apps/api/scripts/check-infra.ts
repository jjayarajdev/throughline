/**
 * Part 2 — Infrastructure liveness probe.
 *
 * Connects to AWS EC2-hosted PostgreSQL + Redis from local dev machine.
 * Proves:
 *   - Security group whitelist allows this dev IP
 *   - Docker compose containers are up and healthy
 *   - Database is migrated and admin user is seeded
 *   - Redis responds to PING
 *
 * Run with: npm --workspace @gigcruite/api exec tsx scripts/check-infra.ts
 */
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';

type Result = { label: string; ok: boolean; detail: string };

async function run(): Promise<void> {
  const results: Result[] = [];

  // --- PG + admin seed ----------------------------------------------------
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@gigcruite.com' },
      select: { id: true, email: true, role: true, status: true, emailVerified: true },
    });
    if (!admin) {
      results.push({
        label: 'PG + admin seeded',
        ok: false,
        detail: 'admin@gigcruite.com not found in users table',
      });
    } else {
      results.push({
        label: 'PG + admin seeded',
        ok: true,
        detail: `${admin.email} | role=${admin.role} | status=${admin.status} | emailVerified=${admin.emailVerified}`,
      });
    }
  } catch (err) {
    results.push({
      label: 'PG + admin seeded',
      ok: false,
      detail: `PG connection failed: ${(err as Error).message}`,
    });
  }

  // --- User table row count ----------------------------------------------
  try {
    const count = await prisma.user.count();
    results.push({
      label: 'PG users table readable',
      ok: true,
      detail: `users table has ${count} row(s)`,
    });
  } catch (err) {
    results.push({
      label: 'PG users table readable',
      ok: false,
      detail: (err as Error).message,
    });
  }

  // --- Redis PING ---------------------------------------------------------
  try {
    const pong = await redis.ping();
    results.push({
      label: 'Redis PING',
      ok: pong === 'PONG',
      detail: `PING → ${pong}`,
    });
  } catch (err) {
    results.push({
      label: 'Redis PING',
      ok: false,
      detail: `Redis connection failed: ${(err as Error).message}`,
    });
  }

  // --- Redis SET/GET ------------------------------------------------------
  try {
    const key = `infra-probe:${Date.now()}`;
    await redis.set(key, 'ok', 'EX', 10);
    const val = await redis.get(key);
    await redis.del(key);
    results.push({
      label: 'Redis SET/GET/DEL',
      ok: val === 'ok',
      detail: `round-trip value=${val}`,
    });
  } catch (err) {
    results.push({
      label: 'Redis SET/GET/DEL',
      ok: false,
      detail: (err as Error).message,
    });
  }

  // --- Print summary ------------------------------------------------------
  console.log('');
  console.log('=== Part 2 Infrastructure Liveness ===');
  for (const r of results) {
    const mark = r.ok ? '[PASS]' : '[FAIL]';
    console.log(`${mark} ${r.label} — ${r.detail}`);
  }
  const passed = results.filter((r) => r.ok).length;
  console.log('');
  console.log(`Summary: ${passed}/${results.length} checks passed`);

  await prisma.$disconnect();
  redis.disconnect();

  if (passed !== results.length) process.exit(1);
}

run().catch((err) => {
  console.error('Probe crashed:', err);
  process.exit(2);
});
