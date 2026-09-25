/**
 * Phase 4 + Phase 11 — Notification enums.
 *
 * Values are lowercase and EXACTLY match the Prisma schema enum identifiers.
 * NO `@map()` on any value — plain `as Prisma<Enum>` casts are safe.
 */

export enum NotificationType {
  SUBMISSION_STATUS_CHANGED = 'submission_status_changed',
  ROLE_PUBLISHED = 'role_published',
  ROLE_INVITATION = 'role_invitation',
  EARNING_CREATED = 'earning_created',
  PAYOUT_UPDATE = 'payout_update',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  ROLE_SUBMITTED_FOR_REVIEW = 'role_submitted_for_review',
  ROLE_APPROVED = 'role_approved',
  ROLE_REJECTED = 'role_rejected',
  // Phase 15 — Analytics AI
  AI_ANOMALY_ALERT = 'ai_anomaly_alert',
  AI_ROLE_MATCH = 'ai_role_match',
}
