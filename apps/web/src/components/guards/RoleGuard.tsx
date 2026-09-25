import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { UserRole } from '@gigcruite/types';
import { useAuthStore } from '@/stores/auth-store';

interface RoleGuardProps {
  allowedRoles: UserRole[] | readonly UserRole[];
  children: ReactNode;
  /**
   * Where to redirect a signed-in user with the wrong role. Defaults to
   * `/403`. Tests can override this with `/` to keep navigation flat.
   */
  fallback?: string;
}

/**
 * RoleGuard
 * ---------
 * Assumes `AuthGuard` has already run (i.e. the store has a user). If the
 * current user's role isn't in `allowedRoles`, redirects them to the
 * forbidden page rather than the login page — they're authenticated, just
 * not authorised for this slice of the app.
 *
 * Usage:
 *   <RoleGuard allowedRoles={['recruiter']}>
 *     <RecruiterDashboard />
 *   </RoleGuard>
 */
export function RoleGuard({
  allowedRoles,
  children,
  fallback = '/403',
}: RoleGuardProps): JSX.Element {
  const user = useAuthStore((s) => s.user);

  // Defensive: if someone forgets to wrap with AuthGuard first.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
