import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  PayoutMode,
  PayoutType,
  RoleType,
  RoleVisibility,
} from '@gigcruite/types';
import { Button } from '@/components/ui/button';
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
import JdUploadDropzone from '@/components/JdUploadDropzone';
import {
  DEFAULT_ROLE_FORM,
  RoleFormSchema,
  type RoleFormValues,
} from './role-form-schema';

/**
 * RoleForm — shared multi-section editor used by RoleCreate + RoleEdit.
 * The parent decides what to do on submit (create vs. update). Disabled
 * state is owned by the parent too (edit disables when role is not in
 * draft/paused).
 */

export interface RoleFormProps {
  initial?: Partial<RoleFormValues>;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (values: RoleFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export default function RoleForm({
  initial,
  submitLabel,
  disabled,
  onSubmit,
  onCancel,
  isSubmitting,
}: RoleFormProps) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(RoleFormSchema),
    defaultValues: { ...DEFAULT_ROLE_FORM, ...initial },
  });

  const payoutType = form.watch('payoutType');
  const shortlistMode = form.watch('shortlistPayoutMode');
  const hireMode = form.watch('hirePayoutMode');

  const showShortlist =
    payoutType === PayoutType.PER_SHORTLIST || payoutType === PayoutType.HYBRID;
  const showHire =
    payoutType === PayoutType.PER_HIRE || payoutType === PayoutType.HYBRID;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        {/* Basics */}
        <section className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Senior Backend Engineer" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="roleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role type</FormLabel>
                  <FormControl>
                    <Select disabled={disabled} {...field}>
                      <option value={RoleType.REGULAR}>Regular</option>
                      <option value={RoleType.HEADHUNTING}>Headhunting</option>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Affects allowed percentage-payout ranges.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment type</FormLabel>
                  <FormControl>
                    <Select disabled={disabled} {...field}>
                      <option value="">Select type…</option>
                      {EMPLOYMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {EMPLOYMENT_TYPE_LABELS[t]}
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
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibility</FormLabel>
                <FormControl>
                  <Select disabled={disabled} {...field}>
                    <option value={RoleVisibility.OPEN}>Open (all recruiters)</option>
                    <option value={RoleVisibility.PREFERRED}>Preferred Network (placed before)</option>
                    <option value={RoleVisibility.INVITE_ONLY}>Invite Only</option>
                  </Select>
                </FormControl>
                <FormDescription>
                  Controls which recruiters can see and submit to this role.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={6} disabled={disabled} {...field} />
                </FormControl>
                <FormDescription>Minimum 30 characters.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Job Description (optional)</label>
            <JdUploadDropzone
              onUploaded={(meta) => {
                form.setValue('jdS3Key', meta.s3Key);
                form.setValue('jdOriginalFilename', meta.filename);
                form.setValue('jdSizeBytes', meta.sizeBytes);
                form.setValue('jdMimeType', meta.mimeType);
              }}
              existingFilename={form.getValues('jdOriginalFilename')}
              disabled={disabled}
            />
          </div>
        </section>

        <Separator />

        {/* Location / skills */}
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Bengaluru" disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isRemote"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Remote friendly</FormLabel>
                    <FormDescription className="text-xs">
                      Show to recruiters browsing remote roles.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={field.value}
                      disabled={disabled}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="skillsCsv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skills</FormLabel>
                <FormControl>
                  <Input
                    placeholder="TypeScript, Node.js, PostgreSQL"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Comma-separated. Max 25 skills.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="experienceMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min experience (years)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={50} disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="experienceMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max experience (years)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={50} disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <Separator />

        {/* Compensation */}
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="ctcMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min CTC (₹ / year)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ctcMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max CTC (₹ / year)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <Separator />

        {/* Payout */}
        <section className="space-y-4">
          <FormField
            control={form.control}
            name="payoutType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payout type</FormLabel>
                <FormControl>
                  <Select disabled={disabled} {...field}>
                    <option value={PayoutType.PER_SHORTLIST}>Per Shortlist</option>
                    <option value={PayoutType.PER_HIRE}>Per Hire</option>
                    <option value={PayoutType.HYBRID}>Hybrid (Shortlist + Hire)</option>
                  </Select>
                </FormControl>
                <FormDescription>
                  Determines how and when recruiters earn for this role.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {showShortlist ? (
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="shortlistPayoutMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shortlist payout mode</FormLabel>
                    <FormControl>
                      <Select
                        disabled={disabled}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                      >
                        <option value="">Select mode…</option>
                        <option value={PayoutMode.FLAT}>Flat amount</option>
                        <option value={PayoutMode.PERCENTAGE}>% of CTC</option>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shortlistPayoutValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {shortlistMode === PayoutMode.PERCENTAGE
                        ? 'Shortlist payout (%)'
                        : 'Shortlist payout (₹)'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={shortlistMode === PayoutMode.PERCENTAGE ? '0.1' : '0.01'}
                        placeholder={shortlistMode === PayoutMode.PERCENTAGE ? 'e.g. 0.5' : 'e.g. 2000'}
                        disabled={disabled}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      {shortlistMode === PayoutMode.PERCENTAGE
                        ? 'Percentage of max CTC per shortlisted candidate.'
                        : 'Fixed amount per shortlisted candidate.'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ) : null}
          {showHire ? (
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="hirePayoutMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hire payout mode</FormLabel>
                    <FormControl>
                      <Select
                        disabled={disabled}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                      >
                        <option value="">Select mode…</option>
                        <option value={PayoutMode.FLAT}>Flat amount</option>
                        <option value={PayoutMode.PERCENTAGE}>% of CTC</option>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hirePayoutValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {hireMode === PayoutMode.PERCENTAGE
                        ? 'Hire payout (%)'
                        : 'Hire payout (₹)'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={hireMode === PayoutMode.PERCENTAGE ? '0.1' : '0.01'}
                        placeholder={hireMode === PayoutMode.PERCENTAGE ? 'e.g. 8.33' : 'e.g. 60000'}
                        disabled={disabled}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      {hireMode === PayoutMode.PERCENTAGE
                        ? 'Percentage of accepted CTC per hired candidate.'
                        : 'Fixed amount per hired candidate.'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ) : null}
        </section>

        <Separator />

        {/* Caps */}
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="maxSubmissions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max submissions (per role)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={500} disabled={disabled} {...field} />
                  </FormControl>
                  <FormDescription>
                    Role auto-closes when this cap is reached.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxPerRecruiter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max per recruiter</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={100} disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="openPositions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Open positions</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={100} disabled={disabled} {...field} />
                  </FormControl>
                  <FormDescription>
                    How many hires this role needs. Auto-fills when all positions are filled.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <div className="flex items-center justify-end gap-2 pt-2">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={disabled || isSubmitting}>
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
