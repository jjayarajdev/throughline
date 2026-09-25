import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';
import type { PlatformSettingResponse } from '@gigcruite/types';
import { AppError } from '../lib/app-error.js';

const CACHE_PREFIX = 'platform_setting:';
const CACHE_TTL_SECONDS = 300; // 5 min

export async function getSetting(key: string): Promise<string | null> {
  // Check Redis cache first
  const cached = await redis.get(`${CACHE_PREFIX}${key}`);
  if (cached !== null) return cached;

  const row = await prisma.platformSetting.findUnique({ where: { key } });
  if (!row) return null;

  await redis.setex(`${CACHE_PREFIX}${key}`, CACHE_TTL_SECONDS, row.value);
  return row.value;
}

/** Alias for getSetting — matches the name expected by newer service consumers. */
export const getSettingValue = getSetting;

export async function getSettingNumber(key: string): Promise<number | null> {
  const val = await getSetting(key);
  if (val === null) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

export async function getSettingBoolean(key: string): Promise<boolean> {
  const val = await getSetting(key);
  return val === 'true';
}

export async function getAllSettings(): Promise<PlatformSettingResponse[]> {
  const rows = await prisma.platformSetting.findMany({
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  });
  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    value: r.value,
    description: r.description,
    category: r.category,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function updateSetting(
  key: string,
  value: string,
): Promise<PlatformSettingResponse> {
  const existing = await prisma.platformSetting.findUnique({ where: { key } });
  if (!existing) {
    throw AppError.notFound(`Setting "${key}" not found`);
  }

  const updated = await prisma.platformSetting.update({
    where: { key },
    data: { value },
  });

  // Invalidate cache
  await redis.del(`${CACHE_PREFIX}${key}`);

  return {
    id: updated.id,
    key: updated.key,
    value: updated.value,
    description: updated.description,
    category: updated.category,
    updatedAt: updated.updatedAt.toISOString(),
  };
}
