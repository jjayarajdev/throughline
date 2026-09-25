import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { MatchResult } from '@gigcruite/types';
import { Building2, MapPin, IndianRupee, Brain, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import { toast } from '@/components/ui/sonner';
import { extractErrorMessage } from '@/lib/error';
import { useRolePublic } from '@/features/role/hooks';
import { useCreateSubmission } from '@/features/submission/hooks';
import { PageHeader, PageTitle, PageDescription } from '@/components/custom';
import CvUploadDropzone, {
  type UploadedCvMeta,
} from '@/components/CvUploadDropzone';
import { useMatchCheck } from '@/features/matching';
import { MatchScoreCard } from '@/components/custom/MatchScoreCard';
import { useFeatureFlags } from '@/features/feature-flags';

/**
 * SubmitCandidate — Phase 2 Wave 2.
 *
 * Two-step layout inside a single page:
 *   Step 1: upload CV (CvUploadDropzone)
 *   Step 2: candidate details form (unlocked once CV is uploaded)
 *
 * On success we navigate to /r/submissions with location.state so the
 * placeholder page can show a friendly "just submitted" banner.
 */

const SubmitFormSchema = z.object({
  candidateName: z
    .string()
    .trim()
    .min(2, 'Candidate name must be at least 2 characters')
    .max(255),
  candidateEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(255),
  candidatePhone: z
    .string()
    .trim()
    .min(8, 'Phone number is too short')
    .max(20, 'Phone number is too long'),
  expectedCtc: z
    .number({ invalid_type_error: 'Expected CTC is required' })
    .finite()
    .nonnegative('Expected CTC cannot be negative')
    .max(99_99_99_99.99),
  noticePeriodDays: z
    .number({ invalid_type_error: 'Notice period is required' })
    .int()
    .min(0, 'Notice period cannot be negative')
    .max(365, 'Max 365 days'),
  currentLocation: z.string().trim().max(255).optional(),
  currentCompany: z.string().trim().max(255).optional(),
  coverNote: z.string().trim().max(5000).optional(),
});

type SubmitFormValues = z.infer<typeof SubmitFormSchema>;

const DEFAULT_FORM: SubmitFormValues = {
  candidateName: '',
  candidateEmail: '',
  candidatePhone: '',
  expectedCtc: 0,
  noticePeriodDays: 30,
  currentLocation: '',
  currentCompany: '',
  coverNote: '',
};

export default function SubmitCandidate() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const [cvMeta, setCvMeta] = useState<UploadedCvMeta | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  const roleQuery = useRolePublic(roleId);
  const createSubmission = useCreateSubmission();
  const matchCheck = useMatchCheck(roleId);
  const flags = useFeatureFlags();

  const form = useForm<SubmitFormValues>({
    resolver: zodResolver(SubmitFormSchema),
    defaultValues: DEFAULT_FORM,
  });

  if (roleQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (roleQuery.isError || !roleQuery.data) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm font-medium">Role not found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This role may have closed or no longer accepts submissions.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/r/dashboard')}
          >
            Back to dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  const role = roleQuery.data;

  const onSubmit = (values: SubmitFormValues) => {
    if (!cvMeta || !roleId) {
      toast.error('Please upload a CV before submitting');
      return;
    }

    createSubmission.mutate(
      {
        roleId,
        candidateName: values.candidateName,
        candidateEmail: values.candidateEmail,
        candidatePhone: values.candidatePhone,
        s3Key: cvMeta.s3Key,
        cvOriginalFilename: cvMeta.filename,
        cvSizeBytes: cvMeta.sizeBytes,
        cvMimeType: cvMeta.mimeType,
        expectedCtc: values.expectedCtc,
        noticePeriodDays: values.noticePeriodDays,
        currentLocation: values.currentLocation || null,
        currentCompany: values.currentCompany || null,
        coverNote: values.coverNote || null,
        ...(matchResult ? {
          matchScore: matchResult.score,
          matchBreakdown: matchResult.breakdown,
          matchExplanation: matchResult.explanation,
        } : {}),
      },
      {
        onSuccess: (result) => {
          toast.success('Candidate submitted!');
          navigate('/r/submissions', {
            state: {
              submittedId: result.id,
              candidateName: values.candidateName,
              companyName: role.company.companyName,
            },
          });
        },
        onError: (err) => {
          toast.error(extractErrorMessage(err, 'Could not submit candidate'));
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageTitle>Submit a Candidate</PageTitle>
          <PageDescription>
            Upload the candidate's CV and fill in their details below.
          </PageDescription>
        </div>
      </PageHeader>

      {/* Role header card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            {role.company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={role.company.logoUrl}
                alt={role.company.companyName}
                className="h-12 w-12 rounded-md border object-contain"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
                <Building2
                  className="h-6 w-6 text-muted-foreground"
                  aria-hidden
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl">{role.title}</CardTitle>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium text-foreground">
                  {role.company.companyName}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {role.location}
                  {role.isRemote ? ' · Remote' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5" aria-hidden />
                  {formatLakhs(role.ctcMin)} – {formatLakhs(role.ctcMax)}
                </span>
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {role.slotsRemaining} slot{role.slotsRemaining === 1 ? '' : 's'} left
            </Badge>
          </div>
        </CardHeader>
        {role.skills.length > 0 ? (
          <CardContent className="flex flex-wrap gap-1.5 pt-0">
            {role.skills.map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </CardContent>
        ) : null}
      </Card>

      {/* Step 1: upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1 · Upload CV</CardTitle>
        </CardHeader>
        <CardContent>
          <CvUploadDropzone
            onUploaded={setCvMeta}
            disabled={createSubmission.isPending}
          />
        </CardContent>
      </Card>

      {/* Step 2: AI match check (optional, gated by matching_ai flag) */}
      {flags.matching_ai && cvMeta && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 2 · AI Match Check</CardTitle>
            <CardDescription>
              Check how well this resume matches the role before submitting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!matchResult && (
              <Button
                type="button"
                variant="outline"
                disabled={matchCheck.isPending}
                onClick={() => {
                  matchCheck.mutate(
                    {
                      cvS3Key: cvMeta.s3Key,
                      cvMimeType: cvMeta.mimeType,
                    },
                    {
                      onSuccess: (data) => setMatchResult(data),
                      onError: (err) =>
                        toast.error(extractErrorMessage(err, 'Match check failed')),
                    },
                  );
                }}
              >
                {matchCheck.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Analyzing resume…
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" aria-hidden />
                    Check Match Score
                  </>
                )}
              </Button>
            )}
            {matchResult && <MatchScoreCard result={matchResult} />}
          </CardContent>
        </Card>
      )}

      {/* Step 2/3: form (step number depends on matching_ai flag) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step {flags.matching_ai ? '3' : '2'} · Candidate details</CardTitle>
          <CardDescription>
            {cvMeta
              ? 'Fill in the candidate details to complete the submission.'
              : 'Upload a CV first to unlock this step.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              <fieldset
                disabled={!cvMeta || createSubmission.isPending}
                className="space-y-6"
              >
                <section className="space-y-4">
                  <FormField
                    control={form.control}
                    name="candidateName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="candidateEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="jane@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="candidatePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+91 9876543210"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Include country code, e.g. +91 9876543210
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <Separator />

                <section className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="expectedCtc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected CTC (₹ / year)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ''
                                    ? 0
                                    : Number(e.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="noticePeriodDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notice period (days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={365}
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ''
                                    ? 0
                                    : Number(e.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="currentLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current location (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Bengaluru" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currentCompany"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current company (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corp" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="coverNote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover note (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Why is this candidate a great fit?"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={createSubmission.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSubmission.isPending}>
                    {createSubmission.isPending
                      ? 'Submitting…'
                      : 'Submit candidate'}
                  </Button>
                </div>
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

/** "1200000.00" → "₹12.00 L". Simple, deterministic, no Intl dance. */
function formatLakhs(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return `₹${value}`;
  return `₹${(n / 100_000).toFixed(1)}L`;
}
