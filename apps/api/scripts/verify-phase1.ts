/**
 * Phase 1 Verification Smoke Test — items #3, #5, #6, #7, #8, #9, #10.
 *
 * Exercises the REAL HTTP API running on localhost:4000 (started via
 * `npm --workspace @gigcruite/api run dev`) against the live AWS EC2
 * PostgreSQL + Redis instances.
 *
 * Usage:
 *   # (in one terminal) npm --workspace @gigcruite/api run dev
 *   # (in another)       npx tsx apps/api/scripts/verify-phase1.ts
 *
 * Idempotent: creates fixture users with fixed emails, cleans them up
 * in a finally block so repeat runs start from a known state. Does NOT
 * touch the seeded admin user.
 *
 * Rate-limiter handling:
 *   The public limiter is 10 req / 60s / IP and is mounted globally on
 *   /api/v1. The script wipes all `ratelimit:*` Redis keys between logical
 *   test groups so a single run can execute >10 requests without self-
 *   throttling. The rate-limit test (sub-test 17) is the ONE exception —
 *   it intentionally does NOT clear, then fires 11 requests to observe 429.
 */
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';

// ---------- config ----------

const BASE = 'http://localhost:4000/api/v1';
const REFRESH_COOKIE = 'gigcruite_refresh';

const RECRUITER_EMAIL = 'smoke-recruiter-phase1@gigcruite.test';
const COMPANY_EMAIL = 'smoke-company-phase1@gigcruite.test';
const PASSWORD = 'SmokeTest@Phase1#2026';
const WRONG_PASSWORD = 'Definitely-Wrong-Password-1!';

// ---------- tiny color helpers (no deps) ----------

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// ---------- result tracking ----------

interface Result {
  num: string;
  label: string;
  ok: boolean;
  detail: string;
  verificationItem?: string;
}
const results: Result[] = [];

function record(
  num: string,
  label: string,
  ok: boolean,
  detail: string,
  verificationItem?: string,
): void {
  results.push({ num, label, ok, detail, verificationItem });
  const mark = ok ? `${c.green}[PASS]${c.reset}` : `${c.red}[FAIL]${c.reset}`;
  const tag = verificationItem ? `${c.cyan}${verificationItem}${c.reset} ` : '';
  console.log(`  ${mark} ${c.bold}${num}${c.reset} ${tag}${label}`);
  if (detail) console.log(`        ${c.gray}${detail}${c.reset}`);
}

function section(title: string): void {
  console.log('');
  console.log(`${c.bold}${c.cyan}=== ${title} ===${c.reset}`);
}

// ---------- HTTP helper ----------

interface HttpResponse {
  status: number;
  body: unknown;
  headers: Headers;
}

async function http(
  method: string,
  path: string,
  options: { body?: unknown; accessToken?: string; cookie?: string } = {},
): Promise<HttpResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }
  if (options.cookie) {
    headers['Cookie'] = `${REFRESH_COOKIE}=${options.cookie}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let body: unknown = null;
  const text = await res.text();
  try {
    body = text.length ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body, headers: res.headers };
}

/**
 * Extract the refresh cookie value from a Set-Cookie header. Returns
 * undefined if no gigcruite_refresh cookie is present. Parses the standard
 * `name=value; attr=...` form without pulling in a cookie library.
 */
function parseRefreshCookie(res: HttpResponse): string | undefined {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return undefined;
  // Node's fetch collapses multiple Set-Cookie into one string separated by
  // commas, but commas can also appear inside Expires=... attributes. We
  // only need to locate `gigcruite_refresh=` and read until the next ;.
  const idx = setCookie.indexOf(`${REFRESH_COOKIE}=`);
  if (idx < 0) return undefined;
  const start = idx + REFRESH_COOKIE.length + 1;
  const end = setCookie.indexOf(';', start);
  return end < 0 ? setCookie.slice(start) : setCookie.slice(start, end);
}

type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: unknown };

function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'success' in body) {
    const env = body as ApiEnvelope<T>;
    if (env.success) return env.data;
  }
  throw new Error(`Unexpected response body: ${JSON.stringify(body).slice(0, 200)}`);
}

// ---------- rate-limit helper ----------

async function clearRateLimits(): Promise<void> {
  const keys = await redis.keys('ratelimit:*');
  if (keys.length) await redis.del(...keys);
}

// ---------- db cleanup ----------

async function cleanupFixtures(): Promise<void> {
  await prisma.user.deleteMany({
    where: { email: { in: [RECRUITER_EMAIL, COMPANY_EMAIL] } },
  });
}

// ---------- main ----------

async function main(): Promise<void> {
  console.log(`${c.bold}GigCruite Phase 1 Verification Smoke Test${c.reset}`);
  console.log(`${c.dim}Target: ${BASE}${c.reset}`);

  // Sanity: API reachable
  section('Sanity');
  try {
    const res = await http('GET', '/health');
    record(
      '0.0',
      'API reachable on /health',
      res.status === 200,
      `status=${res.status}`,
    );
    if (res.status !== 200) {
      console.log(
        `\n${c.red}Cannot reach API at ${BASE}/health. Is \`npm --workspace @gigcruite/api run dev\` running?${c.reset}`,
      );
      return;
    }
  } catch (err) {
    console.log(
      `\n${c.red}Cannot reach API at ${BASE}/health: ${(err as Error).message}${c.reset}`,
    );
    console.log(`${c.yellow}Is the API dev server running on port 4000?${c.reset}`);
    return;
  }

  // Pre-clean
  await cleanupFixtures();
  await clearRateLimits();

  // ========== Sub-test 3.1 — health ==========
  section('Auth foundation');
  {
    await clearRateLimits();
    const res = await http('GET', '/health');
    record(
      '3.1',
      'GET /health → 200',
      res.status === 200,
      `status=${res.status}`,
      '#3',
    );
  }

  // ========== Sub-test 3.3 — register recruiter ==========
  let recruiterAccessToken = '';
  let recruiterRefreshCookie = '';
  {
    await clearRateLimits();
    const res = await http('POST', '/auth/register', {
      body: {
        role: 'recruiter',
        email: RECRUITER_EMAIL,
        password: PASSWORD,
        fullName: 'Smoke Test Recruiter',
        phone: '+919876543210',
      },
    });
    const ok = res.status === 201;
    if (ok) {
      const data = unwrap<{ user: { id: string; role: string }; accessToken: string }>(
        res.body,
      );
      recruiterAccessToken = data.accessToken;
      recruiterRefreshCookie = parseRefreshCookie(res) ?? '';
      record(
        '3.3',
        'POST /auth/register RECRUITER → 201 + tokens + cookie',
        Boolean(
          recruiterAccessToken &&
            recruiterRefreshCookie &&
            data.user.role === 'recruiter',
        ),
        `userId=${data.user.id.slice(0, 8)}… role=${data.user.role} cookie=${Boolean(recruiterRefreshCookie)}`,
        '#5a',
      );
    } else {
      record(
        '3.3',
        'POST /auth/register RECRUITER → 201',
        false,
        `status=${res.status} body=${JSON.stringify(res.body).slice(0, 200)}`,
        '#5a',
      );
    }
  }

  // ========== Sub-test 3.4 — register company ==========
  let companyAccessToken = '';
  {
    await clearRateLimits();
    const res = await http('POST', '/auth/register', {
      body: {
        role: 'company',
        email: COMPANY_EMAIL,
        password: PASSWORD,
        companyName: 'Smoke Test Co',
        industry: 'Software',
        companySize: '11-50',
        contactPerson: 'QA Bot',
      },
    });
    const ok = res.status === 201;
    if (ok) {
      const data = unwrap<{ user: { id: string; role: string }; accessToken: string }>(
        res.body,
      );
      companyAccessToken = data.accessToken;
      record(
        '3.4',
        'POST /auth/register COMPANY → 201 + tokens + cookie',
        Boolean(companyAccessToken && data.user.role === 'company'),
        `userId=${data.user.id.slice(0, 8)}… role=${data.user.role}`,
        '#5b',
      );
    } else {
      record(
        '3.4',
        'POST /auth/register COMPANY → 201',
        false,
        `status=${res.status} body=${JSON.stringify(res.body).slice(0, 200)}`,
        '#5b',
      );
    }
  }

  // ========== Sub-test 3.5 — duplicate email ==========
  {
    await clearRateLimits();
    const res = await http('POST', '/auth/register', {
      body: {
        role: 'recruiter',
        email: RECRUITER_EMAIL,
        password: PASSWORD,
        fullName: 'Dup',
      },
    });
    record(
      '3.5',
      'POST /auth/register duplicate email → 409',
      res.status === 409,
      `status=${res.status}`,
    );
  }

  // ========== Sub-test 3.6 — failed login tracking + lockout ==========
  section('Login, lockout, refresh rotation');
  {
    await clearRateLimits();
    // Flip the recruiter to 'active' status so failed login tests aren't
    // confounded by a pending_verification rejection (sub-test 3.8 checks
    // that gate separately on the COMPANY fixture).
    await prisma.user.update({
      where: { email: RECRUITER_EMAIL },
      data: { status: 'active', emailVerified: true },
    });

    let finalStatus = 0;
    for (let i = 1; i <= 5; i++) {
      await clearRateLimits();
      const r = await http('POST', '/auth/login', {
        body: { email: RECRUITER_EMAIL, password: WRONG_PASSWORD },
      });
      finalStatus = r.status;
      if (r.status !== 401) break;
    }
    const dbUser = await prisma.user.findUnique({ where: { email: RECRUITER_EMAIL } });
    const locked = Boolean(dbUser?.lockedUntil && dbUser.lockedUntil > new Date());
    const attemptsHit = dbUser?.failedLoginAttempts ?? 0;
    record(
      '3.6',
      'Failed login tracking → 5× 401, then account locked',
      finalStatus === 401 && locked && attemptsHit >= 5,
      `lastStatus=${finalStatus} failedAttempts=${attemptsHit} locked=${locked}`,
      '#6',
    );
  }

  // ========== Sub-test 3.7 — clear lockout, login success ==========
  {
    await clearRateLimits();
    // Manually clear the lockout so a fresh correct password proceeds.
    await prisma.user.update({
      where: { email: RECRUITER_EMAIL },
      data: { lockedUntil: null, failedLoginAttempts: 0 },
    });

    const res = await http('POST', '/auth/login', {
      body: { email: RECRUITER_EMAIL, password: PASSWORD },
    });
    const ok = res.status === 200;
    if (ok) {
      const data = unwrap<{ accessToken: string }>(res.body);
      recruiterAccessToken = data.accessToken;
      recruiterRefreshCookie = parseRefreshCookie(res) ?? recruiterRefreshCookie;
      const dbUser = await prisma.user.findUnique({
        where: { email: RECRUITER_EMAIL },
      });
      record(
        '3.7',
        'Login success after lockout cleared → counters reset',
        dbUser?.failedLoginAttempts === 0 && !dbUser?.lockedUntil,
        `failedAttempts=${dbUser?.failedLoginAttempts} lockedUntil=${dbUser?.lockedUntil}`,
        '#6',
      );
    } else {
      record(
        '3.7',
        'Login success after lockout cleared',
        false,
        `status=${res.status}`,
        '#6',
      );
    }
  }

  // ========== Sub-test 3.8 — UserStatus gate (GAP CHECK) ==========
  {
    await clearRateLimits();
    // The COMPANY fixture was just registered and is still in
    // pending_verification. Per trust-first spec, a fresh un-verified user
    // should NOT be able to log in until email verification. This test
    // documents the actual behavior — if login succeeds, that's a Phase 1
    // hardening gap that Part 5 will fix.
    const dbBefore = await prisma.user.findUnique({ where: { email: COMPANY_EMAIL } });
    const res = await http('POST', '/auth/login', {
      body: { email: COMPANY_EMAIL, password: PASSWORD },
    });
    const allowedThrough = res.status === 200;
    record(
      '3.8',
      'UserStatus gate: pending_verification should NOT log in',
      !allowedThrough, // PASS if blocked, FAIL if allowed
      `status=${res.status} dbStatus=${dbBefore?.status} → ${
        allowedThrough ? 'GAP: login succeeded for unverified user' : 'blocked as expected'
      }`,
      'gap',
    );
  }

  // ========== Sub-test 3.9 — refresh rotation ==========
  let oldRefreshCookie = recruiterRefreshCookie;
  {
    await clearRateLimits();
    const res = await http('POST', '/auth/refresh', {
      cookie: oldRefreshCookie,
    });
    const ok = res.status === 200;
    const newRefresh = parseRefreshCookie(res);
    const rotated = Boolean(newRefresh && newRefresh !== oldRefreshCookie);
    if (ok) {
      const data = unwrap<{ accessToken: string }>(res.body);
      recruiterAccessToken = data.accessToken;
      if (newRefresh) {
        oldRefreshCookie = recruiterRefreshCookie; // keep OLD for reuse test
        recruiterRefreshCookie = newRefresh;
      }
    }
    record(
      '3.9',
      'POST /auth/refresh → new pair, refresh cookie rotated',
      ok && rotated,
      `status=${res.status} rotated=${rotated}`,
      '#7a',
    );
  }

  // ========== Sub-test 3.10 — refresh reuse detection ==========
  {
    await clearRateLimits();
    // Replay the OLD refresh cookie — should trigger reuse detection
    // and invalidate ALL sessions for this user.
    const res = await http('POST', '/auth/refresh', {
      cookie: oldRefreshCookie,
    });
    const rejected = res.status === 401;

    // And the NEW one should ALSO now be dead (all sessions invalidated).
    const res2 = await http('POST', '/auth/refresh', {
      cookie: recruiterRefreshCookie,
    });
    const newAlsoDead = res2.status === 401;

    // Also check DB state: refreshTokenHash should be nulled out.
    const dbUser = await prisma.user.findUnique({
      where: { email: RECRUITER_EMAIL },
    });
    const hashCleared = dbUser?.refreshTokenHash === null;

    record(
      '3.10',
      'Refresh reuse detection → old rejected + all sessions invalidated',
      rejected && newAlsoDead && hashCleared,
      `oldReplay=${res.status} newAfter=${res2.status} refreshHashCleared=${hashCleared}`,
      '#7b',
    );

    // Re-login fresh so subsequent tests have a working recruiter token.
    await clearRateLimits();
    const loginRes = await http('POST', '/auth/login', {
      body: { email: RECRUITER_EMAIL, password: PASSWORD },
    });
    if (loginRes.status === 200) {
      const data = unwrap<{ accessToken: string }>(loginRes.body);
      recruiterAccessToken = data.accessToken;
    }
  }

  // ========== Sub-test 3.11 — RBAC 401 no token ==========
  section('RBAC + profile CRUD + PAN masking');
  {
    await clearRateLimits();
    const res = await http('GET', '/recruiters/me');
    record(
      '3.11',
      'GET /recruiters/me without token → 401',
      res.status === 401,
      `status=${res.status}`,
      '#8a',
    );
  }

  // ========== Sub-test 3.12 — RBAC 403 wrong role ==========
  {
    await clearRateLimits();
    // Flip the company user to active so its token is valid and only the
    // role check can reject the request — isolates 403 vs 401.
    await prisma.user.update({
      where: { email: COMPANY_EMAIL },
      data: { status: 'active', emailVerified: true },
    });
    // Get a fresh company token
    const loginRes = await http('POST', '/auth/login', {
      body: { email: COMPANY_EMAIL, password: PASSWORD },
    });
    const freshCompanyToken =
      loginRes.status === 200
        ? unwrap<{ accessToken: string }>(loginRes.body).accessToken
        : companyAccessToken;

    await clearRateLimits();
    const res = await http('GET', '/recruiters/me', { accessToken: freshCompanyToken });
    record(
      '3.12',
      'GET /recruiters/me with COMPANY token → 403',
      res.status === 403,
      `status=${res.status}`,
      '#8b',
    );
  }

  // ========== Sub-test 3.13 — profile GET ==========
  {
    await clearRateLimits();
    const res = await http('GET', '/recruiters/me', {
      accessToken: recruiterAccessToken,
    });
    const ok = res.status === 200;
    if (ok) {
      const data = unwrap<{
        fullName: string;
        hasBankDetails: boolean;
        panMasked: string | null;
        bankAccountMasked: string | null;
        walletBalance: string;
      }>(res.body);
      record(
        '3.13',
        'GET /recruiters/me → profile, hasBankDetails=false, wallet decimal as string',
        !data.hasBankDetails &&
          data.panMasked === null &&
          data.bankAccountMasked === null &&
          typeof data.walletBalance === 'string',
        `fullName="${data.fullName}" hasBankDetails=${data.hasBankDetails} walletBalance=${data.walletBalance}`,
        '#9a',
      );
    } else {
      record(
        '3.13',
        'GET /recruiters/me',
        false,
        `status=${res.status}`,
        '#9a',
      );
    }
  }

  // ========== Sub-test 3.14 — profile PUT ==========
  {
    await clearRateLimits();
    const res = await http('PUT', '/recruiters/me', {
      accessToken: recruiterAccessToken,
      body: {
        fullName: 'Smoke Recruiter Updated',
        bio: 'Automated smoke test fixture',
        yearsOfExperience: 7,
        specializations: ['fullstack', 'devops'],
      },
    });
    const ok = res.status === 200;
    if (ok) {
      const data = unwrap<{
        fullName: string;
        bio: string | null;
        yearsOfExperience: number | null;
        specializations: string[];
      }>(res.body);
      record(
        '3.14',
        'PUT /recruiters/me → updated fields persisted',
        data.fullName === 'Smoke Recruiter Updated' &&
          data.yearsOfExperience === 7 &&
          data.specializations.length === 2,
        `fullName="${data.fullName}" yoe=${data.yearsOfExperience} specs=${data.specializations.join(',')}`,
        '#9b',
      );
    } else {
      record('3.14', 'PUT /recruiters/me', false, `status=${res.status}`, '#9b');
    }
  }

  // ========== Sub-test 3.15 — bank details PUT ==========
  {
    await clearRateLimits();
    const res = await http('PUT', '/recruiters/me/bank-details', {
      accessToken: recruiterAccessToken,
      body: {
        pan: 'ABCDE1234F',
        bankAccount: '1234567890',
        bankIfsc: 'HDFC0001234',
        bankAccountHolderName: 'Smoke Recruiter',
      },
    });
    const ok = res.status === 200;
    if (ok) {
      const data = unwrap<{
        panMasked: string | null;
        bankAccountMasked: string | null;
        bankIfsc: string | null;
        hasBankDetails: boolean;
      }>(res.body);
      record(
        '3.15',
        'PUT /recruiters/me/bank-details → 200, masked in response',
        data.hasBankDetails &&
          typeof data.panMasked === 'string' &&
          data.panMasked.includes('X') &&
          typeof data.bankAccountMasked === 'string' &&
          data.bankAccountMasked.includes('X') &&
          data.bankIfsc === 'HDFC0001234',
        `pan=${data.panMasked} bankAcct=${data.bankAccountMasked} ifsc=${data.bankIfsc} hasBank=${data.hasBankDetails}`,
        '#9c',
      );
    } else {
      record(
        '3.15',
        'PUT /recruiters/me/bank-details',
        false,
        `status=${res.status} body=${JSON.stringify(res.body).slice(0, 200)}`,
        '#9c',
      );
    }
  }

  // ========== Sub-test 3.16 — bank masking round-trip + DB encryption ==========
  {
    await clearRateLimits();
    const res = await http('GET', '/recruiters/me', {
      accessToken: recruiterAccessToken,
    });
    const ok = res.status === 200;
    const data = ok
      ? unwrap<{
          panMasked: string | null;
          bankAccountMasked: string | null;
        }>(res.body)
      : null;

    // Check DB row directly — encrypted blobs must NOT contain the cleartext.
    const dbProfile = await prisma.recruiterProfile.findFirst({
      where: { user: { email: RECRUITER_EMAIL } },
    });
    const panPlaintextLeaked = dbProfile?.panEncrypted?.includes('ABCDE1234F') ?? true;
    const bankPlaintextLeaked =
      dbProfile?.bankAccountEncrypted?.includes('1234567890') ?? true;

    const panMaskEndsWith4F = data?.panMasked?.endsWith('4F') ?? false;
    const bankMaskEndsWith7890 = data?.bankAccountMasked?.endsWith('7890') ?? false;

    record(
      '3.16',
      'Bank masking round-trip + DB encryption verified',
      ok &&
        panMaskEndsWith4F &&
        bankMaskEndsWith7890 &&
        !panPlaintextLeaked &&
        !bankPlaintextLeaked,
      `panMask=${data?.panMasked} bankMask=${data?.bankAccountMasked} plainInDb=${panPlaintextLeaked || bankPlaintextLeaked}`,
      '#9d',
    );
  }

  // ========== Sub-test 3.17 — rate limit 429 ==========
  section('Rate limiting');
  {
    await clearRateLimits();
    // Fire 11 identical login attempts (wrong password to avoid mutating
    // state) from the same IP. Public limiter is 10/min so the 11th must 429.
    let firstLimitedAt = -1;
    let finalStatus = 0;
    let retryAfterHeader = '';
    for (let i = 1; i <= 12; i++) {
      const r = await http('POST', '/auth/login', {
        body: { email: 'ratelimit-probe@nowhere.test', password: 'x' },
      });
      finalStatus = r.status;
      if (r.status === 429 && firstLimitedAt < 0) {
        firstLimitedAt = i;
        retryAfterHeader = r.headers.get('retry-after') ?? '';
        break;
      }
    }
    record(
      '3.17',
      'Spam /auth/login 10+ times/min → 429 + Retry-After',
      firstLimitedAt >= 10 && firstLimitedAt <= 12 && retryAfterHeader !== '',
      `firstLimitedAt=${firstLimitedAt} finalStatus=${finalStatus} Retry-After=${retryAfterHeader}`,
      '#10',
    );
  }

  // ========== summary ==========
  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  const allPass = passed === total;

  console.log('');
  console.log(`${c.bold}${c.cyan}=== SUMMARY ===${c.reset}`);
  console.log(
    `  ${allPass ? c.green : c.red}${passed}/${total} checks passed${c.reset}`,
  );
  console.log('');

  // Verification item roll-up
  const items: Record<string, 'PASS' | 'FAIL' | 'GAP'> = {};
  for (const r of results) {
    if (!r.verificationItem) continue;
    const prev = items[r.verificationItem];
    if (r.verificationItem === 'gap') {
      items[r.verificationItem] = r.ok ? 'PASS' : 'GAP';
    } else {
      if (!prev || prev === 'PASS') {
        items[r.verificationItem] = r.ok ? 'PASS' : 'FAIL';
      }
    }
  }
  console.log(`${c.bold}Verification-item roll-up:${c.reset}`);
  for (const [k, v] of Object.entries(items).sort()) {
    const color = v === 'PASS' ? c.green : v === 'GAP' ? c.yellow : c.red;
    console.log(`  ${color}${v}${c.reset}  ${k}`);
  }
  console.log('');

  if (!allPass) {
    console.log(`${c.yellow}Failures:${c.reset}`);
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`  ${c.red}${r.num}${c.reset} ${r.label} — ${r.detail}`);
    }
    console.log('');
  }
}

// ---------- entrypoint + cleanup ----------

main()
  .catch((err) => {
    console.error(`${c.red}Smoke test crashed:${c.reset}`, err);
    process.exitCode = 2;
  })
  .finally(async () => {
    try {
      await cleanupFixtures();
      await clearRateLimits();
    } catch (err) {
      console.error('Cleanup error:', err);
    }
    await prisma.$disconnect();
    redis.disconnect();

    const total = results.length;
    const passed = results.filter((r) => r.ok).length;
    if (total > 0 && passed !== total) {
      process.exitCode = 1;
    }
  });
