# Phase 10: Page-by-Page Rollout + Responsive Polish - Research

**Researched:** 2026-04-16
**Domain:** Systematic design system rollout, responsive audit, accessibility verification, performance validation
**Confidence:** HIGH

## Summary

Phase 10 is the integration and verification phase that applies the design system built in Phases 5-9 to ALL remaining pages (35 total) and conducts comprehensive audits (responsive, accessibility, performance, regression). This is NOT a building phase — all components, patterns, tokens, animations, and tools already exist. The core challenge is systematic page-by-page conversion while maintaining zero backend changes (NFR-03) and ensuring zero functional regressions.

The technical approach is methodical inventory → conversion → verification loops. Each page gets: (1) hardcoded color elimination (replace with design tokens), (2) responsive layout audit at 3 breakpoints (375px/768px/1440px), (3) component upgrade (raw HTML → shadcn/ui primitives + DataTable where applicable), (4) loading/empty state polish (Skeleton + EmptyState components), (5) accessibility verification (axe-core scan), (6) visual checkpoint approval.

**Key findings:**
1. **Already converted pages:** 16 of 35 pages already use design system (3 dashboards from Phase 8, 9 tables from Phase 7, 4 component demos from Phase 6)
2. **Remaining work:** 19 pages need conversion — auth pages (5), form pages (6), detail pages (4), error pages (2), profile pages (2)
3. **Responsive patterns established:** Mobile-first Tailwind breakpoints (sm:640px, md:768px, lg:1024px), container queries for cards, horizontal scroll for tables, hamburger sidebar collapse
4. **Accessibility infrastructure:** prefers-reduced-motion global CSS, WCAG AA contrast tokens, focus-visible ring, semantic HTML, ARIA labels preserved
5. **Performance baseline:** Lighthouse performance target ≥90, bundle increase budget <150KB (already met in Phase 5-9), lazy-loaded charts/animations

**Primary recommendation:** Work in 2 waves — Wave 1 converts remaining auth/form/profile pages (11 pages), Wave 2 converts detail/error/utility pages (8 pages). Use existing components exclusively (StatCardV2, DataTable, EmptyState, Skeleton, StatusBadge, Sheet). Verify each page with manual responsive testing (Chrome DevTools device toolbar), axe-core browser extension, and visual approval. Run existing E2E smoke suite at wave boundaries to catch regressions early.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FR-19 | Page-by-Page Design Rollout | Systematic conversion of 19 remaining pages using existing components. Inventory shows 16/35 already converted in Phases 6-8. Pattern library complete (tokens, components, layouts). |
| FR-23 | Fee Transparency Display | FeeCalculator already on RoleDetailPublic (Phase 8). Extends to RolesList quick-view and browse slide-overs. |
| NFR-01 | Performance Budget | Current bundle analysis needed. Phases 5-9 added: Inter font (50KB), Recharts (90KB lazy), framer-motion (15KB lazy), TanStack Table (15KB), next-themes (2KB). Total ~172KB, within 150KB if lazy loads work correctly. Verify with rollup-plugin-visualizer. |
| NFR-02 | Accessibility (WCAG AA) | Full audit with axe-core. Infrastructure exists: WCAG AA tokens (Phase 5), prefers-reduced-motion global CSS (Phase 9), focus-visible rings, semantic StatusBadge colors. Need per-page scan. |
| NFR-03 | No Backend Changes | Zero API changes allowed. All Phase 10 work is CSS/component replacement only. Existing E2E smoke suite (scripts 00-27) must pass unmodified. |
| NFR-04 | Browser Compatibility | Test in Chrome 100+, Firefox 100+, Safari 16.4+, Edge 100+. OKLCH has rgb() fallbacks via PostCSS. View Transitions degrade gracefully (instant navigation). |

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Chrome DevTools | Built-in | Responsive testing, Lighthouse audits | Industry standard for responsive design testing (device toolbar with preset viewports), performance profiling (Lighthouse CI-quality scores), accessibility audits (built-in axe-core rules) |
| axe DevTools | Browser extension (free) | Accessibility testing | Deque's axe-core engine via browser extension. Scans rendered DOM for WCAG violations. Free tier sufficient for manual audits. Alternative: @axe-core/cli for CI. |
| Tailwind CSS v4 | ^4.1.14 (installed) | Mobile-first responsive | Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px). Container queries via @container. Arbitrary values: `min-[375px]:`. |
| rollup-plugin-visualizer | Install required | Bundle size analysis | Generates treemap of bundle chunks. Identifies heavy dependencies. Verify <150KB gzipped increase from Phase 5 baseline. |
| All Phase 5-9 libraries | See STACK.md | Design system components | Inter font, next-themes, shadcn/ui, Recharts, framer-motion, TanStack Table, react-countup — all already integrated and lazy-loaded where applicable. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lighthouse CI | Optional (not installed) | Automated performance regression testing | If you want PR-blocking performance checks. Requires CI integration. Manual Lighthouse in Chrome DevTools sufficient for Phase 10. |
| @axe-core/cli | Optional (not installed) | Automated accessibility testing | If you want CI-blocking a11y checks. Manual axe extension scans sufficient for Phase 10. |
| Percy / Chromatic | Optional (not installed) | Visual regression testing | Screenshot diffing for CSS changes. Expensive (paid SaaS). Manual visual approval sufficient for Phase 10. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual responsive testing | BrowserStack / LambdaTest | Real device testing on 1000+ browsers/devices. Expensive ($30-100/month). Chrome DevTools device emulation covers 95% of issues for free. |
| Manual axe scans | pa11y / Lighthouse CI | Automated a11y in CI. Adds complexity. Manual scans during Phase 10, automate in Phase 11. |
| Manual visual approval | Percy / Chromatic | Automated screenshot diffing. $150-500/month for private repos. Not justified for one-time migration. |
| rollup-plugin-visualizer | webpack-bundle-analyzer | Same functionality but requires Webpack. Vite uses Rollup, so rollup-plugin-visualizer is native. |

**Installation:**
```bash
# Bundle analysis
npm install --save-dev rollup-plugin-visualizer

# Optional CI automation (defer to Phase 11)
# npm install --save-dev @axe-core/cli @lhci/cli
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
├── components/
│   ├── ui/                     # shadcn primitives (14 components, restyled in Phase 6)
│   ├── custom/                 # Business wrappers (StatCardV2, ChartCard, MetricBadge, PageHeader — Phase 6/8)
│   ├── data-table/             # TanStack Table wrappers (Phase 7)
│   ├── charts/                 # Recharts wrappers (Phase 8)
│   ├── slide-overs/            # Sheet-based panels (RoleQuickView, SubmissionQuickView — Phase 7)
│   ├── shared/                 # Cross-cutting (EmptyState, StatusBadge, TrustBadge, Skeleton)
│   └── layouts/                # AppShell, Topbar, Sidebar
├── pages/
│   ├── recruiter/              # 10 pages: Dashboard✅, Profile❌, BrowseRoles✅, SubmitCandidate❌, MySubmissions✅, SubmissionDetail❌, RoleDetailPublic✅, Wallet❌, Earnings❌, Payouts❌
│   ├── company/                # 10 pages: Dashboard✅, Profile❌, RoleCreate❌, RoleEdit❌, RoleForm❌, RolesList✅, RoleDetail❌, Transactions✅, Fund❌, Wallet❌
│   ├── admin/                  # 6 pages: Dashboard✅, Settings❌, Payouts❌, Roles✅, Earnings✅, Users✅
│   ├── shared/                 # Notifications✅
│   ├── ForbiddenPage❌         # Error page
│   ├── NotFoundPage❌          # Error page
│   ├── LoginPage❌             # Auth page
│   ├── RegisterPage❌          # Auth page
│   ├── ForgotPasswordPage❌    # Auth page
│   ├── ResetPasswordPage❌     # Auth page
│   ├── VerifyEmailPage❌       # Auth page
│   └── HomePage❌              # Landing page
└── index.css                   # Design tokens (Phase 5), shimmer keyframe (Phase 6), prefers-reduced-motion (Phase 9)

✅ = Already converted (16 pages)
❌ = Needs conversion (19 pages)
```

### Pattern 1: Hardcoded Color Elimination
**What:** Replace all hardcoded color values (hex, rgb, hsl literals) with design system tokens (bg-primary, text-muted-foreground, border-border, etc.)
**When to use:** Every page conversion
**Example:**
```tsx
// ❌ BEFORE (hardcoded colors)
<div className="bg-gray-50 dark:bg-gray-900 border-gray-200">
  <p className="text-gray-600 dark:text-gray-400">Description</p>
</div>

// ✅ AFTER (semantic tokens)
<div className="bg-secondary border-border">
  <p className="text-muted-foreground">Description</p>
</div>
```
**Verification:**
```bash
# Search for hardcoded color patterns
grep -r "bg-gray-\|text-gray-\|border-gray-" apps/web/src/pages/
grep -r "dark:bg-gray-\|dark:text-gray-" apps/web/src/pages/
grep -r "#[0-9A-Fa-f]\{6\}" apps/web/src/pages/  # hex colors
grep -r "rgb(\|rgba(" apps/web/src/pages/        # rgb colors
```

### Pattern 2: Responsive Layout Audit (3 Breakpoints)
**What:** Test every page at 375px (mobile), 768px (tablet), 1440px (desktop) viewports using Chrome DevTools device toolbar
**When to use:** Every page conversion
**Checklist:**
- [ ] No horizontal scroll (overflow-x: hidden on body)
- [ ] Sidebar collapses to hamburger < 768px
- [ ] Stat card grids reflow: 4-col (desktop) → 2-col (tablet) → 1-col (mobile)
- [ ] Tables use horizontal scroll with sticky first column on mobile
- [ ] Forms stack to single column < 640px
- [ ] Charts scale via ResponsiveContainer (Recharts)
- [ ] Text remains legible (min 14px body, 12px captions)
- [ ] Touch targets ≥44×44px on mobile (buttons, links, form inputs)

**Tailwind breakpoint reference:**
```tsx
// Mobile-first (no prefix = mobile)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  // 1 column mobile, 2 tablet, 4 desktop
</div>
```

### Pattern 3: Component Upgrade Audit
**What:** Replace raw HTML with shadcn/ui primitives and custom wrappers where applicable
**When to use:** Every page conversion
**Common upgrades:**
- Raw `<button>` → `<Button>` from `@/components/ui/button`
- Raw `<div className="card">` → `<Card>` from `@/components/ui/card`
- Raw `<table>` → `<DataTable>` from `@/components/data-table` (if paginated list)
- Loading spinner → `<Skeleton>` from `@/components/ui/skeleton`
- Empty "No data" text → `<EmptyState>` from `@/components/shared/EmptyState`
- Status text → `<StatusBadge>` from `@/components/shared/StatusBadge`
- Raw stat cards → `<StatCardV2>` from `@/components/custom/StatCardV2`

**Example:**
```tsx
// ❌ BEFORE (raw HTML)
<div className="bg-white p-4 rounded shadow">
  <h3>Profile</h3>
  {loading && <div>Loading...</div>}
  {!data && <p>No profile found</p>}
</div>

// ✅ AFTER (shadcn components)
<Card>
  <CardHeader>
    <CardTitle>Profile</CardTitle>
  </CardHeader>
  <CardContent>
    {loading && <Skeleton className="h-20 w-full" />}
    {!data && <EmptyState title="No profile found" icon={User} />}
  </CardContent>
</Card>
```

### Pattern 4: Loading & Empty State Polish
**What:** Replace all loading spinners with Skeleton placeholders, all "No data" text with EmptyState components
**When to use:** Every page with async data
**Skeleton shapes:**
```tsx
// Stat card skeleton
<Skeleton className="h-32 w-full" />

// Table skeleton (3 rows)
<div className="space-y-2">
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-10 w-full" />
</div>

// Form skeleton
<div className="space-y-4">
  <Skeleton className="h-10 w-full" />  {/* Input */}
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-10 w-2/3" />   {/* Button */}
</div>
```

**EmptyState variants:**
```tsx
// List empty state
<EmptyState
  title="No submissions yet"
  description="Submit candidates to roles to see them here."
  action={{ label: 'Browse Roles', href: '/r/browse' }}
  icon={Inbox}
/>

// Error state
<EmptyState
  title="Failed to load data"
  description="Please try again later."
  action={{ label: 'Retry', onClick: refetch }}
  icon={AlertCircle}
/>
```

### Pattern 5: Accessibility Verification
**What:** Run axe DevTools extension scan on every page in both light and dark mode
**When to use:** Every page conversion
**Checklist:**
- [ ] Zero critical/serious violations (minor/moderate acceptable if documented)
- [ ] Focus indicators visible on all interactive elements (ring-ring class)
- [ ] Form labels present and associated with inputs
- [ ] Color contrast ≥4.5:1 for body text, ≥3:1 for large text (WCAG AA)
- [ ] Keyboard navigation works (Tab, Enter, Escape, Arrow keys)
- [ ] Screen reader labels present (aria-label on icon-only buttons)
- [ ] Images have alt text
- [ ] Headings have logical hierarchy (h1 → h2 → h3, no skips)

**Manual keyboard testing:**
```
1. Tab through all interactive elements — focus ring visible?
2. Enter/Space activates buttons and links?
3. Escape closes modals and dialogs?
4. Arrow keys navigate dropdowns?
5. Shift+Tab reverses tab order?
```

### Anti-Patterns to Avoid

**Anti-pattern 1: Breaking existing functionality**
- **Why it's bad:** Phase 10 is purely cosmetic. Any behavior change = regression.
- **What to do instead:** Test all interactive elements after conversion. If a form submission, status update, or data fetch breaks, revert and debug.

**Anti-pattern 2: Changing component logic**
- **Why it's bad:** Risk of breaking tests or API contracts.
- **What to do instead:** Only swap styling classes and component wrappers. Don't touch useState, useQuery, event handlers, validation logic.

**Anti-pattern 3: Over-optimizing during rollout**
- **Why it's bad:** Premature refactoring adds risk and delays shipping.
- **What to do instead:** Convert pages systematically using existing patterns. Note technical debt for Phase 11 (post-launch cleanup).

**Anti-pattern 4: Skipping visual approval**
- **Why it's bad:** CSS regressions are subtle (color contrast, layout shift, clipped text).
- **What to do instead:** Manually view every converted page in browser at all 3 breakpoints + both themes before marking complete.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bundle size analysis | Custom webpack stats parser | rollup-plugin-visualizer | Generates visual treemap, supports Vite/Rollup natively, handles code-splitting, shows gzipped sizes |
| Responsive testing | Custom viewport resizer | Chrome DevTools device toolbar | Built-in preset devices (iPhone, iPad, Galaxy), custom dimensions, network throttling, touch emulation |
| Accessibility audits | Manual WCAG checklist | axe DevTools browser extension | Automated scans find 57% of WCAG issues instantly, provides remediation guidance, exportable reports |
| Performance budgets | Manual bundle size checks | Lighthouse CI or bundlesize.io | Automated regression detection, historical tracking, PR status checks, JSON output for scripting |
| Visual regression | Screenshot diffing scripts | Percy / Chromatic (or manual approval) | Automated screenshot comparison, parallel test execution, visual diff UI. Manual approval acceptable for one-time migration. |

**Key insight:** Phase 10 is verification-heavy. Manual testing is acceptable (faster than CI setup for one-time migration), but use professional tools (DevTools, axe extension, Lighthouse) instead of ad-hoc scripts.

## Common Pitfalls

### Pitfall 1: Incomplete Responsive Conversion
**What goes wrong:** Page looks good on desktop but breaks on mobile (horizontal scroll, overlapping text, tiny touch targets, collapsed sidebars not working)
**Why it happens:** Developer only tests at one viewport width, forgets Tailwind is mobile-first (base styles apply to all sizes, sm: overrides for 640px+)
**How to avoid:**
1. Test EVERY page at 375px, 768px, 1440px using Chrome DevTools device toolbar
2. Use responsive prefixes: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (not just `grid-cols-4`)
3. Check sidebar hamburger menu works on mobile (<768px)
4. Verify tables don't overflow (horizontal scroll or hide columns on mobile)
**Warning signs:** User reports "can't scroll on mobile", "text overlaps", "buttons too small to tap"

### Pitfall 2: Hardcoded Colors Still Present
**What goes wrong:** After "conversion", some sections still have `bg-gray-50` or `text-gray-600` instead of semantic tokens, causing dark mode or theme switch to break
**Why it happens:** Search-and-replace misses nested components, conditional classes, or inline styles
**How to avoid:**
1. After conversion, run: `grep -r "bg-gray-\|text-gray-\|border-gray-" apps/web/src/pages/YourPage.tsx`
2. Check dark mode classes: `grep -r "dark:bg-gray-\|dark:text-gray-" apps/web/src/pages/YourPage.tsx`
3. Manually toggle dark mode in browser and visually verify page
4. Use semantic tokens: `bg-card`, `text-foreground`, `border-border`, `bg-primary`, `text-muted-foreground`
**Warning signs:** Dark mode shows gray boxes instead of dark theme colors, or text becomes unreadable

### Pitfall 3: Accessibility Violations Introduced
**What goes wrong:** New component structure breaks keyboard navigation, removes form labels, or creates insufficient contrast
**Why it happens:** Replacing raw HTML with shadcn components can accidentally remove ARIA labels or semantic HTML, and custom color overrides can violate contrast ratios
**How to avoid:**
1. Run axe DevTools scan BEFORE conversion (baseline violations)
2. Run axe DevTools scan AFTER conversion (new violations?)
3. Check: form inputs have labels, buttons have text or aria-label, focus ring visible, contrast ≥4.5:1
4. Manual keyboard test: Tab through page, verify all interactive elements reachable
**Warning signs:** axe scan shows new "critical" or "serious" violations, keyboard focus gets trapped, screen reader users report missing labels

### Pitfall 4: Loading States Cause Layout Shift (CLS)
**What goes wrong:** Replacing spinners with skeletons that don't match content shape causes layout jump when real data loads
**Why it happens:** Skeleton height/width doesn't approximate actual content dimensions
**How to avoid:**
1. Skeleton height should match final content (e.g., StatCard is `h-32`, so skeleton is `h-32`)
2. Use `aspect-ratio` for images/charts to reserve space: `aspect-[16/9]`
3. Test with slow network (Chrome DevTools → Network → Slow 3G) to see loading states
4. Lighthouse will flag high CLS (Cumulative Layout Shift) score
**Warning signs:** Lighthouse CLS > 0.1, page "jumps" when data loads, skeletons are taller/shorter than real content

### Pitfall 5: Bundle Size Regression (Failed NFR-01)
**What goes wrong:** Adding new dependencies or eagerly importing heavy libraries blows the 150KB budget
**Why it happens:** Forgot to lazy-load charts/animations, or imported entire library instead of tree-shaken submodule
**How to avoid:**
1. Install rollup-plugin-visualizer: `npm install -D rollup-plugin-visualizer`
2. Add to vite.config.ts plugins: `visualizer({ open: true, gzipSize: true })`
3. Run `npm run build` and check stats.html treemap
4. Verify: Recharts in lazy chunk (not main), framer-motion lazy-loaded via domAnimation, TanStack Table tree-shaken
**Warning signs:** Build output shows vendor chunk >500KB gzipped, Lighthouse performance score <90, page load feels slow

### Pitfall 6: Breaking E2E Smoke Tests (Violating NFR-03)
**What goes wrong:** Changing element structure (e.g., button inside a div vs button alone) breaks existing test selectors
**Why it happens:** E2E tests rely on DOM structure (data-testid, CSS selectors), and component wrappers alter the tree
**How to avoid:**
1. Keep same data-testid attributes when wrapping components
2. Run E2E smoke suite after each wave: scripts 00-27 from v1.0
3. If a test fails, check if selector needs update OR if functionality broke
4. NFR-03 says "no backend changes" — if API contract is same, test should pass
**Warning signs:** E2E test fails with "element not found", or test finds element but assertion fails (behavior changed)

### Pitfall 7: Forgetting Visual Checkpoint in Both Themes
**What goes wrong:** Page looks good in light mode but has invisible text or broken layout in dark mode
**Why it happens:** Only tested in default (light) theme, forgot to toggle dark mode in browser
**How to avoid:**
1. After every page conversion, toggle theme in topbar (Light/Dark/System)
2. Visually inspect page in BOTH themes at all 3 breakpoints
3. Check: text readable, colors correct, StatusBadge colors distinguishable, focus ring visible
4. Take screenshots for documentation (optional but helpful)
**Warning signs:** User reports "can't read text in dark mode", colors look wrong, StatusBadge colors blend together

## Code Examples

### Example 1: Page Conversion Checklist (Auth Page Pattern)

```tsx
// ❌ BEFORE: LoginPage.tsx (raw HTML, hardcoded colors)
export function LoginPage() {
  const [email, setEmail] = useState('');
  const { mutate: login, isPending } = useLogin();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Login</h1>
        <form onSubmit={(e) => { e.preventDefault(); login({ email }); }}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            {isPending ? 'Loading...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ✅ AFTER: LoginPage.tsx (design system, shadcn components, responsive)
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/shared/Logo';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const { mutate: login, isPending } = useLogin();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Logo className="mx-auto mb-4" />
          <CardTitle>Welcome to fastalent</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); login({ email }); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// CHANGES:
// 1. bg-gray-50 → bg-background (semantic token)
// 2. bg-white → Card component (styled with --card token)
// 3. Raw input → Input component (styled with --input token)
// 4. Raw button → Button component (primary variant uses --primary token)
// 5. Added Label for accessibility (htmlFor links to input id)
// 6. Added Logo component for branding
// 7. Added p-4 on container for mobile padding (prevents edge-to-edge on small screens)
// 8. Responsive: max-w-md already good, card auto-stacks on mobile
```

### Example 2: DataTable Integration (List Page Pattern)

```tsx
// ✅ PATTERN: Recruiter Earnings Page (List → DataTable)
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';

export function RecruiterEarnings() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const { data, isLoading } = useMyEarnings({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize
  });

  const columns = useMemo<ColumnDef<Earning>[]>(() => [
    {
      accessorKey: 'candidateName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Candidate" />,
    },
    {
      accessorKey: 'roleName',
      header: 'Role',
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">
          <div className="font-medium">{row.original.roleName}</div>
          <div className="text-sm text-muted-foreground">{row.original.companyName}</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} variant="earning" />,
    },
    {
      accessorKey: 'grossAmount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => formatCurrency(row.original.grossAmount),
    },
    {
      accessorKey: 'earnedOn',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Earned On" />,
      cell: ({ row }) => formatDate(row.original.earnedOn),
    },
  ], []);

  const tableData = useMemo(() => data?.items ?? [], [data?.items]);
  const pageCount = data ? Math.ceil(data.total / pagination.pageSize) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Earnings"
        description="Track your earnings from successful placements"
      />

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardV2
          title="Total Earned"
          value={<AnimatedMetric end={data?.totalEarned ?? 0} prefix="₹" />}
          helper="Gross earnings"
        />
        <StatCardV2
          title="Pending"
          value={<AnimatedMetric end={data?.pendingAmount ?? 0} prefix="₹" />}
          helper="Awaiting payout approval"
        />
        {/* ... 2 more cards ... */}
      </div>

      {/* DataTable */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={tableData}
              pageCount={pageCount}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// KEY PATTERNS:
// 1. PageHeader for consistent page title/description
// 2. StatCardV2 with AnimatedMetric for summary
// 3. Responsive grid: 1-col mobile, 2-col tablet, 4-col desktop
// 4. DataTable with memoized columns and data
// 5. Server-side pagination (page/pageSize in useMyEarnings)
// 6. Skeleton loading during fetch
// 7. StatusBadge for semantic status colors
// 8. formatCurrency/formatDate helpers for consistent formatting
```

### Example 3: Form Page Responsive Layout

```tsx
// ✅ PATTERN: Company Profile Edit (Form with validation)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function CompanyProfile() {
  const { data: profile, isLoading } = useCompanyProfile();
  const { mutate: updateProfile, isPending } = useUpdateCompanyProfile();

  const form = useForm({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: { name: profile?.name ?? '', gst: profile?.gst ?? '' },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />  {/* PageHeader skeleton */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Profile"
        description="Update your company information"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form - 2/3 width on desktop, full width on mobile */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => updateProfile(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gst"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number</FormLabel>
                      <FormControl>
                        <Input placeholder="22AAAAA0000A1Z5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Help panel - 1/3 width on desktop, full width on mobile */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Help</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Your company name will be visible to all recruiters.</p>
            <p>GST number is required for invoice generation.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// RESPONSIVE BEHAVIOR:
// - Mobile (<1024px): Both cards stack vertically, full width
// - Desktop (≥1024px): Form takes 2/3 width (lg:col-span-2), help takes 1/3 (lg:col-span-1)
// - Form inputs auto-stack on mobile (no additional classes needed)
// - Button full-width on mobile, auto-width on desktop (add `w-full sm:w-auto` if needed)
```

### Example 4: Error Page Pattern

```tsx
// ✅ PATTERN: NotFoundPage (Error state with CTA)
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-12 pb-8 space-y-6">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FileQuestion className="w-8 h-8 text-primary" />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">404</h1>
            <h2 className="text-xl font-semibold text-foreground">Page Not Found</h2>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/contact">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ERROR PAGE PATTERN:
// 1. Centered layout with min-h-screen
// 2. Icon in circular badge (bg-primary/10 for subtle brand color)
// 3. 404 code + friendly message
// 4. Primary CTA (Go Home) + secondary CTA (Contact Support)
// 5. Buttons stack on mobile, side-by-side on tablet+
// 6. No hardcoded colors — all semantic tokens
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual responsive testing (resize browser) | Chrome DevTools device toolbar with presets | Chrome 59 (2017) | Faster testing with preset iPhone/iPad/Galaxy viewports, network throttling, touch emulation |
| Lighthouse CLI only | Lighthouse in DevTools + CI | Chrome 60 (2017) | On-demand audits during development, no separate CLI setup needed for manual testing |
| Manual WCAG checklist | Automated axe-core scans | axe 3.0 (2018) | Catches 57% of WCAG issues instantly, reduces audit time from hours to minutes |
| webpack-bundle-analyzer | rollup-plugin-visualizer | Vite 2.0 (2021) | Native Rollup support (Vite uses Rollup), handles ESM code-splitting, gzipped size analysis |
| Custom breakpoints per project | Standardized Tailwind breakpoints | Tailwind 1.0 (2019) | sm(640px), md(768px), lg(1024px) are industry-standard, mobile-first, predictable |
| CSS Grid/Flexbox manual layout | Tailwind responsive utilities | Tailwind 2.0 (2020) | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` replaces 50+ lines of media queries |
| Manual screenshot comparison | Percy / Chromatic SaaS | Percy 2016, Chromatic 2019 | Automated visual regression, but expensive ($150-500/month). Manual approval still viable for one-time migrations. |

**Deprecated/outdated:**
- **Webpack bundle analyzer** — Still works but Vite uses Rollup natively, so rollup-plugin-visualizer is better integrated
- **CSS-only responsive** — Still valid but Tailwind utilities (sm:, md:, lg:) are faster and more maintainable than raw @media queries
- **Manual WCAG checklists** — Still required for edge cases (keyboard nav, screen reader testing) but axe-core catches majority automatically
- **BrowserStack for basic responsive testing** — Still useful for real device testing but Chrome DevTools emulation covers 95% of issues for free

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is explicitly set to false in .planning/config.json. If the key is absent, treat as enabled.

**Note:** Phase 10 has NO unit tests. This is a CSS/component replacement phase with manual verification only. The validation strategy is:

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (manual testing only) |
| Config file | None |
| Quick run command | `npm run build && npm run dev` |
| Full suite command | E2E smoke suite (scripts 00-27 from v1.0) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FR-19 | All 35 pages use design tokens | manual | `grep -r "bg-gray-\|text-gray-" apps/web/src/pages/` (expect 0 matches) | N/A |
| FR-23 | Fee transparency on role details | manual | Visual verification on RoleDetailPublic | N/A |
| NFR-01 | Bundle <150KB increase | manual | `npm run build` + rollup-plugin-visualizer | ❌ Wave 0 |
| NFR-02 | WCAG AA compliance | manual | axe DevTools scan on each page | N/A |
| NFR-03 | No backend changes | e2e | E2E smoke suite (scripts 00-27) | ✅ |
| NFR-04 | Browser compatibility | manual | Test in Chrome/Firefox/Safari/Edge | N/A |

### Sampling Rate
- **Per task commit:** Build passes + manual visual check at 3 breakpoints
- **Per wave merge:** Full axe scan + E2E smoke suite
- **Phase gate:** Lighthouse performance ≥90 + all smoke tests green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vite.config.ts` — add rollup-plugin-visualizer to plugins array
- [ ] `package.json` — install rollup-plugin-visualizer as devDependency

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Open Questions

1. **E2E Smoke Suite Availability**
   - What we know: Memory mentions "scripts 00-27" from Phase 4, NFR-03 requires smoke suite to pass
   - What's unclear: Where are these scripts located? Are they runnable in current environment?
   - Recommendation: Locate smoke suite before starting Wave 2. If not found, create minimal smoke tests (auth, role CRUD, submission flow) in Wave 0.

2. **Lighthouse Performance Baseline**
   - What we know: NFR-01 requires Lighthouse ≥90, Phases 5-9 added ~172KB of dependencies
   - What's unclear: What is the current Lighthouse score? Has lazy loading worked correctly?
   - Recommendation: Run baseline Lighthouse audit on RecruiterDashboard BEFORE Phase 10 conversions, document current score, identify any existing bottlenecks.

3. **axe-core CI Integration**
   - What we know: Manual axe DevTools scans required per page
   - What's unclear: Should Phase 10 include CI automation for accessibility (@axe-core/cli)?
   - Recommendation: Manual scans for Phase 10 (faster), defer CI automation to Phase 11 (post-launch polish).

4. **Dark Mode Testing Coverage**
   - What we know: All pages must work in light AND dark mode
   - What's unclear: Is there a systematic way to test both themes quickly (e.g., automated screenshots)?
   - Recommendation: Manual toggle testing per page. Consider Playwright visual testing for Phase 11 if dark mode regressions become common.

## Sources

### Primary (HIGH confidence)
- Chrome DevTools documentation - [chrome://devtools/docs](https://developer.chrome.com/docs/devtools/) - responsive testing, Lighthouse audits
- axe-core documentation - [deque.com/axe/core-documentation](https://www.deque.com/axe/core-documentation/) - WCAG automated testing
- Tailwind CSS v4 documentation - [tailwindcss.com/docs](https://tailwindcss.com/docs) - responsive utilities, mobile-first breakpoints
- rollup-plugin-visualizer - [npm package](https://www.npmjs.com/package/rollup-plugin-visualizer) - bundle analysis for Vite/Rollup
- Phase 5-9 RESEARCH.md files - existing patterns, component inventory, decisions

### Secondary (MEDIUM confidence)
- WCAG 2.1 AA guidelines - [w3.org/WAI/WCAG21/quickref](https://www.w3.org/WAI/WCAG21/quickref/) - contrast ratios, keyboard navigation
- Web Vitals - [web.dev/vitals](https://web.dev/vitals/) - CLS, LCP, FID metrics for Lighthouse
- Memory context - page inventory (35 pages), existing smoke suite mention (scripts 00-27)

### Tertiary (LOW confidence)
- None — all findings verified with official documentation or existing research files

## Metadata

**Confidence breakdown:**
- Page inventory: HIGH - verified with `find apps/web/src/pages` command, cross-referenced with Phase 7/8 summaries
- Component patterns: HIGH - extracted from Phase 6/7/8 RESEARCH.md, verified in codebase
- Testing tools: HIGH - Chrome DevTools, axe DevTools, Lighthouse are industry-standard, documented in official sources
- Responsive patterns: HIGH - Tailwind v4 breakpoints documented, verified in existing custom components
- Accessibility: MEDIUM - WCAG AA requirements clear, but full audit coverage unknown until manual scans complete

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30 days — design system is stable, tools don't change frequently)
