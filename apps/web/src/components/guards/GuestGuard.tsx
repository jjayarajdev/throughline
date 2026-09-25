import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { UserRole } from '@gigcruite/types';
import { useAuthStore } from '@/stores/auth-store';

interface GuestGuardProps {
  children: ReactNode;
}

/**
 * GuestGuard
 * ----------
 * Prevents signed-in users from hitting public-only pages like `/login`
 * or `/register`. A logged-in recruiter who navigates back to `/login`
 * should land on their dashboard, not see the login form again.
 *
 * Wave 5 wires role-specific dashboards under `/r`, `/c`, `/a` so each
 * role now bounces to its dedicated workspace.
 */
export function GuestGuard({ children }: GuestGuardProps): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (isAuthenticated && user) {
    const dashboard = roleDashboard(user.role);
    return <Navigate to={dashboard} replace />;
  }

  return <>{children}</>;
}

function roleDashboard(role: UserRole): string {
  switch (role) {
    case UserRole.RECRUITER:
      return '/r/dashboard';
    case UserRole.COMPANY:
      return '/c/dashboard';
    case UserRole.ADMIN:
      return '/a/dashboard';
    default:
      return '/';
  }
}
