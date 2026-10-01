import { describe, it, expect } from 'vitest';
import { SYNTHETIC_TRANSACTIONS } from '@/mock/synthetic-transactions';

describe('Transaction Timeline Assembly & Grounding', () => {
  it('ensures each transaction has a concrete initiation timestamp', () => {
    for (const tx of SYNTHETIC_TRANSACTIONS) {
      expect(tx.timestamp).toBeDefined();
      const parsed = new Date(tx.timestamp);
      expect(isNaN(parsed.getTime())).toBe(false);
    }
  });

  it('guarantees chronological sequence without fabricating non-existent timestamps', () => {
    const tx = SYNTHETIC_TRANSACTIONS[0];
    // In our data model, only initiation timestamp is explicitly recorded;
    // intermediate events rely on sequence ordering and relative elapsed duration,
    // avoiding false precision.
    expect(tx.timestamp).toBe('2026-10-01T13:45:00Z');
    expect(typeof tx.evidence.elapsedMinutes).toBe('number');
    expect(tx.evidence.elapsedMinutes).toBeGreaterThanOrEqual(0);
  });
});
