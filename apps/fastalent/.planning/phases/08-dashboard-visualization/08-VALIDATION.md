---
phase: 8
slug: dashboard-visualization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x + React Testing Library |
| **Config file** | `vitest.config.ts` (Wave 0 creates) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run <affected-file>` (< 10s)
- **After every plan wave:** Run `npm test -- --run` (~30s)
- **Before `/gsd:verify-work`:** Full suite + bundle analysis must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | R4 | unit | `npm test -- EarningChart.test.tsx` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | R4 | unit | `npm test -- SubmissionFunnel.test.tsx` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | R4 | unit | `npm test -- TrustTrend.test.tsx` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | R4 | unit | `npm test -- RoleFillRate.test.tsx` | ❌ W0 | ⬜ pending |
| 08-01-05 | 01 | 1 | R4 | unit | `npm test -- PlatformMetrics.test.tsx` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | R4 | unit | `npm test -- AnimatedMetric.test.tsx` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | R10 | unit | `npm test -- FeeCalculator.test.tsx` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 2 | R4 | integration | Manual — dashboard render check | ❌ Manual | ⬜ pending |
| 08-03-02 | 03 | 2 | R4 | bundle | `npm run build && npx vite-bundle-visualizer` | ❌ W0 script | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vite-native test runner config
- [ ] `apps/web/tests/setup.ts` — jsdom setup for React Testing Library
- [ ] `apps/web/tests/components/charts/` — 5 chart component test stubs
- [ ] `apps/web/tests/components/custom/AnimatedMetric.test.tsx` — scroll trigger test stub
- [ ] `apps/web/tests/components/FeeCalculator.test.tsx` — R10 calculator test stub
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
- [ ] Bundle analysis script in package.json: `"analyze": "vite-bundle-visualizer"`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chart tooltips use CSS variables | R4 | Visual theming verification | Hover chart in light/dark mode, verify tooltip bg matches `--color-card` |
| Charts responsive at 375px/768px/1440px | R4 | Viewport-dependent layout | Resize browser to each breakpoint, verify charts scale |
| Dashboard layout cohesion | R4 | Subjective visual quality | Open each dashboard, verify chart+table+metric card layout |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
