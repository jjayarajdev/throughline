import { FeatureFlagScope } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';

const GLOBAL_SCOPE_ID = '00000000-0000-0000-0000-000000000000';

const KNOWN_FLAGS = ['analytics_dashboards', 'analytics_ai', 'matching_ai'] as const;
type FlagKey = (typeof KNOWN_FLAGS)[number];

export type ResolvedFlags = Record<FlagKey, boolean>;

const CACHE_TTL = 300; // 5 minutes

/**
 * Resolve feature flags for a given entity. Fetches both GLOBAL defaults
 * and entity-specific overrides in a single query, then layers entity
 * values over global defaults.
 */
export async function getResolvedFlags(
  scope: 'COMPANY' | 'RECRUITER',
  scopeId: string,
): Promise<ResolvedFlags> {
  const cacheKey = `ff:${scope}:${scopeId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as ResolvedFlags;

  const rows = await prisma.featureFlag.findMany({
    where: {
      key: { in: [...KNOWN_FLAGS] },
      OR: [
        { scope: FeatureFlagScope.GLOBAL, scopeId: GLOBAL_SCOPE_ID },
        { scope: FeatureFlagScope[scope], scopeId },
      ],
    },
    select: { key: true, enabled: true, scope: true },
    orderBy: { scope: 'asc' }, // COMPANY/RECRUITER before GLOBAL (alphabetical)
  });

  // Start with all false, layer global, then entity overrides
  const flags: ResolvedFlags = {
    analytics_dashboards: false,
    analytics_ai: false,
    matching_ai: false,
  };

  // Apply global defaults first
  for (const row of rows) {
    if (row.scope === FeatureFlagScope.GLOBAL) {
      flags[row.key as FlagKey] = row.enabled;
    }
  }
  // Apply entity overrides (take precedence)
  for (const row of rows) {
    if (row.scope !== FeatureFlagScope.GLOBAL) {
      flags[row.key as FlagKey] = row.enabled;
    }
  }

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(flags));
  return flags;
}

/** Resolve GLOBAL-only flags (for admin users who have no entity scope). */
export async function getGlobalFlags(): Promise<ResolvedFlags> {
  const cacheKey = 'ff:GLOBAL';
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as ResolvedFlags;

  const rows = await prisma.featureFlag.findMany({
    where: {
      key: { in: [...KNOWN_FLAGS] },
      scope: FeatureFlagScope.GLOBAL,
      scopeId: GLOBAL_SCOPE_ID,
    },
    select: { key: true, enabled: true },
  });

  const flags: ResolvedFlags = {
    analytics_dashboards: false,
    analytics_ai: false,
    matching_ai: false,
  };

  for (const row of rows) {
    flags[row.key as FlagKey] = row.enabled;
  }

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(flags));
  return flags;
}

/** Admin: list all feature flag rows, ordered by key + scope. */
export async function listAllFlags() {
  return prisma.featureFlag.findMany({
    orderBy: [{ key: 'asc' }, { scope: 'asc' }],
  });
}

/** Flush all feature-flag cache keys (ff:*). */
export async function flushAllCaches(): Promise<number> {
  const keys = await redis.keys('ff:*');
  if (keys.length === 0) return 0;
  await redis.del(...keys);
  return keys.length;
}
