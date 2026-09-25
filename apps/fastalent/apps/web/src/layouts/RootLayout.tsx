import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeToggle } from '@/components/ThemeToggle';

/**
 * RootLayout
 * ----------
 * Public marketing chrome: header with logo + sign-in/sign-up buttons
 * (or a "Go to dashboard" shortcut for authenticated visitors), and a
 * slim footer. Used for `/` and any future public marketing pages.
 */
export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const dashboardPath =
    user?.role === 'recruiter'
      ? '/r/dashboard'
      : user?.role === 'company'
        ? '/c/dashboard'
        : user?.role === 'admin'
          ? '/a/dashboard'
          : '/';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button asChild>
                <Link to={dashboardPath} viewTransition>Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login" viewTransition>Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/register/recruiter" viewTransition>Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} fastalent · Trust-first gig recruiting</p>
      </footer>
    </div>
  );
}
