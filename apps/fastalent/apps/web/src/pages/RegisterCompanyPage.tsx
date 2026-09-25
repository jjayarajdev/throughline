import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { CompanySize, UserRole } from '@gigcruite/types';
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

const COMPANY_SIZE_OPTIONS: { value: CompanySize; label: string }[] = [
  { value: CompanySize.SIZE_1_10, label: '1–10 employees' },
  { value: CompanySize.SIZE_11_50, label: '11–50 employees' },
  { value: CompanySize.SIZE_51_200, label: '51–200 employees' },
  { value: CompanySize.SIZE_201_500, label: '201–500 employees' },
  { value: CompanySize.SIZE_500_PLUS, label: '500+ employees' },
];

const PasswordPolicy = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128)
  .refine((v) => /[A-Z]/.test(v), 'Must include an uppercase letter')
  .refine((v) => /[a-z]/.test(v), 'Must include a lowercase letter')
  .refine((v) => /[0-9]/.test(v), 'Must include a digit')
  .refine((v) => /[^A-Za-z0-9]/.test(v), 'Must include a special character');

const CompanyFormSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: PasswordPolicy,
  companyName: z.string().trim().min(2, 'Company name is required').max(255),
  industry: z.string().trim().max(100, 'Industry too long').optional().or(z.literal('')),
  companySize: z.union([z.nativeEnum(CompanySize), z.literal('')]).optional(),
  contactPerson: z.string().trim().max(255, 'Contact name too long').optional().or(z.literal('')),
  contactPhone: z.string().trim().max(20, 'Phone number too long').optional().or(z.literal('')),
  country: z.string().trim().optional().or(z.literal('')),
  currency: z.string().trim().optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof CompanyFormSchema>;

export default function RegisterCompanyPage() {
  const nav = useNavigate();
  const register = useRegister();
  const { data: countries } = usePublicCountries();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(CompanyFormSchema),
    defaultValues: {
      email: '',
      password: '',
      companyName: '',
      industry: '',
      companySize: '',
      contactPerson: '',
      contactPhone: '',
      country: '',
      currency: '',
    },
  });

  const undefIfBlank = (v: string | undefined): string | undefined =>
    v && v.trim() !== '' ? v.trim() : undefined;

  const onSubmit = (values: CompanyFormValues) => {
    const payload: RegisterPayload = {
      role: 'company',
      email: values.email,
      password: values.password,
      companyName: values.companyName,
      ...(undefIfBlank(values.industry) ? { industry: undefIfBlank(values.industry) } : {}),
      ...(values.companySize ? { companySize: values.companySize as CompanySize } : {}),
      ...(undefIfBlank(values.contactPerson) ? { contactPerson: undefIfBlank(values.contactPerson) } : {}),
      ...(undefIfBlank(values.contactPhone) ? { contactPhone: undefIfBlank(values.contactPhone) } : {}),
      ...(undefIfBlank(values.country) ? { country: undefIfBlank(values.country) } : {}),
      ...(undefIfBlank(values.currency) ? { currency: undefIfBlank(values.currency) } : {}),
    };

    register.mutate(payload, {
      onSuccess: (data) => {
        const dest = data.user.role === UserRole.COMPANY ? '/c/dashboard' : '/';
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
        <CardTitle>Register your company</CardTitle>
        <CardDescription>
          Post gigs and hire through vetted recruiters on fastalent.
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
                    <Input type="email" autoComplete="email" placeholder="you@company.com" {...field} />
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
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input autoComplete="organization" placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Software, Fintech, Healthcare" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companySize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company size (optional)</FormLabel>
                  <FormControl>
                    <Select {...field} value={field.value ?? ''}>
                      <option value="">Select…</option>
                      {COMPANY_SIZE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary contact (optional)</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" placeholder="Jane Doe" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact phone (optional)</FormLabel>
                    <FormControl>
                      <Input type="tel" autoComplete="tel" placeholder="+91 98765 43210" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
              Looking to recruit?{' '}
              <Link to="/register/recruiter" viewTransition className="underline underline-offset-4">
                Register as a recruiter
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
