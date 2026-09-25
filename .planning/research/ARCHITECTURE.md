# Architecture Research

**Domain:** UI/UX Design System Overhaul (React 18 + Tailwind v4 SPA)
**Researched:** 2026-04-14
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Design System Layer                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  CSS Tokens  │  │  Typography  │  │  Animations  │       │
│  │  (OKLCH)     │  │  (Inter)     │  │  (GPU-accel) │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
├─────────┴─────────────────┴─────────────────┴────────────────┤
│                     Component Library                        │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │  shadcn/ui │  │  Custom    │  │  Charts    │             │
│  │  (wrapped) │  │  Wrappers  │  │  (Recharts)│             │
│  └────┬───────┘  └────┬───────┘  └────┬───────┘             │
│       │               │               │                      │
├───────┴───────────────┴───────────────┴──────────────────────┤
│                     Page Layer (33 pages)                    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Role-Based Pages (recruiter/ company/ admin/)       │    │
│  │  - Dashboard  - Profile  - Wallet  - Submissions     │    │
│  └──────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ TanStack   │  │ Zustand    │  │ Feature    │             │
│  │ Query      │  │ (UI State) │  │ API Modules│             │
│  └────────────┘  └────────────┘  └────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **CSS Tokens** | Design system foundation (colors, spacing, typography, radii) | OKLCH values in :root / .dark, @theme inline mapping |
| **shadcn/ui Primitives** | Base UI components (Button, Card, Dialog, etc.) | 14 Radix primitives in components/ui/ |
| **Custom Wrappers** | Role-specific styling, business logic, chart compositions | components/custom/ extending shadcn primitives |
| **Page Components** | Feature assembly, data fetching, layout | pages/{role}/*.tsx using feature hooks |
| **Feature Modules** | API integration, React Query hooks, cache invalidation | features/{domain}/api.ts + hooks.ts |
| **Layout System** | AppShell (sidebar, topbar, role-based accent) | components/layouts/ with 240px sidebar on md+ |

## Recommended Project Structure

```
apps/web/src/
├── index.css                    # @theme inline, CSS tokens, global styles
├── styles/                      # NEW: design system CSS modules
│   ├── tokens.css               # Deep Teal palette, semantic tokens
│   ├── typography.css           # Inter variable font preload, @font-face
│   └── animations.css           # Reusable keyframes, GPU-accelerated utils
├── components/
│   ├── ui/                      # shadcn/ui primitives (14 existing)
│   │   ├── button.tsx           # RESTYLE: update CVA variants for Deep Teal
│   │   ├── card.tsx             # RESTYLE: border-radius, shadow updates
│   │   └── ...                  # Other shadcn components (restyle inline)
│   ├── custom/                  # NEW: wrapper components
│   │   ├── stat-card-v2.tsx     # Deep Teal gradient variant
│   │   ├── chart-card.tsx       # Recharts wrapper with loading states
│   │   └── metric-badge.tsx     # Animated metric display
│   ├── charts/                  # NEW: Recharts compositions
│   │   ├── earning-chart.tsx    # Bar chart for earnings by month
│   │   ├── submission-funnel.tsx # Funnel chart for submission stages
│   │   └── trust-trend.tsx      # Line chart for trust score over time
│   ├── shared/                  # Existing shared components
│   │   ├── StatCard.tsx         # DEPRECATE: replace with custom/stat-card-v2.tsx
│   │   ├── Logo.tsx             # EXTEND: add animated variant
│   │   ├── EmptyState.tsx       # RESTYLE: update illustration colors
│   │   └── ...
│   ├── layouts/                 # Existing layouts
│   │   ├── AppShell.tsx         # RESTYLE: update accent color mappings
│   │   └── Topbar.tsx           # RESTYLE: add subtle backdrop blur
│   └── wallet/                  # Existing wallet components
│       ├── WalletBalanceCard.tsx # RESTYLE: Deep Teal accent, add chart
│       └── ...
├── features/                    # Existing feature modules (no changes)
│   ├── auth/
│   ├── role/
│   ├── submission/
│   ├── wallet/
│   └── ...
├── pages/                       # 33 existing pages
│   ├── recruiter/               # RESTYLE: 10 pages
│   │   ├── RecruiterDashboard.tsx # Add Recharts, update StatCard usage
│   │   └── ...
│   ├── company/                 # RESTYLE: 13 pages
│   │   ├── CompanyDashboard.tsx   # Add submission funnel chart
│   │   └── ...
│   ├── admin/                   # RESTYLE: 5 pages
│   │   ├── AdminDashboard.tsx     # Add platform metrics charts
│   │   └── ...
│   └── shared/                  # RESTYLE: 5 pages
│       └── Notifications.tsx
└── lib/                         # Utilities (no changes)
    └── utils.ts                 # cn() for class merging
```

### Structure Rationale

- **styles/:** Separates design system CSS from component logic. Allows atomic CSS imports and avoids index.css bloat. tokens.css holds the Deep Teal palette as CSS custom properties; typography.css preloads Inter and defines @font-face; animations.css contains reusable keyframes for micro-interactions.
- **components/custom/:** New components that extend shadcn primitives. Keeps shadcn/ui folder pristine (only modified inline for color/spacing updates). Custom wrappers add business logic (e.g., chart-card.tsx handles loading states, error boundaries).
- **components/charts/:** Domain-specific Recharts compositions. Each chart component receives typed data from feature hooks, handles responsive sizing, and applies Deep Teal theming. Colocates chart logic separate from generic UI components.
- **Restyle vs Extend vs Deprecate:** shadcn primitives are restyled inline (update CVA variants, Tailwind classes). Shared components with hardcoded colors/spacing are deprecated and replaced with custom/ wrappers. Layout components (AppShell, Topbar) are restyled to use new CSS tokens.

## Architectural Patterns

### Pattern 1: CSS-First Design Tokens (Tailwind v4)

**What:** Define all design tokens as CSS custom properties in :root / .dark, then map them to Tailwind utilities via @theme inline. No tailwind.config.js for token management.

**When to use:** For all color, spacing, typography, and radius values. Enables runtime theme switching without rebuilds and allows CSS custom properties to be referenced in arbitrary values, JavaScript, and third-party libraries.

**Trade-offs:**
- **Pros:** Runtime theme switching, single source of truth for tokens, better DX with auto-completion.
- **Cons:** Requires Tailwind v4+ (CSS-first architecture), slight mental shift from JS config.

**Example:**
```css
/* styles/tokens.css */
:root {
  /* Deep Teal primitive tokens (OKLCH for perceptual uniformity) */
  --teal-50: oklch(97% 0.02 200);
  --teal-100: oklch(92% 0.04 200);
  --teal-200: oklch(85% 0.06 200);
  --teal-500: oklch(60% 0.12 200);
  --teal-900: oklch(22% 0.08 200);

  /* Semantic tokens (role-based) */
  --color-brand-primary: var(--teal-500);
  --color-brand-subtle: var(--teal-100);
  --color-surface-brand: var(--teal-50);
}

.dark {
  /* Dark mode surface hierarchy (step up 5-8% lightness) */
  --color-surface-base: oklch(14% 0.02 200);
  --color-surface-raised: oklch(20% 0.03 200);
  --color-surface-overlay: oklch(26% 0.04 200);
  --color-brand-primary: var(--teal-400);
}

/* @theme inline mapping */
@theme inline {
  --color-brand-primary: var(--color-brand-primary);
  --color-brand-subtle: var(--color-brand-subtle);
  --color-surface-brand: var(--color-surface-brand);
}
```

```tsx
// Usage in component
<div className="bg-brand-primary text-white">
  {/* Uses var(--color-brand-primary) automatically */}
</div>
```

### Pattern 2: shadcn/ui Wrapper Pattern

**What:** Create wrapper components in components/custom/ that extend shadcn primitives with business logic, additional variants, or chart integrations. Leave components/ui/ files mostly untouched (only inline restyling).

**When to use:** When a shadcn component needs role-specific styling (e.g., recruiter vs company accent colors), requires data fetching or loading states, or composes multiple primitives (e.g., StatCard + Recharts).

**Trade-offs:**
- **Pros:** Keeps shadcn primitives updatable, clear separation of concerns, easier to test custom logic.
- **Cons:** Additional abstraction layer, need to document which components live where.

**Example:**
```tsx
// components/custom/stat-card-v2.tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardV2Props {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
  variant?: 'default' | 'teal' | 'gradient';
}

export function StatCardV2({ label, value, trend, isLoading, variant = 'default' }: StatCardV2Props) {
  const variantStyles = {
    default: 'border bg-card',
    teal: 'border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/30',
    gradient: 'border-0 bg-gradient-to-br from-teal-500 to-teal-600 text-white',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{value}</span>
            {trend && <TrendIndicator trend={trend} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Pattern 3: Recharts Composition with Feature Hooks

**What:** Colocate Recharts chart components in components/charts/, fetch data via existing feature hooks, and pass typed data arrays to chart compositions. Chart components handle responsive sizing, loading states, and Deep Teal theming.

**When to use:** For all dashboard visualizations (earnings, submissions, trust score trends). Recharts' declarative API aligns with React patterns and integrates cleanly with TanStack Query.

**Trade-offs:**
- **Pros:** Type-safe chart data, automatic refetching via React Query, responsive by default, themeable via CSS tokens.
- **Cons:** Recharts bundle size (~100KB gzipped), requires custom tooltips for brand consistency.

**Example:**
```tsx
// components/charts/earning-chart.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface EarningChartProps {
  data: Array<{ month: string; amount: number }>;
  isLoading?: boolean;
}

export function EarningChart({ data, isLoading }: EarningChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Earnings Trend</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-64 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Earnings Trend</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={256}>
          <BarChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }} />
            <Bar dataKey="amount" fill="var(--color-brand-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

```tsx
// pages/recruiter/RecruiterDashboard.tsx
import { useEarningTrend } from '@/features/earning/hooks';
import { EarningChart } from '@/components/charts/earning-chart';

export default function RecruiterDashboard() {
  const earningTrend = useEarningTrend({ period: 'last-6-months' });

  return (
    <div className="space-y-6">
      <EarningChart data={earningTrend.data ?? []} isLoading={earningTrend.isPending} />
    </div>
  );
}
```

### Pattern 4: Inter Variable Font Preload

**What:** Preload Inter variable font in index.html using <link rel="preload">, define @font-face in styles/typography.css with font-display: swap, and update index.css body font stack to use Inter.

**When to use:** Critical for perceived performance and FOUT reduction. Preload only the latin subset (most used) to avoid bloating initial load.

**Trade-offs:**
- **Pros:** Faster font rendering, single variable font file (reduces HTTP requests), better FOUT handling.
- **Cons:** Variable fonts are ~50KB larger than static subsets, requires careful preload to avoid blocking render.

**Example:**
```html
<!-- index.html -->
<head>
  <link rel="preload" href="/fonts/inter-variable.woff2" as="font" type="font/woff2" crossorigin />
</head>
```

```css
/* styles/typography.css */
@font-face {
  font-family: 'Inter Variable';
  src: url('/fonts/inter-variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
  font-style: normal;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

```css
/* index.css */
@import './styles/typography.css';

@layer base {
  body {
    font-family: 'Inter Variable', system-ui, -apple-system, sans-serif;
    font-feature-settings: 'cv11', 'ss01'; /* Stylistic alternates */
  }
}
```

### Pattern 5: GPU-Accelerated Animations

**What:** Animate only transform and opacity (compositor thread properties). Use will-change sparingly (apply on hover/focus, remove after). Define reusable keyframes in styles/animations.css.

**When to use:** For micro-interactions (hover states, modals, notifications), page transitions, and chart animations. Avoids main thread blocking during React rendering.

**Trade-offs:**
- **Pros:** 60fps on mobile, non-blocking, smooth even during heavy JS execution.
- **Cons:** Overuse of will-change increases GPU memory, can cause visual artifacts.

**Example:**
```css
/* styles/animations.css */
@keyframes slide-up {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.2s ease-out;
}

.animate-scale-in {
  animation: scale-in 0.15s ease-out;
}

/* Apply will-change only on interaction */
.card-hover:hover {
  will-change: transform;
  transform: translateY(-2px);
  transition: transform 0.2s ease-out;
}
```

```tsx
// Usage in component
<Card className="card-hover transition-shadow hover:shadow-lg">
  {/* Content */}
</Card>

<Dialog>
  <DialogContent className="animate-scale-in">
    {/* Modal content with entrance animation */}
  </DialogContent>
</Dialog>
```

## Data Flow

### Chart Data Flow

```
[Page Component] → useFeatureHook() → TanStack Query
        ↓                                    ↓
  [Chart Component]                    [API Request]
        ↓                                    ↓
  [Recharts]  ←─────────────────── [Cached Data Array]
        ↓
  [SVG Render]
```

**Key Data Flows:**

1. **Dashboard Metrics:** Page calls `useRecruiterProfile()` → React Query fetches `/api/v1/recruiters/me` → Chart component receives `{ walletBalance, submissions, trustScore }` → Recharts renders bars/lines with Deep Teal theming.
2. **Earning Trend:** Page calls `useEarningTrend({ period: 'last-6-months' })` → React Query fetches aggregated data → EarningChart receives `Array<{ month, amount }>` → BarChart renders with responsive container.
3. **Submission Funnel:** Page calls `useSubmissionStats()` → React Query fetches stage counts → FunnelChart receives `Array<{ stage, count }>` → Custom SVG funnel with Deep Teal gradient.

### Theme Switching Flow

```
[User clicks theme toggle]
        ↓
  [Zustand UI store updates]
        ↓
  [React effect updates <html> class]
        ↓
  [CSS custom properties cascade]
        ↓
  [Components re-render with new tokens]
```

**No rebuild required** — all theme values are CSS custom properties. Dark mode is a class toggle on `<html>`, and CSS variables under `.dark` override :root values.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **33 pages (current)** | Incremental restyling, start with shared components (Button, Card, StatCard), then roll out to high-traffic pages (dashboards). No bundle size concerns — Recharts + Inter variable font add ~150KB gzipped. |
| **50+ pages** | Consider code-splitting charts (lazy load Recharts on dashboard routes only). Extract theme tokens to separate CSS bundle for instant theme switching without re-downloading component CSS. |
| **100+ components** | Formalize component documentation (Storybook), establish design token governance (who can add new CSS tokens), consider CSS-in-TS for complex conditional theming. |

### Scaling Priorities

1. **First bottleneck:** Bundle size from Recharts and Inter variable font. **Fix:** Lazy load chart components on dashboard routes only (React.lazy), use font subsetting for Inter (latin only, excludes Cyrillic/Greek).
2. **Second bottleneck:** CSS custom property naming collisions. **Fix:** Namespace tokens (--gig-teal-500, --gig-surface-base), document token hierarchy in styles/tokens.css comments.

## Anti-Patterns

### Anti-Pattern 1: Modifying shadcn/ui Files Directly

**What people do:** Edit components/ui/button.tsx to add custom variants, then forget changes when running `npx shadcn-ui@latest add button` to update.

**Why it's wrong:** shadcn CLI overwrites components/ui/ files on update. Custom changes are lost, causing bugs.

**Do this instead:** Create wrapper components in components/custom/ that extend shadcn primitives. Example: `custom/brand-button.tsx` wraps `ui/button.tsx` and adds a `teal` variant via CVA. Only modify ui/ files for global restyling (e.g., changing default border-radius, updating color classes).

### Anti-Pattern 2: Hardcoding Colors Instead of Using Tokens

**What people do:** Write `className="bg-[#00897B]"` for Deep Teal instead of referencing CSS tokens.

**Why it's wrong:** Breaks theme switching (dark mode won't update), creates color drift (different hex values for "same" color), reduces maintainability.

**Do this instead:** Define semantic tokens in styles/tokens.css (`--color-brand-primary: var(--teal-500)`), map to Tailwind utilities via @theme inline, use `className="bg-brand-primary"`. Arbitrary values are acceptable for one-offs, but reference CSS vars: `className="bg-[var(--teal-500)]"`.

### Anti-Pattern 3: Overusing will-change

**What people do:** Add `will-change: transform` to every card component "for performance."

**Why it's wrong:** Excessive GPU layer promotion increases memory consumption, causes visual artifacts (text rendering issues, z-index bugs), and degrades performance.

**Do this instead:** Apply will-change only on interaction (`:hover`, `:focus`), remove it after animation completes. For static animations, use `transform: translateZ(0)` sparingly. Trust the browser's compositor heuristics — modern browsers already promote animated elements to GPU layers.

### Anti-Pattern 4: Importing Entire Recharts Library

**What people do:** `import { ResponsiveContainer, LineChart, BarChart, PieChart, ... } from 'recharts';` in every chart component.

**Why it's wrong:** Recharts is ~100KB gzipped. Tree-shaking works, but importing unused chart types in multiple files increases bundle size.

**Do this instead:** Import only the specific chart type and utilities needed: `import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';`. Lazy load chart components on dashboard routes: `const EarningChart = React.lazy(() => import('@/components/charts/earning-chart'));`.

### Anti-Pattern 5: Preloading All Font Subsets

**What people do:** Preload Inter variable font for latin, latin-ext, cyrillic, greek, and vietnamese subsets to support all languages.

**Why it's wrong:** Each subset is ~50KB. Preloading 5 subsets adds 250KB to initial load, blocking render and harming Core Web Vitals (LCP).

**Do this instead:** Preload only the critical subset (latin for English-only app). Use font-display: swap to show fallback fonts immediately. If multi-language support is needed, lazy load additional subsets after initial render.

## Integration Points

### External Design System Resources

| Resource | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Inter Variable Font** | Preload in index.html, @font-face in typography.css | Use font-display: swap, only preload latin subset |
| **OKLCH Color Generator** | Manual token creation in tokens.css | Use tools like oklch.com to generate perceptually uniform scales |
| **Recharts** | Lazy load on dashboard routes, pass data from feature hooks | Customize tooltips to match shadcn theme (var(--color-card) background) |
| **shadcn/ui CLI** | Run `npx shadcn-ui@latest add <component>` for new primitives | Never modify ui/ files after CLI add — use wrappers in custom/ |

### Internal Component Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Page ↔ Chart Component** | Props (typed data array, isLoading flag) | Page fetches data via feature hooks, chart component is purely presentational |
| **Custom Wrapper ↔ shadcn Primitive** | Composition (children), extended props | Wrapper passes unknown props to shadcn component via spread |
| **CSS Tokens ↔ Tailwind Utilities** | @theme inline mapping | CSS custom properties are mapped to Tailwind classes automatically |
| **Feature Hook ↔ TanStack Query** | React Query hook wraps API call | Chart components consume cached data via feature hooks (e.g., useEarningTrend) |

## Page-by-Page Restyling Strategy

### Phase 1: Foundation (Week 1)
1. **Create CSS token system:** styles/tokens.css (Deep Teal palette, semantic tokens), typography.css (Inter preload), animations.css (keyframes).
2. **Restyle shadcn primitives:** Update Button, Card, Badge variants to use Deep Teal colors. Increase border-radius from 0.625rem to 0.75rem for modern feel.
3. **Create custom wrappers:** StatCardV2, ChartCard, MetricBadge in components/custom/.

### Phase 2: Shared Components (Week 1-2)
4. **Restyle layouts:** AppShell (update accent color mappings for Deep Teal), Topbar (add backdrop-blur-sm).
5. **Replace deprecated components:** Swap StatCard with StatCardV2 in all pages. Update Logo with animated variant.
6. **EmptyState restyling:** Update illustration colors to Deep Teal palette.

### Phase 3: Dashboard Charts (Week 2-3)
7. **Build chart components:** EarningChart, SubmissionFunnel, TrustTrend in components/charts/.
8. **Integrate into dashboards:** RecruiterDashboard (add EarningChart, TrustTrend), CompanyDashboard (add SubmissionFunnel, RoleFillRate), AdminDashboard (add platform metrics).

### Phase 4: High-Traffic Pages (Week 3-4)
9. **Recruiter pages:** Browse roles, submission detail, wallet (add balance trend chart).
10. **Company pages:** Role list, role detail (add applicant pipeline chart), fund wallet.
11. **Admin pages:** Payout approval, user management (add trust score distribution chart).

### Phase 5: Remaining Pages (Week 4-5)
12. **Auth pages:** Login, register, reset password (subtle Deep Teal accents, animated form focus states).
13. **Profile pages:** Recruiter profile, company profile (update form styling).
14. **Notification and settings pages:** Notifications list (animated read/unread states), admin settings.

### Dependency Order
- **Must complete first:** CSS token system (all pages depend on tokens).
- **Complete early:** shadcn primitive restyling (high reuse across pages).
- **Complete before dashboards:** Chart components (dashboards compose multiple charts).
- **Complete before page restyling:** Custom wrappers (StatCardV2 used in 15+ pages).

## Responsive Breakpoint Strategy

### Current Breakpoints (Tailwind Defaults)
- `sm: 640px` — Tablets (portrait)
- `md: 768px` — Tablets (landscape), small laptops
- `lg: 1024px` — Standard desktops
- `xl: 1280px` — Large desktops

### Adjustments for Dashboard-Heavy App

**No changes needed** — existing breakpoints align with dashboard design patterns. Key responsive considerations:

1. **Sidebar visibility:** Hidden below `md:`, visible at `md:` and above (current AppShell pattern).
2. **Stat card grid:** 1 column (mobile), 2 columns at `sm:`, 4 columns at `lg:` (current dashboard pattern).
3. **Chart responsive containers:** Recharts ResponsiveContainer scales width to 100% and adjusts height based on screen size (use 200px height on mobile, 256px on desktop).
4. **Form layouts:** Stack vertically on mobile, two-column grid at `md:`.

**Mobile-first approach:** All styles are base (mobile), then progressively enhance at breakpoints. Example: `className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"`.

## Dark Mode Token Mapping

### Surface Hierarchy (OKLCH for Perceptual Uniformity)

```css
/* Light mode */
:root {
  --color-surface-base: oklch(100% 0 0);        /* Pure white */
  --color-surface-raised: oklch(98% 0 0);       /* Card backgrounds */
  --color-surface-overlay: oklch(96% 0 0);      /* Popovers, dialogs */
  --color-text-primary: oklch(14.5% 0 0);       /* Body text */
  --color-text-secondary: oklch(55.6% 0 0);     /* Muted text */
}

/* Dark mode (step up 5-8% lightness for surface hierarchy) */
.dark {
  --color-surface-base: oklch(14.5% 0 0);       /* Dark background */
  --color-surface-raised: oklch(20.5% 0 0);     /* Cards (6% lighter) */
  --color-surface-overlay: oklch(26.9% 0 0);    /* Dialogs (12% lighter) */
  --color-text-primary: oklch(98.5% 0 0);       /* Light text */
  --color-text-secondary: oklch(70.8% 0 0);     /* Muted text */

  /* Deep Teal adjustments for dark mode (increase lightness 10-15%) */
  --teal-50: oklch(22% 0.08 200);               /* Darkened from 97% */
  --teal-100: oklch(30% 0.10 200);              /* Darkened from 92% */
  --teal-500: oklch(70% 0.12 200);              /* Brightened from 60% */
  --teal-900: oklch(90% 0.06 200);              /* Brightened from 22% */
}
```

### Semantic Token Remapping

| Token | Light Mode | Dark Mode | Rationale |
|-------|------------|-----------|-----------|
| `--color-brand-primary` | `--teal-500` | `--teal-400` | Brighter in dark mode for contrast |
| `--color-brand-subtle` | `--teal-100` | `--teal-900` | Inverted scale for background accents |
| `--color-surface-brand` | `--teal-50` | `--teal-950` | Subtle branded surfaces |
| `--color-border` | `oklch(92.2% 0 0)` | `oklch(100% 0 0 / 10%)` | Alpha channel for dark borders |

### Accessibility Validation

Use OKLCH for all color scales to maintain consistent contrast ratios across hues. Validate contrast ratios using tools like [OddContrast](https://www.oddcontrast.com/) (OKLCH-aware). Target WCAG AA compliance (4.5:1 for body text, 3:1 for large text).

## CSS Custom Property Naming Convention

### Hierarchy

1. **Primitive tokens:** Raw color values with numeric scales.
   - Syntax: `--{hue}-{lightness-step}`
   - Example: `--teal-500`, `--gray-200`
2. **Semantic tokens:** Role-based aliases pointing to primitives.
   - Syntax: `--color-{role}-{variant?}`
   - Example: `--color-brand-primary`, `--color-surface-raised`, `--color-text-secondary`
3. **Tailwind mappings:** @theme inline maps semantic tokens to utility classes.
   - Syntax: `--color-{utility-name}`
   - Example: `--color-brand-primary` → `className="bg-brand-primary"`

### Examples

```css
/* styles/tokens.css */

/* ── Primitive Tokens ────────────────────────────────── */
:root {
  --teal-50: oklch(97% 0.02 200);
  --teal-100: oklch(92% 0.04 200);
  --teal-200: oklch(85% 0.06 200);
  --teal-300: oklch(75% 0.09 200);
  --teal-400: oklch(65% 0.11 200);
  --teal-500: oklch(60% 0.12 200);
  --teal-600: oklch(50% 0.10 200);
  --teal-700: oklch(40% 0.08 200);
  --teal-800: oklch(30% 0.06 200);
  --teal-900: oklch(22% 0.04 200);
  --teal-950: oklch(14% 0.02 200);
}

/* ── Semantic Tokens (Light Mode) ───────────────────── */
:root {
  /* Brand colors */
  --color-brand-primary: var(--teal-500);
  --color-brand-secondary: var(--teal-600);
  --color-brand-subtle: var(--teal-100);

  /* Surface hierarchy */
  --color-surface-base: oklch(100% 0 0);
  --color-surface-raised: oklch(98% 0 0);
  --color-surface-overlay: oklch(96% 0 0);
  --color-surface-brand: var(--teal-50);

  /* Interactive states */
  --color-interactive-default: var(--teal-500);
  --color-interactive-hover: var(--teal-600);
  --color-interactive-active: var(--teal-700);
  --color-interactive-disabled: oklch(70.8% 0 0);

  /* Feedback colors */
  --color-success: oklch(60% 0.15 145);      /* Green */
  --color-warning: oklch(75% 0.15 85);       /* Yellow */
  --color-error: oklch(60% 0.22 25);         /* Red */
  --color-info: var(--teal-500);             /* Teal */
}

/* ── Semantic Tokens (Dark Mode) ────────────────────── */
.dark {
  --color-brand-primary: var(--teal-400);
  --color-brand-subtle: var(--teal-900);
  --color-surface-base: oklch(14.5% 0 0);
  --color-surface-raised: oklch(20.5% 0 0);
  --color-surface-overlay: oklch(26.9% 0 0);
  --color-surface-brand: var(--teal-950);

  --color-interactive-default: var(--teal-400);
  --color-interactive-hover: var(--teal-300);
  --color-interactive-active: var(--teal-200);
}

/* ── Tailwind Mappings ──────────────────────────────── */
@theme inline {
  /* Brand utilities */
  --color-brand-primary: var(--color-brand-primary);
  --color-brand-secondary: var(--color-brand-secondary);
  --color-brand-subtle: var(--color-brand-subtle);

  /* Surface utilities */
  --color-surface-base: var(--color-surface-base);
  --color-surface-raised: var(--color-surface-raised);
  --color-surface-overlay: var(--color-surface-overlay);
  --color-surface-brand: var(--color-surface-brand);

  /* Interactive utilities */
  --color-interactive-default: var(--color-interactive-default);
  --color-interactive-hover: var(--color-interactive-hover);
  --color-interactive-active: var(--color-interactive-active);

  /* Feedback utilities */
  --color-success: var(--color-success);
  --color-warning: var(--color-warning);
  --color-error: var(--color-error);
  --color-info: var(--color-info);
}
```

Usage in components:
```tsx
<Button className="bg-brand-primary hover:bg-interactive-hover">
  Click me
</Button>

<Card className="bg-surface-raised border-brand-subtle">
  Deep Teal branded card
</Card>

<div className="bg-[var(--teal-500)]">
  Direct CSS var reference (for one-offs)
</div>
```

## Sources

**Tailwind CSS v4 Design Tokens:**
- [Tailwind CSS v4.0 - Tailwind CSS](https://tailwindcss.com/blog/tailwindcss-v4)
- [Design Tokens That Scale in 2026 (Tailwind v4 + CSS Variables) | Mavik Labs](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026)
- [Exploring Typesafe design tokens in Tailwind 4 - DEV Community](https://dev.to/wearethreebears/exploring-typesafe-design-tokens-in-tailwind-4-372d)

**Inter Font Preloading:**
- [ReactXRecipes. Preload web fonts for enhancing perceived performance | by Illia Skaryna | Medium](https://medium.com/@O5-25/reactxrecipes-preload-web-fonts-for-enhancing-perceived-performance-5e07bb4f1370)
- [Preloading Fonts | Documentation | Fontsource](https://fontsource.org/docs/getting-started/preload)
- [@fontsource-variable/inter - npm](https://www.npmjs.com/package/@fontsource-variable/inter)

**Recharts Composition Patterns:**
- [The Top 5 React Chart Libraries to Know in 2026 for Modern Dashboards | Syncfusion Blogs](https://www.syncfusion.com/blogs/post/top-5-react-chart-libraries)
- [Mastering Data Visualization: A Deep Dive into Recharts for Modern React Applications - React News](https://react-news.com/mastering-data-visualization-a-deep-dive-into-recharts-for-modern-react-applications)
- [Building Interactive and Customizable Dashboards with Recharts and React-Grid-Layout | Medium](https://medium.com/@mohdkhan.mk99/building-interactive-and-customizable-dashboards-with-recharts-and-react-grid-layout-a12952bbd0e0)

**shadcn/ui Customization:**
- [The Ultimate shadcn/ui Handbook (2026 Edition)](https://shadcnspace.com/blog/shadcn-ui-handbook)
- [How to Make Shadcn UI Components Actually Yours | Spectrum UI Blog](https://ui.spectrumhq.in/blog/shadcn-customization-guide)
- [The Anatomy of shadcn/ui Components | Vercel Academy](https://vercel.com/academy/shadcn-ui/extending-shadcn-ui-with-custom-components)

**CSS Animation Performance:**
- [CSS GPU Animation: Doing It Right — Smashing Magazine](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
- [CSS Animation Performance: What to Animate and What to Avoid — Peasy Math](https://peasymath.com/guides/css-animation-performance-guide/)
- [Animation performance guide | Motion](https://motion.dev/docs/performance)

**Dark Mode Semantic Tokens:**
- [Dark Mode Design Systems: A Complete Guide to Patterns, Tokens, and Hierarchy | Muzli Blog](https://muz.li/blog/dark-mode-design-systems-a-complete-guide-to-patterns-tokens-and-hierarchy/)
- [Color tokens: guide to light and dark modes in design systems | by Victoria Serebrennikova | Bootcamp | Medium](https://medium.com/design-bootcamp/color-tokens-guide-to-light-and-dark-modes-in-design-systems-146ab33023ac)

**Responsive Breakpoints:**
- [Responsive design - Core concepts - Tailwind CSS](https://tailwindcss.com/docs/responsive-design)
- [Responsive Web Design Breakpoints: The Complete 2026 Guide](https://displaypixels.io/learn/responsive-design-breakpoints.html)
- [Tailwind CSS Best Practices: Building Maintainable UIs (Production Patterns for 2026) | Blog | Samioda](https://samioda.com/en/blog/tailwind-css-best-practices)

**Component Refactoring Strategy:**
- [How to Refactor Complex Codebases – A Practical Guide for Devs](https://www.freecodecamp.org/news/how-to-refactor-complex-codebases)
- [Design Systems 2026: How Airbnb & Uber Scale to 100M Users](https://wearepresta.com/design-systems-for-scale-2026/)
- [From Legacy to Modern: My Strategy for Refactoring Large React Codebases](https://www.flexhire.com/blog/miguel-o-46/from-legacy-to-modern-my-strategy-for-refactoring-large-react-codebases)

**OKLCH Color Space:**
- [Better dynamic themes in Tailwind with OKLCH color magic—Martian Chronicles, Evil Martians' team blog](https://evilmartians.com/chronicles/better-dynamic-themes-in-tailwind-with-oklch-color-magic)
- [OKLCH in CSS: why we moved from RGB and HSL](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- [The Ultimate OKLCH Guide: Modern CSS Color Redefined](https://oklch.org/posts/ultimate-oklch-guide)
- [OKLCH in CSS: Consistent, accessible color palettes - LogRocket Blog](https://blog.logrocket.com/oklch-css-consistent-accessible-color-palettes/)

---
*Architecture research for: UI/UX Design System Overhaul (React 18 + Tailwind v4 SPA)*
*Researched: 2026-04-14*
