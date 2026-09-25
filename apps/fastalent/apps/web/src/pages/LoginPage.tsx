import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '@gigcruite/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLogin } from '@/features/auth/hooks';
import { authApi, type DevUser } from '@/features/auth/api';
import { invalidateByEvent } from '@/lib/cache-registry';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { extractErrorMessage } from '@/lib/error';

const LoginFormSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormValues = z.infer<typeof LoginFormSchema>;

const IS_DEV = import.meta.env.DEV;

export default function LoginPage() {
  const nav = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const navigateAfterLogin = (role: string) => {
    const fallback =
      role === UserRole.RECRUITER
        ? '/r/dashboard'
        : role === UserRole.COMPANY
          ? '/c/dashboard'
          : role === UserRole.ADMIN
            ? '/a/dashboard'
            : '/';
    const from = (location.state as { from?: string } | null)?.from;
    nav(from ?? fallback, { replace: true });
  };

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: (data) => navigateAfterLogin(data.user.role),
    });
  };

  const serverError = loginMutation.isError
    ? extractErrorMessage(loginMutation.error, 'Login failed')
    : null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign in to fastalent</CardTitle>
          <CardDescription>
            Welcome back — enter your credentials to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        to="/forgot-password"
                        viewTransition
                        className="text-xs text-muted-foreground underline underline-offset-4"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {serverError && (
                <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {serverError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link to="/register/recruiter" viewTransition className="underline underline-offset-4">
                  Create one
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>

      {IS_DEV && (
        <DevQuickLoginPanel onLogin={navigateAfterLogin} />
      )}
    </div>
  );
}

// ─── Dev-only quick-login panel ───────────────────────────────────────────────

function DevQuickLoginPanel({ onLogin }: { onLogin: (role: string) => void }) {
  const qc = useQueryClient();
  const storeLogin = useAuthStore((s) => s.login);
  const [busy, setBusy] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery<DevUser[]>({
    queryKey: ['dev', 'users'],
    queryFn: () => authApi.devUsers(),
    staleTime: Infinity,
  });

  const handleClick = async (user: DevUser) => {
    if (busy) return;
    setBusy(user.id);
    try {
      const data = await authApi.devLogin(user.id);
      storeLogin(data.user, data.accessToken);
      invalidateByEvent(qc, 'auth.login');
      onLogin(data.user.role);
    } catch {
      setBusy(null);
    }
  };

  const companies = users?.filter((u) => u.role === 'company') ?? [];
  const recruiters = users?.filter((u) => u.role === 'recruiter') ?? [];

  return (
    <Card className="border-dashed border-warning/50 bg-warning/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-warning">Dev Quick Login</CardTitle>
        <CardDescription className="text-xs">
          Click any user to sign in instantly (dev only — no password needed).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <p className="text-xs text-muted-foreground">Loading users...</p>
        )}

        {companies.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Companies
            </p>
            <div className="grid gap-1.5">
              {companies.map((u) => (
                <DevUserRow
                  key={u.id}
                  user={u}
                  busy={busy === u.id}
                  disabled={!!busy}
                  onClick={() => handleClick(u)}
                />
              ))}
            </div>
          </div>
        )}

        {recruiters.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recruiters
            </p>
            <div className="grid gap-1.5">
              {recruiters.map((u) => (
                <DevUserRow
                  key={u.id}
                  user={u}
                  busy={busy === u.id}
                  disabled={!!busy}
                  onClick={() => handleClick(u)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DevUserRow({
  user,
  busy,
  disabled,
  onClick,
}: {
  user: DevUser;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const isInactive = user.status !== 'active';
  const statusColor =
    user.status === 'active'
      ? 'success'
      : user.status === 'blocked'
        ? 'destructive'
        : ('secondary' as const);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isInactive}
      title={isInactive ? `Cannot sign in: account is ${user.status}` : undefined}
      className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <Badge variant={statusColor} className="text-[10px] shrink-0">
        {user.status}
      </Badge>
      {busy && (
        <span className="text-xs text-muted-foreground animate-pulse">Signing in...</span>
      )}
    </button>
  );
}
