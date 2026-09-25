import { useMemo } from 'react';
import { BarChart3, FileText, LayoutDashboard, Search, User, Wallet, IndianRupee, ArrowDownToLine } from 'lucide-react';
import { UserRole } from '@gigcruite/types';
import { AppShell, type NavItem } from '@/components/layouts/AppShell';
import { AuthGuard, RoleGuard } from '@/components/guards';
import { useFeatureFlags, type FeatureFlags } from '@/features/feature-flags';

const NAV_ITEMS: NavItem[] = [
  { to: '/r/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/r/roles', label: 'Browse Roles', icon: Search },
  { to: '/r/submissions', label: 'My Submissions', icon: FileText },
  { to: '/r/wallet', label: 'Wallet', icon: Wallet },
  { to: '/r/earnings', label: 'Earnings', icon: IndianRupee },
  { to: '/r/payouts', label: 'Payouts', icon: ArrowDownToLine },
  { to: '/r/performance', label: 'Performance', icon: BarChart3 },
  { to: '/r/profile', label: 'Profile', icon: User },
];

const GATED_PATHS: Record<string, keyof FeatureFlags> = {
  '/r/performance': 'analytics_dashboards',
};

/**
 * RecruiterLayout — blue accent. Composes AuthGuard + RoleGuard around
 * the generic AppShell so every child route under `/r/*` is
 * automatically locked to authenticated recruiters.
 */
export default function RecruiterLayout() {
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
      <RoleGuard allowedRoles={[UserRole.RECRUITER]}>
        <AppShell accent="recruiter" navItems={visibleNav} roleLabel="Recruiter workspace" />
      </RoleGuard>
    </AuthGuard>
  );
}
