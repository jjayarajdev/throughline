---
phase: 6
slug: component-library-restyling
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual + TypeScript build verification |
| **Config file** | tsconfig.json (existing) |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` + manual responsive/dark-mode check |
| **Estimated runtime** | ~30 seconds (build) + manual verification |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + manual light/dark mode check at 375/768/1440px
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | FR-13 | build + grep | `npm run build` | ✅ | ⬜ pending |
| 06-01-02 | 01 | 1 | FR-14 | build + manual | `npm run build` | ✅ | ⬜ pending |
| 06-01-03 | 01 | 1 | FR-16 | build + manual | `npm run build` | ✅ | ⬜ pending |
| 06-02-01 | 02 | 1 | FR-05 | build + manual | `npm run build` | ✅ | ⬜ pending |
| 06-02-02 | 02 | 1 | FR-11 | manual | viewport test 375/768/1440px | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 1 | FR-12 | manual | visual inspection 1920x1080 | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | FR-15 | build + manual | `npm run build` | ✅ | ⬜ pending |
| 06-03-02 | 03 | 2 | FR-20 | code review | verify layout slots | ❌ W0 | ⬜ pending |
| 06-03-03 | 03 | 2 | FR-22 | manual | test inline errors on blur | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Manual test checklist — responsive at 375/768/1440px per restyled component
- [ ] Light/dark mode manual verification — every restyled component both themes
- [ ] `npm run build` passes (TypeScript + Vite check)

*Existing infrastructure covers automated build verification. Manual testing covers visual/responsive validation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar collapse on mobile | FR-05 | Visual/interactive behavior | Resize to <768px, verify hamburger menu appears and sidebar slides in/out |
| Topbar breadcrumbs + backdrop blur | FR-05 | Visual effect | Scroll page, verify topbar blurs content beneath; check breadcrumb trail |
| Responsive breakpoints 375/768/1440 | FR-11 | Visual layout | DevTools device mode at each breakpoint, verify no overflow |
| Information density at 1080p | FR-12 | Visual measurement | 1920x1080, verify 4 stat cards + content above fold |
| Teal tokens on all components | FR-13 | Visual inspection | Compare all buttons/cards/badges against design tokens |
| Status badge colors consistent | FR-14 | Visual comparison | Render all status variants, verify same color everywhere |
| Skeleton shimmer animation | FR-16 | Visual/timing | Throttle network, verify shimmer gradient sweeps 1.5s |
| Dark mode contrast | NFR-02 | Visual accessibility | Toggle dark mode, check all text readable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
