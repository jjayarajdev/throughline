---
phase: 10-page-by-page-rollout-responsive-polish
plan: 02
subsystem: ui-conversion
tags: [design-system, wallet, admin, card, datatable, dialog]
dependency_graph:
  requires: [phase-06-component-library, phase-07-datatable]
  provides: [company-wallet-conversion, company-fund-conversion, admin-payouts-conversion, admin-settings-conversion]
  affects: [company-routes, admin-routes]
tech_stack:
  added: []
  patterns: [PageHeader-composable, StatCardV2-balance-cards, DataTable-manual-pagination, Dialog-reject-modal, Badge-status-mapping]
key_files:
  created: []
  modified:
    - apps/web/src/pages/company/CompanyWallet.tsx
    - apps/web/src/pages/company/CompanyFund.tsx
    - apps/web/src/pages/admin/AdminPayouts.tsx
    - apps/web/src/pages/admin/AdminSettings.tsx
decisions:
  - Badge variant mapping for payout statuses (StatusBadge is submission-specific)
  - Lock icon for Locked balance card (Wallet for Available and Total)
  - DataTable manual pagination for admin payout requests (server-side)
  - Table component for batch history (simple read-only list, not interactive)
metrics:
  duration_minutes: 8
  tasks_completed: 2
  files_modified: 4
  commits: 2
  completed_at: "2026-04-16T13:58:26Z"
---

# Phase 10 Plan 02: Company Financial + Admin Pages Summary

Convert 4 heavily unconverted pages (CompanyWallet, CompanyFund, AdminPayouts, AdminSettings) from legacy styling to design system components.

## Tasks Completed

### Task 1: Convert CompanyWallet and CompanyFund to design system
- **CompanyWallet**: Replaced local Card component with StatCardV2 for balance cards (Available/Locked/Total with Wallet/Lock icons), composable PageHeader, semantic tokens (text-success/text-destructive for transactions, hover:bg-accent, border-border, text-muted-foreground), EmptyState with action button, Button variant="link" for "View all"
- **CompanyFund**: PageHeader with description, Card + CardContent wrapper, Button variant toggle for preset amounts, Input with Label, rupee symbol prefix with text-muted-foreground
- **Removed**: All hardcoded emerald/amber/blue/gray colors from both files
- **Commit**: `a1e8421`

### Task 2: Convert AdminPayouts and AdminSettings to design system
- **AdminPayouts**: DataTable with ColumnDef for manual pagination (recruiterId truncated mono, amount right-aligned, Badge for status, date muted, conditional action buttons), Dialog for reject modal (replacing DIV-based modal), Select with Label for filter, Skeleton loading, EmptyState, Table for batch history
- **AdminSettings**: PageHeader with description, Card + CardContent per setting, Input + Label, Button with Save icon, Skeleton loading (3 cards), EmptyState, text-success for saved indicator
- **Removed**: All hardcoded purple/emerald/amber/red/blue/gray colors from both files
- **Badge mapping**: Payout statuses use Badge directly (StatusBadge is submission-specific)
- **Commit**: `a6ab11b`

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

**Automated:**
- ✅ TypeScript compilation passes (zero errors)
- ✅ Build succeeds (28s, chunks optimized)
- ✅ Zero hardcoded colors in all 4 files (grep check)
- ✅ Dialog imported from `@/components/ui/dialog` in AdminPayouts

**Manual (recommended):**
- Visual: CompanyWallet balance cards show StatCardV2 styling (gradient variant on Total)
- Visual: CompanyFund preset buttons toggle primary/outline variants
- Visual: AdminPayouts DataTable with manual pagination, Dialog reject modal
- Visual: AdminSettings Card-based settings list with Skeleton loading
- Functional: Dialog animations (framer-motion scale-in from Phase 9)

## Success Criteria Met

- ✅ CompanyWallet: StatCardV2 balance cards, semantic transaction list, EmptyState
- ✅ CompanyFund: Card + Button + Input, preset selection with Button variant toggle
- ✅ AdminPayouts: DataTable + Badge + Dialog reject modal + Skeleton loading
- ✅ AdminSettings: Card + Input + Button + Skeleton loading + Label
- ✅ Zero hardcoded colors across all 4 files
- ✅ TypeScript compilation passes
- ✅ Build succeeds

## Key Implementation Details

**PageHeader Pattern:**
- Composable structure: `<PageHeader><PageTitle /><PageActions /></PageHeader>`
- CompanyFund includes PageDescription

**StatCardV2 Icons:**
- Available: Wallet icon
- Locked: Lock icon (distinct from wallet)
- Total Balance: Wallet icon with gradient variant

**DataTable Manual Pagination:**
- AdminPayouts uses `pagination` and `onPaginationChange` props (not nested in `state`)
- Page state controlled externally via `page` state variable

**Badge vs StatusBadge:**
- StatusBadge expects SubmissionStatus enum
- Payout statuses use Badge directly with variant mapping

**Dialog Reject Modal:**
- Replaced DIV-based modal (fixed inset-0 bg-black/40) with proper Dialog component
- Controlled via `open={!!rejectId}` and `onOpenChange` handler
- DialogFooter with Cancel (outline) and Reject (destructive) buttons

## Files Modified

1. `apps/web/src/pages/company/CompanyWallet.tsx` - StatCardV2 balance, semantic transactions, EmptyState
2. `apps/web/src/pages/company/CompanyFund.tsx` - Card wrapper, Button presets, Input with Label
3. `apps/web/src/pages/admin/AdminPayouts.tsx` - DataTable, Dialog, Badge, Table for batches
4. `apps/web/src/pages/admin/AdminSettings.tsx` - Card settings list, Skeleton loading

## Next Steps

Plan 10-03 will convert the next batch of pages (likely recruiter or company detail pages) following the same pattern.

## Self-Check: PASSED

**Created files exist:** N/A (no new files created)

**Modified files exist:**
- ✅ FOUND: apps/web/src/pages/company/CompanyWallet.tsx
- ✅ FOUND: apps/web/src/pages/company/CompanyFund.tsx
- ✅ FOUND: apps/web/src/pages/admin/AdminPayouts.tsx
- ✅ FOUND: apps/web/src/pages/admin/AdminSettings.tsx

**Commits exist:**
- ✅ FOUND: a1e8421 (CompanyWallet + CompanyFund)
- ✅ FOUND: a6ab11b (AdminPayouts + AdminSettings)

All claims verified.
