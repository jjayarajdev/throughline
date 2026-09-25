---
phase: 13
slug: analytics-api
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x (to be installed in Wave 0 if not present) |
| **Config file** | vitest.config.ts (to be created in Wave 0) |
| **Quick run command** | `npm test -- analytics` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- analytics`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | ANLY-01 | integration | `npm test -- src/services/analytics.service.test.ts -t "funnel"` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | ANLY-02 | integration | `npm test -- src/services/analytics.service.test.ts -t "scorecard"` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | ANLY-03 | integration | `npm test -- src/services/analytics-cache.service.test.ts -t "health"` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | ANLY-04 | integration | `npm test -- src/services/analytics.service.test.ts -t "time-to-fill"` | ❌ W0 | ⬜ pending |
| TBD | 02 | 2 | ANLY-05 | performance | Manual benchmark script | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | ANLY-06 | unit | `npm test -- src/services/analytics.service.test.ts -t "baseline"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — test framework config (if not already exists)
- [ ] `apps/api/src/services/analytics.service.test.ts` — unit/integration tests for funnel, scorecard, time-to-fill
- [ ] `apps/api/src/services/analytics-cache.service.test.ts` — Redis caching behavior tests
- [ ] `test/fixtures/analytics-seed.sql` — seed data for performance testing
- [ ] Framework install: `npm install -D vitest` (if not already installed)

*Note: Wave 0 test stubs will be created as part of the first plan execution.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All analytics queries <500ms | ANLY-05 | Requires production-like dataset and DB load | Run benchmark script with 10K seeded submissions, verify P95 <500ms |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
