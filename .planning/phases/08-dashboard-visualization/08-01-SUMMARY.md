---
phase: 08-dashboard-visualization
plan: 01
subsystem: visualization-components
tags: [recharts, react-countup, charts, animations, fee-calculator]
dependency_graph:
  requires: [shadcn-primitives, css-variables, chartcard]
  provides: [chart-library, animated-metrics, fee-calculator]
  affects: [dashboards, role-detail-pages]
tech_stack:
  added: [recharts@3.8.1, react-countup@6.5.3, tooltip-component]
  patterns: [themed-tooltips, responsive-charts, scroll-triggered-animations, live-calculations]
key_files:
  created:
    - apps/web/src/components/charts/_chart-theme.ts
    - apps/web/src/components/charts/EarningChart.tsx
    - apps/web/src/components/charts/SubmissionDonut.tsx
    - apps/web/src/components/charts/TrustTrend.tsx
    - apps/web/src/components/charts/SubmissionFunnel.tsx
    - apps/web/src/components/charts/RoleFillRate.tsx
    - apps/web/src/components/charts/PlatformRevenue.tsx
    - apps/web/src/components/charts/UserGrowth.tsx
    - apps/web/src/components/charts/index.ts
    - apps/web/src/components/custom/AnimatedMetric.tsx
    - apps/web/src/features/role/components/FeeCalculator.tsx
    - apps/web/src/components/ui/tooltip.tsx
  modified:
    - apps/web/package.json
    - apps/web/src/components/custom/index.ts
    - package-lock.json
decisions:
  - choice: "Shared _chart-theme.ts helper for tooltip/axis styling constants"
    rationale: "DRY principle — 7 chart components share identical tooltip and axis styling patterns, extracting to constants prevents drift"
    alternatives: ["Inline styles in each component", "Tailwind utility classes"]
    impact: "Single source of truth for chart theming, easier dark mode debugging"
  - choice: "Browser native IntersectionObserver for AnimatedMetric scroll trigger"
    rationale: "No external dependency needed, built-in browser API sufficient for simple visibility detection"
    alternatives: ["react-intersection-observer library (9.x)"]
    impact: "Zero bundle cost, StrictMode-safe with useRef flag, respects prefers-reduced-motion"
  - choice: "Horizontal BarChart for SubmissionFunnel instead of FunnelChart"
    rationale: "Better customization and clearer visual (stages read left-to-right), FunnelChart has limited styling options"
    alternatives: ["recharts FunnelChart component"]
    impact: "More flexible theming, consistent with other bar charts, familiar user pattern"
  - choice: "Grouped (not stacked) bars for RoleFillRate"
    rationale: "Side-by-side comparison is clearer than stacked when showing filled vs open roles"
    alternatives: ["Stacked bar chart with stackId"]
    impact: "Easier to compare absolute values per month"
metrics:
  duration: 411
  tasks_completed: 2
  files_created: 12
  files_modified: 3
  commits: 2
  deviations: 0
  completed_date: "2026-04-16"
---

# Phase 08 Plan 01: Chart Components + AnimatedMetric + FeeCalculator Summary

**One-liner:** Complete recharts-based chart library (7 components) + scroll-triggered AnimatedMetric + live FeeCalculator with tier toggle and INR formatting.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install dependencies + create AnimatedMetric + FeeCalculator | `9ce70c9` | package.json, AnimatedMetric.tsx, FeeCalculator.tsx, tooltip.tsx, custom/index.ts |
| 2 | Create all 7 chart components + barrel export | `6758dc5` | _chart-theme.ts, 7 chart files, charts/index.ts |

## What Was Built

### Chart Component Library (7 components)

1. **EarningChart** — Bar chart for recruiter monthly earnings
   - Responsive bar chart with INR-formatted tooltips
   - Primary color fill, rounded top corners [4,4,0,0]
   - Auto-scaled Y-axis

2. **SubmissionDonut** — Pie chart for submission status distribution
   - Donut shape (innerRadius 60%, outerRadius 80%)
   - Center text shows total count
   - Status-colored slices with legend
   - 2px padding angle between slices

3. **TrustTrend** — Line chart for trust score over time
   - Y-axis domain locked to [0, 100]
   - Monotone curve interpolation
   - Primary stroke with activeDot on hover

4. **SubmissionFunnel** — Horizontal bar chart for submission pipeline
   - Vertical layout (horizontal bars reading left-to-right)
   - Stage-colored bars with 100px Y-axis width
   - Clearer visual than recharts FunnelChart

5. **RoleFillRate** — Grouped bar chart for filled vs open roles
   - Side-by-side comparison (not stacked)
   - Success color for filled, muted for open
   - Legend at bottom

6. **PlatformRevenue** — Dual bar chart for admin revenue metrics
   - Revenue (primary) + commission (teal-300)
   - INR-formatted tooltips
   - Grouped bars with legend

7. **UserGrowth** — Dual line chart for user growth trends
   - Companies (primary) + recruiters (teal-300)
   - Monotone curves with dots
   - Legend at bottom

**Shared theming:**
- All charts use `_chart-theme.ts` constants (TOOLTIP_STYLE, AXIS_STYLE, BAR_RADIUS)
- Tooltips themed with CSS variables: `hsl(var(--card))` background, `hsl(var(--border))` border
- Axis labels: `hsl(var(--muted-foreground))`, 12px font size
- All wrapped in `ResponsiveContainer width="100%" height="100%"`
- `accessibilityLayer` prop on all chart root elements
- Zero hardcoded colors — all use `hsl(var(--token))` syntax

### AnimatedMetric Component

Scroll-triggered number counter with accessibility support:
- Uses `react-countup` wrapped in IntersectionObserver
- Triggers animation once when scrolling into view (30% threshold)
- Disconnects observer after first trigger to prevent re-animations
- Respects `prefers-reduced-motion` (sets duration=0)
- StrictMode-safe with `useRef` initialized flag
- Props: `end`, `duration`, `prefix`, `suffix`, `decimals`, `separator`, `className`
- Before visible: renders static formatted value for layout stability

### FeeCalculator Component

Live fee breakdown calculator for role detail pages:
- Two-tier toggle: Regular (6-9%, displays 7.5%) vs Headhunting (15-20%, displays 17.5%)
- Live calculation: payout - fee = earning
- INR formatting via `Intl.NumberFormat('en-IN')`
- Help tooltip explains platform fee tiers
- Card layout with:
  - Badge tier selector (clickable, variant switches on active)
  - Three-row breakdown (payout, fee with %, total earning)
  - Fee amount shows in `text-error` with minus sign
  - Total earning in `text-primary` with bold font, separated by border-top

### Supporting Infrastructure

- **tooltip.tsx** — Added via `shadcn add tooltip` (Radix TooltipPrimitive wrapper)
- **_chart-theme.ts** — Shared constants for consistent chart styling

## Deviations from Plan

None — plan executed exactly as written. All 7 chart components created with typed props, themed tooltips, responsive containers. AnimatedMetric has scroll trigger with reduced-motion support. FeeCalculator has tier toggle with live INR calculation and help tooltip.

## Requirements Satisfied

- **FR-09**: Dashboard Visualization — 7 chart components built with recharts, all themed with CSS variables for dark mode compatibility
- **FR-10**: Fee Transparency UI — FeeCalculator shows live breakdown with tier toggle (regular 6-9%, headhunting 15-20%)

## Testing Evidence

**TypeScript Compilation:**
```bash
cd apps/web && npx tsc --noEmit
# Zero errors — all components type-safe
```

**Hardcoded Color Check:**
```bash
grep -rn "#[0-9a-fA-F]" apps/web/src/components/charts/
# No matches — all charts use hsl(var(--token))
```

**ResponsiveContainer Usage:**
```bash
grep -l "ResponsiveContainer" apps/web/src/components/charts/*.tsx | wc -l
# 7 — all chart components wrapped
```

## Key Learnings

1. **Recharts formatter type safety** — Tooltip `formatter` prop expects `(value: unknown) => string` with explicit return type to satisfy TypeScript's strict ReactNode union
2. **Browser IntersectionObserver sufficient** — No need for react-intersection-observer library when trigger logic is simple (one-shot visibility detection)
3. **Horizontal bar clarity** — `BarChart layout="vertical"` produces clearer funnel visualization than recharts `FunnelChart` component (more styling control, familiar pattern)
4. **Grouped vs stacked bars** — Side-by-side bars easier to compare absolute values; stacked bars better for part-to-whole relationships
5. **CSS variable theming** — Using `hsl(var(--token))` in recharts style props ensures automatic dark mode adaptation without JS

## Next Steps

**Immediate (Plan 02):**
- Integrate chart components into RecruiterDashboard (EarningChart, TrustTrend)
- Integrate into CompanyDashboard (SubmissionFunnel, RoleFillRate)
- Integrate into AdminDashboard (PlatformRevenue, UserGrowth)
- Use AnimatedMetric in StatCardV2 for wallet balance, user counts
- Add FeeCalculator to role detail pages

**Future (Plan 02 - Wave 2):**
- Transform API responses into chart data formats (useMemo for performance)
- Add loading skeletons inside ChartCard
- Handle empty state (no data) gracefully with EmptyState component

## Self-Check

**Files Created:**
```bash
[ -f "apps/web/src/components/charts/EarningChart.tsx" ] && echo "FOUND: EarningChart.tsx" || echo "MISSING: EarningChart.tsx"
[ -f "apps/web/src/components/charts/SubmissionDonut.tsx" ] && echo "FOUND: SubmissionDonut.tsx" || echo "MISSING: SubmissionDonut.tsx"
[ -f "apps/web/src/components/charts/TrustTrend.tsx" ] && echo "FOUND: TrustTrend.tsx" || echo "MISSING: TrustTrend.tsx"
[ -f "apps/web/src/components/charts/SubmissionFunnel.tsx" ] && echo "FOUND: SubmissionFunnel.tsx" || echo "MISSING: SubmissionFunnel.tsx"
[ -f "apps/web/src/components/charts/RoleFillRate.tsx" ] && echo "FOUND: RoleFillRate.tsx" || echo "MISSING: RoleFillRate.tsx"
[ -f "apps/web/src/components/charts/PlatformRevenue.tsx" ] && echo "FOUND: PlatformRevenue.tsx" || echo "MISSING: PlatformRevenue.tsx"
[ -f "apps/web/src/components/charts/UserGrowth.tsx" ] && echo "FOUND: UserGrowth.tsx" || echo "MISSING: UserGrowth.tsx"
[ -f "apps/web/src/components/charts/index.ts" ] && echo "FOUND: charts/index.ts" || echo "MISSING: charts/index.ts"
[ -f "apps/web/src/components/custom/AnimatedMetric.tsx" ] && echo "FOUND: AnimatedMetric.tsx" || echo "MISSING: AnimatedMetric.tsx"
[ -f "apps/web/src/features/role/components/FeeCalculator.tsx" ] && echo "FOUND: FeeCalculator.tsx" || echo "MISSING: FeeCalculator.tsx"
```
All files exist.

**Commits:**
```bash
git log --oneline --all | grep -E "(9ce70c9|6758dc5)"
```
Both commits exist on main branch.

## Self-Check: PASSED

All 12 files created, 2 commits recorded, TypeScript compiles cleanly, zero hardcoded colors, all charts use ResponsiveContainer.
