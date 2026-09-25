/**
 * Phase 3 — Wallet & Payout enums.
 *
 * Values are lowercase and EXACTLY match the Prisma schema enum identifiers.
 * NO `@map()` on any value — plain `as Prisma<Enum>` casts are safe.
 */

export enum TransactionType {
  COMPANY_DEPOSIT = 'company_deposit',
  COMPANY_LOCK = 'company_lock',
  COMPANY_UNLOCK = 'company_unlock',
  COMPANY_DEBIT = 'company_debit',
  RECRUITER_CREDIT = 'recruiter_credit',
  RECRUITER_WITHDRAWAL = 'recruiter_withdrawal',
  PLATFORM_COMMISSION = 'platform_commission',
  REFUND = 'refund',
}

export enum EarningStatus {
  PENDING = 'pending',
  PAYABLE = 'payable',
  PROCESSING = 'processing',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum EarningType {
  SHORTLIST_PAYOUT = 'shortlist_payout',
  HIRE_PAYOUT = 'hire_payout',
}

export enum PayoutBatchStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  PARTIAL_FAILURE = 'partial_failure',
  FAILED = 'failed',
}

export enum PayoutRequestStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
