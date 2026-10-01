import { describe, it, expect } from 'vitest';
import { suggestCaseCategory } from '@/support/category-suggestions';
import { CanonicalRecoveryState } from '@/engine/types';

describe('Support Case Category Suggestions', () => {
  it('suggests MERCHANT_CONFIRMATION_DELAY for CREDITED_MERCHANT_SYNC_LAG', () => {
    const suggestion = suggestCaseCategory(
      'CREDITED_MERCHANT_SYNC_LAG',
      1420,
      'Kaveri Supermarket [SYNTHETIC]'
    );
    expect(suggestion.category).toBe('MERCHANT_CONFIRMATION_DELAY');
    expect(suggestion.defaultSubject).toContain('Soundbox delay');
    expect(suggestion.guidanceSummary).toContain('12-digit UTR');
  });

  it('suggests PAYMENT_PENDING for in-flight settlement states', () => {
    const states: CanonicalRecoveryState[] = [
      'IN_FLIGHT_SWITCH_ACCEPTED',
      'IN_FLIGHT_REMITTER_DEBITED',
    ];

    for (const state of states) {
      const suggestion = suggestCaseCategory(state, 680, 'Swiggy [SYNTHETIC]');
      expect(suggestion.category).toBe('PAYMENT_PENDING');
      expect(suggestion.guidanceSummary).toContain('Do not initiate a duplicate payment');
    }
  });

  it('suggests DEBITED_CONFIRMATION_MISSING for timeouts and indeterminate states', () => {
    const states: CanonicalRecoveryState[] = [
      'UNRESOLVED_DEBIT_TIMEOUT',
      'INDETERMINATE_SAFEGUARD',
    ];

    for (const state of states) {
      const suggestion = suggestCaseCategory(state, 8499, 'Croma [SYNTHETIC]');
      expect(suggestion.category).toBe('DEBITED_CONFIRMATION_MISSING');
      expect(suggestion.guidanceSummary).toContain('auto-reversal');
    }
  });

  it('suggests REVERSAL_TRACKING for switch-failed reversals', () => {
    const suggestion = suggestCaseCategory(
      'AUTO_REVERSAL_IN_PROGRESS',
      2100,
      'Indian Oil [SYNTHETIC]'
    );
    expect(suggestion.category).toBe('REVERSAL_TRACKING');
    expect(suggestion.defaultSubject).toContain('Auto-reversal SLA tracking');
  });

  it('suggests CONFLICTING_EVIDENCE for telemetry contradictions', () => {
    const suggestion = suggestCaseCategory(
      'ANOMALOUS_CONTRADICTION',
      14999,
      'Reliance Digital [SYNTHETIC]'
    );
    expect(suggestion.category).toBe('CONFLICTING_EVIDENCE');
    expect(suggestion.defaultSubject).toContain('Contradictory telemetry');
  });

  it('defaults to GENERAL_INQUIRY for terminal success or failure', () => {
    const successSug = suggestCaseCategory('DEFINITIVE_SUCCESS', 340, 'Blue Tokai');
    expect(successSug.category).toBe('GENERAL_INQUIRY');

    const failSug = suggestCaseCategory('DEFINITIVE_FAILURE_NO_DEBIT', 350, 'Uber');
    expect(failSug.category).toBe('GENERAL_INQUIRY');
  });
});
