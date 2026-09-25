import { NavLink, Outlet, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/Logo';
import { Topbar } from '@/components/layouts/Topbar';

export type AppAccent = 'recruiter' | 'employer' | 'admin';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface AppShellProps {
  accent: AppAccent;
  navItems: NavItem[];
  /** Short role label shown beneath the logo (e.g. "Recruiter workspace"). */
  roleLabel: string;
}

/**
 * Accent colour mapping using role-token system from Phase 5.
 *
 * Tailwind can't see dynamically-constructed class names, so every colour
 * variant must appear as a literal string somewhere in the source. We
 * enumerate all variants here so the JIT picks them up.
 */
const accentStyles: Record<
  AppAccent,
  {
    active: string;
    hover: string;
    indicator: string;
    ring: string;
  }
> = {
  recruiter: {
    active: 'bg-role-recruiter-light text-role-recruiter dark:bg-role-recruiter/15 dark:text-role-recruiter',
    hover: 'hover:bg-role-recruiter-light hover:text-role-recruiter dark:hover:bg-role-recruiter/10 dark:hover:text-role-recruiter',
    indicator: 'bg-role-recruiter',
    ring: 'ring-role-recruiter/30',
  },
  employer: {
    active: 'bg-role-employer-light text-role-employer dark:bg-role-employer/15 dark:text-role-employer',
    hover: 'hover:bg-role-employer-light hover:text-role-employer dark:hover:bg-role-employer/10 dark:hover:text-role-employer',
    indicator: 'bg-role-employer',
    ring: 'ring-role-employer/30',
  },
  admin: {
    active: 'bg-role-admin-light text-role-admin dark:bg-role-admin/15 dark:text-role-admin',
    hover: 'hover:bg-role-admin-light hover:text-role-admin dark:hover:bg-role-admin/10 dark:hover:text-role-admin',
    indicator: 'bg-role-admin',
    ring: 'ring-role-admin/30',
  },
};

/**
 * AppShell
 * --------
 * Generic authenticated application shell: persistent sidebar on
 * md+ screens, topbar on all sizes, main content area renders the
 * matched child route via <Outlet />.
 *
 * Used by RecruiterLayout / CompanyLayout / AdminLayout. Each role
 * passes its accent colour, nav items, and role label; the shell
 * handles structure + theming.
 */
export function AppShell({ accent, navItems, roleLabel }: AppShellProps) {
  const styles = accentStyles[accent];
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — fixed on md+, hidden on mobile (topbar handles mobile nav). */}
      <aside
        className={cn(
          'hidden w-60 shrink-0 flex-col border-r bg-card md:flex',
          'ring-1 ring-inset',
          styles.ring,
        )}
      >
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex flex-col">
            <Logo size="sm" />
            <span className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              {roleLabel}
            </span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                viewTransition
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'text-muted-foreground',
                    styles.hover,
                    isActive && styles.active,
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'h-5 w-1 rounded-full transition-colors',
                        isActive ? styles.indicator : 'bg-transparent',
                      )}
                      aria-hidden
                    />
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main column — topbar + scrolling content area. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar accent={accent} navItems={navItems} roleLabel={roleLabel} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div
            key={location.pathname}
            className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
