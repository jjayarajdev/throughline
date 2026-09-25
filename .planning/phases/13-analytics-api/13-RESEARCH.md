# Phase 13: Analytics API - Research

**Researched:** 2026-04-24
**Domain:** Analytics API for Hiring Intelligence SaaS
**Confidence:** HIGH

## Summary

Phase 13 exposes hiring intelligence data as RESTful API endpoints consumed by the frontend dashboards. This phase focuses on **aggregation queries** over the data foundation built in Phase 12 (HiringMetric table + denormalized analytics columns on Role, Submission, RecruiterProfile). The core challenge is computing funnel conversions, recruiter performance benchmarks, and platform health metrics efficiently while maintaining <500ms response times.

The standard approach combines **Prisma aggregate/groupBy** for simple queries, **raw SQL with window functions** for percentile calculations and ranking, and **Redis caching with TTL-based invalidation** for expensive computations that don't need real-time precision. This phase does NOT include AI features (Phase 15) — all analytics are statistical aggregations over the platform's own historical data.

**Primary recommendation:** Use Prisma for CRUD and simple aggregations, fallback to `$queryRaw` with PostgreSQL window functions (`PERCENT_RANK()`, `PARTITION BY`) for complex analytics, cache computed metrics in Redis with event-driven invalidation on submission status changes and role closures. Offset pagination is sufficient for dashboard queries (<10K records per company/recruiter), cursor pagination deferred until scale demands it.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANLY-01 | Company submission funnel with conversion rates | Prisma aggregate for counts + manual ratio calculation; window functions for conversion metrics per role |
| ANLY-02 | Recruiter scorecard with platform comparison | Aggregate recruiter metrics, compute platform avg via raw SQL, use `PERCENT_RANK()` for percentile positioning |
| ANLY-03 | Admin platform health metrics | Prisma `count()` and `aggregate()` with date filters; Redis cache with 5-minute TTL |
| ANLY-04 | Time-to-fill statistics vs platform baseline | HiringMetric `daysToFill` aggregation; window functions for percentile bands (p25/p50/p75/p90) |
| ANLY-05 | All queries <500ms response time | Indexed queries + Redis caching for percentile computations + Connection pooling |
| ANLY-06 | Compare against platform's own dataset | PostgreSQL window functions over HiringMetric and Submission tables, not external benchmarks |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 7.7.0 (existing) | Primary ORM for aggregate/groupBy queries | Already in stack. Handles 80% of analytics queries via `aggregate()`, `groupBy()`, `count()`. TypeScript-native with excellent type inference. |
| PostgreSQL 16 | 16.x (existing) | Relational database with window functions | Already deployed on EC2. Native support for `PERCENT_RANK()`, `PARTITION BY`, `LAG()`, `LEAD()` — essential for percentile calculations and longitudinal comparisons. |
| ioredis | 5.10.1 (existing) | Redis client for caching aggregates | Already in stack. Cache computed percentiles, funnel metrics, platform averages with TTL-based expiration. |
| Zod | 3.25.76 (existing) | Schema validation for analytics API inputs | Already in stack. Validate date ranges, filters, pagination params. Pattern established in `validators/admin.ts`. |
| Express 5 | 5.2.1 (existing) | HTTP routing layer | Already in stack. Mount analytics routes under `/api/analytics/*`. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| simple-statistics | ^7.8.8 | Statistical calculations (percentile, std dev, variance) | Application-layer percentile computation when raw SQL isn't feasible. Lightweight (~10KB), no dependencies. Useful for client-side metric formatting. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma `aggregate()` | Raw SQL only | Raw SQL gives full control but loses type safety and migration tracking. Use Prisma first, fallback to raw SQL only when necessary. |
| Offset pagination | Cursor pagination | Cursor pagination performs better at scale (>100K records) but adds complexity. Offset is fine for analytics dashboards where users rarely paginate beyond page 10. |
| Redis cache | PostgreSQL materialized views | Materialized views require `REFRESH CONCURRENTLY` coordination and schema migrations. Redis TTL-based cache is simpler for frequently changing metrics. |
| simple-statistics | PostgreSQL window functions | Window functions are more performant but require raw SQL. Use window functions in queries, `simple-statistics` for frontend display calculations. |

**Installation:**
```bash
# Only if adding simple-statistics (optional for frontend metric display)
npm install simple-statistics@^7.8.8
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
├── routes/
│   └── analytics.ts            # GET /analytics/funnel, /time-to-fill, /scorecard, /platform-health
├── services/
│   ├── analytics.service.ts     # Prisma aggregate queries + raw SQL for window functions
│   └── analytics-cache.service.ts # Redis caching layer with TTL + event-driven invalidation
├── validators/
│   └── analytics.ts             # Zod schemas for date ranges, filters, pagination
└── lib/
    └── analytics-helpers.ts     # Conversion rate calculation, percentile formatting

apps/web/src/
├── features/
│   └── analytics/
│       ├── components/
│       │   ├── FunnelChart.tsx
│       │   ├── RecruiterScorecard.tsx
│       │   └── PlatformHealthMetrics.tsx
│       ├── hooks/
│       │   ├── useCompanyFunnel.ts      # TanStack Query hook
│       │   ├── useRecruiterScorecard.ts
│       │   └── usePlatformHealth.ts
│       └── api/
│           └── analytics-api.ts         # apiClient wrappers
└── pages/
    └── analytics/
        ├── RolePerformancePage.tsx      # Company view: single role deep-dive
        └── RecruiterAnalyticsPage.tsx   # Recruiter personal scorecard
```

### Pattern 1: Prisma Aggregate + Manual Calculation

**What:** Use Prisma `aggregate()` and `groupBy()` for counting and summing, compute conversion rates in application code. Reserve raw SQL for operations Prisma doesn't support (window functions, complex JOINs with calculations).

**When to use:** Simple funnel counts, total submissions per status, earning sums. Prisma handles these elegantly with type safety.

**Example:**
```typescript
// services/analytics.service.ts
import { prisma } from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export async function getCompanyFunnel(companyId: string, dateRange: { from: Date; to: Date }) {
  const roles = await prisma.role.findMany({
    where: {
      companyId,
      publishedAt: { gte: dateRange.from, lte: dateRange.to },
    },
    select: { id: true },
  });

  const roleIds = roles.map(r => r.id);

  // Prisma aggregate for status counts
  const [submitted, shortlisted, interview, hired, joined] = await Promise.all([
    prisma.submission.count({ where: { roleId: { in: roleIds }, status: 'submitted' } }),
    prisma.submission.count({ where: { roleId: { in: roleIds }, status: 'shortlisted' } }),
    prisma.submission.count({ where: { roleId: { in: roleIds }, status: 'interview' } }),
    prisma.submission.count({ where: { roleId: { in: roleIds }, status: 'hired' } }),
    prisma.submission.count({ where: { roleId: { in: roleIds }, status: 'joined' } }),
  ]);

  // Manual conversion rate calculation in app code
  const conversionRates = {
    submittedToShortlisted: submitted > 0 ? ((shortlisted / submitted) * 100).toFixed(2) : '0.00',
    shortlistedToInterview: shortlisted > 0 ? ((interview / shortlisted) * 100).toFixed(2) : '0.00',
    interviewToHired: interview > 0 ? ((hired / interview) * 100).toFixed(2) : '0.00',
    hiredToJoined: hired > 0 ? ((joined / hired) * 100).toFixed(2) : '0.00',
    endToEnd: submitted > 0 ? ((joined / submitted) * 100).toFixed(2) : '0.00',
  };

  return {
    funnel: { submitted, shortlisted, interview, hired, joined },
    conversionRates,
  };
}
```

**Why this pattern:** Prisma handles counts efficiently with type safety, conversion rates are simple division (no SQL needed). Keeps business logic in TypeScript where it's testable and readable.

### Pattern 2: PostgreSQL Window Functions for Percentile Ranking

**What:** Use `$queryRaw` with PostgreSQL's `PERCENT_RANK()` and `PARTITION BY` to compute recruiter performance percentiles relative to platform average. Window functions compute ranking in a single pass without CTEs or subqueries.

**When to use:** Scorecard comparisons ("You're in the top 15% for conversion rate"), percentile bands for time-to-fill, longitudinal analysis of recruiter consistency.

**Example:**
```typescript
// services/analytics.service.ts
export async function getRecruiterScorecard(recruiterId: string) {
  // Compute recruiter's metrics AND their percentile rank vs all recruiters
  const result = await prisma.$queryRaw<RecruiterScorecardRow[]>`
    WITH recruiter_metrics AS (
      SELECT
        rp.id AS recruiter_id,
        rp.full_name AS recruiter_name,
        COUNT(DISTINCT s.id) AS total_submissions,
        COUNT(DISTINCT CASE WHEN s.status = 'hired' THEN s.id END) AS total_hires,
        CASE
          WHEN COUNT(DISTINCT s.id) > 0
          THEN (COUNT(DISTINCT CASE WHEN s.status = 'hired' THEN s.id END)::DECIMAL / COUNT(DISTINCT s.id)) * 100
          ELSE 0
        END AS conversion_rate,
        AVG(EXTRACT(EPOCH FROM (s.updated_at - s.created_at)) / 86400.0) FILTER (WHERE s.status = 'hired') AS avg_days_to_hire
      FROM recruiter_profiles rp
      LEFT JOIN submissions s ON s.recruiter_id = rp.id AND s.created_at >= NOW() - INTERVAL '90 days'
      GROUP BY rp.id, rp.full_name
    )
    SELECT
      rm.*,
      PERCENT_RANK() OVER (ORDER BY rm.conversion_rate) AS conversion_rate_percentile,
      PERCENT_RANK() OVER (ORDER BY rm.avg_days_to_hire) AS speed_percentile,
      AVG(rm.conversion_rate) OVER () AS platform_avg_conversion,
      AVG(rm.avg_days_to_hire) OVER () AS platform_avg_days
    FROM recruiter_metrics rm
    WHERE rm.recruiter_id = ${recruiterId}::uuid;
  `;

  const data = result[0];
  if (!data) throw AppError.notFound('Recruiter not found');

  return {
    recruiterId: data.recruiter_id,
    recruiterName: data.recruiter_name,
    totalSubmissions: Number(data.total_submissions),
    totalHires: Number(data.total_hires),
    conversionRate: parseFloat(data.conversion_rate).toFixed(2),
    avgDaysToHire: data.avg_days_to_hire ? parseFloat(data.avg_days_to_hire).toFixed(1) : null,
    // Percentile rank: 0.0 = bottom, 1.0 = top
    conversionRatePercentile: (parseFloat(data.conversion_rate_percentile) * 100).toFixed(0), // "85" means top 15%
    speedPercentile: (parseFloat(data.speed_percentile) * 100).toFixed(0),
    platformAvgConversion: parseFloat(data.platform_avg_conversion).toFixed(2),
    platformAvgDays: data.platform_avg_days ? parseFloat(data.platform_avg_days).toFixed(1) : null,
  };
}
```

**Why this pattern:** `PERCENT_RANK()` computes relative position in a single scan. Eliminates need for self-joins or multiple queries. Window function `OVER()` clause calculates platform averages in same query. Returns percentile (0-1) which app code converts to "top X%" messaging.

### Pattern 3: Redis Caching with TTL + Event-Driven Invalidation

**What:** Cache expensive aggregate queries (platform health metrics, percentile computations) in Redis with TTL expiration. Invalidate cache on submission status change or role closure events. Avoids recomputing platform-wide stats on every API call.

**When to use:** Admin dashboard health metrics (total users, revenue, etc.), platform-wide percentiles that change infrequently, recruiter tier distribution.

**Example:**
```typescript
// services/analytics-cache.service.ts
import { redis } from '../config/redis.js';

const CACHE_TTL = {
  PLATFORM_HEALTH: 300, // 5 minutes
  PERCENTILE_BANDS: 3600, // 1 hour
  FUNNEL_METRICS: 600, // 10 minutes
};

export async function getCachedPlatformHealth(): Promise<PlatformHealth | null> {
  const cached = await redis.get('analytics:platform-health');
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedPlatformHealth(data: PlatformHealth): Promise<void> {
  await redis.setex('analytics:platform-health', CACHE_TTL.PLATFORM_HEALTH, JSON.stringify(data));
}

export async function invalidatePlatformHealthCache(): Promise<void> {
  await redis.del('analytics:platform-health');
}

// services/analytics.service.ts
export async function getPlatformHealth() {
  // Try cache first
  const cached = await getCachedPlatformHealth();
  if (cached) return cached;

  // Cache miss — compute from DB
  const [
    totalCompanies,
    totalRecruiters,
    totalRoles,
    activeRoles,
    totalSubmissions,
    earningsAgg,
  ] = await Promise.all([
    prisma.companyProfile.count(),
    prisma.recruiterProfile.count(),
    prisma.role.count(),
    prisma.role.count({ where: { status: 'published' } }),
    prisma.submission.count(),
    prisma.earning.aggregate({ _sum: { grossAmount: true, platformCommission: true } }),
  ]);

  const health = {
    totalCompanies,
    totalRecruiters,
    totalRoles,
    activeRoles,
    totalSubmissions,
    totalRevenue: (earningsAgg._sum.grossAmount ?? new Prisma.Decimal(0)).toString(),
    platformCommission: (earningsAgg._sum.platformCommission ?? new Prisma.Decimal(0)).toString(),
  };

  // Cache for next request
  await setCachedPlatformHealth(health);
  return health;
}
```

**Event-driven invalidation:**
```typescript
// services/submission-status.service.ts (existing service, add invalidation)
import { invalidatePlatformHealthCache } from './analytics-cache.service.js';

export async function updateSubmissionStatus(...) {
  // ... existing status update logic ...

  // Invalidate analytics cache on status change
  await invalidatePlatformHealthCache(); // Admin dashboard metrics stale
  // Could also invalidate company-specific funnel cache here
}
```

**Why this pattern:** TTL prevents unbounded growth, event-driven invalidation ensures cache doesn't serve stale data after critical events. Platform health metrics don't change on every request — 5-minute staleness is acceptable. Reduces DB load by 95% for admin dashboard.

### Pattern 4: Date Range Filtering with Zod Validation

**What:** Accept `startDate` and `endDate` query params, validate with Zod, apply to Prisma `where` clauses. Provide sensible defaults (last 30 days, last 90 days) if not specified.

**When to use:** All analytics endpoints — funnel, scorecard, time-to-fill, platform health.

**Example:**
```typescript
// validators/analytics.ts
import { z } from 'zod';

const dateStringSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() !== '' ? new Date(v) : undefined),
  z.date().optional(),
);

export const AnalyticsQuerySchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  page: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().int().min(1).max(10_000).optional(),
  ).optional(),
  pageSize: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().int().min(1).max(100).optional(),
  ).optional(),
}).strict().refine(
  (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  { message: 'startDate must be before or equal to endDate' },
);

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;

// routes/analytics.ts
router.get('/funnel', ...authorize(UserRole.COMPANY), validate(AnalyticsQuerySchema, 'query'), async (req, res) => {
  const filters = req.query as unknown as AnalyticsQuery;
  const companyId = req.companyId!; // Set by authorize middleware

  // Default to last 90 days if not specified
  const startDate = filters.startDate ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const endDate = filters.endDate ?? new Date();

  const funnel = await analyticsService.getCompanyFunnel(companyId, { from: startDate, to: endDate });
  return ok(res, funnel);
});
```

**Why this pattern:** Zod handles date parsing and validation, `.refine()` ensures logical date ranges, default to 90 days prevents expensive unbounded queries. Matches existing pagination pattern in `validators/admin.ts`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Percentile calculation | Application-layer percentile with full dataset load + sort | PostgreSQL `PERCENT_RANK()` window function | Hand-rolled percentile requires loading ALL rows into memory, sorting, then picking the Nth value. `PERCENT_RANK()` computes in a single DB scan with <20ms latency. |
| Time-series aggregation | Custom bucketing logic with loops | PostgreSQL `date_trunc()` + `GROUP BY` | Reinventing time bucketing is error-prone (leap years, DST, timezones). `date_trunc('day', created_at)` handles edge cases correctly. |
| Cache invalidation | Custom TTL tracking with timestamps | Redis `SETEX` and `DEL` | Building your own expiration logic invites race conditions and memory leaks. Redis TTL is battle-tested and atomic. |
| Moving averages | Manual window calculation with OFFSET queries | PostgreSQL `LAG()` / `LEAD()` window functions | Computing 7-day moving average with application code requires N queries (one per window). Window functions compute all windows in one pass. |

**Key insight:** PostgreSQL window functions (`PERCENT_RANK()`, `LAG()`, `LEAD()`, `ROW_NUMBER()`) eliminate 90% of "analytics joins hell" — the pattern where you write nested CTEs with self-joins to compute rankings. Let the database engine handle partitioning and ordering; it's optimized for this exact workload.

## Common Pitfalls

### Pitfall 1: Prisma GroupBy Limitations with Calculated Fields
**What goes wrong:** Attempting complex aggregations like `SUM(field1 + field2)` or `AVG(field1 * field2)` via Prisma `groupBy()` fails with cryptic errors or returns incorrect results.

**Why it happens:** Prisma's `groupBy()` supports only scalar field aggregations (`_sum`, `_avg`, `_count`, `_min`, `_max` on single fields). Calculated expressions are NOT supported in the aggregation object. This is a documented limitation.

**How to avoid:** Use Prisma for simple aggregations (counts, sums on individual fields), fallback to `$queryRaw` for complex calculations. Check Prisma docs before assuming an aggregation is possible.

**Warning signs:** Error message "Unknown arg `_sum.fieldExpression`" or aggregation returns `null` unexpectedly. If you see these, switch to raw SQL.

**Example workaround:**
```typescript
// ❌ DOES NOT WORK — Prisma can't aggregate calculated fields
const result = await prisma.earning.groupBy({
  by: ['recruiterId'],
  _sum: {
    totalPayout: true, // ❌ Can't do grossAmount + platformCommission
  },
});

// ✅ Use $queryRaw instead
const result = await prisma.$queryRaw<{ recruiter_id: string; total_payout: string }[]>`
  SELECT
    recruiter_id,
    SUM(gross_amount + platform_commission) AS total_payout
  FROM earnings
  GROUP BY recruiter_id;
`;
```

**Source:** [Prisma groupBy documentation](https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing), [Discussion #21237](https://github.com/prisma/prisma/discussions/21237)

### Pitfall 2: Offset Pagination Performance Degradation at Scale
**What goes wrong:** Offset-based pagination (`LIMIT 25 OFFSET 10000`) becomes increasingly slow as offset grows. At `OFFSET 100,000`, PostgreSQL scans and discards 100K rows on every request, causing multi-second query times.

**Why it happens:** Offset pagination requires the database to count and skip N rows from the beginning of the result set on EVERY query. This is O(n) complexity — the deeper you paginate, the slower it gets.

**How to avoid:** For analytics dashboards, users rarely paginate beyond page 10-20. Offset is acceptable here. If building infinite scroll or deep pagination (>10K records), switch to cursor-based pagination (keyset pagination using `WHERE id > lastSeenId`).

**Warning signs:** Query times increase linearly with page number. `EXPLAIN ANALYZE` shows large "rows removed by filter" count.

**When to care:** Analytics dashboards with <10K records per query — DON'T worry about this. User-facing submission lists with >100K records — DO switch to cursor pagination.

**Example decision tree:**
```typescript
// Analytics dashboard: offset is fine (max 10K roles per company)
const roles = await prisma.role.findMany({
  where: { companyId },
  skip: (page - 1) * pageSize, // ✅ OK for analytics
  take: pageSize,
});

// Public browse roles: cursor pagination needed (100K+ roles platform-wide)
const roles = await prisma.role.findMany({
  where: { status: 'published', id: { gt: cursor } }, // ✅ Keyset pagination
  take: pageSize,
  orderBy: { id: 'asc' },
});
```

**Source:** [REST API Pagination Patterns](https://knowledgelib.io/software/patterns/rest-pagination/2026), [Express.js Pagination Best Practices](https://www.leadwithskills.com/blogs/expressjs-pagination-filtering-api)

### Pitfall 3: Redis Cache Stampede on Expiration
**What goes wrong:** When a heavily-accessed cache key expires, multiple concurrent requests all trigger cache regeneration simultaneously. This creates a "thundering herd" — N identical expensive DB queries execute at once, overwhelming the database and negating the cache benefit.

**Why it happens:** TTL expiration is atomic — the moment the key expires, ALL requests see cache miss. Without coordination, every request tries to rebuild the cache.

**How to avoid:** Implement "cache stampede protection" with a lock-and-wait pattern or probabilistic early expiration.

**Warning signs:** Sudden DB query spikes at regular intervals (matching cache TTL), multiple identical slow queries in logs at the same timestamp.

**Example solution (lock-and-wait pattern):**
```typescript
// services/analytics-cache.service.ts
const CACHE_LOCK_TTL = 30; // 30 seconds to recompute

export async function getCachedOrCompute<T>(
  cacheKey: string,
  computeFn: () => Promise<T>,
  ttl: number,
): Promise<T> {
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Cache miss — try to acquire lock
  const lockKey = `${cacheKey}:lock`;
  const lockAcquired = await redis.set(lockKey, '1', 'EX', CACHE_LOCK_TTL, 'NX');

  if (lockAcquired === 'OK') {
    // This request won the race — compute and cache
    try {
      const data = await computeFn();
      await redis.setex(cacheKey, ttl, JSON.stringify(data));
      return data;
    } finally {
      await redis.del(lockKey); // Release lock
    }
  } else {
    // Another request is computing — wait and retry
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
    const retryCached = await redis.get(cacheKey);
    if (retryCached) return JSON.parse(retryCached);

    // Still not cached — fallback to direct compute (safety valve)
    return computeFn();
  }
}
```

**Simpler alternative (probabilistic early expiration):**
```typescript
// Refresh cache probabilistically BEFORE actual expiration
// If TTL is 300s, start refreshing when <30s remain (10% of TTL)
const EARLY_EXPIRY_BETA = 0.1;
const ttlRemaining = await redis.ttl(cacheKey);
if (ttlRemaining > 0 && ttlRemaining < ttl * EARLY_EXPIRY_BETA) {
  // Refresh cache in background without blocking request
  computeFn().then(data => redis.setex(cacheKey, ttl, JSON.stringify(data)));
}
```

**Source:** [Redis Cache Invalidation Best Practices](https://oneuptime.com/blog/post/2026-01-25-redis-cache-invalidation/view), [Cache Optimization Strategies](https://redis.io/blog/guide-to-cache-optimization-strategies/)

### Pitfall 4: Window Function NULL Handling Surprises
**What goes wrong:** `PERCENT_RANK()` or `AVG()` OVER window clauses return unexpected `NULL` values when partitions contain NULLs, causing frontend crashes with "Cannot read property 'toFixed' of null".

**Why it happens:** Window functions operate per partition. If a partition has no valid (non-NULL) rows, aggregates return NULL. `PERCENT_RANK()` returns NULL if there's only one row in the partition (no peers to rank against).

**How to avoid:** Use `FILTER (WHERE ...)` to exclude NULLs from aggregation, provide `COALESCE()` defaults, handle NULL in TypeScript with optional chaining.

**Warning signs:** Intermittent frontend crashes, TypeScript "possibly null" errors, inconsistent scorecard metrics for new recruiters.

**Example fix:**
```sql
-- ❌ Returns NULL if recruiter has no hires
AVG(EXTRACT(EPOCH FROM (s.updated_at - s.created_at)) / 86400.0) AS avg_days_to_hire

-- ✅ FILTER excludes non-hired submissions from average
AVG(EXTRACT(EPOCH FROM (s.updated_at - s.created_at)) / 86400.0) FILTER (WHERE s.status = 'hired') AS avg_days_to_hire

-- ✅ COALESCE provides default if no hires exist
COALESCE(
  AVG(EXTRACT(EPOCH FROM (s.updated_at - s.created_at)) / 86400.0) FILTER (WHERE s.status = 'hired'),
  0
) AS avg_days_to_hire
```

**TypeScript safety:**
```typescript
// Always handle NULL from window functions
const avgDays = data.avg_days_to_hire ? parseFloat(data.avg_days_to_hire).toFixed(1) : 'N/A';
```

**Source:** [PostgreSQL Window Functions](https://oneuptime.com/blog/post/2026-01-25-postgresql-window-functions/view), [PERCENT_RANK() Documentation](https://neon.com/postgresql/postgresql-window-function/postgresql-percent_rank-function)

### Pitfall 5: Date Range Filtering with Timezone Confusion
**What goes wrong:** Client sends `startDate: "2026-04-01"`, server interprets as UTC midnight, but database timestamps are in IST (India Standard Time, UTC+5:30). Query misses 5.5 hours of data, funnel metrics are incorrect.

**Why it happens:** Dates without explicit timezone default to UTC in JavaScript `Date()` constructor, but PostgreSQL `TIMESTAMPTZ` columns store in UTC and display in session timezone. Mismatch causes off-by-hours errors.

**How to avoid:** Always parse date strings with explicit timezone handling. Use `startOf('day')` and `endOf('day')` in application timezone. Prisma returns `Date` objects in UTC — convert to local timezone if needed.

**Warning signs:** Metrics change depending on time of day request is made, first/last records of day missing from results, end-to-end tests fail in CI (different timezone).

**Example fix:**
```typescript
// ❌ WRONG — UTC interpretation, misses IST morning records
const startDate = new Date(req.query.startDate); // "2026-04-01" → 2026-04-01T00:00:00Z

// ✅ CORRECT — Explicit timezone conversion
import { parseISO, startOfDay, endOfDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';

const userTimezone = 'Asia/Kolkata'; // From user profile or request header
const startDate = zonedTimeToUtc(startOfDay(parseISO(req.query.startDate)), userTimezone);
const endDate = zonedTimeToUtc(endOfDay(parseISO(req.query.endDate)), userTimezone);

// Now Prisma query matches user's local day boundaries
const submissions = await prisma.submission.findMany({
  where: {
    createdAt: { gte: startDate, lte: endDate },
  },
});
```

**Simpler alternative if all users in one timezone:**
```typescript
// If entire platform operates in IST, standardize on that
const IST_OFFSET = 5.5 * 60 * 60 * 1000; // +5:30 in milliseconds
const startDate = new Date(new Date(req.query.startDate).getTime() + IST_OFFSET);
```

**Source:** Project constraint (India-focused, IST timezone), [date-fns-tz documentation](https://date-fns.org/docs/Time-Zones)

## Code Examples

Verified patterns from project codebase:

### Example 1: Pagination + Filtering Pattern (From admin.service.ts)
```typescript
// Source: apps/api/src/services/admin.service.ts
export interface ListUsersFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listUsers(filters: ListUsersFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.UserWhereInput = {};

  if (filters.role) {
    where.role = filters.role as Prisma.EnumUserRoleFilter['equals'];
  }

  if (filters.status) {
    where.status = filters.status as Prisma.EnumUserStatusFilter['equals'];
  }

  if (filters.search) {
    const term = filters.search;
    where.OR = [
      { email: { contains: term, mode: 'insensitive' } },
      { recruiterProfile: { fullName: { contains: term, mode: 'insensitive' } } },
      { companyProfile: { companyName: { contains: term, mode: 'insensitive' } } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: { /* ... */ },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, pageSize };
}
```

**Apply to analytics:** Same pattern for listing roles with performance metrics, submissions by recruiter, etc. Always return `{ data, total, page, pageSize }` for frontend pagination controls.

### Example 2: Decimal Serialization at JSON Boundary (From admin.service.ts)
```typescript
// Source: apps/api/src/services/admin.service.ts
const [earnings, total, agg] = await Promise.all([
  prisma.earning.findMany({ /* ... */ }),
  prisma.earning.count({ where }),
  prisma.earning.aggregate({
    where,
    _sum: { grossAmount: true, platformCommission: true, netAmount: true },
  }),
]);

// ✅ ALWAYS .toString() Prisma.Decimal at JSON boundary
const serialized = earnings.map((e) => ({
  ...e,
  grossAmount: e.grossAmount.toString(),
  platformCommission: e.platformCommission.toString(),
  platformCommissionPct: e.platformCommissionPct.toString(),
  netAmount: e.netAmount.toString(),
}));

return {
  earnings: serialized,
  total,
  page,
  pageSize,
  totals: {
    grossAmount: (agg._sum.grossAmount ?? new Prisma.Decimal(0)).toString(),
    platformCommission: (agg._sum.platformCommission ?? new Prisma.Decimal(0)).toString(),
    netAmount: (agg._sum.netAmount ?? new Prisma.Decimal(0)).toString(),
  },
};
```

**Apply to analytics:** Cost metrics, CTC aggregates, payout totals all use `Prisma.Decimal`. Must serialize to string before JSON response or frontend receives `{}` (Decimal is not JSON-serializable).

### Example 3: TanStack Query Hook with Stale Time (From admin hooks)
```typescript
// Source: apps/web/src/features/admin/hooks.ts pattern
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics-api';

export function useCompanyFunnel(dateRange: { startDate?: Date; endDate?: Date }) {
  return useQuery({
    queryKey: ['analytics', 'funnel', dateRange],
    queryFn: () => analyticsApi.getCompanyFunnel(dateRange),
    staleTime: 30_000, // 30 seconds — funnel metrics don't need real-time precision
  });
}

export function useRecruiterScorecard() {
  return useQuery({
    queryKey: ['analytics', 'recruiter', 'scorecard'],
    queryFn: () => analyticsApi.getRecruiterScorecard(),
    staleTime: 60_000, // 1 minute — scorecard updates infrequently
  });
}

export function usePlatformHealth() {
  return useQuery({
    queryKey: ['analytics', 'platform', 'health'],
    queryFn: () => analyticsApi.getPlatformHealth(),
    staleTime: 15_000, // 15 seconds — admin dashboard
  });
}
```

**Apply to analytics:** Match stale time to cache TTL on backend. If Redis caches platform health for 5 minutes, frontend can safely use 15-second stale time (refetch 20x less often than without caching).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Application-layer percentile calculation with in-memory sort | PostgreSQL `PERCENT_RANK()` window function | PostgreSQL 9.4 (2014), widely adopted 2020+ | 100x performance improvement for ranking queries. Eliminates need to load full dataset into app memory. |
| Offset pagination for all use cases | Cursor (keyset) pagination for large datasets | 2020+ (popularized by GraphQL Relay spec) | Constant-time pagination at any offset. Offset still preferred for analytics dashboards with <10K records. |
| Manual cache invalidation with application logic | Redis TTL + event-driven invalidation | 2018+ (microservices era best practices) | Automatic expiration prevents stale data accumulation. Event-driven invalidation keeps cache fresh without polling. |
| Separate time-series database (InfluxDB, TimescaleDB) | PostgreSQL native window functions + date_trunc | PostgreSQL 16+ (2023) with improved window function performance | Eliminates operational overhead of managing separate DB. PostgreSQL handles <10M time-series rows efficiently. |

**Deprecated/outdated:**
- **Separate analytics database (ClickHouse, Druid):** Necessary at >100M events/day, overkill for GigCruite's scale (<1M submissions total). Keep analytics queries in same PostgreSQL instance.
- **Client-side aggregation:** Fetching raw submission data and computing funnel on frontend. Obsolete — always aggregate server-side for performance and security.

## Open Questions

1. **Should we implement real-time analytics updates via WebSocket?**
   - What we know: TanStack Query polling with `refetchInterval` works for dashboard updates. WebSocket adds complexity (connection management, reconnection logic).
   - What's unclear: Do users need sub-second metric updates, or is 15-30 second polling sufficient?
   - Recommendation: Start with polling (`refetchInterval: 15_000`). Add WebSocket only if user feedback demands real-time updates. Most analytics dashboards don't need <15s latency.

2. **What's the retention policy for HiringMetric snapshots?**
   - What we know: HiringMetric rows are created when roles reach terminal state (filled/closed). They're immutable snapshots.
   - What's unclear: Do we keep these forever, or archive after 2 years? Current dataset is <1000 roles, but at scale (100K roles) table size becomes an issue.
   - Recommendation: No retention policy needed in Phase 13. Defer to Phase 16 (scalability) if table grows beyond 100K rows. PostgreSQL handles 1M row analytics tables efficiently.

3. **How do we handle incomplete data for new recruiters/roles?**
   - What we know: Recruiters with <3 submissions will have meaningless percentile ranks. Roles closed after 1 day skew time-to-fill averages.
   - What's unclear: Should we exclude outliers (roles filled in <3 days or >180 days)? Should we require minimum sample size before showing percentile?
   - Recommendation: Show percentile only if recruiter has ≥10 submissions AND platform has ≥50 recruiters. Display "Insufficient data" message otherwise. Add `minSampleSize` validation in analytics service.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x (inferred from stack, TBD during Wave 0) |
| Config file | vitest.config.ts (to be created in Wave 0) |
| Quick run command | `npm test -- analytics` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANLY-01 | Company funnel returns correct conversion rates for date range | integration | `npm test -- src/services/analytics.service.test.ts -t "funnel"` | ❌ Wave 0 |
| ANLY-02 | Recruiter scorecard computes percentile rank vs platform avg | integration | `npm test -- src/services/analytics.service.test.ts -t "scorecard"` | ❌ Wave 0 |
| ANLY-03 | Platform health metrics cached for 5 minutes | integration | `npm test -- src/services/analytics-cache.service.test.ts -t "health"` | ❌ Wave 0 |
| ANLY-04 | Time-to-fill returns p25/p50/p75/p90 percentile bands | integration | `npm test -- src/services/analytics.service.test.ts -t "time-to-fill"` | ❌ Wave 0 |
| ANLY-05 | All analytics queries complete in <500ms with 10K records | performance | Manual benchmark script (not automated) | ❌ Wave 0 |
| ANLY-06 | Platform baseline computed from HiringMetric table, not external data | unit | `npm test -- src/services/analytics.service.test.ts -t "baseline"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- analytics` (run analytics test suite, ~30 seconds)
- **Per wave merge:** `npm test` (full suite including E2E)
- **Phase gate:** Full suite green + manual performance validation with 10K seed data

### Wave 0 Gaps
- [ ] `vitest.config.ts` — test framework config (if not already exists)
- [ ] `src/services/analytics.service.test.ts` — unit/integration tests for funnel, scorecard, time-to-fill
- [ ] `src/services/analytics-cache.service.test.ts` — Redis caching behavior tests
- [ ] `test/fixtures/analytics-seed.sql` — 10K submission seed data for performance testing
- [ ] Framework install: `npm install -D vitest @vitest/ui` (if not already installed)

## Sources

### Primary (HIGH confidence)
- [Prisma Aggregation Documentation](https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing) — Official guide for aggregate() and groupBy() capabilities and limitations
- [PostgreSQL Window Functions Documentation](https://www.postgresql.org/docs/current/functions-window.html) — Authoritative reference for PERCENT_RANK(), LAG(), LEAD(), PARTITION BY
- [PostgreSQL PERCENT_RANK() Examples](https://neon.com/postgresql/postgresql-window-function/postgresql-percent_rank-function) — Practical examples of percentile calculation
- Project codebase (`apps/api/src/services/admin.service.ts`, `apps/api/src/validators/admin.ts`) — Established patterns for pagination, filtering, Decimal serialization

### Secondary (MEDIUM confidence)
- [API Pagination Strategies 2026](https://oneuptime.com/blog/post/2026-01-30-api-pagination-strategies/view) — Offset vs cursor pagination tradeoffs
- [Express.js Pagination and Filtering Best Practices](https://www.leadwithskills.com/blogs/expressjs-pagination-filtering-api) — Query parameter handling, date range filtering
- [Redis Cache Invalidation Strategies](https://oneuptime.com/blog/post/2026-01-25-redis-cache-invalidation/view) — TTL-based expiration, event-driven invalidation, stampede protection
- [PostgreSQL Window Functions for Analytics](https://oneuptime.com/blog/post/2026-01-25-postgresql-window-functions/view) — Performance characteristics, NULL handling
- [Hiring Funnel Analysis Best Practices 2026](https://www.mokahr.io/myblog/hiring-funnel-analysis-best-practices-2026/) — Funnel stage definitions, conversion rate benchmarks
- [Recruiter Scorecard Performance Metrics](https://treegarden.io/blog/recruiter-scorecard-performance/) — Fair benchmarking, sample size considerations

### Tertiary (LOW confidence)
- [Prisma groupBy GitHub Discussions](https://github.com/prisma/prisma/discussions/21237) — Community workarounds for calculated field limitations (not official guidance)
- [Redis Caching Strategies for Video Platforms](https://dev.to/ahmet_gedik778845/redis-caching-strategies-for-video-content-platforms-53id) — General caching patterns (not analytics-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries already in project (Prisma, PostgreSQL, ioredis, Zod, Express). No new dependencies required for core functionality.
- Architecture: HIGH — Window functions, Prisma patterns, Redis caching are well-documented and proven at scale. Project already uses these patterns in admin.service.ts.
- Pitfalls: HIGH — Prisma groupBy limitations documented in official GitHub issues, window function NULL handling verified in PostgreSQL docs, offset pagination performance degradation is well-known industry pattern.

**Research date:** 2026-04-24
**Valid until:** 2026-07-24 (90 days — PostgreSQL, Prisma, and caching patterns are stable; analytics API design is mature)
