import { useMemo } from 'react';
import { BarChart3, Bot, LayoutDashboard, Users, Briefcase, ClipboardCheck, Globe, TrendingUp, CreditCard, Settings } from 'lucide-react';
import { UserRole } from '@gigcruite/types';
import { AppShell, type NavItem } from '@/components/layouts/AppShell';
import { AuthGuard, RoleGuard } from '@/components/guards';
import { useFeatureFlags, type FeatureFlags } from '@/features/feature-flags';

const NAV_ITEMS: NavItem[] = [
  { to: '/a/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/a/users', label: 'Users', icon: Users },
  { to: '/a/roles', label: 'Roles', icon: Briefcase },
  { to: '/a/review', label: 'Review Queue', icon: ClipboardCheck },
  { to: '/a/countries', label: 'Countries', icon: Globe },
  { to: '/a/earnings', label: 'Earnings', icon: TrendingUp },
  { to: '/a/payouts', label: 'Payouts', icon: CreditCard },
  { to: '/a/intelligence', label: 'Intelligence', icon: BarChart3 },
  { to: '/a/ai', label: 'AI Management', icon: Bot },
  { to: '/a/settings', label: 'Settings', icon: Settings },
];

const GATED_PATHS: Record<string, keyof FeatureFlags> = {
  '/a/intelligence': 'analytics_dashboards',
  '/a/ai': 'analytics_ai',
};

/**
 * AdminLayout — purple accent. Admin flags always resolve to true from
 * the API, so the filter is a no-op in practice but keeps the pattern
 * consistent across all layouts.
 */
export default function AdminLayout() {
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
      <RoleGuard allowedRoles={[UserRole.ADMIN]}>
        <AppShell accent="admin" navItems={visibleNav} roleLabel="Admin console" />
      </RoleGuard>
    </AuthGuard>
  );
}
