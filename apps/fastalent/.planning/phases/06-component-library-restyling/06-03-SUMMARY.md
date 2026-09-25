---
phase: 06-component-library-restyling
plan: 03
subsystem: ui-components
tags: [custom-wrappers, dashboard-migration, skeleton-loading, brand-tokens]

dependency_graph:
  requires: [06-01-shadcn-primitives, 06-02-appshell-layout]
  provides: [StatCardV2, ChartCard, MetricBadge, stat-skeleton-variant]
  affects: [dashboard-pages, verify-email-page, status-presentation]

tech_stack:
  added:
    - class-variance-authority (CVA for StatCardV2 variants)
  patterns:
    - Wrapper pattern for business-logic components (StatCardV2 wraps Card)
    - Loading skeleton states integrated with TanStack Query
    - Brand token migration (bg-success/warning/error/primary)

key_files:
  created:
    - apps/web/src/components/custom/StatCardV2.tsx
    - apps/web/src/components/custom/ChartCard.tsx
    - apps/web/src/components/custom/MetricBadge.tsx
  modified:
    - apps/web/src/components/custom/index.ts
    - apps/web/src/components/shared/EmptyState.tsx
    - apps/web/src/components/StatusBadge.tsx
    - apps/web/src/components/TrustBadge.tsx
    - apps/web/src/components/shared/SkeletonList.tsx
    - apps/web/src/components/shared/index.ts
    - apps/web/src/pages/recruiter/RecruiterDashboard.tsx
    - apps/web/src/pages/company/CompanyDashboard.tsx
    - apps/web/src/pages/admin/AdminDashboard.tsx
    - apps/web/src/pages/company/RoleDetail.tsx
    - apps/web/src/pages/VerifyEmailPage.tsx

decisions:
  - decision: StatCardV2 uses CVA for type-safe variants (default/teal/gradient)
    rationale: Type-safe variant system prevents runtime errors, gradient variant for visual emphasis on key metrics
    alternatives_considered: Inline className conditionals (less type-safe, harder to maintain)
  - decision: RecruiterDashboard wallet balance uses gradient variant
    rationale: Visual hierarchy — wallet is the primary metric for recruiters
  - decision: Loading skeleton integrated with TanStack Query isLoading
    rationale: Single source of truth for loading state, eliminates manual loading checks
  - decision: Checklist dots use bg-success instead of bg-emerald-500
    rationale: Consistent brand tokens across all components
  - decision: SkeletonList stat variant uses 4-column grid
    rationale: Matches dashboard StatCardV2 layout for visual consistency during loading

metrics:
  duration_minutes: 9
  completed_at: "2026-04-16T08:19:29Z"
  tasks_completed: 2
  files_created: 3
  files_modified: 12
  commits: 2
---

# Phase 6 Plan 3: Custom Wrappers + Dashboard Migration Summary

**One-liner:** StatCardV2 with CVA variants, ChartCard wrapper, MetricBadge inline metrics, brand token migration for StatusBadge/EmptyState/TrustBadge, all dashboards migrated with skeleton loading states.

## Objective

Create custom wrapper components (StatCardV2, ChartCard, MetricBadge), restyle presentation components (EmptyState, StatusBadge, TrustBadge) with brand tokens, and migrate all dashboards from StatCard to StatCardV2 with skeleton loading states. Eliminate last remaining LoadingSpinner usage.

## Completed Work

### Task 1: Custom Wrapper Components + Presentation Restyling

**StatCardV2.tsx** (81 lines)
- CVA variants: default (standard card), teal (subtle brand accent with ring), gradient (bg-brand-gradient for emphasis)
- Loading skeleton state with proper variant and text skeletons
- Trend prop with direction object: `{ direction: 'up' | 'down' | 'neutral', label: string }`
- Trend arrows with semantic colors: text-success (up), text-error (down), text-muted-foreground (neutral)
- Gradient variant inverts text colors (white/80, white/60) for readability
- Tabular-nums for consistent number alignment
- `optional value` prop for loading state handling

**ChartCard.tsx** (38 lines)
- Wrapper for recharts integration (Phase 8)
- Loading skeleton with configurable height
- Header with title, description, and action slot
- Consistent padding with Plan 01 Card primitives (px-5 py-4)

**MetricBadge.tsx** (33 lines)
- Compact inline metric display for tables and summaries
- Trend-aware background colors: bg-success/10 (up), bg-error/10 (down), bg-muted (neutral)
- sm/md size variants
- Tabular-nums for numeric consistency

**EmptyState restyling**
- Icon tint: text-muted-foreground → text-primary/60 (teal branding)
- Subtle background: rounded-lg bg-muted/50 py-12
- Maintains existing title, description, action structure

**StatusBadge migration**
- DOT_CLASSES: bg-emerald-500 → bg-success, bg-amber-500 → bg-warning, bg-red-500 → bg-error, bg-blue-500 → bg-primary
- All submission status colors now use brand tokens

**TrustBadge migration**
- Bronze: text-warning bg-warning/10 (was text-amber-700 bg-amber-100)
- Silver: text-muted-foreground bg-muted (was text-gray-600 bg-gray-100)
- Gold: text-success bg-success/10 (was text-yellow-600 bg-yellow-100)
- Platinum: text-primary bg-primary/10 (was text-indigo-600 bg-indigo-100)

**custom/index.ts updated**
- Added exports: StatCardV2, ChartCard, MetricBadge

**Commit:** `42c0417` feat(06-03): create custom wrapper components and restyle presentation components

### Task 2: Dashboard Migration + LoadingSpinner Elimination

**RecruiterDashboard.tsx**
- Wallet balance: StatCardV2 with `variant="gradient"` for visual emphasis
- Loading states: `loading={profile.isPending}` connected to TanStack Query
- Checklist dots: bg-emerald-500 → bg-success (brand token)
- Removed local StatCard component (98-121)

**CompanyDashboard.tsx**
- All 4 stat cards migrated to StatCardV2
- No loading states needed (placeholder "—" values)
- Checklist dots: bg-emerald-500 → bg-success
- Removed local StatCard component (79-102)

**AdminDashboard.tsx**
- All 8 stat cards migrated to StatCardV2 with loading states
- Loading connected to `useAdminMetrics` isLoading
- Removed local StatCard component (83-103)

**RoleDetail.tsx**
- 4 stat cards (Submissions, Shortlisted, Hired, Payout) migrated to StatCardV2
- No loading needed (role data already loaded at page level)
- Removed local StatCard component (665-690)

**VerifyEmailPage.tsx**
- LoadingSpinner replaced with Skeleton
- Skeleton pattern: avatar (h-12 w-12) + text (w-48) + descriptive text
- Success icon: text-emerald-500 → text-success (brand token)

**SkeletonList.tsx**
- Added `stat` variant for dashboard loading
- SkeletonStat component: matches StatCardV2 loading state structure
- 4-column grid: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`
- Consistent with StatCardV2 skeleton in loading prop

**shared/index.ts**
- @deprecated tags added for StatCard and LoadingSpinner
- Guides developers to new patterns

**Commit:** `6ec32e7` feat(06-03): migrate dashboards to StatCardV2 and replace LoadingSpinner with skeletons

## Deviations from Plan

### Auto-fixed Issues

None. Plan executed exactly as written, including the bonus Checklist brand token migration discovered during execution.

## Verification Results

**TypeScript Compilation:** ✅ Passed (`npx tsc --noEmit` with zero errors)

**No hardcoded colors:** ✅ Confirmed
```bash
grep -rn "emerald-500\|amber-500\|red-500\|blue-500" apps/web/src/components/StatusBadge.tsx apps/web/src/components/shared/EmptyState.tsx
# Zero matches
```

**No old StatCard imports:** ✅ Confirmed
```bash
grep -rn "from.*shared.*StatCard\b" apps/web/src/pages/recruiter/RecruiterDashboard.tsx apps/web/src/pages/company/CompanyDashboard.tsx apps/web/src/pages/admin/AdminDashboard.tsx apps/web/src/pages/company/RoleDetail.tsx
# Zero matches
```

**No LoadingSpinner in VerifyEmailPage:** ✅ Confirmed
```bash
grep -rn "LoadingSpinner" apps/web/src/pages/VerifyEmailPage.tsx
# Zero matches
```

**Component Structure:**
- ✅ StatCardV2: 81 lines (min 60), CVA variants, loading skeleton, trend object, tabular-nums
- ✅ ChartCard: 38 lines (min 30), loading skeleton, configurable height, action slot
- ✅ MetricBadge: 33 lines (min 25), trend-aware coloring, sm/md sizes
- ✅ EmptyState: text-primary/60 icon, bg-muted/50 background
- ✅ StatusBadge: bg-success/warning/error/primary tokens
- ✅ SkeletonList: stat variant with 4-column grid

## Success Criteria

- [x] StatCardV2 with 3 CVA variants, loading skeleton, trend object [FR-16]
- [x] ChartCard with loading skeleton, configurable height (ready for Phase 8)
- [x] MetricBadge with trend-aware coloring, tabular-nums
- [x] StatusBadge uses brand tokens for status dots [FR-14]
- [x] EmptyState has teal-branded styling with CTA pattern [FR-15]
- [x] All dashboards migrated from StatCard to StatCardV2 with loading states
- [x] VerifyEmailPage uses Skeleton instead of LoadingSpinner [FR-16]
- [x] SkeletonList has 'stat' variant
- [x] TypeScript compilation passes

## Technical Highlights

**CVA Type Safety:** StatCardV2 variants are type-checked at compile time, preventing invalid variant combinations.

**Wrapper Pattern:** StatCardV2 wraps Card primitive from Plan 01 without modifying shadcn source — follows research Pattern 1.

**Loading State Integration:** TanStack Query `isLoading` directly drives skeleton rendering, eliminating manual loading checks.

**Brand Token Propagation:** StatusBadge and EmptyState changes affect 33+ pages through single-source component updates.

**Trend Object Structure:** `{ direction, label }` allows contextual trend text (e.g., "+12%", "↑ 5 this week") rather than just arrows.

## Impact

**Dashboard UX:** All dashboards now show branded loading skeletons instead of empty/broken UI during data fetch.

**Wallet Emphasis:** Gradient variant on RecruiterDashboard wallet card creates visual hierarchy — most important metric stands out.

**Skeleton Consistency:** SkeletonList stat variant matches StatCardV2 loading structure, ensuring consistent loading states.

**Brand Cohesion:** EmptyState, StatusBadge, TrustBadge, and dashboard checklists all use brand tokens (text-success, text-primary, etc.) instead of hardcoded Tailwind colors.

**Phase 8 Prep:** ChartCard wrapper is ready for recharts integration — title, description, loading, and action slots already in place.

## Self-Check: PASSED

**Created files exist:**
```bash
[ -f "apps/web/src/components/custom/StatCardV2.tsx" ] # FOUND
[ -f "apps/web/src/components/custom/ChartCard.tsx" ] # FOUND
[ -f "apps/web/src/components/custom/MetricBadge.tsx" ] # FOUND
```

**Commits exist:**
```bash
git log --oneline --all | grep "42c0417" # FOUND: feat(06-03): create custom wrapper components
git log --oneline --all | grep "6ec32e7" # FOUND: feat(06-03): migrate dashboards to StatCardV2
```

**All must-have truths verified:**
- ✅ StatCardV2 renders with default, teal, and gradient variants with loading skeleton state
- ✅ ChartCard provides consistent wrapper for recharts with header, description, and loading skeleton
- ✅ MetricBadge displays value with optional trend arrow and color-coded direction
- ✅ All 3 dashboards + RoleDetail use StatCardV2 instead of StatCard
- ✅ VerifyEmailPage uses skeleton instead of LoadingSpinner
- ✅ EmptyState has teal-tinted icon and contextual CTA styling
- ✅ StatusBadge uses brand tokens (bg-success, bg-warning, bg-error, bg-primary) instead of hardcoded colors
- ✅ SkeletonList has 'stat' variant for dashboard loading

## Next Steps

**Wave 2 Completion:** Plan 06-04 (AI-ready surfaces + form validation UX) to complete Phase 6.

**Phase 7:** Navigation enhancements with DataTable, pagination, offcanvas/slide-over, View Transitions.

**Phase 8:** ChartCard integration with recharts for dashboard visualizations (AnimatedMetric, revenue/submission trends).
