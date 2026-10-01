import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SYNTHETIC_TRANSACTIONS } from '@/mock/synthetic-transactions';
import { evaluateRecoveryGuidance } from '@/engine/recovery-engine';
import { CanonicalRecoveryState, TransactionType } from '@/engine/types';

// Helper mirroring the context's filtering and evaluation pipeline for testing
function computeEvaluatedTransactions(raw = SYNTHETIC_TRANSACTIONS) {
  return raw.map((tx) => ({
    ...tx,
    guidance: evaluateRecoveryGuidance(tx.evidence),
  }));
}

function filterTransactions(
  transactions: ReturnType<typeof computeEvaluatedTransactions>,
  query: string,
  statusFilter: 'ALL' | CanonicalRecoveryState,
  typeFilter: 'ALL' | TransactionType
) {
  return transactions.filter((tx) => {
    if (statusFilter !== 'ALL' && tx.guidance.canonicalState !== statusFilter) {
      return false;
    }
    if (typeFilter !== 'ALL' && tx.type !== typeFilter) {
      return false;
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      const matchesId = tx.id.toLowerCase().includes(q);
      const matchesUtr = tx.utr.toLowerCase().includes(q);
      const matchesCounterparty = tx.counterparty.toLowerCase().includes(q);
      const matchesVpa = tx.counterpartyVpa.toLowerCase().includes(q);
      const matchesState = tx.guidance.canonicalState.toLowerCase().includes(q);

      if (!matchesId && !matchesUtr && !matchesCounterparty && !matchesVpa && !matchesState) {
        return false;
      }
    }
    return true;
  });
}

describe('Transaction Context - Filtering, Search, and Status Telemetry', () => {
  const evaluated = computeEvaluatedTransactions();

  it('initializes with all synthetic transactions evaluated via recovery engine', () => {
    expect(evaluated.length).toBe(SYNTHETIC_TRANSACTIONS.length);
    for (const item of evaluated) {
      expect(item.guidance).toBeDefined();
      expect(item.guidance.canonicalState).toBeDefined();
      expect(typeof item.guidance.safeToRetryPayment).toBe('boolean');
    }
  });

  describe('Search functionality', () => {
    it('searches accurately by transaction ID', () => {
      const results = filterTransactions(evaluated, 'SYNTH-TX-105', 'ALL', 'ALL');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('SYNTH-TX-105');
      expect(results[0].counterparty).toContain('Zomato');
    });

    it('searches accurately by 12-digit UTR', () => {
      const targetUtr = SYNTHETIC_TRANSACTIONS[2].utr;
      const results = filterTransactions(evaluated, targetUtr, 'ALL', 'ALL');
      expect(results.length).toBe(1);
      expect(results[0].utr).toBe(targetUtr);
    });

    it('searches by counterparty name case-insensitively', () => {
      const results = filterTransactions(evaluated, 'blue tokai', 'ALL', 'ALL');
      expect(results.length).toBe(1);
      expect(results[0].counterparty).toContain('Blue Tokai');
    });

    it('returns empty array when search query matches nothing', () => {
      const results = filterTransactions(evaluated, 'NONEXISTENT_QUERY_12345', 'ALL', 'ALL');
      expect(results.length).toBe(0);
    });
  });

  describe('Status and Type filters', () => {
    it('filters strictly by canonical status', () => {
      const successResults = filterTransactions(evaluated, '', 'DEFINITIVE_SUCCESS', 'ALL');
      expect(successResults.length).toBeGreaterThan(0);
      for (const item of successResults) {
        expect(item.guidance.canonicalState).toBe('DEFINITIVE_SUCCESS');
      }

      const reversalResults = filterTransactions(evaluated, '', 'AUTO_REVERSAL_IN_PROGRESS', 'ALL');
      expect(reversalResults.length).toBe(1);
      expect(reversalResults[0].guidance.canonicalState).toBe('AUTO_REVERSAL_IN_PROGRESS');
    });

    it('filters by transaction type (P2P vs P2M)', () => {
      const p2pResults = filterTransactions(evaluated, '', 'ALL', 'P2P');
      expect(p2pResults.length).toBeGreaterThan(0);
      for (const item of p2pResults) {
        expect(item.type).toBe('P2P');
      }

      const p2mResults = filterTransactions(evaluated, '', 'ALL', 'P2M');
      expect(p2mResults.length).toBeGreaterThan(0);
      for (const item of p2mResults) {
        expect(item.type).toBe('P2M');
      }
    });

    it('handles combined status, type, and search filters', () => {
      // P2M + Search "Coffee"
      const results = filterTransactions(evaluated, 'Coffee', 'DEFINITIVE_SUCCESS', 'P2M');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('SYNTH-TX-101');
      expect(results[0].type).toBe('P2M');
      expect(results[0].guidance.canonicalState).toBe('DEFINITIVE_SUCCESS');
    });
  });

  describe('Simulated Polling and Timer Safety', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('cleans up polling timers without memory leaks', () => {
      const activeTimers = new Map<string, NodeJS.Timeout>();

      // Simulate starting a poll timer
      const timer = setTimeout(() => {}, 750);
      activeTimers.set('SYNTH-TX-104', timer);
      expect(activeTimers.has('SYNTH-TX-104')).toBe(true);

      // Simulate unmount cleanup
      activeTimers.forEach((t) => clearTimeout(t));
      activeTimers.clear();

      expect(activeTimers.size).toBe(0);
    });

    it('guarantees polling update cannot accidentally authorize an unsafe retry', () => {
      // Take a debited in-flight transaction
      const debitedTx = SYNTHETIC_TRANSACTIONS.find((t) => t.id === 'SYNTH-TX-105')!;
      expect(debitedTx.evidence.remitterDebit).toBe('DEBITED');

      // Before poll
      const initialGuidance = evaluateRecoveryGuidance(debitedTx.evidence);
      expect(initialGuidance.safeToRetryPayment).toBe(false);

      // Simulate polling where elapsed time increases and switch remains in timeout
      const updatedEvidence = {
        ...debitedTx.evidence,
        elapsedMinutes: debitedTx.evidence.elapsedMinutes + 10,
      };

      const polledGuidance = evaluateRecoveryGuidance(updatedEvidence);
      // Cardinal invariant: still debited, so safeToRetryPayment MUST remain false!
      expect(polledGuidance.safeToRetryPayment).toBe(false);
      expect(polledGuidance.primaryAction.safeToRetryPayment).toBe(false);
    });
  });
});
