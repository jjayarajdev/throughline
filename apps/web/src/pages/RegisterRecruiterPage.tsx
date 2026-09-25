import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '@gigcruite/types';
import { useRegister, usePublicCountries } from '@/features/auth/hooks';
import type { RegisterPayload } from '@/features/auth/api';
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
import { Select } from '@/components/ui/select';
import { extractErrorMessage } from '@/lib/error';

const PasswordPolicy = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128)
  .refine((v) => /[A-Z]/.test(v), 'Must include an uppercase letter')
  .refine((v) => /[a-z]/.test(v), 'Must include a lowercase letter')
  .refine((v) => /[0-9]/.test(v), 'Must include a digit')
  .refine((v) => /[^A-Za-z0-9]/.test(v), 'Must include a special character');

const RecruiterFormSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: PasswordPolicy,
  fullName: z.string().trim().min(2, 'Full name is required').max(255),
  phone: z.string().trim().max(20, 'Phone number too long').optional().or(z.literal('')),
  country: z.string().trim().optional().or(z.literal('')),
  currency: z.string().trim().optional().or(z.literal('')),
});

type RecruiterFormValues = z.infer<typeof RecruiterFormSchema>;

export default function RegisterRecruiterPage() {
  const nav = useNavigate();
  const register = useRegister();
  const { data: countries } = usePublicCountries();

  const form = useForm<RecruiterFormValues>({
    resolver: zodResolver(RecruiterFormSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      phone: '',
      country: '',
      currency: '',
    },
  });

  const undefIfBlank = (v: string | undefined): string | undefined =>
    v && v.trim() !== '' ? v.trim() : undefined;

  const onSubmit = (values: RecruiterFormValues) => {
    const payload: RegisterPayload = {
      role: 'recruiter',
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      ...(undefIfBlank(values.phone) ? { phone: undefIfBlank(values.phone) } : {}),
      ...(undefIfBlank(values.country) ? { country: undefIfBlank(values.country) } : {}),
      ...(undefIfBlank(values.currency) ? { currency: undefIfBlank(values.currency) } : {}),
    };

    register.mutate(payload, {
      onSuccess: (data) => {
        const dest = data.user.role === UserRole.RECRUITER ? '/r/dashboard' : '/';
        nav(dest, { replace: true });
      },
    });
  };

  const handleCountryChange = (countryCode: string) => {
    form.setValue('country', countryCode);
    const match = countries?.find((c) => c.countryCode === countryCode);
    if (match) {
      form.setValue('currency', match.currencyCode);
    }
  };

  const serverError = register.isError
    ? extractErrorMessage(register.error, 'Registration failed')
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a recruiter account</CardTitle>
        <CardDescription>
          Join fastalent to source talent and earn placement fees.
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
                    <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
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
                  <FormLabel>Password</FormLabel>
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
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" autoComplete="tel" placeholder="+91 98765 43210" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Select
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => handleCountryChange(e.target.value)}
                      >
                        <option value="">Select country…</option>
                        {countries?.map((c) => (
                          <option key={c.countryCode} value={c.countryCode}>
                            {c.countryName}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Select {...field} value={field.value ?? ''}>
                        <option value="">Auto from country</option>
                        {countries?.map((c) => (
                          <option key={c.currencyCode} value={c.currencyCode}>
                            {c.currencyCode} ({c.currencySymbol})
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {serverError && (
              <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={register.isPending}>
              {register.isPending ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Hiring for a company?{' '}
              <Link to="/register/company" viewTransition className="underline underline-offset-4">
                Register as a company
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" viewTransition className="underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
