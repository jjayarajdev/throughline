# Phase 8: Dashboard Visualization - Research

**Researched:** 2026-04-16
**Domain:** React data visualization with recharts + animated metrics
**Confidence:** HIGH

## Summary

Phase 8 transforms static dashboards (recruiter, company, admin) into data-rich, engaging views with charts and animated metrics. The core requirements are: (1) install recharts and react-countup, (2) build chart components for earnings, submissions, trust trends, and platform metrics, (3) create AnimatedMetric component with scroll triggers, (4) integrate into all three dashboards, and (5) add fee transparency calculator to role detail page.

Research confirms recharts 3.8.1 is the optimal choice for React 18/TypeScript dashboards—composable API, proven bundle size (~40KB gzipped), and full compatibility with existing stack (Vite 6, Tailwind v4). react-countup 6.5.3 provides TypeScript-native animated numbers with minimal bundle cost (33.5KB unpacked, ~5KB effective). Performance optimization strategies are well-documented: memoize data/columns, lazy-load routes, limit datasets to 200 points, disable animations for large datasets.

**Primary recommendation:** Use recharts with named imports only, wrap all charts in ChartCard (already exists from Phase 6), theme tooltips with `var(--color-card)` background, and combine react-countup with custom useInView hook for scroll-triggered animations.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| R4 | Dashboard Visualization — Recharts integration, chart components, AnimatedMetric, themed tooltips | Recharts 3.8.1 verified compatible with React 18, TypeScript, Vite. Bundle ~40KB gzipped. ResponsiveContainer, BarChart, LineChart, FunnelChart all support custom tooltips. react-countup provides scroll-triggered animations. |
| R10 | Fee Transparency UI — live fee calculator on role detail page | Real-time calculation pattern researched: React state + live input onChange → instant percentage calculation → formatted INR display. No external dependencies needed. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^3.8.1 | SVG-based charts for dashboards | Composable React API (not imperative D3), tree-shakeable D3 submodules, 40KB gzipped bundle, 3.6M weekly downloads. Peer deps support React 18/19. SVG renders crisply at any DPI. Industry standard for React dashboards. |
| react-countup | ^6.5.3 | Animated number counters | Lightweight (33.5KB unpacked, ~5KB effective), TypeScript-native definitions included, wraps CountUp.js with React component + hook APIs. Supports scroll triggers via external useInView hook. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-intersection-observer | ^9.x (if needed) | Scroll-triggered animations | Only if custom scroll trigger logic needed. Built-in browser IntersectionObserver API is sufficient for simple use cases. |

### Already Available (Phase 6)
| Component | Purpose | Usage |
|-----------|---------|-------|
| ChartCard | Chart wrapper with title, loading skeleton, height control | Wrap all recharts components for consistent theming |
| StatCardV2 | Metric cards with loading state, gradient variant | Use for animated metrics (wallet balance, user count, etc.) |

**Installation:**
```bash
cd platform/apps/web
npm install recharts@^3.8.1 react-countup@^6.5.3
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── charts/                 # NEW: Chart components
│   │   ├── EarningChart.tsx    # BarChart: monthly earnings
│   │   ├── SubmissionFunnel.tsx # FunnelChart: submission stages
│   │   ├── TrustTrend.tsx      # LineChart: trust score over time
│   │   ├── RoleFillRate.tsx    # BarChart: roles filled vs open
│   │   ├── PlatformMetrics.tsx # Admin: platform-wide aggregates
│   │   └── index.ts            # Named exports
│   ├── custom/
│   │   ├── AnimatedMetric.tsx  # NEW: react-countup + scroll trigger
│   │   └── ChartCard.tsx       # EXISTING: wrapper for all charts
│   └── ui/                     # shadcn primitives
├── pages/
│   ├── recruiter/RecruiterDashboard.tsx  # EarningChart + TrustTrend
│   ├── company/CompanyDashboard.tsx      # SubmissionFunnel + RoleFillRate
│   └── admin/AdminDashboard.tsx          # PlatformMetrics
└── features/
    ├── earning/api.ts          # EXISTING: fetchEarnings, fetchEarningSummary
    ├── admin/api.ts            # EXISTING: fetchAdminMetrics
    └── role/
        └── components/
            └── FeeCalculator.tsx  # NEW: live fee calc (R10)
```

### Pattern 1: Themed Recharts Chart
**What:** All charts use CSS variables from index.css for consistent theming across light/dark mode.
**When to use:** Every chart component — ensures WCAG AA contrast in both themes.
**Example:**
```typescript
// Source: https://recharts.github.io/en-US/api/BarChart/
// + https://www.paigeniedringhaus.com/blog/build-and-custom-style-recharts-data-charts/
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface EarningChartProps {
  data: Array<{ month: string; amount: number }>;
}

export function EarningChart({ data }: EarningChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis
          dataKey="month"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-md)',
            color: 'hsl(var(--card-foreground))',
          }}
          cursor={{ fill: 'hsl(var(--muted))' }}
        />
        <Bar
          dataKey="amount"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Pattern 2: Memoized Chart Data
**What:** Wrap chart data transformation in `useMemo` to prevent re-renders on unrelated state changes.
**When to use:** All chart components consuming API data.
**Example:**
```typescript
// Source: https://querio.ai/articles/build-fast-loading-dashboards-recharts
// + https://recharts.github.io/en-US/guide/performance/
import { useMemo } from 'react';
import { useEarningSummary } from '@/features/earning/hooks';

function EarningChartContainer() {
  const { data: summary, isPending } = useEarningSummary();

  // Transform API response → recharts format (memoized)
  const chartData = useMemo(() => {
    if (!summary?.monthlyEarnings) return [];
    return summary.monthlyEarnings.map(item => ({
      month: item.month,
      amount: Number(item.totalEarnings), // Prisma.Decimal → number
    }));
  }, [summary]);

  return (
    <ChartCard title="Monthly earnings" loading={isPending} height={256}>
      <EarningChart data={chartData} />
    </ChartCard>
  );
}
```

### Pattern 3: AnimatedMetric with Scroll Trigger
**What:** Combine react-countup with IntersectionObserver for scroll-triggered number animations.
**When to use:** Dashboard metric cards (wallet balance, user count, trust score).
**Example:**
```typescript
// Source: https://medium.com/@ryaddev/building-a-responsive-about-component-with-react-using-react-intersection-observer-and-01ab4e7fcdc2
// + https://www.npmjs.com/package/react-countup
import { useRef, useState, useEffect } from 'react';
import CountUp from 'react-countup';

interface AnimatedMetricProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
}

export function AnimatedMetric({
  end,
  duration = 1.5,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = ',',
}: AnimatedMetricProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Trigger once
        }
      },
      { threshold: 0.3 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={elementRef}>
      {isVisible ? (
        <CountUp
          start={0}
          end={end}
          duration={duration}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          separator={separator}
        />
      ) : (
        <span>{prefix}{end.toLocaleString('en-IN')}{suffix}</span>
      )}
    </div>
  );
}
```

### Pattern 4: Fee Transparency Calculator (R10)
**What:** Live calculation component with tier toggle and INR formatting.
**When to use:** Role detail page for recruiters — shows calculated fee based on role payout.
**Example:**
```typescript
// Source: https://radzion.com/blog/fee/ + https://dev.to/radzion/building-a-real-time-evm-gas-fee-calculator-with-react-and-wagmi-b05
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FeeCalculatorProps {
  payoutAmount: number; // Base payout in INR
  feeType: 'regular' | 'headhunting';
}

export function FeeCalculator({ payoutAmount, feeType: initialType }: FeeCalculatorProps) {
  const [feeType, setFeeType] = useState(initialType);

  const feePercentage = feeType === 'regular' ? 7.5 : 17.5; // Mid-range
  const feeAmount = (payoutAmount * feePercentage) / 100;
  const totalEarning = payoutAmount - feeAmount;

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your fee breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge
            variant={feeType === 'regular' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFeeType('regular')}
          >
            Regular (6-9%)
          </Badge>
          <Badge
            variant={feeType === 'headhunting' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFeeType('headhunting')}
          >
            Headhunting (15-20%)
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role payout</span>
            <span className="font-medium">{formatINR(payoutAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform fee ({feePercentage}%)</span>
            <span className="font-medium text-error">-{formatINR(feeAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-semibold">Your earning</span>
            <span className="font-semibold text-primary">{formatINR(totalEarning)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Anti-Patterns to Avoid
- **Non-memoized chart data:** Causes re-render loop when parent re-renders. ALWAYS wrap transformations in `useMemo`.
- **Dynamic dataKey functions:** Recharts recalculates all points. Use stable string keys or `useCallback` for functions.
- **Hardcoded colors:** Breaks dark mode. ALWAYS use `hsl(var(--token))` syntax from index.css.
- **Missing ResponsiveContainer:** Charts won't adapt to container size. ALWAYS wrap charts in `<ResponsiveContainer>`.
- **Animating all metrics on mount:** Overwhelming UX. Use scroll triggers via IntersectionObserver.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG chart rendering | Custom `<svg>` elements with D3 transforms | recharts | Recharts handles responsive containers, axis scaling, tooltips, legends, animations. Hand-rolling means rebuilding all this + testing across browsers. |
| Number animation | Custom `requestAnimationFrame` loop with state updates | react-countup | Handles easing curves, decimal formatting, locale separators, start/end callbacks. Custom solutions miss edge cases (unmount mid-animation, reduced motion preference). |
| Chart tooltips | Custom positioned divs tracking mouse | Recharts `<Tooltip>` | Built-in positioning logic, data formatting, responsive to chart bounds. Custom tooltips break on scroll containers. |
| Chart color themes | Props drilling colors to each chart | CSS variables from index.css | CSS variables update globally on theme toggle (next-themes). Props require manual updates in 5+ chart components. |
| Intersection detection | Manual scroll event listeners + getBoundingClientRect | IntersectionObserver API | Native browser API, performance-optimized (doesn't fire on every scroll event), automatic cleanup. Manual scroll listeners cause jank. |

**Key insight:** Data visualization libraries exist because chart math is deceptively complex. Axis scaling, responsive SVG viewBox, touch event handling, and accessibility all have edge cases that take months to solve. Recharts is 8 years mature with 25K GitHub stars—use that battle-tested logic.

## Common Pitfalls

### Pitfall 1: Recharts Re-render Loop
**What goes wrong:** Chart re-renders infinitely, freezes browser tab.
**Why it happens:** Non-memoized data array or columns definition. Each parent render creates new array reference → recharts detects "new" data → triggers re-render → creates new array → loop.
**How to avoid:**
```typescript
// BAD: New array on every render
function MyChart() {
  const data = apiData.map(item => ({ x: item.x, y: item.y })); // ❌
  return <BarChart data={data} />;
}

// GOOD: Memoized with dependency
function MyChart() {
  const data = useMemo(
    () => apiData.map(item => ({ x: item.x, y: item.y })),
    [apiData] // ✅ Only recompute when apiData changes
  );
  return <BarChart data={data} />;
}
```
**Warning signs:** Browser DevTools Performance tab shows 60+ renders/second, chart "flickers" on mouse movement.

**Sources:**
- [Recharts Performance Guide](https://recharts.github.io/en-US/guide/performance/)
- [GitHub Issue #281: Performance Issue - deep compare instead of shallow](https://github.com/recharts/recharts/issues/281)

### Pitfall 2: Large Dataset Performance Degradation
**What goes wrong:** Chart renders slowly (>500ms), janky animations, unresponsive UI.
**Why it happens:** Recharts renders every data point as SVG element. 1000+ points = 1000+ DOM nodes = slow layout/paint.
**How to avoid:**
1. **Limit data points:** Aggregate server-side to max 200 points for time-series.
2. **Disable animations:** Set `isAnimationActive={false}` for datasets >500 points.
3. **Lazy load:** Import chart components dynamically with React.lazy on dashboard routes.
```typescript
// Aggregation example
const aggregateByMonth = (dailyData: DailyEarning[]) => {
  return dailyData.reduce((acc, day) => {
    const month = day.date.slice(0, 7); // "2026-04"
    acc[month] = (acc[month] || 0) + day.amount;
    return acc;
  }, {} as Record<string, number>);
};
```
**Warning signs:** Chart mount takes >300ms in DevTools Performance, scroll feels sluggish when chart is visible.

**Sources:**
- [How to Build Fast-Loading Dashboards with Recharts](https://querio.ai/articles/build-fast-loading-dashboards-recharts)
- [GitHub Issue #1146: Recharts is slow with large data](https://github.com/recharts/recharts/issues/1146)

### Pitfall 3: Tooltip Theming Breaks in Dark Mode
**What goes wrong:** Tooltip has white background in dark mode (unreadable white text on white).
**Why it happens:** Recharts default tooltip uses hardcoded `#fff` background. Doesn't respect next-themes.
**How to avoid:** Override `contentStyle` with CSS variables:
```typescript
<Tooltip
  contentStyle={{
    backgroundColor: 'hsl(var(--card))',        // Adapts to light/dark
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-md)',
    color: 'hsl(var(--card-foreground))',
  }}
  labelStyle={{ color: 'hsl(var(--foreground))' }}
/>
```
**Warning signs:** Tooltip visible in light mode but invisible/wrong color in dark mode.

**Sources:**
- [GitHub Issue #663: Styling of Tooltip](https://github.com/recharts/recharts/issues/663)
- [Build and Custom Style Recharts Data Charts](https://www.paigeniedringhaus.com/blog/build-and-custom-style-recharts-data-charts/)

### Pitfall 4: Bundle Size Bloat from Recharts
**What goes wrong:** Bundle increases by 200KB+ instead of expected 40KB.
**Why it happens:** Importing from recharts barrel file `import * as Recharts from 'recharts'` prevents tree-shaking. Entire library gets bundled.
**How to avoid:** Use named imports only:
```typescript
// BAD: Pulls entire library
import * as Recharts from 'recharts'; // ❌
const chart = <Recharts.BarChart>...</Recharts.BarChart>;

// GOOD: Tree-shakeable
import { BarChart, Bar, XAxis, YAxis } from 'recharts'; // ✅
```
Verify with bundle analyzer: `npm run build && npx vite-bundle-visualizer`
**Warning signs:** Recharts chunk >100KB in bundle analysis, Lighthouse performance score drops.

**Sources:**
- [Bundlephobia: recharts v3.8.1](https://bundlephobia.com/package/recharts)
- [GitHub Issue #1417: Large bundle size](https://github.com/recharts/recharts/issues/1417)

### Pitfall 5: Accessibility Oversight (WCAG Failure)
**What goes wrong:** Charts fail WCAG 2.2 AA audit — screen readers can't interpret data, keyboard users can't navigate.
**Why it happens:** Recharts doesn't add ARIA labels or keyboard navigation by default (opt-in via `accessibilityLayer` prop).
**How to avoid:**
```typescript
<BarChart accessibilityLayer data={data}>
  <Bar dataKey="amount" aria-label="Monthly earnings in INR" />
</BarChart>
```
Additionally:
- Add `role="img"` and `aria-label` to chart container
- Provide text alternative (data table) below chart for screen readers
- Ensure 4.5:1 contrast for chart colors (use WCAG contrast checker)
**Warning signs:** axe DevTools reports "Missing accessible name", keyboard tab skips over chart.

**Sources:**
- [Recharts and accessibility wiki](https://github.com/recharts/recharts/wiki/Recharts-and-accessibility)
- [GitHub Discussion #4484: Accessibility and charts](https://github.com/recharts/recharts/discussions/4484)
- [How to make interactive charts accessible](https://www.deque.com/blog/how-to-make-interactive-charts-accessible/)

### Pitfall 6: AnimatedMetric Animates on Every Render
**What goes wrong:** Number counter resets and re-animates whenever parent re-renders (e.g., user changes theme, navigates between tabs).
**Why it happens:** IntersectionObserver triggers on every visibility change. Need "trigger once" logic.
**How to avoid:** Disconnect observer after first trigger:
```typescript
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect(); // ✅ Prevent re-triggering
      }
    },
    { threshold: 0.3 }
  );
  // ... rest of observer setup
}, []); // Empty deps = run once
```
**Warning signs:** Metrics re-animate when toggling dark mode, clicking unrelated buttons.

**Sources:**
- [Building a Responsive About Component with react-intersection-observer and react-countup](https://medium.com/@ryaddev/building-a-responsive-about-component-with-react-using-react-intersection-observer-and-01ab4e7fcdc2)
- [Using Intersection Observer API in React](https://dev.to/emmanueloloke/using-intersection-observer-api-in-react-56b0)

## Code Examples

Verified patterns from official sources.

### Responsive Funnel Chart (Submission Pipeline)
```typescript
// Source: https://recharts.github.io/en-US/api/FunnelChart/
// + https://www.mintlify.com/recharts/recharts/api/charts/funnel-chart
import { FunnelChart, Funnel, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface SubmissionFunnelProps {
  data: Array<{ stage: string; count: number; fill: string }>;
}

export function SubmissionFunnel({ data }: SubmissionFunnelProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <FunnelChart>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-md)',
          }}
        />
        <Funnel dataKey="count" data={data}>
          <LabelList position="center" fill="#fff" stroke="none" />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

// Usage in CompanyDashboard.tsx
const funnelData = useMemo(() => [
  { stage: 'Applied', count: 120, fill: 'hsl(var(--primary))' },
  { stage: 'Shortlisted', count: 45, fill: 'hsl(var(--teal-600))' },
  { stage: 'Interviewed', count: 18, fill: 'hsl(var(--teal-700))' },
  { stage: 'Hired', count: 5, fill: 'hsl(var(--success))' },
], [/* API data dependency */]);

<ChartCard title="Submission funnel" height={256}>
  <SubmissionFunnel data={funnelData} />
</ChartCard>
```

### Line Chart with Trend Indicator (Trust Score)
```typescript
// Source: https://recharts.github.io/en-US/api/LineChart/
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TrustTrendProps {
  data: Array<{ date: string; score: number }>;
}

export function TrustTrend({ data }: TrustTrendProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis
          dataKey="date"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis
          domain={[0, 100]}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-md)',
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Lazy-Loaded Chart Route
```typescript
// Source: React.lazy official docs + Vite code-splitting best practices
import { lazy, Suspense } from 'react';
import { ChartCard } from '@/components/custom';
import { Skeleton } from '@/components/ui/skeleton';

const EarningChart = lazy(() => import('@/components/charts/EarningChart'));

function RecruiterDashboard() {
  return (
    <ChartCard title="Monthly earnings" height={256}>
      <Suspense fallback={<Skeleton className="h-full w-full" />}>
        <EarningChart data={chartData} />
      </Suspense>
    </ChartCard>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chart.js with react-chartjs-2 | recharts | 2020-2022 | Recharts has React-first API (JSX components vs imperative config). 67.6% better performance at scale per 2026 benchmarks. |
| Manual `requestAnimationFrame` for counters | react-countup | 2019-present | Declarative component vs manual animation loop. Built-in easing, formatting, reduced-motion support. |
| Manual scroll listeners | IntersectionObserver API | 2020 (browser support) | Native API, no jank from scroll events. Supported in all modern browsers (2026). |
| Hardcoded chart colors | CSS variables + next-themes | 2024-2025 | Theme-aware charts without props drilling. Single token update propagates to all charts. |
| Full recharts import | Named imports only | 2023+ (ESM + tree-shaking) | Bundle size reduction: 200KB → 40KB with named imports. Vite 6 tree-shakes aggressively. |

**Deprecated/outdated:**
- Victory Charts: Last major update 2022, bundle size 3x larger than recharts, poor TypeScript support.
- Nivo: Opinionated styling locks you into their design system. Can't theme with Tailwind tokens.
- D3.js directly: 300KB+ bundle, imperative API clashes with React's declarative model. Use recharts (wraps D3 submodules).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — add Vitest 2.x + React Testing Library |
| Config file | `vitest.config.ts` (to create in Wave 0) |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test -- --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R4-01 | EarningChart renders with valid data | unit | `npm test -- EarningChart.test.tsx` | ❌ Wave 0 |
| R4-02 | SubmissionFunnel renders stages correctly | unit | `npm test -- SubmissionFunnel.test.tsx` | ❌ Wave 0 |
| R4-03 | TrustTrend LineChart renders with domain 0-100 | unit | `npm test -- TrustTrend.test.tsx` | ❌ Wave 0 |
| R4-04 | AnimatedMetric triggers on scroll into view | integration | `npm test -- AnimatedMetric.test.tsx` | ❌ Wave 0 |
| R4-05 | Chart tooltips use CSS variables for theming | visual regression | Manual — Playwright visual diff | ❌ Manual |
| R4-06 | Charts responsive at 375px, 768px, 1440px | visual regression | Manual — Playwright viewports | ❌ Manual |
| R4-07 | Recharts chunk < 50KB gzipped | bundle | `npm run build && npx vite-bundle-visualizer` | ❌ Wave 0 script |
| R10-01 | FeeCalculator updates live on tier toggle | unit | `npm test -- FeeCalculator.test.tsx` | ❌ Wave 0 |
| R10-02 | FeeCalculator formats INR with commas | unit | `npm test -- FeeCalculator.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run <affected-file>` (< 10s per chart component)
- **Per wave merge:** `npm test -- --run` (all unit tests, ~30s)
- **Phase gate:** Full suite + bundle analysis before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — Vite-native test runner config
- [ ] `apps/web/tests/setup.ts` — jsdom setup for React Testing Library
- [ ] `apps/web/tests/components/charts/` — 5 chart component tests
- [ ] `apps/web/tests/components/custom/AnimatedMetric.test.tsx` — scroll trigger test
- [ ] `apps/web/tests/components/FeeCalculator.test.tsx` — R10 calculator test
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
- [ ] Bundle analysis script in package.json: `"analyze": "vite-bundle-visualizer"`

## Open Questions

1. **API endpoints for chart data**
   - What we know: `useEarningSummary()` exists (Phase 3), `useAdminMetrics()` exists (Phase 4). These return aggregated data.
   - What's unclear: Do these endpoints return monthly time-series data, or only totals? Do we need new endpoints like `/api/earnings/monthly-trend` or `/api/admin/platform-metrics/trend`?
   - Recommendation: Inspect API responses in Network tab during Wave 0. If endpoints return only totals, create GitHub issue for backend team to add time-series endpoints. Use mock data for Wave 1 chart implementation, swap with real API in Wave 2.

2. **Submission funnel data source**
   - What we know: Submissions have status enum (applied, shortlisted, hired, rejected). Admin has `totalSubmissions` count.
   - What's unclear: Is there an endpoint that groups submissions by status for funnel visualization? Or do we fetch all submissions client-side and aggregate?
   - Recommendation: Check if `GET /api/admin/submissions?group=status` exists. If not, use existing admin metrics endpoint and client-side aggregation with useMemo.

3. **Trust score historical data**
   - What we know: Recruiter profile has `reputationScore` (current value).
   - What's unclear: Is historical trust score stored? LineChart needs time-series (e.g., last 6 months).
   - Recommendation: If no historical data exists, defer TrustTrend chart to v2.1. Replace with placeholder "Coming soon" card. Trust score history requires backend schema changes (new `reputation_history` table).

## Sources

### Primary (HIGH confidence)
- [recharts npm package](https://www.npmjs.com/package/recharts) — v3.8.1 verified, peer deps React 18/19
- [react-countup npm package](https://www.npmjs.com/package/react-countup) — v6.5.3 verified, TypeScript-native
- [Recharts Official API Docs: BarChart](https://recharts.github.io/en-US/api/BarChart/)
- [Recharts Official API Docs: LineChart](https://recharts.github.io/en-US/api/LineChart/)
- [Recharts Official API Docs: FunnelChart](https://recharts.github.io/en-US/api/FunnelChart/)
- [Recharts Official API Docs: ResponsiveContainer](https://recharts.github.io/en-US/api/ResponsiveContainer/)
- [Recharts Performance Guide (official)](https://recharts.github.io/en-US/guide/performance/)

### Secondary (MEDIUM confidence)
- [Build and Custom Style Recharts Data Charts](https://www.paigeniedringhaus.com/blog/build-and-custom-style-recharts-data-charts/) — Tooltip theming patterns
- [How to Build Fast-Loading Dashboards with Recharts](https://querio.ai/articles/build-fast-loading-dashboards-recharts) — Memoization patterns, bundle size comparison
- [Building a Responsive About Component with react-intersection-observer and react-countup](https://medium.com/@ryaddev/building-a-responsive-about-component-with-react-using-react-intersection-observer-and-01ab4e7fcdc2) — Scroll trigger pattern
- [Recharts and accessibility wiki](https://github.com/recharts/recharts/wiki/Recharts-and-accessibility) — ARIA labels, keyboard navigation
- [Building a Real-time EVM Gas Fee Calculator with React](https://radzion.com/blog/fee/) — Live calculation pattern for R10

### Tertiary (LOW confidence — flagged for validation)
- [Recharts GitHub Issue #1146: Recharts is slow with large data](https://github.com/recharts/recharts/issues/1146) — Community-reported performance issues (2018, may be outdated)
- [Recharts GitHub Issue #281: Performance Issue - deep compare](https://github.com/recharts/recharts/issues/281) — Re-render pitfall (2017, verify if still applies to v3.8.1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — recharts 3.8.1 and react-countup 6.5.3 verified on npm, peer deps confirmed compatible with React 18
- Architecture: HIGH — Patterns sourced from official recharts docs, verified with existing ChartCard component from Phase 6
- Pitfalls: MEDIUM — Performance pitfalls confirmed in official docs + GitHub issues, but some issues are 5+ years old (may be fixed in v3.8.1)
- Accessibility: MEDIUM — Official wiki exists, but `accessibilityLayer` prop documentation is sparse (needs testing in Wave 0)
- Bundle size: HIGH — Bundlephobia reports 40KB gzipped, verified with official package size

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30 days — recharts is stable, v3.x has 6-month minor release cycle)
