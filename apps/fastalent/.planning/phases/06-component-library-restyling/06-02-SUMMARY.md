---
phase: 06-component-library-restyling
plan: 02
subsystem: ui
tags: [react, tailwind, role-tokens, breadcrumbs, layout, design-system]

# Dependency graph
requires:
  - phase: 05-design-system-foundation
    provides: Deep Teal OKLCH role-token system (role-recruiter, role-employer, role-admin)
provides:
  - AppShell layout using role-token accent colors instead of hardcoded blue/green/purple
  - Breadcrumbs component reading from route handle metadata
  - PageHeader composable component (PageHeader, PageTitle, PageDescription, PageActions)
  - Tightened main content spacing (FR-12)
affects: [06-03-custom-components, 10-page-rollout, all-authenticated-pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Role-token accent system in layout components"
    - "Composable primitives pattern (PageHeader split into 4 exports)"
    - "Breadcrumb labels from route handle metadata"

key-files:
  created:
    - apps/web/src/components/custom/Breadcrumbs.tsx
    - apps/web/src/components/custom/PageHeader.tsx
    - apps/web/src/components/custom/index.ts
  modified:
    - apps/web/src/components/layouts/AppShell.tsx
    - apps/web/src/components/layouts/Topbar.tsx
    - apps/web/src/layouts/RecruiterLayout.tsx
    - apps/web/src/layouts/CompanyLayout.tsx
    - apps/web/src/layouts/AdminLayout.tsx

key-decisions:
  - "Manual breadcrumb definition via route handles (not auto-generated from path segments) for resilience with dynamic routes"
  - "Composable PageHeader pattern (4 separate exports) over monolithic single component for flexibility"
  - "Tightened main content padding from py-6 to py-4 (FR-12) for better screen space efficiency"

patterns-established:
  - "Pattern 1: Role-token accent mapping — accentStyles object with literal Tailwind classes for JIT compiler"
  - "Pattern 2: Breadcrumbs via route handle metadata — routes opt-in with handle: { breadcrumb: '...' }"
  - "Pattern 3: Composable page primitives — split into PageHeader/Title/Description/Actions for flexible composition"

requirements-completed: [FR-05, FR-11, FR-12]

# Metrics
duration: 4min
completed: 2026-04-16
---

# Phase 6 Plan 2: AppShell Layout & PageHeader Components Summary

**AppShell layout remapped to Deep Teal role-token accents (recruiter/employer/admin), breadcrumbs integrated into topbar, composable PageHeader component created**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-04-16T07:58:30Z
- **Completed:** 2026-04-16T08:02:44Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Replaced hardcoded blue/green/purple accent system with role-token classes (role-recruiter, role-employer, role-admin)
- Integrated breadcrumbs component into topbar (visible on md+ screens, hidden on mobile)
- Created composable PageHeader primitives ready for page-level adoption in Phase 10
- Tightened main content padding from py-6 to py-4 for better screen space efficiency (FR-12)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remap AppShell + Topbar accent system and add breadcrumbs** - `3dbda77` (feat)
2. **Task 2: Create PageHeader composable component** - `faab58a` (feat)

## Files Created/Modified
- `apps/web/src/components/layouts/AppShell.tsx` - Changed AppAccent type to role names, replaced accentStyles with role-token classes
- `apps/web/src/components/layouts/Topbar.tsx` - Updated profile path logic for role names, added Breadcrumbs component slot
- `apps/web/src/layouts/RecruiterLayout.tsx` - Changed accent="blue" to accent="recruiter"
- `apps/web/src/layouts/CompanyLayout.tsx` - Changed accent="green" to accent="employer"
- `apps/web/src/layouts/AdminLayout.tsx` - Changed accent="purple" to accent="admin"
- `apps/web/src/components/custom/Breadcrumbs.tsx` - Created breadcrumb component reading from route handle metadata
- `apps/web/src/components/custom/PageHeader.tsx` - Created composable page header primitives
- `apps/web/src/components/custom/index.ts` - Created barrel export for custom components

## Decisions Made
- **Manual breadcrumb metadata:** Opted for route handle definitions (`handle: { breadcrumb: "..." }`) instead of auto-generation from path segments. Auto-generation is fragile with dynamic segments (/r/roles/:id), and manual control gives better UX (e.g., "Role Details" instead of "123").
- **Composable PageHeader pattern:** Split into 4 separate exports (PageHeader, PageTitle, PageDescription, PageActions) following shadcn composable primitives pattern rather than monolithic component with props. Enables flexible composition at page level.
- **Tightened spacing:** Reduced main content padding from `py-6 sm:px-6 lg:px-8` to `py-4 sm:px-6` for better screen space efficiency per FR-12 (founder directive: minimal excessive padding).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AppShell layout foundation complete with role-token accents working in light and dark modes
- Breadcrumbs component ready — routes need handle metadata added in Phase 10 (page rollout)
- PageHeader component ready for adoption across all 33 pages in Phase 10
- No blockers for Plan 06-03 (custom wrappers) or Plan 06-04 (AI-ready surfaces)

## Self-Check: PASSED

**Created files:**
- ✓ apps/web/src/components/custom/Breadcrumbs.tsx
- ✓ apps/web/src/components/custom/PageHeader.tsx
- ✓ apps/web/src/components/custom/index.ts

**Commits:**
- ✓ 3dbda77 (Task 1: AppShell accent remap + breadcrumbs)
- ✓ faab58a (Task 2: PageHeader composable)

---
*Phase: 06-component-library-restyling*
*Completed: 2026-04-16*
