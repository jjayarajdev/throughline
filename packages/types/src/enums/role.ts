/**
 * Role-related enums.
 *
 * Values are lowercase and EXACTLY match the Prisma schema enum identifiers.
 * Phase 2 deliberately avoids `@map()` on enum VALUES (see the CompanySize
 * post-mortem in MEMORY.md) so plain `as Prisma<Enum>` casts are safe on
 * both read and write paths — no enum bridge needed.
 */

export enum RoleType {
  /** Standard placement — 6-9% agency fee when payoutType=percentage. */
  REGULAR = 'regular',
  /** Executive / specialized search — 15-20% agency fee when payoutType=percentage. */
  HEADHUNTING = 'headhunting',
}

export enum RoleStatus {
  /** Not visible to recruiters. Company can still edit freely. */
  DRAFT = 'draft',
  /** Company submitted for admin review. */
  SUBMITTED = 'submitted',
  /** Admin approved. Visible in public browse. Accepting submissions. */
  PUBLISHED = 'published',
  /** Admin rejected with comment. Company can edit and resubmit. */
  REJECTED = 'rejected',
  /** Hidden from browse. Existing submissions still move through the lifecycle. */
  PAUSED = 'paused',
  /** Manually closed by company. No new submissions. Existing submissions continue. */
  CLOSED = 'closed',
  /** Auto-set when per-role submission cap is hit or when a candidate has joined. */
  FILLED = 'filled',
}

export enum PayoutMode {
  /** Fixed currency amount per event. */
  FLAT = 'flat',
  /** Percentage of CTC per event. */
  PERCENTAGE = 'percentage',
}

export enum PayoutType {
  /** Flat amount paid to the recruiter per shortlisted candidate. */
  PER_SHORTLIST = 'per_shortlist',
  /** Amount paid to the recruiter per hired candidate. */
  PER_HIRE = 'per_hire',
  /** Both shortlist + hire payouts (combined). */
  HYBRID = 'hybrid',
}

export enum RoleVisibility {
  /** Visible to all active recruiters (default). */
  OPEN = 'open',
  /** Only recruiters who have placed with this company before. */
  PREFERRED = 'preferred',
  /** Only explicitly invited recruiters. */
  INVITE_ONLY = 'invite_only',
}
