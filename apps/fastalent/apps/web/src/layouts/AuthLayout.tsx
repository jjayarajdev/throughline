import { Link, Outlet } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

/**
 * AuthLayout
 * ----------
 * Centered card layout for all public auth/email flow pages
 * (/login, /register, /forgot-password, /reset-password, /verify-email).
 * Kept deliberately minimal — the pages themselves own the card content
 * via shadcn Card primitives.
 */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" viewTransition>
          <Logo size="md" asPlainText />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} fastalent</p>
      </footer>
    </div>
  );
}
