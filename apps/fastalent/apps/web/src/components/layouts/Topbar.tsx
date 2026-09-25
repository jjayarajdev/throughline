import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/hooks';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Logo } from '@/components/shared/Logo';
import type { AppAccent, NavItem } from '@/components/layouts/AppShell';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Breadcrumbs } from '@/components/custom/Breadcrumbs';

interface TopbarProps {
  accent: AppAccent;
  navItems: NavItem[];
  roleLabel: string;
}

/**
 * Topbar
 * ------
 * Sits above the main content column. Holds:
 *   - Mobile nav trigger (hamburger → Dialog with NavLinks)
 *   - Profile page shortcut (desktop)
 *   - User menu: avatar, email, "Profile" link, "Log out"
 *
 * The profile shortcut path is derived from the accent colour because
 * each role has its own `/{r|c|a}/profile` route.
 */
export function Topbar({ accent, navItems, roleLabel }: TopbarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const nav = useNavigate();

  const profilePath =
    accent === 'recruiter' ? '/r/profile' : accent === 'employer' ? '/c/profile' : '/a/profile';

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => nav('/login', { replace: true }),
    });
  };

  const initials = getInitials(user?.email ?? '?');

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      {/* Left: mobile menu trigger + logo (mobile) / breadcrumbs (desktop) */}
      <div className="flex items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-left">
                <Logo size="sm" asPlainText />
                <p className="mt-1 text-[11px] font-normal uppercase tracking-wide text-muted-foreground">
                  {roleLabel}
                </p>
              </DialogTitle>
            </DialogHeader>
            <nav className="space-y-1">
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
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )
                    }
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </DialogContent>
        </Dialog>
        <div className="md:hidden">
          <Logo size="sm" />
        </div>
        <div className="hidden md:flex items-center">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right: notification bell + theme toggle + user menu */}
      <div className="flex items-center gap-2">
      <NotificationBell />
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full p-1 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Open user menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{user?.email}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={profilePath} viewTransition className="cursor-pointer">
              <UserIcon className="h-4 w-4" aria-hidden />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout} disabled={logout.isPending}>
            <LogOut className="h-4 w-4" aria-hidden />
            {logout.isPending ? 'Signing out…' : 'Log out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}

function getInitials(email: string): string {
  const local = email.split('@')[0] ?? '?';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
  }
  return (local.slice(0, 2) || '?').toUpperCase();
}
