# Phase 6: Component Library + Restyling - Research

**Researched:** 2026-04-16
**Domain:** React component library restyling, responsive layout, design system implementation
**Confidence:** HIGH

## Summary

Phase 6 transforms the visual presentation of the fastalent platform by restyling shadcn/ui primitives with Deep Teal tokens, creating information-dense responsive layouts, and replacing loading spinners with skeleton placeholders. The phase builds directly on Phase 5's foundation (OKLCH tokens, Inter font, dark mode, fastalent branding) to create a polished, consistent UI across all 33 pages.

The core technical challenge is restyling 14+ shadcn/ui components without creating specificity conflicts or breaking existing functionality. shadcn/ui's copy-paste ownership model eliminates traditional override battles, but requires discipline: use `cn()` exclusively for class merging, create wrapper components instead of modifying base files, and enumerate CVA variants as literal strings for Tailwind JIT.

The responsive strategy follows Tailwind v4's mobile-first breakpoints (sm: 640px, md: 768px, lg: 1024px) with container queries for component-level responsiveness. Information density improvements target 4 stat cards + 1 chart above the fold on 1080p screens by reducing padding (max 32px gaps), tightening card internals, and using compact table rows.

**Primary recommendation:** Restyle shadcn primitives via CSS variable updates first, then create custom wrapper components in `components/custom/` for business-specific variants (teal gradient buttons, status badges, StatCardV2). Replace all LoadingSpinner usage with content-shaped Skeleton placeholders using a shimmer animation (1.5s linear-gradient sweep). Test each restyled component in isolation in both light and dark mode before rolling out to pages.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FR-05 | Sidebar + Topbar Layout | AppShell already exists with role-based accents — needs topbar backdrop-blur, breadcrumbs slot, responsive hamburger (existing Dialog-based mobile nav) |
| FR-11 | Responsive Design (Desktop + Tablet) | Tailwind v4 mobile-first breakpoints (sm/md/lg), container queries for cards, horizontal scroll on mobile tables with scroll hint |
| FR-12 | Efficient Screen Space Usage | Reduce padding to max 32px gaps, tighten card internal spacing, compact table rows, minimize page-level horizontal padding |
| FR-13 | shadcn/ui Component Restyling | Update CSS variables in existing components, use wrapper pattern for custom variants, all components use Deep Teal tokens via `--primary` |
| FR-14 | Color-Coded Status Badges | Badge component already has CVA variants (success/warning/destructive) — extend with status-specific mappings, use semantic colors consistently |
| FR-15 | Empty States with CTAs | EmptyState component exists — needs teal accent on icons, single-action CTA pattern, contextual messaging per page type |
| FR-16 | Skeleton Loading States | Skeleton component exists with pulse animation — add shimmer keyframe (1.5s gradient sweep), replace LoadingSpinner in 3 dashboard pages |
| FR-20 | AI-Ready Design Surfaces | Layout slots for expandable search bar, match score badge area on submission cards, recommendation panel on dashboards (empty shells, no logic) |
| FR-22 | Enhanced Form Validation UX | Inline validation on blur, field-level errors below input, success state (green check), required asterisk, disabled submit during loading |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui | v4 (Tailwind v4 compatible) | Radix UI wrapper components | Industry standard for copy-paste ownership model, eliminates specificity battles, native dark mode support via CSS variables |
| class-variance-authority | ^0.7.1 (installed) | CVA variant system | Official pattern for shadcn/ui, type-safe variants, compound variant support, integrates with tailwind-merge |
| tailwind-merge | ^2.6.0 (installed) | Class conflict resolution | Required for `cn()` utility, handles complex conflicts (px-3 + pr-4), respects variant boundaries (hover:, md:) |
| clsx | ^2.1.1 (installed) | Conditional class composition | Pairs with tailwind-merge in `cn()` utility, handles object-based conditional classes, lightweight (228B gzipped) |
| Tailwind CSS | ^4.1.14 (installed) | CSS-first utility framework | Rust-based Oxide engine (5x faster builds), container queries built-in, mobile-first breakpoints, GPU-accelerated animations |
| Radix UI | Various (installed) | Unstyled accessible primitives | Powers shadcn/ui (Dialog, Dropdown, Avatar, etc.), WAI-ARIA compliant, keyboard navigation, focus management |
| next-themes | ^0.4.6 (installed) | Dark mode management | FOUC-free theme switching, localStorage persistence, `prefers-color-scheme` support, class-based strategy |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.468.0 (installed) | Icon library | All icons (UI, status, navigation) — consistent stroke width, tree-shakeable, 1000+ icons |
| react-loading-skeleton | Optional (not installed) | Skeleton loader library | If custom shimmer animation proves complex — provides out-of-box shimmer, customizable colors, but adds 7KB gzipped |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn/ui | Material UI | More opinionated (harder to customize), heavier bundle (300KB+ vs. <50KB), non-native dark mode |
| shadcn/ui | Chakra UI | Runtime CSS-in-JS overhead, smaller ecosystem, migration path unclear with Tailwind v4 |
| Custom shimmer CSS | react-loading-skeleton | Library adds 7KB but handles edge cases (circle, count, inline) — only worth it if >10 skeleton variants needed |
| Tailwind breakpoints | react-responsive | JS-based media queries add runtime cost, Tailwind's CSS breakpoints are compile-time and more performant |

**Installation:**
```bash
# All dependencies already installed in Phase 5
# No new packages required for Phase 6 core scope
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/components/
├── ui/                  # shadcn primitives (owned, copy-pasted)
│   ├── button.tsx       # Base Button with CVA variants
│   ├── card.tsx         # Base Card
│   ├── badge.tsx        # Base Badge with success/warning/destructive
│   ├── skeleton.tsx     # Base Skeleton (pulse animation)
│   └── ...              # 10+ other primitives
├── custom/              # Business-specific wrappers (NEW in Phase 6)
│   ├── StatCardV2.tsx   # Wrapper around Card with trend, loading, gradient variant
│   ├── ChartCard.tsx    # Card wrapper for chart containers (Phase 8)
│   ├── MetricBadge.tsx  # Badge wrapper with animated counter (Phase 8)
│   └── PageHeader.tsx   # Title + description + action buttons
├── shared/              # Cross-cutting utilities
│   ├── EmptyState.tsx   # Needs teal accent restyling
│   ├── StatCard.tsx     # DEPRECATED — replace with StatCardV2
│   ├── LoadingSpinner.tsx # DEPRECATED — replace with Skeleton
│   └── Logo.tsx
├── layouts/
│   ├── AppShell.tsx     # Needs topbar backdrop-blur, breadcrumbs slot
│   └── Topbar.tsx       # Needs breadcrumb component, responsive hamburger
└── ...
```

### Pattern 1: Wrapper Component Pattern (Don't Modify Base shadcn Files)
**What:** Create custom components in `components/custom/` that compose shadcn primitives instead of editing shadcn source files directly.
**When to use:** Any time you need business-specific behavior (trend indicators, loading states, gradient variants) on top of shadcn primitives.
**Example:**
```typescript
// ✅ CORRECT: components/custom/StatCardV2.tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const statCardVariants = cva(
  'relative overflow-hidden', // base classes
  {
    variants: {
      variant: {
        default: '',
        teal: 'ring-2 ring-brand-primary/20',
        gradient: 'bg-brand-gradient text-primary-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

interface StatCardV2Props extends VariantProps<typeof statCardVariants> {
  label: string;
  value: string | number;
  trend?: { direction: 'up' | 'down' | 'neutral'; percent: number };
  loading?: boolean;
  icon?: React.ReactNode;
}

export function StatCardV2({ label, value, trend, loading, variant, icon }: StatCardV2Props) {
  return (
    <Card className={cn(statCardVariants({ variant }))}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">{value}</span>
            {trend && (
              <span className={cn(
                'text-sm font-medium',
                trend.direction === 'up' && 'text-success',
                trend.direction === 'down' && 'text-error',
                trend.direction === 'neutral' && 'text-muted-foreground'
              )}>
                {trend.direction === 'up' && '↑'}
                {trend.direction === 'down' && '↓'}
                {trend.direction === 'neutral' && '→'}
                {trend.percent}%
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Pattern 2: Restyling shadcn Primitives via CSS Variable Updates
**What:** Update existing shadcn component files to use teal tokens from `index.css` instead of hardcoded colors.
**When to use:** When the shadcn component uses hardcoded colors (emerald-500, blue-600) that should inherit from the design system.
**Example:**
```typescript
// ❌ BEFORE: components/ui/badge.tsx
success: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',

// ✅ AFTER: Use CSS custom properties from index.css
success: 'border-transparent bg-[var(--color-success)]/15 text-[var(--color-success)] dark:text-[var(--color-success)]',

// OR if --color-success is mapped in @theme inline:
success: 'border-transparent bg-success/15 text-success dark:text-success',
```

### Pattern 3: Skeleton Loading Shapes (Content-Aware Placeholders)
**What:** Skeleton placeholders match the shape of actual content (card header = 1 line, body = 3 lines, chart = rectangle).
**When to use:** Any async data fetch (dashboard stats, tables, detail pages, slide-overs).
**Example:**
```typescript
// components/custom/StatCardV2.tsx loading state
{loading ? (
  <Card>
    <CardHeader>
      <Skeleton className="h-4 w-24" /> {/* Label */}
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-32 mb-2" /> {/* Value */}
      <Skeleton className="h-3 w-20" /> {/* Helper text */}
    </CardContent>
  </Card>
) : (
  <Card>{/* Actual content */}</Card>
)}
```

### Pattern 4: Responsive Breakpoint Strategy (Mobile-First)
**What:** Tailwind v4 mobile-first breakpoints: unprefixed = mobile, sm: (640px+), md: (768px+), lg: (1024px+).
**When to use:** Grid layouts, sidebar collapse, table overflow, card stacking.
**Example:**
```typescript
// Stat card grid: 1-col mobile, 2-col tablet, 4-col desktop
<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StatCardV2 {...} />
  <StatCardV2 {...} />
  <StatCardV2 {...} />
  <StatCardV2 {...} />
</section>

// Sidebar: hidden on mobile, visible on md+ (AppShell already implements this)
<aside className="hidden md:flex w-60 ...">
```

### Pattern 5: `cn()` Utility for Class Merging (Always Use, Never Concatenate)
**What:** The `cn()` function combines `clsx` (conditional classes) + `tailwind-merge` (conflict resolution).
**When to use:** Every component that accepts `className` prop or merges conditional classes.
**Example:**
```typescript
// ✅ CORRECT: cn() handles conflicts
<Button className={cn('px-4', someCondition && 'px-6')}>
  {/* tailwind-merge ensures px-6 wins if condition true */}
</Button>

// ❌ WRONG: String concatenation causes px-4 AND px-6 both applied
<Button className={'px-4 ' + (someCondition ? 'px-6' : '')}>
```

### Anti-Patterns to Avoid
- **Modifying shadcn source files for business logic:** Don't add trend indicators, loading states, or custom variants to `components/ui/button.tsx` — create a wrapper in `components/custom/` instead. Reason: Breaks updateability, mixes concerns, makes future shadcn upgrades painful.
- **Dynamic class name construction:** `bg-${color}-500` doesn't work with Tailwind JIT. Solution: Enumerate all variants as literal strings in CVA config or use CSS variables.
- **Using `!important` to win specificity battles:** shadcn + `cn()` eliminates specificity conflicts. If you need `!important`, you're fighting the framework. Solution: Use `cn()` to merge classes correctly or wrap the component.
- **Hardcoding colors instead of tokens:** `text-teal-600` instead of `text-primary` breaks dark mode and violates design system. Solution: Always use semantic tokens (`text-primary`, `bg-brand-primary`, `text-success`).
- **Mixing LoadingSpinner and Skeleton:** Inconsistent loading UX confuses users. Solution: Phase 6 replaces ALL spinners with skeletons — enforce in code review.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible modal/dialog | Custom overlay + focus trap + keyboard handling | shadcn Dialog (Radix Dialog) | Edge cases: focus restoration on close, scroll locking, Escape key handling, click-outside-to-close, portal rendering, screen reader announcements (20+ gotchas) |
| Responsive sidebar with hamburger | Custom useState + media query listener | AppShell already exists; enhance with Dialog for mobile | Existing solution uses Radix Dialog for mobile nav drawer, handles focus management, transitions, and accessibility |
| Class name conflict resolution | Manual string concatenation or priority rules | tailwind-merge via `cn()` | Handles complex conflicts (px-3 + pr-4), respects variant boundaries (hover:, md:), supports custom Tailwind config |
| Dark mode theme switching | Manual localStorage + class toggling | next-themes (already installed) | FOUC prevention, SSR hydration issues, system preference detection, storage sync across tabs |
| Shimmer skeleton animation | Complex gradient + transform keyframes | Existing Skeleton component + simple linear-gradient shift | Custom shimmer is 40+ lines of CSS with cross-browser gotchas; linear-gradient shift is 10 lines and GPU-accelerated |
| Form validation timing (blur vs submit) | Custom event listeners + state management | react-hook-form (installed) + Zod (installed) | Already integrated, handles async validation, field-level errors, touched state, submission state — don't rebuild |
| Responsive grid breakpoints | JS-based matchMedia listeners | Tailwind breakpoint prefixes (sm:, md:, lg:) | Compile-time CSS is faster than runtime JS, no hydration mismatches, no event listener cleanup needed |

**Key insight:** shadcn/ui + Radix UI primitives have solved accessibility, keyboard navigation, focus management, and portal rendering. Custom implementations introduce 20+ edge cases (screen readers, keyboard traps, mobile Safari scroll locking, etc.). Always compose shadcn primitives first; only build custom if primitive doesn't exist.

## Common Pitfalls

### Pitfall 1: Dynamic Class Name Construction Breaks Tailwind JIT
**What goes wrong:** `bg-${color}-500` or `text-[${colorVar}]` doesn't appear in production build because Tailwind JIT can't see the full class name at compile time.
**Why it happens:** Tailwind scans source files for literal class strings; dynamic string interpolation is invisible to the scanner.
**How to avoid:** Enumerate all color variants as literal strings in CVA config or use CSS custom properties.
**Warning signs:** Class works in dev but disappears in production build; `npm run build` output shows fewer utilities than expected.
**Example:**
```typescript
// ❌ WRONG: bg-${color}-500 won't compile
const colors = ['red', 'blue', 'green'];
<div className={`bg-${colors[0]}-500`}>

// ✅ CORRECT: Enumerate variants
const badgeVariants = cva('base-classes', {
  variants: {
    color: {
      red: 'bg-red-500 text-red-50',
      blue: 'bg-blue-500 text-blue-50',
      green: 'bg-green-500 text-green-50',
    },
  },
});
<Badge variant={color} />

// ✅ ALSO CORRECT: Use CSS variables
<div className="bg-[var(--color-status)]" style={{ '--color-status': statusColor }}>
```

### Pitfall 2: Modifying shadcn Source Files Blocks Updates
**What goes wrong:** You edit `components/ui/button.tsx` to add a gradient variant, then shadcn releases a security fix or new feature and you can't update without losing your changes.
**Why it happens:** shadcn is copy-paste, not an npm package — updates require re-copying files, which overwrites customizations.
**How to avoid:** Never edit shadcn source files for business logic. Create wrappers in `components/custom/` that compose shadcn primitives.
**Warning signs:** Diff shows changes inside `components/ui/` that aren't CSS variable updates; PR comments like "don't overwrite my Button changes."
**Example:**
```typescript
// ❌ WRONG: Editing components/ui/button.tsx
const buttonVariants = cva('...', {
  variants: {
    variant: {
      default: '...',
      gradient: 'bg-brand-gradient text-primary-foreground', // CUSTOM ADDITION
    },
  },
});

// ✅ CORRECT: Create components/custom/GradientButton.tsx
import { Button, type ButtonProps } from '@/components/ui/button';
export function GradientButton(props: ButtonProps) {
  return <Button className="bg-brand-gradient" {...props} />;
}
```

### Pitfall 3: Specificity Conflicts from Naive Class Merging
**What goes wrong:** `className={'px-4 ' + extraClasses}` where `extraClasses = 'px-6'` results in BOTH px-4 and px-6 applied, with unpredictable results based on CSS source order.
**Why it happens:** String concatenation doesn't resolve conflicts; CSS specificity is identical for both utilities, so last-in-source-order wins (not last-in-string).
**How to avoid:** Always use `cn()` utility which wraps `tailwind-merge` to intelligently resolve conflicts (last-in-call-order wins).
**Warning signs:** Padding/margin behaves inconsistently; DevTools shows two conflicting utilities both applied; hover states flicker.
**Example:**
```typescript
// ❌ WRONG: String concatenation
<Button className={'px-4 py-2 ' + (isLarge ? 'px-6 py-3' : '')}>
  {/* Both px-4 and px-6 applied if isLarge true */}
</Button>

// ✅ CORRECT: cn() resolves conflicts
<Button className={cn('px-4 py-2', isLarge && 'px-6 py-3')}>
  {/* tailwind-merge ensures px-6 py-3 win if isLarge true */}
</Button>
```

### Pitfall 4: Skeleton Count Mismatch (CLS on Load)
**What goes wrong:** Show 3 skeleton cards during loading, but actual data has 5 items → layout shifts when real content loads (poor CLS score).
**Why it happens:** Skeleton count is hardcoded instead of based on expected data length or previous fetch result.
**How to avoid:** If data length is predictable (e.g., always 4 stat cards), match skeleton count. If dynamic (e.g., table rows), show a reasonable default (8-10 rows) or use previous fetch's `data.length` from cache.
**Warning signs:** Visible layout jump when loading completes; Lighthouse flags CLS > 0.1; user sees content "pop in."
**Example:**
```typescript
// ❌ WRONG: Hardcoded 3 skeletons, but data has 4 items
{loading ? (
  <>
    <Skeleton className="h-20" />
    <Skeleton className="h-20" />
    <Skeleton className="h-20" />
  </>
) : (
  data.map(item => <StatCardV2 {...item} />) // 4 items
)}

// ✅ CORRECT: Match expected count
{loading ? (
  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
) : (
  data.map(item => <StatCardV2 {...item} />)
)}
```

### Pitfall 5: Missing Dark Mode Testing
**What goes wrong:** Component looks perfect in light mode, but dark mode has unreadable text (white text on light gray background) or invisible borders.
**Why it happens:** Only tested in default theme; dark mode overrides in `index.css` weren't considered; hardcoded colors instead of semantic tokens.
**How to avoid:** Test EVERY restyled component in both light and dark mode before merging. Use semantic tokens (`text-foreground`, `bg-card`, `border-border`) instead of hardcoded colors.
**Warning signs:** CI passes but user reports unreadable UI; contrast ratio fails in dark mode; borders disappear in dark mode.
**Example:**
```typescript
// ❌ WRONG: Hardcoded colors break dark mode
<div className="bg-white text-gray-900 border-gray-200">
  {/* White bg + gray-900 text is unreadable in dark mode if .dark overrides background */}
</div>

// ✅ CORRECT: Semantic tokens adapt to theme
<div className="bg-card text-card-foreground border-border">
  {/* Uses --card, --card-foreground, --border which have light/dark variants */}
</div>
```

### Pitfall 6: Responsive Breakpoint Misalignment
**What goes wrong:** Sidebar collapses at 768px (`md:`), but stat card grid switches to 2-column at 640px (`sm:`), creating awkward layout where sidebar is visible but cards are stacked.
**Why it happens:** Breakpoints chosen independently per component without considering overall layout.
**How to avoid:** Establish breakpoint conventions (mobile <640px, tablet 640-1024px, desktop >1024px) and use consistently. Sidebar collapse and card grid transitions should align.
**Warning signs:** Tablet view (768px) has inconsistent density; some sections look desktop-ish, others mobile-ish.
**Example:**
```typescript
// ❌ WRONG: Sidebar at md:, cards at sm:
<aside className="hidden md:flex"> {/* 768px */}
<section className="grid sm:grid-cols-2 lg:grid-cols-4"> {/* 640px / 1024px */}

// ✅ CORRECT: Align breakpoints
<aside className="hidden lg:flex"> {/* 1024px */}
<section className="grid md:grid-cols-2 lg:grid-cols-4"> {/* 768px / 1024px */}
```

## Code Examples

Verified patterns from official sources:

### Shimmer Animation Keyframe
```css
/* Add to index.css (or animations.css if separate) */
@keyframes shimmer {
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 100% 0;
  }
}

/* Apply to Skeleton component */
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-muted) 0%,
    var(--color-accent) 50%,
    var(--color-muted) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### Responsive Stat Card Grid
```typescript
// Source: Tailwind v4 responsive design docs
<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StatCardV2 label="Total Revenue" value="₹1,23,456" loading={false} />
  <StatCardV2 label="Active Roles" value="23" trend={{ direction: 'up', percent: 12 }} />
  <StatCardV2 label="Submissions" value="156" trend={{ direction: 'down', percent: 8 }} />
  <StatCardV2 label="Hired" value="12" trend={{ direction: 'neutral', percent: 0 }} />
</section>
```

### Status Badge Mapping (Semantic Colors)
```typescript
// Source: StatusBadge.tsx + REQUIREMENTS.md FR-14
import { Badge } from '@/components/ui/badge';

const SUBMISSION_STATUS_CONFIG = {
  pending: { label: 'Pending', variant: 'warning', color: 'amber' },
  under_review: { label: 'Under Review', variant: 'default', color: 'blue' },
  shortlisted: { label: 'Shortlisted', variant: 'default', color: 'teal' },
  interview: { label: 'Interview', variant: 'default', color: 'purple' },
  hired: { label: 'Hired', variant: 'success', color: 'green' },
  rejected: { label: 'Rejected', variant: 'destructive', color: 'red' },
  withdrawn: { label: 'Withdrawn', variant: 'outline', color: 'gray' },
} as const;

export function SubmissionStatusBadge({ status }: { status: keyof typeof SUBMISSION_STATUS_CONFIG }) {
  const config = SUBMISSION_STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
```

### Empty State with Single-Action CTA
```typescript
// Source: Empty state UX research + EmptyState.tsx
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';

<EmptyState
  icon={<Briefcase className="text-brand-primary" />} {/* Teal accent */}
  title="No active roles yet"
  description="Create your first role to start receiving submissions from recruiters."
  action={
    <Button asChild>
      <Link to="/company/roles/create">Create Role</Link>
    </Button>
  }
/>
```

### Enhanced Form Validation (Inline Errors)
```typescript
// Source: Form validation UX research + react-hook-form docs
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  roleTitle: z.string().min(5, 'Title must be at least 5 characters'),
  salary: z.coerce.number().min(1, 'Salary is required'),
});

function CreateRoleForm() {
  const form = useForm({ resolver: zodResolver(schema), mode: 'onBlur' }); // Validate on blur

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="roleTitle"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Role Title <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className={cn(
                    fieldState.error && 'border-destructive',
                    !fieldState.error && field.value && 'border-success' // Success state
                  )}
                />
              </FormControl>
              <FormMessage /> {/* Error below input */}
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating...' : 'Create Role'}
        </Button>
      </form>
    </Form>
  );
}
```

### Topbar with Backdrop Blur and Breadcrumbs
```typescript
// Source: AppShell.tsx + Tailwind v4 backdrop-filter docs
function Topbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
        {/* Mobile hamburger (existing Dialog-based drawer) */}
        <button className="md:hidden">...</button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden md:flex">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li><Link to="/recruiter">Dashboard</Link></li>
            <li className="text-foreground" aria-current="page">Profile</li>
          </ol>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Component library via npm | Copy-paste ownership (shadcn/ui) | 2023-2024 | Full control over source, no version lock-in, easier customization, but manual updates |
| CSS-in-JS (styled-components) | Utility-first CSS (Tailwind v4) | 2024-2025 | Zero runtime cost, faster builds (Rust Oxide engine), no hydration mismatches, but learning curve |
| Manual dark mode with theme context | next-themes + CSS variables | 2024-2025 | FOUC-free, SSR-safe, system preference support, simpler implementation |
| Loading spinners everywhere | Skeleton screens with shimmer | 2024-2026 | Better perceived performance, reduced CLS, more professional UX |
| JS-based responsive (matchMedia) | CSS container queries | 2025-2026 | Component-level responsiveness, no JS overhead, 93.92% browser support (Dec 2025) |
| Hardcoded colors in components | Design token system (CSS custom properties) | 2024-2026 | Theme switching, dark mode, brand consistency, single source of truth |
| Class name string concatenation | tailwind-merge + clsx via `cn()` | 2023-2024 | Conflict resolution, conditional classes, no specificity battles |

**Deprecated/outdated:**
- **Tailwind v3 config-based theming:** Tailwind v4 is CSS-first with `@theme inline` — no `tailwind.config.js` needed for theme tokens
- **react-burger-menu for sidebars:** Modern approach uses Radix Dialog/Sheet primitives with better accessibility and animations
- **Manual skeleton implementations:** shadcn/ui Skeleton component (Radix-based) is now standard, extensible with shimmer animation
- **Separate light/dark stylesheets:** CSS custom properties with `.dark` selector is now universal pattern (eliminates duplication)

## Open Questions

1. **Should we lazy-load the shimmer animation keyframe?**
   - What we know: Shimmer is 10 lines of CSS (~200 bytes), used on every page (dashboards, tables, detail pages)
   - What's unclear: Whether inlining in `index.css` vs. separate `animations.css` impacts initial bundle size
   - Recommendation: Inline in `index.css` — 200 bytes is negligible, and every page uses skeletons (no lazy-load benefit)

2. **How many skeleton variants do we need?**
   - What we know: Current Skeleton component has pulse animation; need to add shimmer and content-shaped variants (card, table row, stat card)
   - What's unclear: Whether to create separate components (SkeletonCard, SkeletonTable) or use props (`<Skeleton variant="card" />`)
   - Recommendation: Use composition pattern — keep Skeleton primitive, build SkeletonCard/SkeletonStatCard wrappers in `components/custom/` for reusability

3. **Should we use react-loading-skeleton library?**
   - What we know: Library adds 7KB gzipped, provides out-of-box shimmer, handles circle/inline variants
   - What's unclear: Whether custom shimmer CSS (10 lines) + composition pattern is sufficient
   - Recommendation: Start with custom implementation — if we hit >10 skeleton variants or complex use cases (inline skeletons mid-sentence), revisit library. Currently project has ~8 loading scenarios (dashboards, tables, detail pages, slide-overs) — manageable with custom.

4. **How to handle breadcrumb generation (static vs dynamic)?**
   - What we know: Topbar needs breadcrumbs, React Router 7 is installed
   - What's unclear: Whether to use react-router matches API for auto-breadcrumbs or define manually per route
   - Recommendation: Manual definition in route config — auto-breadcrumbs are fragile (rely on route naming conventions) and don't handle dynamic segments well ("Role #123" requires fetching role title). Define breadcrumbs in route loader or component.

5. **Should PageHeader be a single component or composed primitives?**
   - What we know: Need title + description + action buttons pattern across 20+ pages
   - What's unclear: Whether to create monolithic `<PageHeader title="..." description="..." actions={...} />` or composable `<PageHeader><PageTitle /><PageActions /></PageHeader>`
   - Recommendation: Composable primitives — more flexible for edge cases (some pages have tabs, filters, or custom layouts). Follow shadcn pattern: PageHeader container + PageTitle/PageDescription/PageActions subcomponents.

## Validation Architecture

> Phase 6 restyling is purely presentational — no new business logic, no API changes. Validation focuses on visual regression, accessibility, and responsive behavior.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — Phase 6 uses manual testing + Lighthouse |
| Config file | N/A (no unit tests for presentational components) |
| Quick run command | N/A |
| Full suite command | `npm run build` (TypeScript + Vite build check) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FR-05 | Sidebar + Topbar responsive layout | Manual + Screenshot | Storybook or manual at 375/768/1440px | ❌ Wave 0 |
| FR-11 | Responsive design at 3 breakpoints | Manual + Screenshot | Browser DevTools device mode | ❌ Wave 0 |
| FR-12 | Efficient screen space (4 cards + chart visible) | Manual + Screenshot | Visual inspection at 1920x1080 | ❌ Wave 0 |
| FR-13 | shadcn components use teal tokens | Manual + grep | `grep -r "hardcoded-color" src/components/ui/` | ❌ Wave 0 |
| FR-14 | Status badges color-coded | Manual + Screenshot | Render all status variants in isolation | ❌ Wave 0 |
| FR-15 | Empty states with CTAs | Manual + Screenshot | Navigate to empty list pages | ❌ Wave 0 |
| FR-16 | Skeleton loading states | Manual + Screenshot | Throttle network, observe loading states | ❌ Wave 0 |
| FR-20 | AI-ready design slots | Manual + Code Review | Verify layout slots exist (no interaction) | ❌ Wave 0 |
| FR-22 | Form validation UX | Manual + E2E | Test inline errors on blur | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run build` (TypeScript + Vite build verification)
- **Per wave merge:** Manual testing in light/dark mode at 3 breakpoints (375/768/1440px)
- **Phase gate:** Lighthouse audit (Performance >= 90, Accessibility >= 95), visual regression screenshots

### Wave 0 Gaps
- [ ] **Manual test checklist** — Responsive behavior at 375/768/1440px for each restyled page
- [ ] **Lighthouse CI integration** — Automated performance/accessibility checks on PR (optional but recommended)
- [ ] **Storybook setup** — Isolated component testing environment for shadcn primitives and custom wrappers (optional, deferred to Phase 10)
- [ ] **Visual regression testing** — Percy/Chromatic for screenshot diffs (optional, deferred to Phase 10)

**Rationale:** Phase 6 is presentational restyling with no new business logic. Unit tests for components are low ROI (test implementation details, not behavior). Manual testing + Lighthouse + TypeScript build verification provide sufficient coverage. If visual regressions become frequent, add Storybook + Percy in Phase 10.

## Sources

### Primary (HIGH confidence)
- [shadcn/ui Theming Docs](https://ui.shadcn.com/docs/theming) — CSS variable-based theming, component restyling patterns
- [shadcn/ui Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) — v4 compatibility, data-slot attributes
- [Class Variance Authority Docs](https://cva.style/docs) — CVA variant patterns, compound variants, TypeScript integration
- [Tailwind CSS Responsive Design Docs](https://tailwindcss.com/docs/responsive-design) — Mobile-first breakpoints, container queries
- [Tailwind CSS v4 Container Queries](https://www.sitepoint.com/tailwind-css-v4-container-queries-modern-layouts/) — Component-level responsive design

### Secondary (MEDIUM confidence)
- [Inline Validation UX — Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/inline-validation-ux/) — Form validation timing, error message placement
- [Empty State UX Examples and Design Rules](https://www.eleken.co/blog-posts/empty-state-ux) — Contextual CTAs, single-action pattern
- [Status System — Astro UX Design System](https://www.astrouxds.com/patterns/status-system/) — Semantic color coding for status badges
- [React Loading Skeleton Docs](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/) — Shimmer animation patterns, skeleton best practices
- [The Anatomy of shadcn/ui](https://vercel.com/academy/shadcn-ui/extending-shadcn-ui-with-custom-components) — Wrapper component pattern, extending primitives

### Tertiary (LOW confidence — verify before implementation)
- [Responsive Design in 2026: What's New](https://medium.com/@netizens_technologies/responsive-design-in-2026-whats-new-and-what-s-next-137285d4f0c6) — Container query support statistics (93.92% Dec 2025)
- [ShadCN UI in 2026: Component Library Evolution](https://dev.to/whoffagents/shadcn-ui-in-2026-the-component-library-that-changed-how-we-build-uis-296o) — AI generation trends, v0.dev integration

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All dependencies verified in package.json, shadcn/ui + CVA + Tailwind v4 is industry-standard pattern (2026)
- Architecture: HIGH — Wrapper pattern verified from official shadcn docs, existing codebase already uses `cn()` and AppShell
- Responsive strategy: HIGH — Tailwind v4 breakpoints documented, existing code uses mobile-first pattern
- Skeleton/shimmer: MEDIUM — CSS keyframe pattern verified from multiple sources, but custom vs. library tradeoff needs validation
- Form validation: HIGH — react-hook-form + Zod already integrated, inline validation pattern standard in 2026
- Empty states: MEDIUM — Pattern verified from UX research, but implementation details (icon accent color, CTA styling) need Wave 0 validation
- Status badges: HIGH — Existing StatusBadge component already uses semantic colors, needs extension for additional statuses

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30 days for stable patterns — shadcn/ui, Tailwind, CVA mature ecosystems)
