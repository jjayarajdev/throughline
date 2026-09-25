---
phase: 9
slug: micro-interactions-animation-polish
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-16
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual visual + DevTools Performance (no automated test framework for animations) |
| **Config file** | N/A — visual testing required |
| **Quick run command** | `npx vite build` (verify build succeeds, no TS errors) |
| **Full suite command** | Manual: Chrome DevTools Performance tab + Rendering > Emulate reduced motion |
| **Estimated runtime** | ~5 seconds (build), ~5 minutes (manual visual audit) |

---

## Sampling Rate

- **After every task commit:** Run `npx vite build` + visual inspection of changed animations
- **After every plan wave:** Full animation pass — all buttons, modals, cards, notifications
- **Before `/gsd:verify-work`:** Full suite must be green + DevTools performance audit
- **Max feedback latency:** 10 seconds (build check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | FR-18 | build | `npx vite build` | N/A | ⬜ pending |
| 09-01-02 | 01 | 1 | FR-18 | manual (visual) | DevTools: Rendering > Frame rate overlay | N/A | ⬜ pending |
| 09-01-03 | 01 | 1 | NFR-05 | manual (perf) | DevTools: Performance > Record during animation | N/A | ⬜ pending |
| 09-01-04 | 01 | 1 | NFR-02 | manual (a11y) | DevTools: Rendering > Emulate reduced motion | N/A | ⬜ pending |
| 09-02-01 | 02 | 1 | FR-18 | manual (visual) | Open NotificationBell, verify stagger | N/A | ⬜ pending |
| 09-02-02 | 02 | 1 | R8 | manual (visual) | Verify read/unread toggle, mark-all-read | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework setup needed.

- Phase 9 is UI animation polish — all verification is visual/performance-based
- Build verification (`npx vite build`) catches TypeScript errors and import issues
- Chrome DevTools Performance tab validates 60fps target
- Chrome DevTools Rendering panel validates prefers-reduced-motion

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Button hover/click scale + shadow | FR-18 | Visual animation quality | Hover primary buttons, verify 1.02 scale + shadow lift. Click to verify 0.98 tap scale. |
| Modal/dialog scale-in entrance | FR-18 | Visual animation quality | Open any dialog, verify smooth scale-in from 0.95 + fade. Close to verify exit animation. |
| Card hover lift (translateY -2px) | FR-18 | Visual animation quality | Hover stat cards, role cards. Verify subtle lift + shadow transition. |
| Notification slideout with stagger | FR-18, R8 | Visual animation quality | Open NotificationBell sheet, verify items enter with staggered delay (50ms per item). |
| 60fps performance | NFR-05 | Requires DevTools profiling | Record animation in Performance tab. Verify no frames >16.7ms. No purple "Layout" blocks. |
| No layout thrashing | NFR-05 | Requires DevTools profiling | During animation recording, check for zero forced reflow warnings. |
| prefers-reduced-motion | NFR-02 | Requires OS/browser setting | DevTools > Rendering > Emulate reduced motion. Verify all animations disabled. |
| LazyMotion bundle size | NFR-05 | Requires build analysis | Run `npx vite build`, check chunk sizes. framer-motion should not appear in initial bundle. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
