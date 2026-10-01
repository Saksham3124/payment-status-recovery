import { describe, it, expect } from 'vitest';
import { INITIAL_SYNTHETIC_CASES } from '@/mock/synthetic-support-cases';
import { SupportCase, CaseStatus } from '@/support/types';
import { validateCaseTransition } from '@/support/case-transitions';

function filterCases(
  cases: SupportCase[],
  query: string,
  statusFilter: 'ALL' | CaseStatus
) {
  return cases.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) {
      return false;
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      const matchesId = c.id.toLowerCase().includes(q);
      const matchesTxId = c.transactionId.toLowerCase().includes(q);
      const matchesUtr = c.utr.toLowerCase().includes(q);
      const matchesSubject = c.subject.toLowerCase().includes(q);
      const matchesCategory = c.category.toLowerCase().includes(q);

      if (!matchesId && !matchesTxId && !matchesUtr && !matchesSubject && !matchesCategory) {
        return false;
      }
    }
    return true;
  });
}

describe('Support Context - Searching, Filtering, and Activity History', () => {
  const initialCases = [...INITIAL_SYNTHETIC_CASES];

  it('initializes with seed synthetic cases linked to valid transactions', () => {
    expect(initialCases.length).toBeGreaterThanOrEqual(3);
    for (const c of initialCases) {
      expect(c.id).toMatch(/^CASE-\d+$/);
      expect(c.transactionId).toMatch(/^SYNTH-TX-\d+$/);
      expect(c.utr).toMatch(/^\d{12}$/);
      expect(c.history.length).toBeGreaterThan(0);
      expect(c.isSimulated).toBe(true);
    }
  });

  describe('Search functionality', () => {
    it('searches accurately by Case ID', () => {
      const results = filterCases(initialCases, 'CASE-1001', 'ALL');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('CASE-1001');
    });

    it('searches accurately by linked Transaction ID', () => {
      const results = filterCases(initialCases, 'SYNTH-TX-107', 'ALL');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('CASE-1001');
    });

    it('searches accurately by UTR', () => {
      const targetUtr = initialCases[1].utr;
      const results = filterCases(initialCases, targetUtr, 'ALL');
      expect(results.length).toBe(1);
      expect(results[0].utr).toBe(targetUtr);
    });

    it('returns empty array when search matches nothing', () => {
      const results = filterCases(initialCases, 'NONEXISTENT_QUERY_9999', 'ALL');
      expect(results.length).toBe(0);
    });
  });

  describe('Status filtering', () => {
    it('filters strictly by case status', () => {
      const openCases = filterCases(initialCases, '', 'OPEN');
      for (const c of openCases) {
        expect(c.status).toBe('OPEN');
      }

      const reviewCases = filterCases(initialCases, '', 'UNDER_REVIEW');
      for (const c of reviewCases) {
        expect(c.status).toBe('UNDER_REVIEW');
      }

      const resolvedCases = filterCases(initialCases, '', 'RESOLVED');
      for (const c of resolvedCases) {
        expect(c.status).toBe('RESOLVED');
      }
    });

    it('handles combined status and search query', () => {
      const results = filterCases(initialCases, 'Croma', 'UNDER_REVIEW');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('CASE-1001');
    });
  });

  describe('Activity History Progression', () => {
    it('appends chronological activity entries upon transition', () => {
      const c = { ...initialCases[0] };
      const fromStatus = c.status; // UNDER_REVIEW
      const toStatus: CaseStatus = 'RESOLVED';

      const validation = validateCaseTransition(fromStatus, toStatus);
      expect(validation.allowed).toBe(true);

      const newActivity = {
        id: `ACT-${c.id}-3`,
        timestamp: new Date().toISOString(),
        action: 'STATUS_ADVANCED',
        fromStatus,
        toStatus,
        note: 'Reversal confirmed by bank switch.',
        actor: 'SUPPORT_AGENT' as const,
      };

      const updatedHistory = [...c.history, newActivity];
      expect(updatedHistory.length).toBe(c.history.length + 1);
      expect(updatedHistory[updatedHistory.length - 1].toStatus).toBe('RESOLVED');
    });
  });
});
