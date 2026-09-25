# Phase 7: Data Tables + Page Transitions - Research

**Researched:** 2026-04-16
**Domain:** Data table management, pagination, filtering, sorting, view transitions
**Confidence:** HIGH

## Summary

Phase 7 transforms list-based interfaces from card grids to structured data tables with server-side pagination, sorting, and filtering, while adding smooth page transitions for navigation polish. The phase implements TanStack Table (the industry-standard headless table library) paired with shadcn/ui table primitives to create a DataTable component that handles 7 critical list views: RolesList, BrowseRoles, MySubmissions, AdminUsers, AdminRoles, AdminEarnings, and TransactionTable.

The core technical challenge is building a single reusable DataTable component that supports both client-side and server-side data operations without performance regressions. TanStack Table is headless (no UI, just logic), so all styling comes from shadcn table primitives restyled in Phase 6. The biggest pitfall is re-render loops caused by non-memoized data/columns — MANDATORY `useMemo` on both.

React Router 7 stabilized the View Transitions API with the `viewTransition` prop on Link/NavLink components and the `useViewTransitionState` hook for fine-grained control. Browser support reaches 70-75% globally (Chrome 111+, Edge 111+, Safari 18+, Firefox 133+), with graceful degradation to instant navigation in unsupported browsers — no broken functionality, just no animations.

Mobile table strategy uses horizontal scroll with `overflow-x: auto` + sticky headers (`position: sticky; left: 0`) + a scroll hint indicator (gradient fade or chevron) to signal scrollable content. Tailwind's container queries enable responsive breakpoints where tables switch to card layouts below 640px for complex multi-column tables.

**Primary recommendation:** Build DataTable component with shadcn/ui table primitives + TanStack Table v8, memoize data and columns with `useMemo`, integrate with TanStack Query for server-side pagination/filtering/sorting state, use Sheet component (already installed) for slide-over quick-view panels, enable `viewTransition` on all Link/NavLink components, and test table responsiveness at 375px/768px/1440px with real data.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FR-06 | Paginated Data Tables with Sort/Filter | TanStack Table v8 with `getPaginationRowModel`, `getSortedRowModel`, `getFilteredRowModel`. shadcn/ui data-table pattern provides reference implementation. Server-side state managed via TanStack Query with queryKey invalidation. |
| FR-07 | Offcanvas / Slide-Over Panels | Sheet component already installed (Radix Dialog-based), 600-700px on desktop, full-width on mobile. Use for submission quick-view, role summary, notification detail, user profile preview. Preserves scroll position on close. |
| FR-08 | Minimal-Click Information Access | Slide-over panels + inline expansion reduce navigation depth to 1-2 clicks. From role list → see fee structure in slide-over. From submission list → see candidate details in slide-over. From dashboard → see metric breakdown in slide-over. |
| FR-17 | Page Transitions (View Transitions API) | React Router 7 stabilized `viewTransition` prop (formerly `unstable_viewTransition`). Add to all Link/NavLink. Customize with `::view-transition-old(root)` and `::view-transition-new(root)` CSS pseudo-elements. Falls back gracefully in unsupported browsers. |
| FR-21 | Notification Center Slide-Over | Sheet component for notification panel. Unread count badge on bell icon, read/unread states, priority filtering (All/Unread tabs), relative timestamps, quick-action buttons, "Mark all read" action. Group by date. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | v8 (install required) | Headless table logic | Industry standard for React tables (500K+ weekly downloads), handles sorting/filtering/pagination/grouping, framework-agnostic, built by Tanner Linsley (TanStack ecosystem author) |
| shadcn/ui Table | Installed (Phase 6) | Table UI primitives | Radix-free table component (native `<table>` with Tailwind styling), already restyled with Deep Teal tokens, accessible markup, responsive helpers |
| React Router | 7.1.3 (installed) | View Transitions API | Stabilized `viewTransition` prop in v7.10+, `useViewTransitionState` hook for fine-grained control, integrates with browser View Transitions API |
| Sheet (Radix Dialog) | Installed (Phase 6) | Slide-over panels | Already in `components/ui/sheet.tsx`, 600-700px on desktop, full-width mobile, focus trap, Escape-to-close, overlay backdrop |
| TanStack Query | 5.90.2 (installed) | Server-side state | Already integrated for data fetching, query invalidation, pagination state (`keepPreviousData`), caching, optimistic updates |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.468.0 (installed) | Icons for table actions | Sort indicators (ArrowUp/ArrowDown), filter icons, dropdown triggers, pagination arrows |
| zustand | ^5.0.8 (installed) | Client-side table state | Optional for persisting column visibility, column order, or filter presets across sessions |
| nuqs | Optional (not installed) | URL state for filters | If you want shareable filter URLs (`?status=pending&sort=date`) — adds 3KB, useful for admin tables |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Table | Material React Table | Built on TanStack Table but opinionated (Material Design), heavier bundle (80KB vs 15KB), less customization |
| TanStack Table | AG Grid React | Enterprise-grade but commercial license for advanced features, massive bundle (200KB+), overkill for this use case |
| Sheet (Radix Dialog) | Vaul Drawer | Better mobile gestures (drag-to-close) but different API, adds 8KB, not needed since Sheet already works |
| React Router View Transitions | framer-motion page transitions | More control but requires manual orchestration, larger bundle (50KB vs 0KB), View Transitions API is native |
| Server-side pagination via TanStack Query | Client-side pagination only | Simpler but won't scale beyond 1000 rows, already have TanStack Query integrated |

**Installation:**
```bash
npm install @tanstack/react-table
# Optional for URL state:
# npm install nuqs
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/components/
├── ui/
│   ├── table.tsx                 # shadcn table primitives (installed)
│   ├── sheet.tsx                 # Slide-over component (installed)
│   └── ...
├── data-table/                   # NEW in Phase 7
│   ├── DataTable.tsx             # Generic table wrapper with TanStack Table
│   ├── DataTablePagination.tsx   # Page size selector + page controls
│   ├── DataTableToolbar.tsx      # Filter dropdowns + search + clear filters
│   ├── DataTableColumnHeader.tsx # Sortable column header with icon
│   ├── DataTableFilterPills.tsx  # Active filter badges with X to dismiss
│   └── DataTableEmptyState.tsx   # "No results" with CTA
├── slide-overs/                  # NEW in Phase 7
│   ├── RoleQuickView.tsx         # Role summary slide-over
│   ├── SubmissionQuickView.tsx   # Candidate quick-view
│   ├── NotificationCenter.tsx    # Notification slide-over panel
│   └── ...
└── ...

apps/web/src/pages/
├── company/RolesList.tsx         # Convert to DataTable
├── recruiter/BrowseRoles.tsx     # Convert to DataTable
├── recruiter/MySubmissions.tsx   # Convert to DataTable
├── admin/AdminUsers.tsx          # Convert to DataTable
├── admin/AdminRoles.tsx          # Convert to DataTable
├── admin/AdminEarnings.tsx       # Convert to DataTable
└── ...
```

### Pattern 1: DataTable Component with Server-Side Operations
**What:** Reusable DataTable wrapper that accepts columns, data, and optional server-side handlers (onPaginationChange, onSortingChange, onFilterChange).
**When to use:** All 7 list views in the phase scope.
**Example:**
```typescript
// components/data-table/DataTable.tsx
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar } from './DataTableToolbar';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number; // Server-side pagination total pages
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onSortingChange?: (sorting: { id: string; desc: boolean }[]) => void;
  onFilterChange?: (filters: { id: string; value: any }[]) => void;
  loading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  onPaginationChange,
  onSortingChange,
  onFilterChange,
  loading,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination, sorting, columnFilters },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(newPagination);
      onPaginationChange?.(newPagination);
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      onSortingChange?.(newSorting);
    },
    onColumnFiltersChange: (updater) => {
      const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
      setColumnFilters(newFilters);
      onFilterChange?.(newFilters);
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: !!pageCount, // Server-side if pageCount provided
    manualSorting: !!onSortingChange,
    manualFiltering: !!onFilterChange,
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map(group => (
              <TableRow key={group.id}>
                {group.headers.map(header => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={columns.length}><Skeleton className="h-8" /></TableCell></TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length}>No results.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
```

### Pattern 2: Memoized Columns Definition (MANDATORY to Avoid Re-Render Loop)
**What:** Wrap column definitions in `useMemo` with stable dependencies to prevent infinite re-renders.
**When to use:** Every DataTable usage.
**Example:**
```typescript
// pages/company/RolesList.tsx
import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';

export default function RolesList() {
  const { data, isLoading } = useMyRoles({ pageIndex: 0, pageSize: 10 });

  // ✅ CORRECT: Memoize columns
  const columns = useMemo<ColumnDef<RoleOwnerResponse>[]>(() => [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role Title" />
      ),
      cell: ({ row }) => (
        <Link to={`/c/roles/${row.original.id}`} className="font-medium hover:underline">
          {row.getValue('title')}
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
      filterFn: 'equals', // Enable filtering by status
    },
    {
      accessorKey: 'submissionsCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Submissions" />
      ),
    },
  ], []); // Empty deps — columns never change

  // ✅ CORRECT: Memoize data only if transforming it
  const memoizedData = useMemo(() => data?.items ?? [], [data?.items]);

  return (
    <DataTable
      columns={columns}
      data={memoizedData}
      pageCount={data?.totalPages}
      loading={isLoading}
    />
  );
}
```

### Pattern 3: Server-Side Pagination with TanStack Query
**What:** Integrate DataTable with TanStack Query to fetch paginated data from API, using `keepPreviousData` to prevent flicker.
**When to use:** All 7 list views (API already supports pagination via `page`/`limit` query params).
**Example:**
```typescript
// hooks/useMyRolesPaginated.ts
import { useQuery } from '@tanstack/react-query';
import { listMyRoles } from '@/features/role/api';

export function useMyRolesPaginated(pagination: { pageIndex: number; pageSize: number }) {
  return useQuery({
    queryKey: ['roles', 'my', pagination],
    queryFn: () => listMyRoles({
      page: pagination.pageIndex + 1, // API is 1-indexed
      limit: pagination.pageSize,
    }),
    keepPreviousData: true, // Don't flash loading state on page change
  });
}

// pages/company/RolesList.tsx
export default function RolesList() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const { data, isLoading } = useMyRolesPaginated(pagination);

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      pageCount={data?.totalPages}
      onPaginationChange={setPagination}
      loading={isLoading}
    />
  );
}
```

### Pattern 4: Filter Pills with "Clear All" Action
**What:** Display active filters as dismissible badges above the table, with a "Clear all" button to reset all filters.
**When to use:** Any table with 2+ filter options.
**Example:**
```typescript
// components/data-table/DataTableFilterPills.tsx
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function DataTableFilterPills({ filters, onRemoveFilter, onClearAll }) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map(filter => (
        <Badge key={filter.id} variant="secondary" className="gap-1 pr-1">
          <span className="text-xs">{filter.label}: {filter.value}</span>
          <button
            onClick={() => onRemoveFilter(filter.id)}
            className="rounded-sm opacity-70 hover:opacity-100"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.length > 1 && (
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          Clear all
        </Button>
      )}
    </div>
  );
}
```

### Pattern 5: Slide-Over Quick View (Role Summary)
**What:** Use Sheet component to show role details in a slide-over panel from the browse list, avoiding full page navigation.
**When to use:** RoleQuickView, SubmissionQuickView, NotificationCenter, UserProfilePreview.
**Example:**
```typescript
// components/slide-overs/RoleQuickView.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';

export function RoleQuickView({ roleId, open, onOpenChange }) {
  const { data: role, isLoading } = useRole(roleId, { enabled: open });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{role?.title || 'Role Details'}</SheetTitle>
          <SheetDescription>{role?.companyName}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Role details sections */}
          <section>
            <h3 className="font-medium text-sm text-muted-foreground">Fee Structure</h3>
            <p className="text-lg font-semibold mt-1">
              {role?.payoutPerShortlist && `₹${role.payoutPerShortlist}/shortlist`}
              {role?.payoutPerHire && ` + ₹${role.payoutPerHire}/hire`}
            </p>
          </section>

          <section>
            <h3 className="font-medium text-sm text-muted-foreground">Requirements</h3>
            <p className="mt-1 text-sm">{role?.requirements}</p>
          </section>

          <div className="pt-4">
            <Button asChild className="w-full">
              <Link to={`/r/roles/${roleId}`}>View Full Details</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Usage in DataTable cell
{
  accessorKey: 'title',
  cell: ({ row }) => (
    <button
      onClick={() => setQuickViewRoleId(row.original.id)}
      className="text-left font-medium hover:underline"
    >
      {row.getValue('title')}
    </button>
  ),
}
```

### Pattern 6: View Transitions on All Navigation Links
**What:** Add `viewTransition` prop to all Link and NavLink components for smooth cross-fade page transitions.
**When to use:** All page navigation (sidebar nav, breadcrumbs, table row links, CTAs).
**Example:**
```typescript
// layouts/Sidebar.tsx
<NavLink to="/recruiter" viewTransition>
  {({ isActive }) => (
    <span className={cn('flex items-center gap-2', isActive && 'font-semibold')}>
      <Home className="h-4 w-4" />
      Dashboard
    </span>
  )}
</NavLink>

// DataTable cell with viewTransition
{
  accessorKey: 'title',
  cell: ({ row }) => (
    <Link to={`/c/roles/${row.original.id}`} viewTransition className="hover:underline">
      {row.getValue('title')}
    </Link>
  ),
}

// Custom CSS for cross-fade transition
/* index.css */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}

::view-transition-old(root) {
  animation-name: fade-out;
}

::view-transition-new(root) {
  animation-name: fade-in;
}

@keyframes fade-out {
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
}
```

### Pattern 7: Sticky Table Headers on Scroll
**What:** Use `position: sticky` on TableHeader to keep column headers visible when scrolling long tables.
**When to use:** All DataTable instances.
**Example:**
```typescript
// components/data-table/DataTable.tsx
<TableHeader className="sticky top-0 bg-background z-10 border-b">
  {/* Header rows */}
</TableHeader>

// For tables inside a scrollable container (not full-page):
<div className="max-h-[600px] overflow-auto">
  <Table>
    <TableHeader className="sticky top-0 bg-background z-10">
      {/* ... */}
    </TableHeader>
  </Table>
</div>
```

### Pattern 8: Mobile Table Strategy (Horizontal Scroll + Scroll Hint)
**What:** On mobile (<640px), tables scroll horizontally with a gradient fade to indicate scrollable content.
**When to use:** Tables with 4+ columns that don't fit on mobile.
**Example:**
```typescript
// components/data-table/DataTable.tsx
<div className="relative">
  {/* Scroll hint gradient */}
  <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 sm:hidden" />

  {/* Scrollable table container */}
  <div className="overflow-x-auto">
    <Table className="min-w-[640px]"> {/* Force horizontal scroll on mobile */}
      <TableHeader className="sticky top-0 left-0 bg-background">
        {/* First column sticky on horizontal scroll */}
        <TableHead className="sticky left-0 bg-background z-20">Title</TableHead>
        <TableHead>Status</TableHead>
        {/* ... more columns */}
      </TableHeader>
    </Table>
  </div>
</div>
```

### Anti-Patterns to Avoid
- **Non-memoized columns/data:** Causes infinite re-render loop. TanStack Table compares data reference on every render — if `columns` is redefined inside the component body without `useMemo`, table re-renders infinitely.
- **Client-side pagination with server-side filtering:** Inconsistent UX — user filters to 50 items, but pagination only shows first 10 of the 50. Solution: Use server-side pagination/filtering/sorting together, or client-side for all three.
- **Hardcoded filter values in column definitions:** `filterFn: (row, columnId, filterValue) => row.getValue(columnId) === 'pending'` breaks when filter changes. Solution: Use TanStack Table's `filterFn` with dynamic `filterValue` from state.
- **Sheet component without scroll:** Slide-over content overflows viewport on mobile. Solution: Add `overflow-y-auto` to `SheetContent`.
- **View Transitions without fallback testing:** Breaks in Safari <18 or Firefox <133. Solution: Test in unsupported browser to verify graceful degradation (instant navigation, no errors).
- **Mixing Link and `<a>` tags:** Breaks View Transitions (only works with React Router's Link component). Solution: Always use `<Link>` from `react-router`.
- **Dynamic view-transition-name on every element:** Performance cost. Solution: Only name elements that should animate (e.g., hero image, page title), not every card in a grid.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table sorting/filtering/pagination logic | Custom useState + manual sort/filter functions | TanStack Table with `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel` | Edge cases: multi-column sorting, nested object accessors, server-side pagination state sync, column visibility, row selection (50+ gotchas) |
| Slide-over panel with focus trap | Custom overlay + useEffect focus management | Sheet component (already installed) | Radix Dialog handles focus trap, Escape key, click-outside-to-close, scroll locking, portal rendering, ARIA announcements |
| Page transition animations | framer-motion AnimatePresence + manual route change detection | React Router `viewTransition` prop + View Transitions API | Native browser API (0KB bundle), hardware-accelerated, auto-detects route changes, no layout shift issues |
| Filter pill dismissal logic | Manual state mutation + filter removal function | TanStack Table `setColumnFilters` with updater function | Handles filter state immutably, triggers table re-render, integrates with server-side filtering, supports complex filter types |
| Responsive table strategy | Custom breakpoint detection + conditional rendering | CSS `overflow-x: auto` + `position: sticky` + Tailwind breakpoints | Works without JS, better performance, no hydration mismatches, supports infinite columns |
| Pagination controls (first/prev/next/last) | Custom button handlers + page state | TanStack Table `table.previousPage()`, `table.nextPage()`, `table.setPageIndex()` | Handles edge cases (can't go before page 0, can't exceed pageCount), integrates with server-side pagination |

**Key insight:** TanStack Table is headless — it provides zero UI but handles all the complex state management, edge cases, and performance optimizations for tables. Building custom table logic is a 2-week rabbit hole (sorting nested objects, server-side pagination state sync, column resizing, row selection with Shift+click). Always use TanStack Table for any table with >3 features (sorting, filtering, pagination).

## Common Pitfalls

### Pitfall 1: Non-Memoized Columns/Data Causes Infinite Re-Render Loop
**What goes wrong:** Component defines `columns` inside the render function without `useMemo` → every render creates a new `columns` array reference → TanStack Table detects a change and re-renders → infinite loop.
**Why it happens:** TanStack Table uses strict reference equality to detect data/columns changes. Without stable references, it assumes data changed and re-renders.
**How to avoid:** Wrap `columns` in `useMemo` with empty dependency array `[]`. If `data` is derived (filtered/transformed), memoize it too.
**Warning signs:** Browser freezes, DevTools shows thousands of renders, React profiler shows constant re-renders of `useReactTable`.
**Example:**
```typescript
// ❌ WRONG: Columns redefined on every render
function RolesList() {
  const columns = [{ accessorKey: 'title', header: 'Title' }]; // NEW ARRAY EVERY RENDER
  return <DataTable columns={columns} data={data} />;
}

// ✅ CORRECT: Memoized columns
function RolesList() {
  const columns = useMemo(() => [
    { accessorKey: 'title', header: 'Title' }
  ], []); // Stable reference
  return <DataTable columns={columns} data={data} />;
}
```

### Pitfall 2: Server-Side Pagination Without `keepPreviousData`
**What goes wrong:** User clicks "Next page" → table shows loading spinner → previous page data disappears → flicker/jump to loading state → new data loads.
**Why it happens:** TanStack Query replaces `data` with `undefined` during refetch by default, causing table to show empty state or loading skeleton.
**How to avoid:** Add `keepPreviousData: true` to TanStack Query `useQuery` options. This keeps previous page visible while fetching next page.
**Warning signs:** Visible flash of loading state or empty table when changing pages, poor perceived performance, user sees content disappear and reappear.
**Example:**
```typescript
// ❌ WRONG: Data flashes on page change
const { data } = useQuery({
  queryKey: ['roles', pagination],
  queryFn: () => fetchRoles(pagination),
});
// data becomes undefined during refetch → table shows loading state

// ✅ CORRECT: Keep previous data during pagination
const { data } = useQuery({
  queryKey: ['roles', pagination],
  queryFn: () => fetchRoles(pagination),
  keepPreviousData: true, // Shows previous page while fetching next
});
```

### Pitfall 3: Mixing Client-Side Sorting with Server-Side Pagination
**What goes wrong:** User sorts by "Date" column → only the 10 visible rows sort → sorted data is incorrect because it doesn't include rows on other pages.
**Why it happens:** Client-side sorting only operates on the current page's data. Server-side pagination means only 10/100 rows are loaded, so sorting only affects those 10.
**How to avoid:** Use `manualSorting: true` in TanStack Table config and send sort state to server via API query params. Server returns sorted + paginated results.
**Warning signs:** Sorting works but results don't make sense (e.g., sorted by date but oldest item is on page 3, not page 1), pagination breaks after sorting.
**Example:**
```typescript
// ❌ WRONG: Client-side sort + server-side pagination
const table = useReactTable({
  data, // Only 10 rows from server
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(), // Sorts only these 10 rows
  manualPagination: true, // Server-side pagination
});

// ✅ CORRECT: Server-side sorting + pagination
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualSorting: true, // Server handles sorting
  manualPagination: true,
  onSortingChange: (updater) => {
    const newSort = typeof updater === 'function' ? updater(sorting) : updater;
    setSorting(newSort);
    // Refetch from server with sort params
  },
});
```

### Pitfall 4: Sheet Component Overflow on Mobile
**What goes wrong:** Slide-over panel opens on mobile with long content → content overflows viewport → user can't scroll to see all content → critical info (like "Submit" button at bottom) is inaccessible.
**Why it happens:** Sheet component uses `fixed` positioning with `inset-y-0 h-full`, but content inside isn't scrollable by default.
**How to avoid:** Add `overflow-y-auto` to `SheetContent` or wrap content in a scrollable container. Test on mobile with real content length.
**Warning signs:** Content cut off at bottom of slide-over, scroll doesn't work, CTA buttons not visible on mobile.
**Example:**
```typescript
// ❌ WRONG: Content overflows
<SheetContent>
  <SheetHeader>{/* ... */}</SheetHeader>
  <div className="py-4">
    {/* Long content here — if taller than viewport, it's cut off */}
  </div>
</SheetContent>

// ✅ CORRECT: Scrollable content
<SheetContent className="overflow-y-auto">
  <SheetHeader>{/* ... */}</SheetHeader>
  <div className="py-4">
    {/* Long content scrolls within SheetContent */}
  </div>
</SheetContent>
```

### Pitfall 5: View Transitions Break Scroll Restoration
**What goes wrong:** User scrolls down a long list, clicks a detail link with `viewTransition`, clicks back button → page scrolls to top instead of restoring previous scroll position.
**Why it happens:** View Transitions API can interfere with browser's default scroll restoration if the transition animation duration is long or the page structure changes.
**How to avoid:** Test back button navigation in all browsers. If scroll restoration breaks, reduce transition duration or use `useViewTransitionState` to only animate specific elements (not root).
**Warning signs:** Back button always scrolls to top, user loses scroll position after navigation, reported as UX regression from card-based layout.
**Example:**
```css
/* ❌ WRONG: Long transition duration breaks scroll restoration */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 1s; /* Too long */
}

/* ✅ CORRECT: Short transition preserves scroll restoration */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.2s; /* Quick enough to not interfere */
}
```

### Pitfall 6: Filter Dropdown Doesn't Close After Selection
**What goes wrong:** User opens filter dropdown, selects a status, dropdown stays open → user has to manually click outside to close it → annoying UX.
**Why it happens:** Radix Dropdown Menu doesn't auto-close on selection unless you use `DropdownMenuItem` with `onSelect` (not `onClick`).
**How to avoid:** Use `DropdownMenuItem` component with `onSelect` handler, not a custom button with `onClick`. Or manually close with `setOpen(false)`.
**Warning signs:** User reports dropdown "stuck open", multiple clicks needed to apply filter, inconsistent with other dropdowns in the app.
**Example:**
```typescript
// ❌ WRONG: Dropdown doesn't close
<DropdownMenu>
  <DropdownMenuTrigger>Filter by Status</DropdownMenuTrigger>
  <DropdownMenuContent>
    <button onClick={() => setStatusFilter('pending')}>Pending</button>
    {/* Clicking doesn't close dropdown */}
  </DropdownMenuContent>
</DropdownMenu>

// ✅ CORRECT: Dropdown closes after selection
<DropdownMenu>
  <DropdownMenuTrigger>Filter by Status</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onSelect={() => setStatusFilter('pending')}>
      Pending
    </DropdownMenuItem>
    {/* onSelect auto-closes dropdown */}
  </DropdownMenuContent>
</DropdownMenu>
```

### Pitfall 7: Sticky Header Z-Index Conflicts
**What goes wrong:** Table header uses `position: sticky` but dropdown menu or slide-over panel appears behind the header → menu is unclickable.
**Why it happens:** Default z-index on sticky header is lower than dropdown/dialog portals. Sticky headers need `z-10+` to appear above table content but below modals (`z-50`).
**How to avoid:** Set `z-10` on sticky header, ensure portaled components (Dialog, Dropdown) use higher z-index (`z-50`). Test with dropdown in first table row.
**Warning signs:** Dropdown menu appears behind table header, filter dropdown unclickable when table is scrolled, slide-over panel partially hidden.
**Example:**
```typescript
// ❌ WRONG: Sticky header without z-index
<TableHeader className="sticky top-0 bg-background">
  {/* Dropdowns appear behind when table scrolls */}
</TableHeader>

// ✅ CORRECT: Sticky header with z-index
<TableHeader className="sticky top-0 bg-background z-10">
  {/* Header above table body (z-0), below modals (z-50) */}
</TableHeader>
```

## Code Examples

Verified patterns from official sources:

### TanStack Table Server-Side Pagination Example
```typescript
// Source: TanStack Table docs + TanStack Query integration
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table';

function RolesList() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ['roles', pagination],
    queryFn: () => fetchRoles({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    }),
    keepPreviousData: true,
  });

  const columns = useMemo<ColumnDef<Role>[]>(() => [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'status', header: 'Status' },
  ], []);

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    pageCount: data?.totalPages ?? 0,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return <DataTable table={table} loading={isLoading} />;
}
```

### Sortable Column Header with Icon
```typescript
// Source: shadcn/ui data-table guide
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Column } from '@tanstack/react-table';

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>;
  title: string;
}) {
  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="-ml-3 h-8"
    >
      {title}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-2 h-3.5 w-3.5" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-2 h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
      )}
    </Button>
  );
}
```

### Filter Toolbar with Dropdown and Pills
```typescript
// Source: shadcn/ui data-table filtering example
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function DataTableToolbar({ table }) {
  const statusFilter = table.getColumn('status')?.getFilterValue();
  const hasFilters = !!statusFilter;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Filter by Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => table.getColumn('status')?.setFilterValue('pending')}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => table.getColumn('status')?.setFilterValue('active')}>
              Active
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasFilters && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 pr-1">
              Status: {statusFilter}
              <button
                onClick={() => table.getColumn('status')?.setFilterValue(undefined)}
                className="rounded-sm opacity-70 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()}>
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Pagination Controls with Page Size Selector
```typescript
// Source: TanStack Table pagination docs
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function DataTablePagination({ table }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page:</span>
        <Select
          value={String(table.getState().pagination.pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger className="h-8 w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### React Router View Transitions with Custom CSS
```typescript
// Source: React Router view transitions guide
import { Link, NavLink } from 'react-router';

// In your components:
<Link to="/roles/123" viewTransition>
  View Role
</Link>

<NavLink to="/dashboard" viewTransition>
  {({ isActive, isTransitioning }) => (
    <span className={cn(isActive && 'font-semibold')}>
      Dashboard
    </span>
  )}
</NavLink>

// In index.css:
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
  animation-timing-function: ease-in-out;
}

::view-transition-old(root) {
  animation-name: fade-out;
}

::view-transition-new(root) {
  animation-name: fade-in;
}

@keyframes fade-out {
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
}

/* Disable animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none !important;
  }
}
```

### Slide-Over Role Quick View
```typescript
// Source: shadcn/ui Sheet component docs
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function RoleQuickView({ roleId, open, onOpenChange }) {
  const { data: role, isLoading } = useRole(roleId, { enabled: open });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:w-[600px]">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>{role?.title}</SheetTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant={statusBadgeVariant(role?.status)}>
                  {role?.status}
                </Badge>
                <Badge variant="outline">{role?.roleType}</Badge>
              </div>
            </SheetHeader>

            <div className="space-y-6 py-4">
              <section>
                <h3 className="text-sm font-medium text-muted-foreground">Fee Structure</h3>
                <p className="text-lg font-semibold mt-1">
                  {formatPayout(role)}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-medium text-muted-foreground">Requirements</h3>
                <p className="mt-1 text-sm whitespace-pre-wrap">{role?.requirements}</p>
              </section>

              <section>
                <h3 className="text-sm font-medium text-muted-foreground">Submission Stats</h3>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="rounded border bg-muted/30 p-2">
                    <div className="text-lg font-semibold">{role?.submissionsCount}</div>
                    <div className="text-xs text-muted-foreground">Submissions</div>
                  </div>
                  <div className="rounded border bg-muted/30 p-2">
                    <div className="text-lg font-semibold">{role?.shortlistedCount}</div>
                    <div className="text-xs text-muted-foreground">Shortlisted</div>
                  </div>
                  <div className="rounded border bg-muted/30 p-2">
                    <div className="text-lg font-semibold">{role?.hiredCount}</div>
                    <div className="text-xs text-muted-foreground">Hired</div>
                  </div>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 bg-background pt-4 pb-6 border-t mt-6">
              <Button asChild className="w-full">
                <Link to={`/r/roles/${roleId}`} viewTransition>
                  View Full Details
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Card-based lists with manual tabs | DataTable with server-side pagination/filtering/sorting | 2024-2026 | More data visible per screen, faster sorting/filtering, shareable URLs with query params, better UX for 100+ items |
| Full-page navigation for detail views | Slide-over panels (Sheet component) | 2024-2026 | Reduced navigation depth (1-2 clicks to info), preserved scroll position, faster perceived performance, less back-button navigation |
| Page-load instant jumps | View Transitions API | 2025-2026 (Baseline status Oct 2025) | Smooth cross-fade transitions, hardware-accelerated, native browser API (0KB bundle), better perceived performance |
| Loading spinners everywhere | Skeleton placeholders + `keepPreviousData` | 2024-2026 | No flash of empty state on pagination, content-shaped loading, better perceived performance |
| Custom table sorting/filtering logic | TanStack Table (headless) | 2023-2026 | Eliminates 2 weeks of edge case handling, battle-tested logic, 500K+ weekly downloads, scales to 10K rows |
| React Table v7 | TanStack Table v8 | 2022-2023 | Better TypeScript support, smaller bundle (15KB vs 25KB), improved performance, modern React patterns (hooks) |
| Material-UI DataGrid | TanStack Table + shadcn/ui | 2024-2026 | Full control over styling, lighter bundle (15KB vs 80KB), better Tailwind integration, no opinionated UI |

**Deprecated/outdated:**
- **React Table v7:** Renamed to TanStack Table v8 in 2022 — v7 still works but no longer maintained
- **Client-side pagination for 1000+ rows:** Performance degrades, use server-side pagination
- **Instant page navigation (no transitions):** Modern UX expects smooth transitions, View Transitions API is now Baseline (supported in all major browsers)
- **Full-page modals for contextual info:** Slide-over panels provide better UX (less disruptive, preserve context)
- **`unstable_viewTransition` in React Router:** Stabilized as `viewTransition` in React Router 7.10+

## Open Questions

1. **Should we use nuqs for URL state management?**
   - What we know: `nuqs` is a 3KB library that syncs filter/sort/pagination state to URL query params (`?status=pending&page=2`), enabling shareable filter URLs
   - What's unclear: Whether the team wants shareable filter URLs or if local state is sufficient
   - Recommendation: Start without `nuqs` — add it later if users request shareable filter URLs (common for admin tables, less common for user-facing lists)

2. **Should we implement column visibility toggles?**
   - What we know: TanStack Table supports column hiding with `onColumnVisibilityChange`, shadcn/ui data-table guide shows a "View" dropdown for toggling columns
   - What's unclear: Whether users need to customize which columns are visible (e.g., hide "Submissions" column if not relevant)
   - Recommendation: Defer to Wave 2 — implement core DataTable in Wave 1, add column visibility if user feedback requests it

3. **Should we use Vaul Drawer instead of Sheet for mobile?**
   - What we know: Vaul provides better mobile gestures (drag-to-close), used in Linear/Vercel. Sheet (Radix Dialog) already installed and working.
   - What's unclear: Whether the improved mobile UX justifies adding another dependency (8KB + API learning curve)
   - Recommendation: Use Sheet (already installed) for Wave 1. If mobile testing reveals poor UX (e.g., hard to close on touch), add Vaul in Wave 2.

4. **How many skeleton rows to show during table loading?**
   - What we know: Skeleton count should match expected data length to prevent CLS. Current card-based lists show 3 skeleton cards.
   - What's unclear: Whether to show 10 skeletons (matching default pageSize) or 5 (faster perceived load)
   - Recommendation: Show `pageSize` skeleton rows (10/25/50 based on current pagination state) to prevent layout shift when real data loads

5. **Should we implement row selection (checkboxes)?**
   - What we know: TanStack Table supports row selection with `enableRowSelection` and `onRowSelectionChange`. Useful for bulk actions (e.g., "Delete selected" in admin tables).
   - What's unclear: Whether any of the 7 list views need bulk actions
   - Recommendation: Not in Phase 7 scope — none of the requirements mention bulk actions. If admin requests "bulk approve payouts" later, add row selection in a future phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual testing + Lighthouse |
| Config file | N/A (no unit tests for table component) |
| Quick run command | N/A |
| Full suite command | `npm run build` (TypeScript + Vite build check) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FR-06 | DataTable pagination, sorting, filtering | Manual + Screenshot | Test at 375/768/1440px with 100+ rows | ❌ Wave 0 |
| FR-07 | Slide-over panels preserve scroll position | Manual + E2E | Open slide-over, scroll list, close, verify scroll | ❌ Wave 0 |
| FR-08 | 1-2 click info access | Manual | Count clicks from list to fee structure | ❌ Wave 0 |
| FR-17 | View Transitions cross-fade | Manual + Screenshot | Test in Chrome/Safari/Firefox, verify fallback | ❌ Wave 0 |
| FR-21 | Notification center slide-over | Manual | Test unread count, mark read, filters | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run build` (TypeScript + Vite build verification)
- **Per wave merge:** Manual testing in light/dark mode at 3 breakpoints (375/768/1440px) with real data
- **Phase gate:** Lighthouse audit (Performance >= 90), table sorting/filtering/pagination verified on all 7 list views

### Wave 0 Gaps
- [ ] **Manual test checklist** — DataTable functionality (sort/filter/paginate) on all 7 list views
- [ ] **Mobile table testing** — Horizontal scroll + sticky headers at 375px viewport
- [ ] **Slide-over testing** — Scroll position preservation, Escape-to-close, focus trap
- [ ] **View Transitions testing** — Cross-browser (Chrome/Safari/Firefox), fallback behavior, scroll restoration on back button
- [ ] **Performance testing** — Table render time with 1000 rows, infinite re-render check (memoization)

**Rationale:** Phase 7 focuses on data presentation and navigation UX. Manual testing + Lighthouse + TypeScript build verification provide sufficient coverage. If table performance becomes an issue (re-render loops, slow sorting), add React DevTools Profiler snapshots to verify memoization.

## Sources

### Primary (HIGH confidence)
- [TanStack Table Official Docs](https://tanstack.com/table/v8/docs/framework/react/examples/pagination) — Pagination, sorting, filtering examples
- [shadcn/ui Data Table Guide](https://ui.shadcn.com/docs/components/radix/data-table) — Reference implementation with TanStack Table
- [React Router View Transitions Guide](https://reactrouter.com/how-to/view-transitions) — `viewTransition` prop, `useViewTransitionState` hook, CSS customization
- [TanStack Table FAQ](https://tanstack.com/table/v8/docs/faq) — Memoization guidance, re-render loop prevention
- [TanStack Table Data Guide](https://tanstack.com/table/v8/docs/guide/data) — Stable references, data memoization

### Secondary (MEDIUM confidence)
- [Server-side Pagination with TanStack Table and React Query](https://medium.com/@aylo.srd/server-side-pagination-and-sorting-with-tanstack-table-and-react-bd493170125e) — Integration patterns
- [Filter UX Design Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering) — Filter pills, clear all, active filters best practices
- [View Transitions API Guide (2026)](https://webperfclinic.com/article/view-transitions-api-smooth-page-transitions-perceived-performance) — Browser support, fallback strategies
- [Responsive Table Design with Sticky Headers](https://www.taniarascia.com/horizontal-scroll-fixed-headers-table/) — Mobile table patterns, horizontal scroll
- [shadcn/ui Sheet Component](https://ui.shadcn.com/docs/components/radix/sheet) — Slide-over panel implementation

### Tertiary (LOW confidence — verify before implementation)
- [Material React Table Memoization Guide](https://www.material-react-table.com/docs/guides/memoization) — Built on TanStack Table, memoization patterns transferable
- [TanStack Table Re-render Issues](https://github.com/TanStack/table/issues/4614) — GitHub issue discussions, community workarounds
- [15 Filter UI Patterns That Actually Work in 2026](https://bricxlabs.com/blogs/universal-search-and-filters-ui) — Modern filter UX trends

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — TanStack Table is industry standard (500K+ weekly npm downloads), React Router 7 stabilized View Transitions API, Sheet component already installed and verified
- Architecture: HIGH — shadcn/ui data-table guide provides reference implementation, TanStack Table docs show server-side pagination patterns, existing TanStack Query integration simplifies state management
- Memoization: HIGH — TanStack Table FAQ explicitly documents re-render loop pitfall and `useMemo` solution, verified by community issues and official docs
- View Transitions: HIGH — React Router docs show stabilized API (`viewTransition` prop), MDN documents browser support (70-75% globally), graceful degradation verified
- Mobile table strategy: MEDIUM — Horizontal scroll + sticky headers is standard pattern, but optimal scroll hint UX (gradient vs. chevron) needs user testing
- Slide-over UX: MEDIUM — Sheet component verified in codebase, but scroll position preservation needs testing to confirm no edge cases

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30 days for stable patterns — TanStack Table v8, React Router 7, View Transitions API mature ecosystems)
