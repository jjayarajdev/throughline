/**
 * Submission status enum.
 *
 * Represents the 7-state lifecycle of a candidate submission, as confirmed
 * by the founder during Phase 2 kickoff.
 *
 * State machine (see apps/api/src/lib/submission-state-machine.ts in Wave 4):
 *
 *   submitted   → { shortlisted, rejected, withdrawn }
 *   shortlisted → { interview, hired, rejected, withdrawn }
 *   interview   → { hired, rejected, withdrawn }
 *   hired       → { joined, rejected }
 *   joined      → terminal
 *   rejected    → terminal
 *   withdrawn   → terminal
 *
 * Interview is optional — a submission can go straight from shortlisted to
 * hired without stepping through interview. Withdrawn is recruiter-initiated
 * only; rejected is company-initiated only.
 *
 * Values match Prisma schema identifiers exactly — no `@map()`.
 */
export enum SubmissionStatus {
  SUBMITTED = 'submitted',
  SHORTLISTED = 'shortlisted',
  INTERVIEW = 'interview',
  HIRED = 'hired',
  JOINED = 'joined',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}
