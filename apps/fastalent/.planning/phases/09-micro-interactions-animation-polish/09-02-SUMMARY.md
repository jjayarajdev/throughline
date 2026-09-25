---
phase: 09-micro-interactions-animation-polish
plan: 02
subsystem: frontend-ui
tags: [animation, framer-motion, dialog, notifications, stagger, accessibility]
completed: 2026-04-16T12:18:00Z
duration_minutes: 5

dependency_graph:
  requires: [09-01-motion-infrastructure]
  provides: [dialog-scale-animation, notification-stagger]
  affects: [all-dialogs, notification-bell]

tech_stack:
  added: []
  patterns:
    - LazyMotion with asChild pattern for Radix primitives
    - AnimatePresence for exit animations (Radix compatibility)
    - Stagger animation with tab-based re-trigger via key prop

key_files:
  created: []
  modified:
    - apps/web/src/components/ui/dialog.tsx
    - apps/web/src/components/NotificationBell.tsx

decisions:
  - Use `asChild` on DialogPrimitive.Content to delegate rendering to m.div (Radix focus trap + framer-motion animation)
  - Remove Radix data-[state] CSS animations to prevent conflicts with framer-motion
  - Stagger container key={tab} re-triggers animation on tab switch for fresh entrance effect
  - Only animate notification items, NOT loading skeletons or empty states
  - LazyMotion strict mode ensures only m.* components (not motion.*) for minimal bundle

metrics:
  tasks_completed: 2
  files_created: 0
  files_modified: 2
  commits: 1
---

# Phase 09 Plan 02: Dialog Scale-In + NotificationBell Stagger Animations

**One-liner:** Dialogs scale in from 95% with smooth easing, notification list items cascade in from right with 50ms stagger, all via framer-motion LazyMotion.

## Execution Summary

Added framer-motion animations to the two highest-value interaction patterns: modal entrances (Dialog) and notification reveals (NotificationBell). Dialog uses AnimatePresence for scale-in/out transitions, NotificationBell uses stagger variants for cascading list items.

### Tasks Completed

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Dialog scale-in + NotificationBell stagger | `c3951da` | Dialog: scale-in 0.95→1.0 via LazyMotion + asChild, NotificationBell: staggerChildren 50ms with x:20→0 slide-in |
| 2 | Visual + performance verification | N/A (checkpoint) | Human approved: all animations smooth, 60fps confirmed, reduced-motion compliant, framer-motion not in main bundle |

### Technical Highlights

**Dialog Scale-In/Out Animation:**
- DialogContent wraps child in `<LazyMotion features={loadFeatures} strict>`
- DialogPrimitive.Content uses `asChild` to delegate rendering to `m.div`
- Animation props: `initial={{ opacity: 0, scale: 0.95 }}`, `animate={{ opacity: 1, scale: 1 }}`, `exit={{ opacity: 0, scale: 0.95 }}`
- Transition: `TRANSITIONS.smooth` (200ms, custom cubic-bezier easing)
- Removed conflicting `data-[state=open]:animate-in` CSS classes from Radix
- DialogOverlay keeps existing CSS animation (only content panel gets framer-motion)

**NotificationBell Stagger Animation:**
- Notification list container wrapped in `<LazyMotion features={loadFeatures} strict>`
- Container `m.div` uses `variants={STAGGER.container}` with `initial="hidden"` and `animate="show"`
- Container has `key={tab}` to re-trigger animation when switching between All/Unread tabs
- Each notification item is `m.button` with `variants={STAGGER.item}`
- STAGGER.container: `staggerChildren: 0.05` (50ms), `delayChildren: 0.1` (100ms initial delay)
- STAGGER.item: slides in from right `{ opacity: 0, x: 20 }` → `{ opacity: 1, x: 0 }`
- Loading skeletons and empty state NOT animated (only actual notification items)

**Accessibility:**
- MotionConfig from main.tsx auto-disables framer-motion animations when prefers-reduced-motion is set
- No per-component checks needed — global provider handles it

### Performance Metrics

- **Execution time:** 5 minutes
- **Tasks:** 2/2 completed (Task 2 was checkpoint approval)
- **Files:** 0 created, 2 modified
- **Commits:** 1 (Task 1)
- **TypeScript:** Zero errors
- **Build:** Clean
- **Visual verification:** Human approved all Phase 9 animations

### Accessibility

✅ **prefers-reduced-motion fully supported:**
1. MotionConfig provider auto-disables all framer-motion animations
2. Dialog appears instantly without scale (still accessible)
3. Notification items appear instantly without stagger (still accessible)
4. All color/focus changes still work (not motion-based)

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

### Automated Checks

| Check | Status | Details |
|-------|--------|---------|
| TypeScript compilation | ✅ PASS | `npx tsc --noEmit` — zero errors |
| Vite build | ✅ PASS | `npx vite build` — clean build |
| Dialog framer-motion | ✅ PASS | `AnimatePresence`, `LazyMotion` present in dialog.tsx |
| NotificationBell stagger | ✅ PASS | `STAGGER`, `m.button` present in NotificationBell.tsx |

### Must-Haves Verification

| Must-Have | Status | Evidence |
|-----------|--------|----------|
| Dialogs animate in with scale-in (0.95 → 1.0) | ✅ PASS | `initial={{ scale: 0.95 }}` `animate={{ scale: 1 }}` in dialog.tsx |
| Dialogs animate out with scale-out (1.0 → 0.95) | ✅ PASS | `exit={{ scale: 0.95 }}` in dialog.tsx |
| Notification items enter with stagger (50ms) | ✅ PASS | `staggerChildren: 0.05` in STAGGER.container |
| prefers-reduced-motion disables framer-motion | ✅ PASS | MotionConfig global provider handles it |
| framer-motion lazy-loaded (not in main bundle) | ✅ PASS | LazyMotion with loadFeatures dynamic import |

### Artifact Verification

| Path | Provides | Status |
|------|----------|--------|
| `apps/web/src/components/ui/dialog.tsx` | Dialog with scale-in/out via AnimatePresence | ✅ CONTAINS `AnimatePresence`, `m.div`, `initial/animate/exit` |
| `apps/web/src/components/NotificationBell.tsx` | Notification list with staggered entrance | ✅ CONTAINS `STAGGER`, `m.button`, `variants` |

### Key Links Verification

| From | To | Via | Status |
|------|----|----|--------|
| dialog.tsx | framer-motion AnimatePresence | LazyMotion with motion-features lazy loader | ✅ PRESENT |
| NotificationBell.tsx | motion-config.ts STAGGER | Imported for container/item variants | ✅ PRESENT |
| NotificationBell.tsx | framer-motion m.div/m.button | LazyMotion wrapper | ✅ PRESENT |

### Visual Verification (Human)

User tested all Phase 9 animations:
1. ✅ Button hover scale-up + shadow lift — smooth, 60fps
2. ✅ Button press scale-down — responsive feel
3. ✅ Card hover lift — 2px translateY with shadow fade-in
4. ✅ Dialog scale-in — smooth entrance from 95% to 100%
5. ✅ Notification stagger — 50ms cascade from right
6. ✅ Tab switch re-trigger — stagger animation resets on All/Unread toggle
7. ✅ prefers-reduced-motion — all animations disabled in emulation mode
8. ✅ Bundle check — framer-motion NOT in main chunk, only lazy-loaded

**Performance:** All animations run at 60fps, no jank or layout thrashing.

## Self-Check

**Files modified:**
```bash
apps/web/src/components/ui/dialog.tsx (AnimatePresence + m.div with scale variants) — FOUND ✅
apps/web/src/components/NotificationBell.tsx (STAGGER variants + m.button items) — FOUND ✅
```

**Commits:**
```bash
c3951da (Task 1: Dialog + NotificationBell animations) — FOUND ✅
```

## Self-Check: PASSED ✅

All claimed files exist, commit present, all verification checks passed, human visual approval received.

## Next Steps

**Phase 9 Complete:** All 2 plans executed. Phase 10 (Page-by-Page Rollout) is next.

**Requirements satisfied:**
- FR-18 (micro-interactions — buttons, cards, dialogs, notifications)
- NFR-05 (accessibility — prefers-reduced-motion support via MotionConfig)

**Foundation complete:** Motion infrastructure established, high-value interactions polished. Phase 10 will roll out these patterns across all 33 pages systematically.
