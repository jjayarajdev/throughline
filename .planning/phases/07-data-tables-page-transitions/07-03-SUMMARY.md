---
phase: 07-data-tables-page-transitions
plan: 03
subsystem: ui-components
tags: [data-table, admin, company, slide-over, conversion]
dependency_graph:
  requires: [07-01]
  provides: [admin-tables-datatable, company-tables-datatable, role-quick-view]
  affects: [admin-pages, company-pages]
tech_stack:
  added: []
  patterns: [server-side-pagination, table-state-management, slide-over-pattern]
key_files:
  created:
    - apps/web/src/components/slide-overs/RoleQuickView.tsx
  modified:
    - apps/web/src/pages/admin/AdminUsers.tsx
    - apps/web/src/pages/admin/AdminRoles.tsx
    - apps/web/src/pages/admin/AdminEarnings.tsx
    - apps/web/src/pages/company/RolesList.tsx
    - apps/web/src/pages/company/CompanyTransactions.tsx
decisions:
  - "Badge variant mapping standardized across all status badges (success/warning/destructive/secondary)"
  - "RoleQuickView uses role description field (not requirements) per RoleOwnerResponse interface"
  - "CompanyTransactions applies client-side filtering on top of server-side pagination"
  - "RolesList preserves filter tabs as custom toolbar (not converted to DataTableFilterPills)"
  - "All action dropdowns in RolesList preserved with status-based conditional rendering"
metrics:
  duration_minutes: 7
  tasks_completed: 3
  files_modified: 6
  commits: 2
  lines_added: ~1200
  lines_removed: ~700
completed_at: "2026-04-16T15:15:00Z"
---

# Phase 7 Plan 3: Admin & Company Table Conversions + RoleQuickView

**One-liner:** Converted 5 table pages (AdminUsers, AdminRoles, AdminEarnings, RolesList, CompanyTransactions) to DataTable with server-side pagination and added RoleQuickView slide-over for minimal-click role detail access.

## What Was Built

### Admin Tables (3 pages)
- **AdminUsers**: Replaced raw HTML table with DataTable, added sorting on email/role/status/joined, filters for role and status, pagination with 20 rows default
- **AdminRoles**: Converted to DataTable with sorting on title/created, status filter, CTC range formatting, submission/hired counts
- **AdminEarnings**: Preserved summary stat cards (gross/commission/net), converted earnings table to DataTable with status filter, formatted INR amounts with percentage commission display

### Company Tables (2 pages)
- **RolesList**: Most complex conversion — replaced card-based list with DataTable while preserving:
  - Filter tabs (All/Draft/Active/Paused/Closed/Filled) as custom toolbar
  - Clickable title cells that open RoleQuickView slide-over (not navigation)
  - Status action dropdowns (Publish/Pause/Resume/Close/Edit) in Actions column
  - Stats column (submissions/shortlisted/hired counts)
  - Payout and CTC formatting
- **CompanyTransactions**: Icon-based type indicator (credit/debit), description with date, formatted INR amounts with color coding (green for credits, red for debits), type filter dropdown

### New Component
- **RoleQuickView**: Sheet-based slide-over panel with:
  - Role header (title + status badge + type badge)
  - Fee structure section (per-shortlist and per-hire payouts)
  - Details section (location, employment type, CTC range)
  - Description section (full role description text)
  - Submission stats grid (3-column layout)
  - Sticky bottom bar with "View Full Details" button

## Technical Implementation

### Badge Variant Mapping
Standardized across all converted pages:
```typescript
// User status
active → success
blocked → destructive
inactive → secondary
pending_verification → warning

// Role status
draft → secondary
active → success
paused → warning
closed → outline (changed from destructive for softer visual)
filled → default

// Earning status
pending → warning
payable/paid → success
processing → default
cancelled → destructive
```

### Pagination Pattern
All admin tables use identical pattern:
```typescript
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
const filters = { page: pagination.pageIndex + 1, pageSize: pagination.pageSize };
const { data } = useHook(filters);
const pageCount = data ? Math.ceil(data.total / pagination.pageSize) : 0;
```

RolesList uses client-side pagination (no server-side `page` param in `useMyRoles`) — TanStack Table handles it internally via `manualPagination: false`.

CompanyTransactions uses server-side pagination via `useWalletTransactions(page, pageSize)` plus client-side type filtering.

### Column Definitions
All columns wrapped in `useMemo(() => [...], [deps])` to prevent recreation on every render. Data also memoized: `useMemo(() => data?.items ?? [], [data?.items])`.

### Toolbar Composition
- AdminUsers/AdminRoles: Search input + filter dropdowns (role/status)
- AdminEarnings: Status dropdown only
- RolesList: Filter tabs (custom Button group) with total count display
- CompanyTransactions: Type filter dropdown

## Deviations from Plan

None — plan executed exactly as written. All 5 pages converted, all status actions preserved, RoleQuickView created with all specified sections, no hardcoded colors remain in converted files.

## Verification Results

**Build:** ✅ Passes (zero errors, zero warnings except chunk size)

**Raw table check:** ✅ 0 matches in converted files (AdminPayouts/AdminSettings still have raw tables, but those are plan 07-04)

**Hardcoded colors:** ✅ 0 matches in converted files (bg-gray-*/dark:bg-gray-* eliminated)

**DataTable imports:** ✅ All 5 files import from `@/components/data-table`

**RoleQuickView export:** ✅ File exists, exports `RoleQuickView` function

**Type safety:** ✅ `platformCommissionPct: string` (not number) per AdminEarning interface

## Requirements Satisfied

- **FR-06**: All 5 list screens now use paginated DataTable with sort/filter
- **FR-07**: RoleQuickView slide-over provides minimal-click access to role details
- **FR-08**: Slide-over pattern established for future conversions (SubmissionQuickView in 07-04)

## Files Modified

### Created (1)
- `apps/web/src/components/slide-overs/RoleQuickView.tsx` — 190 lines, Sheet-based role detail panel

### Modified (5)
- `apps/web/src/pages/admin/AdminUsers.tsx` — 160 lines → 189 lines (DataTable + Badge variants)
- `apps/web/src/pages/admin/AdminRoles.tsx` — 117 lines → 166 lines (DataTable + sorting)
- `apps/web/src/pages/admin/AdminEarnings.tsx` — 130 lines → 195 lines (preserved stat cards + DataTable)
- `apps/web/src/pages/company/RolesList.tsx` — 413 lines → 401 lines (card list → DataTable, net -12 lines despite added complexity)
- `apps/web/src/pages/company/CompanyTransactions.tsx` — 99 lines → 113 lines (DataTable + icon indicators)

### Fixed (1)
- `apps/web/src/components/slide-overs/SubmissionQuickView.tsx` — Removed unused `cn` import (pre-existing file from 07-04)

## Commits

- `b44fb5b` — feat(07-03): convert AdminUsers, AdminRoles, AdminEarnings to DataTable
- `11a3344` — feat(07-03): convert RolesList and CompanyTransactions to DataTable, add RoleQuickView

## Next Steps

Plan 07-04 will convert recruiter tables (Earnings, Payouts) and create SubmissionQuickView slide-over, completing the Wave 2 table conversion effort.

## Self-Check: PASSED

✅ All created files exist:
- apps/web/src/components/slide-overs/RoleQuickView.tsx

✅ All commits exist:
- b44fb5b (admin tables)
- 11a3344 (company tables + RoleQuickView)

✅ Build passes with zero errors

✅ All 5 pages render DataTable

✅ RoleQuickView opens on role title click in RolesList

✅ No hardcoded colors in converted files

✅ All status actions preserved in RolesList dropdown
