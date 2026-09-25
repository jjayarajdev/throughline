import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, ShieldCheck } from 'lucide-react';
import type { UpdateRecruiterProfileInput } from '@gigcruite/types';
import { useRecruiterProfile, useUpdateBankDetails, useUpdateRecruiterProfile } from '@/features/recruiter/hooks';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';
import { extractErrorMessage } from '@/lib/error';
import { PageHeader, PageTitle, PageDescription } from '@/components/custom';
import { Select } from '@/components/ui/select';
import { useActiveCountries } from '@/hooks/useActiveCountries';

/**
 * RecruiterProfile
 * ----------------
 * Two cards:
 *   1. Profile details — editable basic/marketing fields (non-PII).
 *   2. Bank details — PII, separate endpoint, must be submitted as a
 *      complete unit. If the profile already has bank details we show
 *      the masked view + an "Update" button that reveals the edit form;
 *      this nudges users to only touch these fields intentionally.
 *
 * Both forms hydrate from the query via `reset()` inside a `useEffect`
 * so server state drives defaults. Success toasts fire from mutation
 * callbacks.
 */

// -------------------- profile schema --------------------

const ProfileFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(255),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  bio: z.string().trim().max(2000).optional().or(z.literal('')),
  linkedinUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || /^https?:\/\//.test(v),
      'Must start with http:// or https://',
    ),
  yearsOfExperience: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^\d+$/.test(v), 'Must be a whole number')
    .refine((v) => !v || Number(v) <= 80, 'That seems unreasonably high'),
  specializations: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal('')),
  country: z.string().trim().optional().or(z.literal('')),
  currency: z.string().trim().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

// -------------------- bank schema --------------------

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const BankFormSchema = z.object({
  pan: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(z.string().regex(PAN_REGEX, 'Invalid PAN (AAAAA9999A)')),
  bankAccount: z
    .string()
    .trim()
    .regex(/^[0-9]{6,18}$/, 'Bank account must be 6–18 digits'),
  bankIfsc: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(z.string().regex(IFSC_REGEX, 'Invalid IFSC (AAAA0NNNNNN)')),
  bankAccountHolderName: z
    .string()
    .trim()
    .min(2, 'Holder name is required')
    .max(255),
});

type BankFormValues = z.infer<typeof BankFormSchema>;

// -------------------- page --------------------

export default function RecruiterProfile() {
  const profile = useRecruiterProfile();

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageTitle>Your Profile</PageTitle>
          <PageDescription>
            Keep your details current so companies can find you and payouts land in the right account.
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
        <>
          <ProfileDetailsCard
            initial={{
              fullName: profile.data.fullName,
              phone: profile.data.phone ?? '',
              bio: profile.data.bio ?? '',
              linkedinUrl: profile.data.linkedinUrl ?? '',
              yearsOfExperience:
                profile.data.yearsOfExperience !== null
                  ? String(profile.data.yearsOfExperience)
                  : '',
              specializations: profile.data.specializations.join(', '),
              country: profile.data.country ?? '',
              currency: profile.data.currency ?? '',
            }}
          />
          <BankDetailsCard
            hasBankDetails={profile.data.hasBankDetails}
            panMasked={profile.data.panMasked}
            bankAccountMasked={profile.data.bankAccountMasked}
            bankIfsc={profile.data.bankIfsc}
            bankAccountHolderName={profile.data.bankAccountHolderName}
          />
        </>
      ) : null}
    </div>
  );
}

// -------------------- profile card --------------------

function ProfileDetailsCard({ initial }: { initial: ProfileFormValues }) {
  const update = useUpdateRecruiterProfile();
  const { data: countries } = useActiveCountries();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
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
    initial.fullName,
    initial.phone,
    initial.bio,
    initial.linkedinUrl,
    initial.yearsOfExperience,
    initial.specializations,
    initial.country,
    initial.currency,
  ]);

  const onSubmit = (values: ProfileFormValues) => {
    const payload: UpdateRecruiterProfileInput = {
      fullName: values.fullName,
      phone: values.phone?.trim() ? values.phone.trim() : null,
      bio: values.bio?.trim() ? values.bio.trim() : null,
      linkedinUrl: values.linkedinUrl?.trim() ? values.linkedinUrl.trim() : null,
      yearsOfExperience:
        values.yearsOfExperience && values.yearsOfExperience.trim()
          ? Number(values.yearsOfExperience)
          : null,
      specializations: values.specializations
        ? values.specializations
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : [],
      country: values.country?.trim() ? values.country.trim() : undefined,
      currency: values.currency?.trim() ? values.currency.trim() : undefined,
    };

    update.mutate(payload, {
      onSuccess: () => {
        toast.success('Profile updated');
      },
      onError: (err) => {
        toast.error(extractErrorMessage(err, 'Could not update profile'));
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile details</CardTitle>
        <CardDescription>
          Your public-facing recruiter information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" autoComplete="tel" placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yearsOfExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of experience</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={80}
                        placeholder="5"
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
              name="linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      autoComplete="url"
                      placeholder="https://linkedin.com/in/…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specializations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specializations</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Backend, DevOps, React"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Comma-separated list of roles or technologies you recruit for.
                  </FormDescription>
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

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="A short paragraph about your recruiting focus and track record."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

// -------------------- bank card --------------------

interface BankCardProps {
  hasBankDetails: boolean;
  panMasked: string | null;
  bankAccountMasked: string | null;
  bankIfsc: string | null;
  bankAccountHolderName: string | null;
}

function BankDetailsCard(props: BankCardProps) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateBankDetails();

  const form = useForm<BankFormValues>({
    resolver: zodResolver(BankFormSchema),
    defaultValues: {
      pan: '',
      bankAccount: '',
      bankIfsc: '',
      bankAccountHolderName: props.bankAccountHolderName ?? '',
    },
  });

  const onSubmit = (values: BankFormValues) => {
    update.mutate(values, {
      onSuccess: () => {
        toast.success('Bank details updated');
        form.reset({
          pan: '',
          bankAccount: '',
          bankIfsc: '',
          bankAccountHolderName: '',
        });
        setEditing(false);
      },
      onError: (err) => {
        toast.error(extractErrorMessage(err, 'Could not update bank details'));
      },
    });
  };

  const showForm = editing || !props.hasBankDetails;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" aria-hidden />
              Bank details
            </CardTitle>
            <CardDescription>
              Used for payouts after successful placements. Stored encrypted
              and never shown in full after you save them.
            </CardDescription>
          </div>
          {props.hasBankDetails && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Update
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {props.hasBankDetails && !editing ? (
          <MaskedBankDetails
            pan={props.panMasked}
            bankAccount={props.bankAccountMasked}
            ifsc={props.bankIfsc}
            holder={props.bankAccountHolderName}
          />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="pan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABCDE1234F"
                        autoComplete="off"
                        maxLength={10}
                        className="uppercase"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankAccountHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account holder name</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" placeholder="As per bank records" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bankAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account number</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="1234567890"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankIfsc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          maxLength={11}
                          className="uppercase"
                          placeholder="HDFC0001234"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                <span>
                  PAN and account number are encrypted with AES-256-GCM. Only
                  the last few characters are ever shown after saving.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {showForm && props.hasBankDetails && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditing(false);
                      form.reset();
                    }}
                    disabled={update.isPending}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending ? 'Saving…' : 'Save bank details'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

function MaskedBankDetails({
  pan,
  bankAccount,
  ifsc,
  holder,
}: {
  pan: string | null;
  bankAccount: string | null;
  ifsc: string | null;
  holder: string | null;
}) {
  return (
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <Field label="Account holder" value={holder ?? '—'} />
      <Field label="PAN" value={pan ?? '—'} mono />
      <Field label="Account number" value={bankAccount ?? '—'} mono />
      <Field label="IFSC" value={ifsc ?? '—'} mono />
    </dl>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono text-foreground' : 'text-foreground'}>{value}</dd>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Separator />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
