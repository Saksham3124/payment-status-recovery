/**
 * State Transition Matrix & Transition Guards
 *
 * Formally models allowed vs. prohibited transitions across canonical recovery states.
 * Enforces banking accounting invariants:
 * e.g., a debited transaction can NEVER transition to DEFINITIVE_FAILURE_NO_DEBIT.
 */

import { CanonicalRecoveryState } from './types';

export interface StateTransitionResult {
  allowed: boolean;
  fromState: CanonicalRecoveryState;
  toState: CanonicalRecoveryState;
  reason: string;
}

// Explicit lookup of allowed forward transitions from each canonical state
export const PERMITTED_STATE_TRANSITIONS: Record<CanonicalRecoveryState, CanonicalRecoveryState[]> = {
  // Terminal success: No further system transitions allowed (disputes are handled via separate ticketing)
  DEFINITIVE_SUCCESS: [],

  // Terminal clean failure: No debit occurred
  DEFINITIVE_FAILURE_NO_DEBIT: [],

  CREDITED_MERCHANT_SYNC_LAG: [
    'DEFINITIVE_SUCCESS', // Merchant POS finally syncs
    'ANOMALOUS_CONTRADICTION',
  ],

  IN_FLIGHT_SWITCH_ACCEPTED: [
    'DEFINITIVE_SUCCESS', // Beneficiary bank confirms credit
    'CREDITED_MERCHANT_SYNC_LAG', // Credit confirmed, merchant lag continues
    'UNRESOLVED_DEBIT_TIMEOUT', // Timeout threshold reached
    'AUTO_REVERSAL_IN_PROGRESS', // Switch re-routes to reversal
    'ANOMALOUS_CONTRADICTION',
  ],

  IN_FLIGHT_REMITTER_DEBITED: [
    'IN_FLIGHT_SWITCH_ACCEPTED', // Switch catches up
    'DEFINITIVE_SUCCESS', // Central switch reconciles directly
    'CREDITED_MERCHANT_SYNC_LAG',
    'UNRESOLVED_DEBIT_TIMEOUT', // Cooling-off window passed
    'AUTO_REVERSAL_IN_PROGRESS', // Switch acknowledges routing failed
    'ANOMALOUS_CONTRADICTION',
  ],

  UNRESOLVED_DEBIT_TIMEOUT: [
    'AUTO_REVERSAL_IN_PROGRESS', // Bank executes auto-reversal under RBI mandate
    'DEFINITIVE_SUCCESS', // Late settlement acknowledged
    'ANOMALOUS_CONTRADICTION',
  ],

  AUTO_REVERSAL_IN_PROGRESS: [
    'ANOMALOUS_CONTRADICTION',
  ],

  ANOMALOUS_CONTRADICTION: [
    'AUTO_REVERSAL_IN_PROGRESS', // Bank manual review settles on auto-reversal
    'DEFINITIVE_SUCCESS', // Bank manual review settles on valid credit
  ],

  INDETERMINATE_SAFEGUARD: [
    // Once telemetry is clarified, any valid state can be reached
    'DEFINITIVE_SUCCESS',
    'CREDITED_MERCHANT_SYNC_LAG',
    'IN_FLIGHT_SWITCH_ACCEPTED',
    'IN_FLIGHT_REMITTER_DEBITED',
    'UNRESOLVED_DEBIT_TIMEOUT',
    'AUTO_REVERSAL_IN_PROGRESS',
    'DEFINITIVE_FAILURE_NO_DEBIT',
    'ANOMALOUS_CONTRADICTION',
  ],
};

/**
 * Validates whether a state transition is permitted according to accounting and network rules.
 */
export function validateStateTransition(
  fromState: CanonicalRecoveryState,
  toState: CanonicalRecoveryState
): StateTransitionResult {
  // Same state is always a no-op / allowed
  if (fromState === toState) {
    return {
      allowed: true,
      fromState,
      toState,
      reason: 'No-op transition within identical state.',
    };
  }

  // Check terminal state locks
  if (fromState === 'DEFINITIVE_SUCCESS') {
    return {
      allowed: false,
      fromState,
      toState,
      reason: 'Prohibited: DEFINITIVE_SUCCESS is terminal. Completed transactions cannot be demoted to in-flight or failed.',
    };
  }

  if (fromState === 'DEFINITIVE_FAILURE_NO_DEBIT') {
    return {
      allowed: false,
      fromState,
      toState,
      reason: 'Prohibited: DEFINITIVE_FAILURE_NO_DEBIT is terminal. Zero-debit failures cannot retroactively transition.',
    };
  }

  // Accounting Invariant: Any state representing debited funds CAN NEVER transition to DEFINITIVE_FAILURE_NO_DEBIT
  const debitedStates: CanonicalRecoveryState[] = [
    'IN_FLIGHT_REMITTER_DEBITED',
    'IN_FLIGHT_SWITCH_ACCEPTED',
    'CREDITED_MERCHANT_SYNC_LAG',
    'UNRESOLVED_DEBIT_TIMEOUT',
    'AUTO_REVERSAL_IN_PROGRESS',
  ];

  if (debitedStates.includes(fromState) && toState === 'DEFINITIVE_FAILURE_NO_DEBIT') {
    return {
      allowed: false,
      fromState,
      toState,
      reason: `Prohibited Accounting Violation: Cannot transition from ${fromState} to DEFINITIVE_FAILURE_NO_DEBIT because customer account has already suffered a debit. Reversals must follow AUTO_REVERSAL_IN_PROGRESS.`,
    };
  }

  const allowedDestinations = PERMITTED_STATE_TRANSITIONS[fromState] || [];
  const isPermitted = allowedDestinations.includes(toState);

  return {
    allowed: isPermitted,
    fromState,
    toState,
    reason: isPermitted
      ? `Permitted transition from ${fromState} to ${toState}.`
      : `Prohibited transition from ${fromState} to ${toState}. Not defined in state machine transition matrix.`,
  };
}
