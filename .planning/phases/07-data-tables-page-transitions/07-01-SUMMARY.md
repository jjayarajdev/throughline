---
phase: 07
plan: 01
subsystem: ui-components
tags: [datatable, tanstack-table, pagination, sorting, filtering]
dependencies:
  requires: [phase-06]
  provides: [datatable-components]
  affects: []
tech_stack:
  added:
    - "@tanstack/react-table v8"
  patterns:
    - "Shadcn table primitives with semantic tokens"
    - "Generic DataTable with TanStack Table integration"
    - "Client-side and server-side pagination/sorting/filtering support"
    - "Native HTML select for pagination controls (not Radix UI)"
key_files:
  created:
    - apps/web/src/components/ui/table.tsx
    - apps/web/src/components/data-table/DataTable.tsx
    - apps/web/src/components/data-table/DataTablePagination.tsx
    - apps/web/src/components/data-table/DataTableColumnHeader.tsx
    - apps/web/src/components/data-table/DataTableToolbar.tsx
    - apps/web/src/components/data-table/DataTableFilterPills.tsx
    - apps/web/src/components/data-table/DataTableEmptyState.tsx
    - apps/web/src/components/data-table/index.ts
  modified: []
decisions:
  - "Used native HTML select in DataTablePagination (not Radix Select) to match project's existing Select component pattern"
  - "Implemented both client-side and server-side table modes with manual pagination/sorting/filtering flags"
  - "Mobile horizontal scroll hint gradient only visible on small screens (sm:hidden)"
  - "Sticky table header with z-10 for overlapping scroll behavior"
metrics:
  duration: 412 seconds (~7 minutes)
  tasks_completed: 2
  files_created: 8
  commits: 2
  completed_date: "2026-04-16"
---

# Phase 7 Plan 1: DataTable Component Library Summary

**One-liner:** TanStack Table v8 integration with 8 shadcn table primitives + 6 DataTable subcomponents for sortable/filterable/paginated list views

## Overview

Created the foundational DataTable component library that all 7 list views (admin users/companies, recruiter roles/submissions, company roles) will consume in Plans 03 and 04. This plan provides the infrastructure - shadcn table primitives styled with Deep Teal tokens, plus 6 specialized DataTable components that wrap TanStack Table with sort/filter/paginate capabilities.

## Task Completion Summary

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Install TanStack Table and create shadcn table.tsx primitives | ✅ Complete | a51d837 |
| 2 | Build DataTable component suite with pagination, sorting, filtering, filter pills, column header, and empty state | ✅ Complete | ccc3a27 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used native HTML select instead of non-existent Radix Select components**
- **Found during:** Task 2 - DataTablePagination implementation
- **Issue:** Plan specified using `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` imports from `@/components/ui/select`, but the project's Select component is a native HTML select wrapper (not Radix UI)
- **Fix:** Replaced Radix-style Select usage with native HTML select using `<Select><option></option></Select>` pattern with `value` and `onChange` props
- **Files modified:** apps/web/src/components/data-table/DataTablePagination.tsx
- **Commit:** ccc3a27 (included in task 2 commit)

**2. [Rule 1 - Bug] Removed unused React imports to fix TypeScript strict mode errors**
- **Found during:** Task 2 - build verification
- **Issue:** TypeScript strict mode flagged unused `import * as React from 'react'` in DataTableToolbar and DataTableFilterPills (TS6133 error)
- **Fix:** Removed unused React namespace imports since components don't use JSX pragma
- **Files modified:**
  - apps/web/src/components/data-table/DataTableToolbar.tsx
  - apps/web/src/components/data-table/DataTableFilterPills.tsx
- **Commit:** ccc3a27 (included in task 2 commit)

**3. [Rule 1 - Bug] Fixed unused variable in skeleton loading row map**
- **Found during:** Task 2 - build verification
- **Issue:** TypeScript flagged unused `column` variable in `columns.map((column, cellIndex) => ...)` during skeleton row rendering (TS6133 error)
- **Fix:** Changed to `columns.map((_, cellIndex) => ...)` since we only need the column count, not the column definition
- **Files modified:** apps/web/src/components/data-table/DataTable.tsx
- **Commit:** ccc3a27 (included in task 2 commit)

## Technical Implementation

### Component Architecture

**Table Primitives (table.tsx):**
- 8 React.forwardRef wrappers around native HTML table elements
- Semantic token styling (bg-muted, text-muted-foreground, border)
- Special handling for checkbox columns with `[&:has([role=checkbox])]:pr-0`
- Hover and selection states with `data-[state=selected]:bg-muted`

**DataTable Component:**
- Generic `<TData, TValue>` types propagated throughout
- `useReactTable` hook with `getCoreRowModel`
- Automatic mode detection via prop presence:
  - `pageCount` provided → `manualPagination: true` (server-side)
  - `onSortingChange` provided → `manualSorting: true`
  - `onColumnFiltersChange` provided → `manualFiltering: true`
- Three render states: loading (skeleton rows) | data rows | empty state
- Mobile scroll hint: 48px gradient on right edge, only visible `sm:hidden`
- Sticky header: `sticky top-0 bg-background z-10`

**Pagination Component:**
- Native HTML select for page size (10/25/50)
- Four navigation buttons: first/prev/next/last with disabled states
- Optional row count display: "{rowCount} total"
- Page indicator: "Page X of Y"

**Column Header Component:**
- Conditional sortability: plain text if `!column.getCanSort()`
- Button with arrow icons: `ArrowUp` (asc), `ArrowDown` (desc), `ArrowUpDown` (unsorted, opacity-50)
- Toggles sort direction via `column.toggleSorting(isSorted === 'asc')`

**Toolbar Component:**
- Optional search input with `Search` icon
- Filter dropdowns per filterable column (DropdownMenu from Radix)
- "Reset" button when filters active
- Integrates DataTableFilterPills below toolbar controls

**Filter Pills Component:**
- Reads `table.getState().columnFilters`
- Renders each active filter as dismissible Badge
- "Clear all" button when 2+ filters active

**Empty State Component:**
- Centered layout within TableRow/TableCell with full colSpan
- Configurable icon (default: `FileQuestion`), title, description, CTA
- Defaults: "No results found" / "Try adjusting your search or filters."

### Key Technical Decisions

1. **Native Select Pattern:** Followed project's existing Select component which wraps native `<select>` rather than Radix UI primitives. This maintains consistency and avoids adding Radix Select as a dependency.

2. **Manual Mode Flags:** DataTable automatically sets `manualPagination`, `manualSorting`, `manualFiltering` based on callback prop presence. This allows the same component to work for both client-side (no callbacks) and server-side (callbacks provided) scenarios.

3. **Loading Skeletons:** Renders `pageSize` skeleton rows (default 10) with Skeleton component in each cell. This provides visual feedback during async data fetches without layout shift.

4. **Mobile Scroll Hint:** Added 48px gradient `bg-gradient-to-l from-background` on right edge, visible only on mobile (`sm:hidden`). Indicates horizontal scrollability for wide tables on small screens.

5. **Barrel Export:** `data-table/index.ts` re-exports all 6 DataTable components plus table primitives for convenient single-import usage: `import { DataTable, DataTablePagination, Table, TableRow } from '@/components/data-table'`

## Verification Results

✅ **Build:** `npm run build` passes with zero TypeScript errors
✅ **Exports:** table.tsx exports 8 primitives, data-table/index.ts exports 6 components + primitives
✅ **Color Tokens:** No hardcoded colors (`#`, `rgb(`, `bg-gray-`, `text-gray-`) in any new file
✅ **Type Safety:** All components use strict TypeScript, generics properly propagated
✅ **Commits:** 2 atomic commits (task 1: table primitives + install, task 2: 6 DataTable components)

## Files Created

| Path | Purpose | Exports |
|------|---------|---------|
| `apps/web/src/components/ui/table.tsx` | Shadcn table primitives | Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption |
| `apps/web/src/components/data-table/DataTable.tsx` | Generic table wrapper with TanStack Table | DataTable |
| `apps/web/src/components/data-table/DataTablePagination.tsx` | Page size selector + navigation | DataTablePagination |
| `apps/web/src/components/data-table/DataTableColumnHeader.tsx` | Sortable column headers | DataTableColumnHeader |
| `apps/web/src/components/data-table/DataTableToolbar.tsx` | Search + filter controls | DataTableToolbar |
| `apps/web/src/components/data-table/DataTableFilterPills.tsx` | Active filter badges | DataTableFilterPills |
| `apps/web/src/components/data-table/DataTableEmptyState.tsx` | Empty table state | DataTableEmptyState |
| `apps/web/src/components/data-table/index.ts` | Barrel export | All of the above |

## Next Steps

**Immediate (Plan 07-03):** Convert admin list views (users, companies) to DataTable with RoleQuickView slide-over
**Immediate (Plan 07-04):** Convert recruiter list views (roles, submissions) to DataTable with SubmissionQuickView + NotificationBell slide-over

**Integration Pattern for Consumers:**

```typescript
import { DataTable, DataTableColumnHeader } from '@/components/data-table'

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
]

<DataTable
  columns={columns}
  data={users}
  pageCount={totalPages}
  pagination={{ pageIndex, pageSize }}
  onPaginationChange={setPagination}
  sorting={sorting}
  onSortingChange={setSorting}
  loading={isLoading}
  toolbar={<DataTableToolbar table={table} searchColumn="name" />}
/>
```

## Self-Check: PASSED

**Files Created:**
- ✅ FOUND: apps/web/src/components/ui/table.tsx
- ✅ FOUND: apps/web/src/components/data-table/DataTable.tsx
- ✅ FOUND: apps/web/src/components/data-table/DataTablePagination.tsx
- ✅ FOUND: apps/web/src/components/data-table/DataTableColumnHeader.tsx
- ✅ FOUND: apps/web/src/components/data-table/DataTableToolbar.tsx
- ✅ FOUND: apps/web/src/components/data-table/DataTableFilterPills.tsx
- ✅ FOUND: apps/web/src/components/data-table/DataTableEmptyState.tsx
- ✅ FOUND: apps/web/src/components/data-table/index.ts

**Commits:**
- ✅ FOUND: a51d837 (feat(07-01): install TanStack Table and create table primitives)
- ✅ FOUND: ccc3a27 (feat(07-01): create DataTable component suite with 6 subcomponents)

All artifacts verified on disk and in git history.
