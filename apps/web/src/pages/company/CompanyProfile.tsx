import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CompanySize, type UpdateCompanyProfileInput } from '@gigcruite/types';
import { useCompanyProfile, useUpdateCompanyProfile } from '@/features/company/hooks';
import { useMyRoles } from '@/features/role/hooks';
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
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';
import { extractErrorMessage } from '@/lib/error';
import { PageHeader, PageTitle, PageDescription } from '@/components/custom';
import { useActiveCountries } from '@/hooks/useActiveCountries';

/**
 * CompanyProfile
 * --------------
 * Single-card editor for all company fields. Uses our native <Select>
 * for the CompanySize enum. GSTIN is validated client-side with the same
 * regex the server uses (source of truth lives in the API validator).
 * Successful mutations toast and let the cache registry refresh the
 * surrounding dashboard automatically.
 */

const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const CURRENT_YEAR = new Date().getFullYear();

const CompanyFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, 'Company name is required')
    .max(255),
  industry: z.string().trim().max(120).optional().or(z.literal('')),
  companySize: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || /^https?:\/\//.test(v),
      'Must start with http:// or https://',
    ),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  foundedYear: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^\d{4}$/.test(v), 'Must be a 4-digit year')
    .refine(
      (v) => !v || (Number(v) >= 1800 && Number(v) <= CURRENT_YEAR),
      'Year is out of range',
    ),
  headquarters: z.string().trim().max(255).optional().or(z.literal('')),
  contactPerson: z.string().trim().max(255).optional().or(z.literal('')),
  contactPhone: z.string().trim().max(20).optional().or(z.literal('')),
  gstNumber: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || GSTIN_REGEX.test(v),
      'Invalid GSTIN format',
    ),
  country: z.string().trim().optional().or(z.literal('')),
  currency: z.string().trim().optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof CompanyFormSchema>;

const COMPANY_SIZE_OPTIONS: { value: CompanySize; label: string }[] = [
  { value: CompanySize.SIZE_1_10, label: '1–10 employees' },
  { value: CompanySize.SIZE_11_50, label: '11–50 employees' },
  { value: CompanySize.SIZE_51_200, label: '51–200 employees' },
  { value: CompanySize.SIZE_201_500, label: '201–500 employees' },
  { value: CompanySize.SIZE_500_PLUS, label: '500+ employees' },
];

export default function CompanyProfile() {
  const profile = useCompanyProfile();

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageTitle>Company Profile</PageTitle>
          <PageDescription>
            Recruiters and candidates see this information on every gig you post.
          </PageDescription>
        </div>
      </PageHeader>

      {profile.isPending ? (
        <ProfileSkeleton />
      ) : profile.isError ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            {extractErrorMessage(profile.error, 'Could not load your profile')}
          </CardContent>
        </Card>
      ) : profile.data ? (
        <CompanyDetailsCard
          initial={{
            companyName: profile.data.companyName,
            industry: profile.data.industry ?? '',
            companySize: profile.data.companySize ?? '',
            website: profile.data.website ?? '',
            description: profile.data.description ?? '',
            foundedYear:
              profile.data.foundedYear !== null
                ? String(profile.data.foundedYear)
                : '',
            headquarters: profile.data.headquarters ?? '',
            contactPerson: profile.data.contactPerson ?? '',
            contactPhone: profile.data.contactPhone ?? '',
            gstNumber: profile.data.gstNumber ?? '',
            country: profile.data.country ?? '',
            currency: profile.data.currency ?? '',
          }}
        />
      ) : null}
    </div>
  );
}

function CompanyDetailsCard({ initial }: { initial: CompanyFormValues }) {
  const update = useUpdateCompanyProfile();
  const { data: countries } = useActiveCountries();
  const rolesQuery = useMyRoles({});
  const hasRoles = (rolesQuery.data?.total ?? 0) > 0;
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(CompanyFormSchema),
    defaultValues: initial,
  });

  const handleCountryChange = (countryCode: string) => {
    form.setValue('country', countryCode);
    const match = countries?.find((c) => c.countryCode === countryCode);
    if (match) {
      form.setValue('currency', match.currencyCode);
    }
  };

  useEffect(() => {
    form.reset(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initial.companyName,
    initial.industry,
    initial.companySize,
    initial.website,
    initial.description,
    initial.foundedYear,
    initial.headquarters,
    initial.contactPerson,
    initial.contactPhone,
    initial.gstNumber,
    initial.country,
    initial.currency,
  ]);

  const onSubmit = (values: CompanyFormValues) => {
    const payload: UpdateCompanyProfileInput = {
      companyName: values.companyName,
      industry: values.industry?.trim() ? values.industry.trim() : null,
      companySize: values.companySize
        ? (values.companySize as CompanySize)
        : null,
      website: values.website?.trim() ? values.website.trim() : null,
      description: values.description?.trim() ? values.description.trim() : null,
      foundedYear:
        values.foundedYear && values.foundedYear.trim()
          ? Number(values.foundedYear)
          : null,
      headquarters: values.headquarters?.trim() ? values.headquarters.trim() : null,
      contactPerson: values.contactPerson?.trim() ? values.contactPerson.trim() : null,
      contactPhone: values.contactPhone?.trim() ? values.contactPhone.trim() : null,
      gstNumber: values.gstNumber?.trim() ? values.gstNumber.trim() : null,
      country: values.country?.trim() ? values.country.trim() : undefined,
      currency: values.currency?.trim() ? values.currency.trim() : undefined,
    };

    update.mutate(payload, {
      onSuccess: () => {
        toast.success('Company profile updated');
      },
      onError: (err) => {
        toast.error(extractErrorMessage(err, 'Could not update profile'));
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company details</CardTitle>
        <CardDescription>
          Complete these to unlock gig posting and tax-compliant invoicing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* ---- Basics ---- */}
            <section className="space-y-4">
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

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="SaaS / Fintech / Healthcare" {...field} />
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
                      <FormLabel>Company size</FormLabel>
                      <FormControl>
                        <Select {...field}>
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
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          autoComplete="url"
                          placeholder="https://acme.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="foundedYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Founded</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1800}
                          max={CURRENT_YEAR}
                          placeholder="2015"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="headquarters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headquarters</FormLabel>
                    <FormControl>
                      <Input placeholder="Bengaluru, India" {...field} />
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
                          disabled={hasRoles}
                        >
                          <option value="">Select country…</option>
                          {countries?.map((c) => (
                            <option key={c.countryCode} value={c.countryCode}>
                              {c.countryName}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      {hasRoles && (
                        <FormDescription>
                          Cannot change after roles are created — existing roles and wallet use this country's currency.
                        </FormDescription>
                      )}
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
                        <Select {...field} value={field.value ?? ''} disabled={hasRoles}>
                          <option value="">Auto from country</option>
                          {countries?.map((c) => (
                            <option key={c.currencyCode} value={c.currencyCode}>
                              {c.currencyCode} ({c.currencySymbol})
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      {hasRoles && (
                        <FormDescription>
                          Locked to match your country setting.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About the company</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="What do you build? Who do you hire? What makes your team a great place to work?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <Separator />

            {/* ---- Contact ---- */}
            <section className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold">Hiring contact</h2>
                <p className="text-xs text-muted-foreground">
                  The person recruiters reach out to for clarification on your gigs.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact person</FormLabel>
                      <FormControl>
                        <Input autoComplete="name" placeholder="Jane Doe" {...field} />
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
                      <FormLabel>Contact phone</FormLabel>
                      <FormControl>
                        <Input type="tel" autoComplete="tel" placeholder="+91 98765 43210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator />

            {/* ---- Tax ---- */}
            <section className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold">Tax details</h2>
                <p className="text-xs text-muted-foreground">
                  Required for GST-compliant invoices against agency fees.
                </p>
              </div>
              <FormField
                control={form.control}
                name="gstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GSTIN</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="29ABCDE1234F1Z5"
                        maxLength={15}
                        className="uppercase font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      15-character GST Identification Number (India).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}
