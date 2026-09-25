/**
 * Phase 13 Analytics API — smoke tests
 * Run: npx tsx apps/api/scripts/test-analytics.ts
 */

const API = 'http://localhost:4000/api/v1';

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json() as any;
  if (!json.success) throw new Error(`Login failed for ${email}: ${json.error.message}`);
  return json.data.accessToken;
}

async function get(path: string, token: string): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function main() {
  console.log('Logging in...');
  const companyToken = await login('hire@techvista.in', 'DemoPass@2026!');
  const recruiterToken = await login('anita.kapoor@fastmail.com', 'DemoPass@2026!');
  const adminToken = await login('admin@gigcruite.com', 'Admin@GigCruite2026');
  console.log('All logins OK\n');

  // ---- ANLY-01: Company Funnel ----
  console.log('ANLY-01: Company Submission Funnel');
  const funnel = await get('/analytics/funnel', companyToken);
  assert('success', funnel.success);
  assert('has funnel stages', funnel.data?.funnel?.submitted >= 0);
  assert('has conversion rates', !!funnel.data?.conversionRates?.endToEnd);
  assert('has dateRange', !!funnel.data?.dateRange?.from);

  // With date range filter (ANLY-06)
  const funnelFiltered = await get('/analytics/funnel?startDate=2026-04-01&endDate=2026-04-30', companyToken);
  assert('date range filter works', funnelFiltered.success);
  console.log('');

  // ---- ANLY-02: Time-to-Fill ----
  console.log('ANLY-02: Time-to-Fill Statistics');
  const ttf = await get('/analytics/time-to-fill', companyToken);
  assert('success', ttf.success);
  assert('has count', ttf.data?.count >= 0);
  assert('has percentiles (p25/p50/p75/p90)', ttf.data?.p25 !== undefined);
  assert('has stddev', ttf.data?.stddev !== undefined);
  assert('has trend array', Array.isArray(ttf.data?.trend));

  // groupBy=roleType
  const ttfByType = await get('/analytics/time-to-fill?groupBy=roleType', companyToken);
  assert('groupBy=roleType works', ttfByType.success && Array.isArray(ttfByType.data?.trend));

  // Admin can also access (platform-wide)
  const ttfAdmin = await get('/analytics/time-to-fill', adminToken);
  assert('admin can access time-to-fill', ttfAdmin.success);
  console.log('');

  // ---- ANLY-03: Recruiter Scorecard ----
  console.log('ANLY-03: Recruiter Scorecard');
  const scorecard = await get('/analytics/scorecard', recruiterToken);
  assert('success', scorecard.success);
  assert('has recruiter info', !!scorecard.data?.recruiter?.fullName);
  assert('has conversionRate', !!scorecard.data?.metrics?.conversionRate);
  assert('has consistencyScore', scorecard.data?.metrics?.consistencyScore !== undefined);
  assert('has platformComparison', scorecard.data?.platformComparison?.platformConversionRate !== undefined);
  assert('has earningsTotal', !!scorecard.data?.metrics?.earningsTotal);
  console.log('');

  // ---- ANLY-04: Company Cost Metrics ----
  console.log('ANLY-04: Company Cost Metrics');
  const cost = await get('/analytics/cost-metrics', companyToken);
  assert('success', cost.success);
  assert('has summary.totalSpend', !!cost.data?.summary?.totalSpend);
  assert('has summary.avgCostPerHire', cost.data?.summary?.avgCostPerHire !== undefined);
  assert('has summary.submissionQualityRatio', !!cost.data?.summary?.submissionQualityRatio);
  assert('has roles array', Array.isArray(cost.data?.roles));
  assert('role has costPerHire', cost.data?.roles?.some((r: any) => r.costPerHire !== null));
  console.log('');

  // ---- ANLY-05: Platform Health (Admin) ----
  console.log('ANLY-05: Platform Health');
  const health = await get('/analytics/platform-health', adminToken);
  assert('success', health.success);
  assert('has overview.totalCompanies', health.data?.overview?.totalCompanies >= 0);
  assert('has funnel.submitted', health.data?.funnel?.submitted >= 0);
  assert('has financials.totalRevenue', !!health.data?.financials?.totalRevenue);
  assert('has recruiterTiers', !!health.data?.recruiterTiers);

  // Cached response (hit again)
  const health2 = await get('/analytics/platform-health', adminToken);
  assert('cached response also succeeds', health2.success);
  console.log('');

  // ---- ANLY-06: RBAC enforcement ----
  console.log('ANLY-06: RBAC + Cross-cutting');
  const rbac1 = await get('/analytics/funnel', recruiterToken);
  assert('recruiter cannot access company funnel (403)', !rbac1.success);

  const rbac2 = await get('/analytics/platform-health', companyToken);
  assert('company cannot access platform-health (403)', !rbac2.success);

  const rbac3 = await get('/analytics/scorecard', companyToken);
  assert('company cannot access recruiter scorecard (403)', !rbac3.success);

  const rbac4 = await get('/analytics/cost-metrics', recruiterToken);
  assert('recruiter cannot access company cost-metrics (403)', !rbac4.success);
  console.log('');

  // ---- Summary ----
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(process.exitCode ? ' SOME TESTS FAILED' : ' ALL TESTS PASSED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
