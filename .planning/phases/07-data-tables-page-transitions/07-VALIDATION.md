---
phase: 7
slug: data-tables-page-transitions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual testing + TypeScript build + Lighthouse |
| **Config file** | none — build check via existing Vite config |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` + manual test at 375/768/1440px |
| **Estimated runtime** | ~15 seconds (build) + manual |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + manual testing in light/dark mode at 3 breakpoints (375/768/1440px)
- **Before `/gsd:verify-work`:** Full suite must be green + Lighthouse Performance >= 90
- **Max feedback latency:** 15 seconds (build check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | FR-06 | build | `npm run build` | ✅ | ⬜ pending |
| 7-01-02 | 01 | 1 | FR-06 | manual | DataTable sort/filter/paginate at 3 breakpoints | N/A | ⬜ pending |
| 7-01-03 | 01 | 1 | FR-06 | manual | Mobile horizontal scroll + sticky headers at 375px | N/A | ⬜ pending |
| 7-02-01 | 02 | 1 | FR-07, FR-08 | manual | Slide-over panels: scroll preservation, focus trap, Esc-close | N/A | ⬜ pending |
| 7-02-02 | 02 | 1 | FR-21 | manual | Notification center: unread count, mark read, filters | N/A | ⬜ pending |
| 7-03-01 | 03 | 2 | FR-06 | build | `npm run build` | ✅ | ⬜ pending |
| 7-03-02 | 03 | 2 | FR-06 | manual | 7 list views converted, sort/filter/paginate verified | N/A | ⬜ pending |
| 7-04-01 | 04 | 2 | FR-17 | manual | View Transitions in Chrome/Safari/Firefox + fallback | N/A | ⬜ pending |
| 7-04-02 | 04 | 2 | FR-17 | manual | Scroll restoration on back button | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Phase 7 relies on TypeScript build verification (automated) + manual testing (visual/interaction). No new test framework needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DataTable sort/filter/paginate | FR-06 | UI interaction, visual layout | Sort each column, apply filter pills, paginate through 100+ rows at all breakpoints |
| Slide-over scroll preservation | FR-07 | Scroll position state | Open slide-over, scroll list, close, verify scroll position retained |
| 1-2 click info access | FR-08 | Click count, UX flow | Count clicks from list to fee structure / detail info |
| View Transitions cross-fade | FR-17 | Animation visual quality | Navigate between pages in Chrome/Safari/Firefox, verify cross-fade + fallback |
| Notification center | FR-21 | Interaction UX | Test unread count badge, mark-as-read, filter by type |
| Mobile table at 375px | FR-06 | Device viewport | Horizontal scroll + scroll hint indicator on narrow viewport |
| Memoization (no re-render loop) | FR-06 | Performance | React DevTools Profiler — verify table doesn't re-render on every frame |

---

## Nyquist Compliance Note

**Status: Intentionally non-compliant.** Phase 7 is a UI/UX transformation phase where critical behaviors (DataTable sort/filter/paginate, View Transitions animation, slide-over scroll preservation, mobile responsiveness) require visual/interactive verification that cannot be automated via build checks alone. Automated `npm run build` catches TypeScript/import errors per-task; functional behavior is verified manually per-wave.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (`npm run build`)
- [x] Sampling continuity: build check after every task
- [x] Wave 0 covers all MISSING references (none needed)
- [x] No watch-mode flags
- [x] Feedback latency < 15s (build check)
- [ ] `nyquist_compliant: false` — intentional for UI-heavy phase (see note above)

**Approval:** pending
