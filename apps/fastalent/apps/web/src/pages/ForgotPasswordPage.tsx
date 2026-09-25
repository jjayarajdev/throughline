import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/features/auth/hooks';
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
import { extractErrorMessage } from '@/lib/error';

/**
 * Forgot-password flow — step 1 of 2.
 *
 * The server intentionally returns the same generic success response
 * whether or not the email exists. We mirror that here: on success we
 * display a neutral "check your inbox" message, never a confirmation
 * that the account was found.
 */
const FormSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
});
type FormValues = z.infer<typeof FormSchema>;

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values: FormValues) => forgot.mutate(values);

  const serverError = forgot.isError ? extractErrorMessage(forgot.error) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your account email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {forgot.isSuccess ? (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              If an account exists for <strong>{form.getValues('email')}</strong>, a password
              reset link has been sent. In development, the link is logged to the API console.
            </p>
            <Button asChild className="w-full">
              <Link to="/login" viewTransition>Back to sign in</Link>
            </Button>
          </div>
        ) : (
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
              {serverError && (
                <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {serverError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={forgot.isPending}>
                {forgot.isPending ? 'Sending…' : 'Send reset link'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remembered it?{' '}
                <Link to="/login" viewTransition className="underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
