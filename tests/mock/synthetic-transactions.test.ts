import { describe, it, expect } from 'vitest';
import { SYNTHETIC_TRANSACTIONS } from '@/mock/synthetic-transactions';
import { evaluateRecoveryGuidance } from '@/engine/recovery-engine';
import { CanonicalRecoveryState } from '@/engine/types';

describe('Synthetic Transactions Dataset - Fixture Validity & State Coverage', () => {
  it('contains valid, clearly labeled synthetic transaction records', () => {
    expect(SYNTHETIC_TRANSACTIONS.length).toBeGreaterThanOrEqual(10);

    for (const tx of SYNTHETIC_TRANSACTIONS) {
      // Must be explicitly labeled as synthetic
      expect(tx.counterparty).toContain('[SYNTHETIC]');
      expect(tx.id).toMatch(/^SYNTH-TX-\d+$/);

      // Must have valid 12-digit UTR
      expect(tx.utr).toMatch(/^\d{12}$/);

      // Must have valid amount
      expect(tx.amount).toBeGreaterThan(0);

      // Must have valid type
      expect(['P2P', 'P2M']).toContain(tx.type);

      // Evidence snapshot integrity
      expect(tx.evidence.transactionId).toBe(tx.id);
      expect(tx.evidence.utr).toBe(tx.utr);
      expect(tx.evidence.amount).toBe(tx.amount);
      expect(tx.evidence.remitterBankName).toBeDefined();
      expect(tx.evidence.beneficiaryBankName).toBeDefined();
    }
  });

  it('covers all essential canonical recovery states across the dataset', () => {
    const evaluatedStates = new Set<CanonicalRecoveryState>();

    for (const tx of SYNTHETIC_TRANSACTIONS) {
      const guidance = evaluateRecoveryGuidance(tx.evidence);
      evaluatedStates.add(guidance.canonicalState);
    }

    // Required canonical states:
    expect(evaluatedStates.has('DEFINITIVE_SUCCESS')).toBe(true);
    expect(evaluatedStates.has('CREDITED_MERCHANT_SYNC_LAG')).toBe(true);
    expect(evaluatedStates.has('IN_FLIGHT_SWITCH_ACCEPTED')).toBe(true);
    expect(evaluatedStates.has('IN_FLIGHT_REMITTER_DEBITED')).toBe(true);
    expect(evaluatedStates.has('UNRESOLVED_DEBIT_TIMEOUT')).toBe(true);
    expect(evaluatedStates.has('AUTO_REVERSAL_IN_PROGRESS')).toBe(true);
    expect(evaluatedStates.has('DEFINITIVE_FAILURE_NO_DEBIT')).toBe(true);
    expect(evaluatedStates.has('ANOMALOUS_CONTRADICTION')).toBe(true);
    expect(evaluatedStates.has('INDETERMINATE_SAFEGUARD')).toBe(true);
  });

  it('covers both P2P and P2M transaction archetypes', () => {
    const p2pCount = SYNTHETIC_TRANSACTIONS.filter((t) => t.type === 'P2P').length;
    const p2mCount = SYNTHETIC_TRANSACTIONS.filter((t) => t.type === 'P2M').length;

    expect(p2pCount).toBeGreaterThanOrEqual(3);
    expect(p2mCount).toBeGreaterThanOrEqual(5);
  });

  it('strictly adheres to retry safety invariant across all synthetic records', () => {
    for (const tx of SYNTHETIC_TRANSACTIONS) {
      const guidance = evaluateRecoveryGuidance(tx.evidence);

      if (guidance.safeToRetryPayment) {
        // Must strictly be DEFINITIVE_FAILURE_NO_DEBIT
        expect(guidance.canonicalState).toBe('DEFINITIVE_FAILURE_NO_DEBIT');
        expect(tx.evidence.remitterDebit).toBe('NOT_DEBITED');
        expect(tx.evidence.beneficiaryCredit).toBe('NOT_CREDITED');
      } else {
        // Any debit, pending, timeout, reversal, or contradiction must forbid retry
        expect(guidance.primaryAction.safeToRetryPayment).toBe(false);
      }
    }
  });
});
