import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useResetPassword } from '@/features/auth/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { extractErrorMessage } from '@/lib/error';

/**
 * Reset-password flow — step 2 of 2.
 *
 * The reset token is pulled from the `?token=` query param (the server's
 * email-transport logs this link directly in dev). If the token is absent
 * we bail out with a clear message rather than silently submitting an
 * empty string.
 */
const FormSchema = z
  .object({
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .max(128)
      .refine((v) => /[A-Z]/.test(v), 'Must include an uppercase letter')
      .refine((v) => /[a-z]/.test(v), 'Must include a lowercase letter')
      .refine((v) => /[0-9]/.test(v), 'Must include a digit')
      .refine((v) => /[^A-Za-z0-9]/.test(v), 'Must include a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof FormSchema>;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const reset = useResetPassword();
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Missing reset token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            This page needs a <code>?token=…</code> query parameter from your reset email. Use
            the link from the email you received, or request a new one.
          </p>
          <Button asChild className="w-full">
            <Link to="/forgot-password" viewTransition>Request a new link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = (values: FormValues) => {
    reset.mutate({ token, password: values.password });
  };

  const serverError = reset.isError ? extractErrorMessage(reset.error, 'Reset failed') : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>Pick a strong password you haven&apos;t used before.</CardDescription>
      </CardHeader>
      <CardContent>
        {reset.isSuccess ? (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Your password has been reset. Please sign in with your new password.
            </p>
            <Button asChild className="w-full">
              <Link to="/login" viewTransition>Go to sign in</Link>
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormDescription>
                      At least 12 characters with upper, lower, digit, and symbol.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
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
              <Button type="submit" className="w-full" disabled={reset.isPending}>
                {reset.isPending ? 'Resetting…' : 'Reset password'}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
