---
phase: 10
slug: page-by-page-rollout-responsive-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual testing (Chrome DevTools + axe DevTools + Lighthouse) |
| **Config file** | vite.config.ts (rollup-plugin-visualizer added in Wave 0) |
| **Quick run command** | `npm run build && npm run dev` |
| **Full suite command** | E2E smoke suite (scripts 00-27 from v1.0) + Lighthouse audit |
| **Estimated runtime** | ~30 seconds (build) + manual per-page verification |

---

## Sampling Rate

- **After every task commit:** `npm run build` passes + manual visual check at 3 breakpoints (375px, 768px, 1440px) in both themes
- **After every plan wave:** Full axe DevTools scan on all converted pages + E2E smoke suite
- **Before `/gsd:verify-work`:** Lighthouse performance ≥90, all smoke tests green, zero hardcoded colors
- **Max feedback latency:** 30 seconds (build time)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-00-01 | 00 | 0 | NFR-01 | build | `npm run build` (visualizer output) | ❌ W0 | ⬜ pending |
| 10-01-XX | 01 | 1 | FR-19 | manual | `grep -r "bg-gray-\|text-gray-" apps/web/src/pages/` (0 matches) | N/A | ⬜ pending |
| 10-01-XX | 01 | 1 | NFR-02 | manual | axe DevTools scan per page | N/A | ⬜ pending |
| 10-02-XX | 02 | 2 | FR-19 | manual | `grep -r "bg-gray-\|text-gray-" apps/web/src/pages/` (0 matches) | N/A | ⬜ pending |
| 10-02-XX | 02 | 2 | NFR-03 | e2e | E2E smoke suite (scripts 00-27) | ✅ | ⬜ pending |
| 10-02-XX | 02 | 2 | NFR-01 | build | `npm run build` + Lighthouse ≥90 | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` — install `rollup-plugin-visualizer` as devDependency
- [ ] `vite.config.ts` — add visualizer to plugins array (gzipSize: true)
- [ ] Baseline Lighthouse audit — run on RecruiterDashboard, document current scores

*These must complete before Wave 1 begins.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive layout at 3 breakpoints | FR-19, NFR-02 | Visual correctness requires human eyes | Chrome DevTools → Toggle Device Toolbar → 375px, 768px, 1440px per page |
| Dark mode visual correctness | FR-19 | Automated color checking insufficient | Toggle theme in topbar (Light/Dark), verify text readable, colors correct |
| Keyboard navigation intact | NFR-02 | Tab order validation needs human judgment | Tab through all interactive elements, verify focus ring visible |
| axe DevTools zero critical violations | NFR-02 | Browser extension requires manual run | Open axe DevTools panel → Scan → Verify 0 critical/serious |
| Touch target ≥44×44px on mobile | NFR-02 | Size validation at viewport-dependent | Inspect buttons/links at 375px, verify min dimensions |
| Fee transparency on role pages | FR-23 | Business logic visual verification | Open RoleDetailPublic, verify FeeCalculator visible |

---

## Validation Sign-Off

- [ ] All tasks have manual verify checklist or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without build verification
- [ ] Wave 0 covers all MISSING references (rollup-plugin-visualizer)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (build time)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
