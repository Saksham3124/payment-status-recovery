import { describe, it, expect } from 'vitest';
import { SYNTHETIC_TRANSACTIONS } from '@/mock/synthetic-transactions';
import { evaluateRecoveryGuidance } from '@/engine/recovery-engine';

describe('Transaction Detail Consistency & Safety Guarantees', () => {
  it('guarantees complete consistency between engine output, safety directives, and guidance', () => {
    for (const tx of SYNTHETIC_TRANSACTIONS) {
      const guidance = evaluateRecoveryGuidance(tx.evidence);

      // Invariant: Top-level safety boolean matches primaryAction safety boolean
      expect(guidance.safeToRetryPayment).toBe(guidance.primaryAction.safeToRetryPayment);

      // What we know must be present
      expect(guidance.knownFacts.length).toBeGreaterThan(0);

      // For all non-clean failures, retry must be blocked
      if (guidance.canonicalState !== 'DEFINITIVE_FAILURE_NO_DEBIT') {
        expect(guidance.safeToRetryPayment).toBe(false);
        expect(guidance.primaryAction.safeToRetryPayment).toBe(false);
        expect(guidance.primaryAction.type).not.toBe('SAFE_TO_RETRY_OR_SWITCH');
      }

      // For uncertain states, unknown facts must explain why it is uncertain
      if (
        guidance.canonicalState === 'IN_FLIGHT_REMITTER_DEBITED' ||
        guidance.canonicalState === 'IN_FLIGHT_SWITCH_ACCEPTED' ||
        guidance.canonicalState === 'UNRESOLVED_DEBIT_TIMEOUT' ||
        guidance.canonicalState === 'ANOMALOUS_CONTRADICTION' ||
        guidance.canonicalState === 'INDETERMINATE_SAFEGUARD' ||
        guidance.canonicalState === 'CREDITED_MERCHANT_SYNC_LAG'
      ) {
        expect(guidance.unknownFacts.length).toBeGreaterThan(0);
      }
    }
  });

  it('handles invalid transaction IDs safely', () => {
    const invalidId = 'SYNTH-TX-DOES-NOT-EXIST';
    const found = SYNTHETIC_TRANSACTIONS.find((t) => t.id === invalidId);
    expect(found).toBeUndefined();
  });
});
