---
phase: 07-data-tables-page-transitions
plan: 02
subsystem: frontend-ux
tags: [view-transitions, navigation, animation, accessibility]
dependency_graph:
  requires: [react-router-7.14.0, css-view-transitions-api]
  provides: [smooth-page-transitions, cross-fade-navigation]
  affects: [all-navigation-links, page-routing]
tech_stack:
  added: []
  patterns: [view-transition-prop, css-pseudo-elements, reduced-motion-override]
key_files:
  created: []
  modified:
    - apps/web/src/index.css
    - apps/web/src/components/layouts/AppShell.tsx
    - apps/web/src/components/layouts/Topbar.tsx
    - apps/web/src/components/custom/Breadcrumbs.tsx
    - apps/web/src/components/shared/Logo.tsx
    - apps/web/src/components/NotificationBell.tsx
    - apps/web/src/pages/HomePage.tsx
    - apps/web/src/pages/LoginPage.tsx
    - apps/web/src/pages/RegisterPage.tsx
    - apps/web/src/pages/ForgotPasswordPage.tsx
    - apps/web/src/pages/ResetPasswordPage.tsx
    - apps/web/src/pages/VerifyEmailPage.tsx
    - apps/web/src/pages/ForbiddenPage.tsx
    - apps/web/src/pages/NotFoundPage.tsx
    - apps/web/src/pages/company/RolesList.tsx
    - apps/web/src/pages/company/RoleDetail.tsx
    - apps/web/src/pages/company/CompanyWallet.tsx
    - apps/web/src/pages/recruiter/BrowseRoles.tsx
    - apps/web/src/pages/recruiter/MySubmissions.tsx
    - apps/web/src/pages/recruiter/RoleDetailPublic.tsx
    - apps/web/src/pages/recruiter/SubmissionDetail.tsx
    - apps/web/src/layouts/RootLayout.tsx
    - apps/web/src/layouts/AuthLayout.tsx
decisions:
  - Use 0.2s duration for View Transitions (short enough to not interfere with scroll restoration)
  - vt- prefix for keyframe names to avoid collision with existing shimmer animations
  - prefers-reduced-motion override at global level for accessibility
  - viewTransition prop on all Link/NavLink components (not programmatic navigate calls)
metrics:
  duration_minutes: 8
  tasks_completed: 2
  files_modified: 23
  commits: 2
  lines_changed: 71
completed_date: 2026-04-16
---

# Phase 7 Plan 2: View Transitions Summary

**One-liner:** Hardware-accelerated cross-fade View Transitions enabled on all 40+ Link/NavLink navigation elements with 0.2s CSS animation and reduced-motion accessibility override.

## What Was Built

### Task 1: View Transition CSS Rules
Added CSS pseudo-element rules to `index.css` for smooth cross-fade page transitions:
- `::view-transition-old(root)` and `::view-transition-new(root)` with 0.2s ease-in-out timing
- `vt-fade-out` and `vt-fade-in` keyframes for opacity animation
- `@media (prefers-reduced-motion: reduce)` override to disable animations for accessibility
- Rules placed after existing keyframes, before `@layer base` directive

### Task 2: viewTransition Prop Across All Navigation
Added `viewTransition` boolean prop to every `<Link>` and `<NavLink>` component in the application (40+ instances across 22 files):

**Layout Components (5 files):**
- AppShell.tsx: Sidebar NavLink items
- Topbar.tsx: Mobile menu NavLinks + profile dropdown Link
- Breadcrumbs.tsx: Breadcrumb segment Links
- Logo.tsx: Brand logo Link
- NotificationBell.tsx: "View all notifications" Link

**Auth Pages (5 files):**
- LoginPage: Register link, forgot password link
- RegisterPage: Login link
- ForgotPasswordPage: Login links (2 instances)
- ResetPasswordPage: Forgot password link, login link
- VerifyEmailPage: Login links (3 instances)

**Error Pages (2 files):**
- ForbiddenPage: Home link
- NotFoundPage: Home link

**Public Pages (3 files):**
- HomePage: Dashboard link, register link, login link
- RootLayout: Dashboard/login/register links (3 instances)
- AuthLayout: Logo home link

**Company Pages (3 files):**
- RolesList: "New role" links (2 instances), "View" role link
- RoleDetail: "Back to roles" links (2 instances), "Edit" link
- CompanyWallet: "Add Funds" link, "View all" transactions link

**Recruiter Pages (4 files):**
- BrowseRoles: "Details" link, "Submit" link
- MySubmissions: "Browse Roles" link, submission detail Links
- RoleDetailPublic: "Back to roles" links (2 instances), "Submit Candidate" link
- SubmissionDetail: "Back to submissions" links (2 instances)

## Verification

✅ **Build:** `npm run build` passes with zero errors
✅ **viewTransition count:** 40 instances confirmed via `grep -r "viewTransition" apps/web/src/ --include="*.tsx" | wc -l`
✅ **CSS rules present:** `::view-transition-old` and `::view-transition-new` confirmed in index.css
✅ **Reduced-motion override:** `@media (prefers-reduced-motion: reduce)` present with `animation: none !important`
✅ **No programmatic navigation modified:** Only JSX `<Link>` and `<NavLink>` components affected, no `useNavigate` calls touched

## Deviations from Plan

None — plan executed exactly as written.

## Key Implementation Details

1. **Duration choice:** 0.2s matches research recommendation (Pitfall #5: longer durations interfere with scroll restoration)
2. **Keyframe prefix:** `vt-` prefix used to avoid collision with existing `shimmer` and `fadeIn` keyframes
3. **Accessibility first:** Reduced-motion override uses `!important` to ensure it cannot be overridden by other styles
4. **Scope boundary:** Only Link/NavLink JSX elements modified; programmatic `navigate()` calls left unchanged (View Transitions API handles them automatically)
5. **Pattern consistency:** All Links using `asChild` pattern had `viewTransition` added to the `<Link>`, not the wrapping `<Button>`

## Requirements Satisfied

- **FR-17:** Hardware-accelerated page transitions ✅
  - View Transitions API enabled via `viewTransition` prop
  - Cross-fade animation defined at 0.2s
  - Graceful degradation in unsupported browsers (React Router handles fallback)
  - Accessibility: prefers-reduced-motion disables all transition animations

## Performance Impact

- **CSS overhead:** +31 lines of CSS (+0.5 KB gzipped)
- **Runtime overhead:** Zero — View Transitions API is browser-native, no JS polyfill
- **Build time:** No change (6.7s web build)
- **Bundle size:** No change (viewTransition is a boolean prop, no runtime cost)

## What Comes Next

Phase 7 Plan 3 (Wave 2): DataTable conversions for Admin/Company pages + RoleQuickView slide-over.

## Commits

| Commit  | Message                                                  | Files |
|---------|----------------------------------------------------------|-------|
| e479349 | feat(07-02): add View Transitions CSS rules             | 1     |
| be83013 | feat(07-02): add viewTransition prop to all Link/NavLink | 22    |

## Self-Check: PASSED

**Created files:** None (all modifications)

**Modified files verified:**
- ✅ apps/web/src/index.css (View Transition CSS rules present)
- ✅ All 22 component/page files (viewTransition prop added)

**Commits verified:**
```bash
git log --oneline --all | grep -E "e479349|be83013"
```
- ✅ e479349: View Transitions CSS rules
- ✅ be83013: viewTransition prop on all Link/NavLink
