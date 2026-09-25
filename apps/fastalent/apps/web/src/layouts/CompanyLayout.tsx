import { useMemo } from 'react';
import { BarChart3, LayoutDashboard, Briefcase, Building2, PiggyBank, Wallet } from 'lucide-react';
import { UserRole } from '@gigcruite/types';
import { AppShell, type NavItem } from '@/components/layouts/AppShell';
import { AuthGuard, RoleGuard } from '@/components/guards';
import { useFeatureFlags, type FeatureFlags } from '@/features/feature-flags';

const NAV_ITEMS: NavItem[] = [
  { to: '/c/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/c/roles', label: 'Roles', icon: Briefcase },
  { to: '/c/wallet', label: 'Wallet', icon: Wallet },
  { to: '/c/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/c/savings', label: 'Savings', icon: PiggyBank },
  { to: '/c/profile', label: 'Company profile', icon: Building2 },
];

const GATED_PATHS: Record<string, keyof FeatureFlags> = {
  '/c/analytics': 'analytics_dashboards',
};

/**
 * CompanyLayout — emerald accent. Wraps AppShell with guards so every
 * `/c/*` child route is gated to authenticated company users.
 */
export default function CompanyLayout() {
  const flags = useFeatureFlags();
  const visibleNav = useMemo(
    () => NAV_ITEMS.filter((item) => {
      const flag = GATED_PATHS[item.to];
      return !flag || flags[flag];
    }),
    [flags],
  );

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={[UserRole.COMPANY]}>
        <AppShell accent="employer" navItems={visibleNav} roleLabel="Company workspace" />
      </RoleGuard>
    </AuthGuard>
  );
}
