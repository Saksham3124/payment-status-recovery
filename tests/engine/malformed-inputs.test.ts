import { describe, it, expect } from 'vitest';
import { evaluateRecoveryGuidance } from '@/engine/recovery-engine';

describe('Recovery Engine - Malformed, Missing, and Unknown Inputs', () => {
  it('handles completely empty input object gracefully', () => {
    // @ts-expect-error Testing empty object runtime safety
    const guidance = evaluateRecoveryGuidance({});

    expect(guidance).toBeDefined();
    expect(guidance.canonicalState).toBe('INDETERMINATE_SAFEGUARD');
    expect(guidance.safeToRetryPayment).toBe(false);
    expect(guidance.primaryAction.type).toBe('HOLD_AND_VERIFY_STATEMENT');
    expect(guidance.evidenceSnapshot.amount).toBe(0);
    expect(guidance.evidenceSnapshot.remitterDebit).toBe('UNKNOWN');
  });

  it('handles corrupted string values for status enums', () => {
    const guidance = evaluateRecoveryGuidance({
      // @ts-expect-error Testing runtime invalid enum
      remitterDebit: 'MAYBE_DEBITED',
      // @ts-expect-error Testing runtime invalid enum
      npciSwitch: 'EXPLODED',
      // @ts-expect-error Testing runtime invalid enum
      beneficiaryCredit: 'SOMETHING_ELSE',
      // @ts-expect-error Testing runtime invalid enum
      merchantOrder: 'WHO_KNOWS',
    });

    expect(guidance.canonicalState).toBe('INDETERMINATE_SAFEGUARD');
    expect(guidance.safeToRetryPayment).toBe(false);
    expect(guidance.evidenceSnapshot.remitterDebit).toBe('UNKNOWN');
    expect(guidance.evidenceSnapshot.npciSwitch).toBe('UNKNOWN');
  });

  it('handles null, negative amounts, and NaN durations gracefully', () => {
    const guidance = evaluateRecoveryGuidance({
      amount: -500,
      elapsedMinutes: NaN,
      remitterDebit: 'DEBITED',
      npciSwitch: 'TIMEOUT',
      beneficiaryCredit: 'UNKNOWN',
    });

    expect(guidance.evidenceSnapshot.amount).toBe(0);
    expect(guidance.evidenceSnapshot.elapsedMinutes).toBe(0);
    expect(guidance.canonicalState).toBe('IN_FLIGHT_REMITTER_DEBITED');
    expect(guidance.safeToRetryPayment).toBe(false);
  });
});
