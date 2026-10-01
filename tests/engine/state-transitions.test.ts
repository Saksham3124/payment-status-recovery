import { describe, it, expect } from 'vitest';
import {
  validateStateTransition,
  PERMITTED_STATE_TRANSITIONS,
} from '@/engine/state-transitions';
import { CanonicalRecoveryState } from '@/engine/types';

describe('State Transitions - Banking Invariants & State Machine', () => {
  it('allows valid forward progress from IN_FLIGHT_REMITTER_DEBITED', () => {
    const validNextStates: CanonicalRecoveryState[] = [
      'IN_FLIGHT_SWITCH_ACCEPTED',
      'DEFINITIVE_SUCCESS',
      'CREDITED_MERCHANT_SYNC_LAG',
      'UNRESOLVED_DEBIT_TIMEOUT',
      'AUTO_REVERSAL_IN_PROGRESS',
      'ANOMALOUS_CONTRADICTION',
    ];

    for (const nextState of validNextStates) {
      const res = validateStateTransition('IN_FLIGHT_REMITTER_DEBITED', nextState);
      expect(res.allowed).toBe(true);
    }
  });

  it('prohibits illegal transition from debited state to DEFINITIVE_FAILURE_NO_DEBIT', () => {
    const debitedStates: CanonicalRecoveryState[] = [
      'IN_FLIGHT_REMITTER_DEBITED',
      'IN_FLIGHT_SWITCH_ACCEPTED',
      'CREDITED_MERCHANT_SYNC_LAG',
      'UNRESOLVED_DEBIT_TIMEOUT',
      'AUTO_REVERSAL_IN_PROGRESS',
    ];

    for (const state of debitedStates) {
      const res = validateStateTransition(state, 'DEFINITIVE_FAILURE_NO_DEBIT');
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('Accounting Violation');
    }
  });

  it('prohibits any transitions away from terminal states', () => {
    const allStates: CanonicalRecoveryState[] = [
      'IN_FLIGHT_REMITTER_DEBITED',
      'IN_FLIGHT_SWITCH_ACCEPTED',
      'UNRESOLVED_DEBIT_TIMEOUT',
      'AUTO_REVERSAL_IN_PROGRESS',
      'DEFINITIVE_FAILURE_NO_DEBIT',
      'INDETERMINATE_SAFEGUARD',
    ];

    for (const target of allStates) {
      const successRes = validateStateTransition('DEFINITIVE_SUCCESS', target);
      expect(successRes.allowed).toBe(false);
      expect(successRes.reason).toContain('DEFINITIVE_SUCCESS is terminal');

      if (target !== 'DEFINITIVE_FAILURE_NO_DEBIT') {
        const failureRes = validateStateTransition('DEFINITIVE_FAILURE_NO_DEBIT', target);
        expect(failureRes.allowed).toBe(false);
        expect(failureRes.reason).toContain('DEFINITIVE_FAILURE_NO_DEBIT is terminal');
      }
    }
  });

  it('permits identical state transition as safe no-op', () => {
    const res = validateStateTransition('IN_FLIGHT_REMITTER_DEBITED', 'IN_FLIGHT_REMITTER_DEBITED');
    expect(res.allowed).toBe(true);
  });
});
