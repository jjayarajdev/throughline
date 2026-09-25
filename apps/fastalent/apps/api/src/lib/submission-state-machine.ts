import { SubmissionStatus, UserRole } from '@gigcruite/types';

/**
 * Submission state machine — Phase 2 Wave 4.
 *
 * Pure functions, no DB access. Encodes the 7-state lifecycle documented
 * in packages/types/src/enums/submission.ts:
 *
 *   submitted   → { shortlisted, rejected, withdrawn }
 *   shortlisted → { interview, hired, rejected, withdrawn }
 *   interview   → { hired, rejected, withdrawn }
 *   hired       → { joined, rejected }
 *   joined      → terminal
 *   rejected    → terminal
 *   withdrawn   → terminal
 */

export const ALLOWED_TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  [SubmissionStatus.SUBMITTED]: [
    SubmissionStatus.SHORTLISTED,
    SubmissionStatus.REJECTED,
    SubmissionStatus.WITHDRAWN,
  ],
  [SubmissionStatus.SHORTLISTED]: [
    SubmissionStatus.INTERVIEW,
    SubmissionStatus.HIRED,
    SubmissionStatus.REJECTED,
    SubmissionStatus.WITHDRAWN,
  ],
  [SubmissionStatus.INTERVIEW]: [
    SubmissionStatus.HIRED,
    SubmissionStatus.REJECTED,
    SubmissionStatus.WITHDRAWN,
  ],
  [SubmissionStatus.HIRED]: [
    SubmissionStatus.JOINED,
    SubmissionStatus.REJECTED,
  ],
  [SubmissionStatus.JOINED]: [],
  [SubmissionStatus.REJECTED]: [],
  [SubmissionStatus.WITHDRAWN]: [],
};

/**
 * Which roles can drive each target status. `withdrawn` is
 * recruiter-only; everything else is company-only.
 */
export const ACTOR_FOR_STATUS: Record<SubmissionStatus, UserRole[]> = {
  [SubmissionStatus.SUBMITTED]: [], // initial state, not a transition target
  [SubmissionStatus.SHORTLISTED]: [UserRole.COMPANY],
  [SubmissionStatus.INTERVIEW]: [UserRole.COMPANY],
  [SubmissionStatus.HIRED]: [UserRole.COMPANY],
  [SubmissionStatus.JOINED]: [UserRole.COMPANY],
  [SubmissionStatus.REJECTED]: [UserRole.COMPANY],
  [SubmissionStatus.WITHDRAWN]: [UserRole.RECRUITER],
};

export const TERMINAL_STATUSES: ReadonlySet<SubmissionStatus> = new Set([
  SubmissionStatus.JOINED,
  SubmissionStatus.REJECTED,
  SubmissionStatus.WITHDRAWN,
]);

export function canTransition(
  from: SubmissionStatus,
  to: SubmissionStatus,
  actorRole: UserRole,
): { allowed: boolean; reason?: string } {
  const targets = ALLOWED_TRANSITIONS[from];
  if (!targets.includes(to)) {
    return {
      allowed: false,
      reason: `Transition from "${from}" to "${to}" is not allowed`,
    };
  }

  const allowedActors = ACTOR_FOR_STATUS[to];
  if (!allowedActors.includes(actorRole)) {
    return {
      allowed: false,
      reason: `Role "${actorRole}" cannot move a submission to "${to}"`,
    };
  }

  return { allowed: true };
}

export function requiresAcceptedCtc(toStatus: SubmissionStatus): boolean {
  return toStatus === SubmissionStatus.HIRED;
}

/**
 * Returns the set of statuses the given actor role can transition TO
 * from the given current status. Used by the frontend to decide which
 * action buttons to render.
 */
export function allowedTargets(
  from: SubmissionStatus,
  actorRole: UserRole,
): SubmissionStatus[] {
  return ALLOWED_TRANSITIONS[from].filter((to) =>
    ACTOR_FOR_STATUS[to].includes(actorRole),
  );
}
