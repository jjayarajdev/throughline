---
phase: 07-data-tables-page-transitions
plan: 04
subsystem: Recruiter UI (BrowseRoles, MySubmissions) + Notifications
tags: [datatable, slide-over, sheet, notifications, ui-conversion]
one_liner: "Converted recruiter list views to DataTable with SubmissionQuickView slide-over and redesigned NotificationBell as Sheet-based panel"

dependency_graph:
  requires: [07-01-datatable-library]
  provides: [recruiter-table-views, submission-quick-view, notification-slide-over]
  affects: [BrowseRoles, MySubmissions, NotificationBell, Notifications]

tech_stack:
  added: []
  patterns: [sheet-slide-over, client-side-table-pagination, infinite-query-flattening]

key_files:
  created:
    - apps/web/src/components/slide-overs/SubmissionQuickView.tsx
  modified:
    - apps/web/src/pages/recruiter/BrowseRoles.tsx
    - apps/web/src/pages/recruiter/MySubmissions.tsx
    - apps/web/src/components/NotificationBell.tsx
    - apps/web/src/pages/shared/Notifications.tsx
    - apps/web/src/components/data-table/DataTable.tsx

decisions:
  - what: "DataTable client-side row models added automatically"
    why: "DataTable component didn't include getSortedRowModel/getFilteredRowModel/getPaginationRowModel for client-side mode"
    impact: "All client-side DataTable usage now gets automatic sorting/filtering/pagination without manual row model imports"
    alternatives: "Could have required consumers to pass row models explicitly, but that's more boilerplate"

  - what: "BrowseRoles uses flattened infinite query with Load More button"
    why: "API only supports cursor-based pagination (NFR-03: no backend changes), infinite query already exists"
    impact: "DataTable shows all loaded pages with client-side pagination, Load More button fetches next batch"
    alternatives: "Could have converted to server-side pagination but that requires API changes (out of scope)"

  - what: "NotificationBell unread badge uses bg-destructive instead of bg-red-500"
    why: "Semantic token for urgent indicators, matches design system palette"
    impact: "Badge color respects theme (light/dark) automatically"

metrics:
  duration_minutes: 8
  completed_at: "2026-04-16T09:44:09Z"
  commits: 1
  files_created: 1
  files_modified: 5
  lines_added: 612
  lines_removed: 378
---

# Phase 7 Plan 4: Recruiter Tables + Notification Slide-Over Summary

**Objective:** Convert recruiter list views (BrowseRoles, MySubmissions) to DataTable, add SubmissionQuickView slide-over, and redesign NotificationBell as a Sheet-based slide-over panel.

**Result:** ✅ Complete — 2 recruiter pages converted to DataTable, SubmissionQuickView slide-over created, NotificationBell redesigned with Sheet.

## Work Completed

### Task 1: BrowseRoles, MySubmissions, SubmissionQuickView ✅

**SubmissionQuickView.tsx** (new component):
- Sheet-based slide-over panel with 500px width on desktop
- Props: `submissionId`, `open`, `onOpenChange` (controlled)
- Fetches submission detail via `useSubmission` hook when open
- Skeleton loading state while fetching
- Content sections:
  - Header: candidate name + StatusBadge
  - Role info: title, company name
  - Candidate details: expected CTC, notice period, location, current company, submission date
  - CV info: filename, file size
  - Status history timeline (if `statusEvents` available)
- Sticky footer with "View Full Details" button linking to `/r/submissions/:id`

**MySubmissions.tsx** (converted to DataTable):
- Replaced button-based status filter tabs with Select dropdown
- Memoized columns: Candidate (clickable → opens SubmissionQuickView), Status (StatusBadge), Role (title + company), Expected CTC, Submitted Date (sortable)
- Client-side pagination (25 rows/page), sorting, filtering
- Empty state: "No submissions yet" with "Browse Roles" CTA
- Post-submit success banner preserved at top
- Quick view slide-over state: `quickViewId` with `SubmissionQuickView` component

**BrowseRoles.tsx** (converted to DataTable):
- Replaced card grid + infinite scroll with DataTable
- Infinite query pages flattened: `allRoles = data?.pages.flatMap(p => p.items)`
- Client-side pagination on loaded data (no API changes per NFR-03)
- Memoized columns: Title (clickable Link), Company (name + industry), Location (MapPin icon + Remote badge), Type (Regular/Headhunting badge), CTC Range, Payout, Skills (first 3 + count), Slots, Actions (Details + Submit buttons)
- Filter toolbar: Type Select, Status Select, Remote checkbox
- Search input with 300ms debounce
- **Load More button** below table if `hasNextPage` (replaces infinite scroll sentinel)
- Removed IntersectionObserver code entirely

**DataTable.tsx** (deviation — auto-fix):
- Added `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel` imports
- Automatically provides row models when in client-side mode (when `pageCount` is undefined)
- Logic: `!isManualPagination ? getPaginationRowModel() : undefined`
- **Impact:** All client-side DataTable usage now gets automatic sorting/filtering/pagination

### Task 2: NotificationBell + Notifications.tsx ✅

**NotificationBell.tsx** (redesigned):
- Replaced custom dropdown (position: absolute + manual click-outside listener) with Sheet component
- Sheet structure:
  - `SheetTrigger`: Bell button with unread badge (bg-destructive, not bg-red-500)
  - `SheetContent`: 400px wide on desktop, p-0 for full control
  - `SheetHeader`: Title + Mark all read button (if unreadCount > 0)
  - Tab bar: All / Unread with active border-primary indicator
  - Notification list: unread dot (bg-primary), title, body (line-clamp-2), relative timestamp
  - Sticky footer: "View all notifications" link
- Tab filtering: local state `tab: 'all' | 'unread'`, filters `notifications` array
- Skeleton loading: 3 skeleton rows while `isPending`
- Sheet handles focus trap, Escape-to-close, overlay backdrop automatically
- **Removed:** manual `useRef` + `useEffect` click-outside listener, position: absolute dropdown

**Notifications.tsx** (full page — minor updates):
- Added Skeleton import
- Replaced "Loading..." text with 5 skeleton rows in bordered container
- Replaced `bg-blue-500` unread dot with `bg-primary` (semantic token)
- Tab buttons already use design tokens (no changes needed)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Feature] DataTable missing client-side row models**
- **Found during:** Task 1, when converting MySubmissions
- **Issue:** DataTable component only provided `getCoreRowModel()`. Client-side pagination/sorting/filtering requires `getSortedRowModel()`, `getFilteredRowModel()`, `getPaginationRowModel()`.
- **Fix:** Added imports and conditional logic to provide row models automatically when not in manual mode (`manualPagination: pageCount !== undefined`).
- **Files modified:** `apps/web/src/components/data-table/DataTable.tsx`
- **Commit:** Part of Task 1 commit (single atomic change)

## Verification

✅ Build passes with zero errors
✅ `grep -r "IntersectionObserver" apps/web/src/pages/recruiter/BrowseRoles.tsx` returns 0 matches (infinite scroll removed)
✅ `grep -r "bg-blue-500" apps/web/src/components/NotificationBell.tsx` returns 0 matches (replaced with bg-primary)
✅ `apps/web/src/components/slide-overs/SubmissionQuickView.tsx` exists and exports `SubmissionQuickView`
✅ NotificationBell.tsx imports from `@/components/ui/sheet`
✅ BrowseRoles.tsx and MySubmissions.tsx import from `@/components/data-table`

## Requirements Satisfied

- **FR-06** (List screens use DataTable): BrowseRoles and MySubmissions now use DataTable with sort/filter/paginate ✅
- **FR-07** (Slide-overs for minimal-click access): SubmissionQuickView opens from MySubmissions table row clicks ✅
- **FR-21** (Notification center as slide-over): NotificationBell is now Sheet-based with All/Unread tabs, mark-all-read, relative timestamps ✅

## Testing Notes

**Manual testing required:**
- Click a submission row in MySubmissions → SubmissionQuickView should slide in from right
- Click bell icon → NotificationBell Sheet should slide in with All/Unread tabs
- Switch tabs in NotificationBell → unread count badge should appear on Unread tab
- Mark all read → unread count badge should disappear
- BrowseRoles Load More button → should fetch next page of roles and add to table
- DataTable client-side sorting on any sortable column → should sort in-memory
- DataTable client-side filtering via toolbar → should filter in-memory

## Context for Next Plans

- **Plan 07-03** was already completed (AdminUsers, AdminRoles, AdminEarnings, RolesList, CompanyTransactions, RoleQuickView)
- **Phase 7** is now complete (all 4 plans done: 07-01 DataTable library, 07-02 View Transitions, 07-03 Admin/Company tables, 07-04 Recruiter tables + Notifications)
- **Next phase:** Phase 8 (Dashboard Visualization with Recharts)
- **Uncommitted work:** `apps/web/src/pages/admin/AdminUsers.tsx` has modifications from 07-03 that weren't committed in the previous session. This is out of scope for 07-04 but should be addressed before Phase 8.

## Self-Check

**Created files:**
```bash
$ [ -f "apps/web/src/components/slide-overs/SubmissionQuickView.tsx" ] && echo "FOUND"
FOUND
```

**Modified files exist:**
```bash
$ [ -f "apps/web/src/pages/recruiter/BrowseRoles.tsx" ] && echo "FOUND"
FOUND
$ [ -f "apps/web/src/pages/recruiter/MySubmissions.tsx" ] && echo "FOUND"
FOUND
$ [ -f "apps/web/src/components/NotificationBell.tsx" ] && echo "FOUND"
FOUND
```

**Commit exists:**
```bash
$ git log --oneline | grep "07-04"
56b6e0a feat(07-04): redesign NotificationBell as Sheet-based slide-over panel
```

## Self-Check: PASSED ✅

All files created/modified as planned. Commit 56b6e0a exists on branch main.
