/**
 * Pure Case State Transition Validator
 *
 * Enforces a disciplined support lifecycle:
 * OPEN -> UNDER_REVIEW -> RESOLVED -> CLOSED
 */

import { CaseStatus } from './types';

export interface CaseTransitionResult {
  allowed: boolean;
  fromStatus: CaseStatus;
  toStatus: CaseStatus;
  reason: string;
}

const ALLOWED_CASE_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  OPEN: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['RESOLVED', 'OPEN'],
  RESOLVED: ['CLOSED'],
  CLOSED: [], // Terminal
};

export function validateCaseTransition(
  fromStatus: CaseStatus,
  toStatus: CaseStatus
): CaseTransitionResult {
  if (fromStatus === toStatus) {
    return {
      allowed: true,
      fromStatus,
      toStatus,
      reason: 'No-op transition within identical status.',
    };
  }

  if (fromStatus === 'CLOSED') {
    return {
      allowed: false,
      fromStatus,
      toStatus,
      reason: 'Prohibited: Case is CLOSED and cannot be modified further.',
    };
  }

  const allowedList = ALLOWED_CASE_TRANSITIONS[fromStatus] || [];
  const isAllowed = allowedList.includes(toStatus);

  return {
    allowed: isAllowed,
    fromStatus,
    toStatus,
    reason: isAllowed
      ? `Permitted lifecycle transition from ${fromStatus} to ${toStatus}.`
      : `Prohibited transition: Cannot jump directly from ${fromStatus} to ${toStatus}. Must follow support lifecycle protocol.`,
  };
}
