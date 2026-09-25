---
phase: 10-page-by-page-rollout-responsive-polish
plan: 04
subsystem: ui-polish
tags: [cleanup, design-tokens, refactor]
dependencies:
  requires: [10-01, 10-02, 10-03]
  provides: [zero-hardcoded-colors]
  affects: [pages, components]
tech_stack:
  added: []
  patterns: [semantic-tokens, design-system-migration]
key_files:
  created: []
  modified:
    - apps/web/src/pages/recruiter/MySubmissions.tsx
    - apps/web/src/components/CvUploadDropzone.tsx
    - apps/web/src/components/JdUploadDropzone.tsx
    - apps/web/src/components/shared/StatCard.tsx
    - apps/web/src/components/InviteRecruiterDialog.tsx
    - apps/web/src/components/wallet/WithdrawalDialog.tsx
  deleted:
    - apps/web/src/components/wallet/WalletBalanceCard.tsx
    - apps/web/src/components/wallet/TransactionTable.tsx
    - apps/web/src/components/wallet/EarningStatusBadge.tsx
decisions:
  - slug: success-token-for-emerald
    summary: "Replace all emerald-* colors with text-success/bg-success semantic token"
    rationale: "Success states (file uploads, submission confirmations) should use semantic success token for theme consistency"
    impact: "All success UI states now respect theme palette and dark mode"
  - slug: warning-token-for-amber
    summary: "Replace amber-* alert colors with bg-warning/border-warning/text-warning tokens"
    rationale: "Warning messages (bank verification required) should use semantic warning token"
    impact: "Warning UI states integrate with design system palette"
  - slug: delete-legacy-wallet-components
    summary: "Delete WalletBalanceCard, TransactionTable, and EarningStatusBadge"
    rationale: "Components not imported anywhere after Plan 10-01 migration to StatCardV2 and DataTable"
    impact: "Removed 203 lines of dead code, cleaner codebase"
metrics:
  duration: 3
  tasks_completed: 1
  files_modified: 6
  files_deleted: 3
  completed_at: "2026-04-16T14:18:40Z"
---

# Phase 10 Plan 04: Codebase Cleanup & Color Audit Summary

**One-liner:** Eliminated all 50+ instances of hardcoded colors across pages and components, replaced with semantic design tokens, deleted 3 orphaned legacy wallet components (203 LOC removed).

## Overview

Systematic codebase-wide audit to ensure zero hardcoded color classes remain after the page-by-page conversion. Replaced all legacy Tailwind color classes (gray-*, blue-*, emerald-*, amber-*, red-*) with semantic design tokens. Deleted orphaned legacy wallet components that were replaced by design system equivalents in earlier plans.

**Scope:** All 35 pages + all custom components (excluding ui/ and charts/ primitives).

**Result:** Zero hardcoded colors, 3 legacy components deleted, build passes with zero errors.

## What Was Done

### Task 1: Codebase-wide hardcoded color audit and legacy component cleanup (f524383)

**Step 1: Audit pages directory**
- Ran comprehensive grep searches for all hardcoded color patterns
- Found 3 instances of `emerald-*` colors in MySubmissions.tsx success banner
- Replaced with `text-success`, `bg-success/5`, `border-success/30`

**Step 2: Audit components directory**
- Found 50+ instances across 6 components:
  - InviteRecruiterDialog.tsx: gray-* in dialog, borders, hover states
  - CvUploadDropzone.tsx: emerald-* in success state
  - JdUploadDropzone.tsx: emerald-* in success state
  - StatCard.tsx: emerald-*/red-* in trend indicators
  - WithdrawalDialog.tsx: gray-*, blue-*, amber-*, green-* throughout
- Replaced all with semantic tokens:
  - `bg-gray-50/100` → `bg-muted` or `bg-secondary`
  - `bg-gray-800/900` → `bg-card` or `bg-background`
  - `text-gray-400/500` → `text-muted-foreground`
  - `text-gray-700/800/900` → `text-foreground`
  - `border-gray-200/300/600/700` → `border-border`
  - `bg-blue-600` → `bg-primary`
  - `text-emerald-*/text-green-*` → `text-success`
  - `bg-emerald-*` → `bg-success`
  - `bg-amber-*/text-amber-*` → `bg-warning/text-warning/border-warning`
  - `text-red-*` → `text-destructive`

**Step 3: Delete orphaned legacy wallet components**
- Verified zero imports via `grep -rn "WalletBalanceCard\|TransactionTable\|EarningStatusBadge"`
- Deleted:
  - `WalletBalanceCard.tsx` (40 lines) — replaced by StatCardV2 in Plan 10-01
  - `TransactionTable.tsx` (94 lines) — replaced by DataTable in Plan 10-01
  - `EarningStatusBadge.tsx` (69 lines) — replaced by inline badge variant mapping in Plan 10-01
- Total removed: 203 lines of dead code

**Step 4: Build verification**
- `npx tsc --noEmit` — passed with zero errors
- `npm run build` — succeeded in 10.85s
- Chunk size warning (935.79 kB main bundle) — noted for NFR-01 tracking, acceptable for current scope

## Deviations from Plan

None. Plan executed exactly as written.

## Key Files Changed

| File | Change | Lines |
|------|--------|-------|
| `MySubmissions.tsx` | emerald → success tokens | 3 |
| `CvUploadDropzone.tsx` | emerald → success tokens | 3 |
| `JdUploadDropzone.tsx` | emerald → success tokens | 3 |
| `StatCard.tsx` | emerald/red → success/destructive | 2 |
| `InviteRecruiterDialog.tsx` | gray → semantic tokens | 8 |
| `WithdrawalDialog.tsx` | gray/blue/amber/green → semantic tokens | 15 |
| `WalletBalanceCard.tsx` | DELETED | -40 |
| `TransactionTable.tsx` | DELETED | -94 |
| `EarningStatusBadge.tsx` | DELETED | -69 |

## Verification Results

**Must-haves (5/5 passed):**

| # | Truth | Status |
|---|-------|--------|
| 1 | Codebase-wide grep for hardcoded colors in pages/ returns zero matches | ✅ PASS (0 matches) |
| 2 | Codebase-wide grep for hardcoded colors in components/ returns zero matches from non-third-party files | ✅ PASS (0 matches excluding ui/ and charts/) |
| 3 | npm run build succeeds with no TypeScript errors | ✅ PASS (built in 10.85s) |
| 4 | No legacy wallet components remain imported by any page | ✅ PASS (0 imports found) |
| 5 | All 35 page files use design system tokens exclusively | ✅ PASS (verified via grep) |

**Build output:**
- Zero TypeScript errors
- Build succeeded in 10.85s
- Main bundle: 935.79 kB (gzip: 273.93 kB) — chunk size warning noted for NFR-01

## Impact

**Immediate:**
- ✅ Zero hardcoded colors across entire codebase (pages + components)
- ✅ All UI states now respect theme palette and dark mode
- ✅ 203 lines of dead code removed
- ✅ Cleaner component directory structure

**Long-term:**
- Design system is now the single source of truth for colors
- Theme changes propagate automatically to all components
- Reduced risk of color inconsistencies in future development
- Easier onboarding for new developers (use semantic tokens, not Tailwind color scales)

## Notes

**Color replacement patterns applied:**
- Success states (file uploads, confirmations) → `text-success`, `bg-success/5`, `border-success/30`
- Warning states (alerts, notices) → `text-warning`, `bg-warning/5`, `border-warning/30`
- Neutral backgrounds → `bg-card`, `bg-muted`, `bg-secondary`
- Text → `text-foreground`, `text-muted-foreground`
- Borders → `border-border`, `border-input`
- Primary actions → `bg-primary`, `text-primary-foreground`
- Destructive states → `text-destructive`, `bg-destructive`

**Exceptions not changed (as per plan):**
- `components/ui/*` — shadcn primitives, managed by CSS vars
- `components/charts/*` — intentional chart palette using `var(--...)` tokens
- StatusBadge internal mapping — already uses semantic variants

**Legacy components deleted:**
All three wallet components were confirmed orphaned:
- RecruiterWallet page now uses StatCardV2 + DataTable (Plan 10-01)
- RecruiterEarnings page now uses StatusBadge for inline status display (Plan 10-01)
- No other pages imported these components

## Self-Check: PASSED

**Files verified to exist:**
```
✓ apps/web/src/pages/recruiter/MySubmissions.tsx (modified)
✓ apps/web/src/components/CvUploadDropzone.tsx (modified)
✓ apps/web/src/components/JdUploadDropzone.tsx (modified)
✓ apps/web/src/components/shared/StatCard.tsx (modified)
✓ apps/web/src/components/InviteRecruiterDialog.tsx (modified)
✓ apps/web/src/components/wallet/WithdrawalDialog.tsx (modified)
✗ apps/web/src/components/wallet/WalletBalanceCard.tsx (deleted as intended)
✗ apps/web/src/components/wallet/TransactionTable.tsx (deleted as intended)
✗ apps/web/src/components/wallet/EarningStatusBadge.tsx (deleted as intended)
```

**Commits verified:**
```
✓ f524383 (refactor(10-04): remove all hardcoded colors and delete orphaned legacy wallet components)
```

**Build verification:**
```
✓ TypeScript compilation passes (npx tsc --noEmit)
✓ Vite build succeeds (npm run build)
✓ Zero hardcoded colors in pages/ (grep -rn count: 0)
✓ Zero hardcoded colors in components/ excluding ui/charts/ (grep -rn count: 0)
```
