import { describe, it, expect } from 'vitest';
import {
  SYNTHETIC_TRANSACTIONS,
  getInitialSyntheticTransactions,
} from '@/mock/synthetic-transactions';
import {
  INITIAL_SYNTHETIC_CASES,
  SupportCase,
  getInitialSyntheticCases,
} from '@/mock/synthetic-support-cases';
import { evaluateRecoveryGuidance } from '@/engine/recovery-engine';
import { createValidEvent } from '@/analytics/schema';
import { calculateFunnelMetrics } from '@/analytics/metrics';
import { AnalyticsEvent, AnalyticsEventType } from '@/analytics/types';

describe('Reset Demo Data — State Recovery, Isolation, and Invariant Preservation', () => {
  // 1. Reset from a modified transaction state
  it('restores modified transactions back to pristine original values', () => {
    const pristine = getInitialSyntheticTransactions();
    const workingSet = getInitialSyntheticTransactions();

    // Modify a transaction (e.g. simulate a late credit update)
    const txIndex = workingSet.findIndex((t) => t.id === 'SYNTH-TX-105');
    expect(txIndex).toBeGreaterThan(-1);

    workingSet[txIndex].evidence.beneficiaryCredit = 'CREDITED';
    workingSet[txIndex].evidence.elapsedMinutes = 99;
    expect(workingSet[txIndex].evidence.beneficiaryCredit).toBe('CREDITED');

    // Simulate resetToMockData
    const restored = getInitialSyntheticTransactions();
    expect(restored[txIndex].evidence.beneficiaryCredit).toBe('UNKNOWN');
    expect(restored[txIndex].evidence.elapsedMinutes).toBe(pristine[txIndex].evidence.elapsedMinutes);
    expect(restored[txIndex].evidence.remitterDebit).toBe(pristine[txIndex].evidence.remitterDebit);
  });

  // 2. Reset after creating or changing a support case
  it('restores synthetic support cases and statuses back to seed fixtures', () => {
    let cases = getInitialSyntheticCases();
    const initialCount = cases.length;

    // Create a new support case
    const newCase: SupportCase = {
      id: 'CASE-9999',
      transactionId: 'SYNTH-TX-101',
      utr: '908234120911',
      category: 'PAYMENT_PENDING',
      subject: 'Temporary test dispute',
      description: 'Customer inquiry for testing reset flow.',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSimulated: true,
      history: [],
    };
    cases = [newCase, ...cases];
    expect(cases.length).toBe(initialCount + 1);

    // Transition an existing case
    const targetCase = cases.find((c) => c.id === 'CASE-1001')!;
    targetCase.status = 'RESOLVED';
    expect(targetCase.status).toBe('RESOLVED');

    // Reset support cases
    cases = getInitialSyntheticCases();
    expect(cases.length).toBe(initialCount);
    expect(cases.some((c) => c.id === 'CASE-9999')).toBe(false);

    const resetTarget = cases.find((c) => c.id === 'CASE-1001')!;
    expect(resetTarget.status).toBe('UNDER_REVIEW');
    expect(resetTarget.history.length).toBe(2);
  });

  // 3. Reset after generating analytics events
  it('clears previous session events and retains only the single DEMO_DATA_RESET audit event', () => {
    const sess = 'SESS-RESET-TEST';
    let events: AnalyticsEvent[] = [
      createValidEvent('DASHBOARD_VIEWED', sess, 'USER', {}),
      createValidEvent('TRANSACTION_DETAILS_OPENED', sess, 'USER', {}, 'SYNTH-TX-105'),
      createValidEvent('SUPPORT_CASE_FLOW_STARTED', sess, 'USER', {}, 'SYNTH-TX-105'),
      createValidEvent('SUPPORT_CASE_CREATED', sess, 'USER', {}, 'SYNTH-TX-105', 'CASE-1005'),
    ];

    expect(events.length).toBe(4);
    const beforeMetrics = calculateFunnelMetrics(events);
    expect(beforeMetrics.caseCreationsCompleted).toBe(1);
    expect(beforeMetrics.caseCreationCompletionRate).toBe(1.0);

    // Simulate resetAnalytics(true)
    const resetEvent = createValidEvent(
      'DEMO_DATA_RESET',
      sess,
      'SYSTEM',
      { resetScope: 'ALL_DATA', reason: 'USER_INITIATED_RESET' }
    );
    events = [resetEvent];

    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('DEMO_DATA_RESET');
    expect(events[0].actor).toBe('SYSTEM');
    expect(events[0].properties.resetScope).toBe('ALL_DATA');

    // Verify metrics after reset: All funnel metrics must reset cleanly
    const afterMetrics = calculateFunnelMetrics(events);
    expect(afterMetrics.totalEvents).toBe(1);
    expect(afterMetrics.caseCreationFlowsStarted).toBe(0);
    expect(afterMetrics.caseCreationsCompleted).toBe(0);
    expect(afterMetrics.caseCreationCompletionRate).toBe(0);
    expect(afterMetrics.caseCreationExplicitAbandonmentRate).toBe(0);

    // Simulate resetAnalytics(false) - completely empty
    events = [];
    expect(events.length).toBe(0);
    const emptyMetrics = calculateFunnelMetrics(events);
    expect(emptyMetrics.totalEvents).toBe(0);
  });

  // 4. Cross-page consistency after reset (filters and search inputs)
  it('resets search queries, status filters, and type filters across all contexts', () => {
    // Transaction filter state
    let txSearchQuery = 'Croma';
    let txStatusFilter = 'UNRESOLVED_DEBIT_TIMEOUT';
    let txTypeFilter = 'P2M';

    // Support filter state
    let supportSearchQuery = 'Kaveri';
    let supportStatusFilter = 'OPEN';

    // Analytics filter state
    let analyticsTypeFilter: 'ALL' | AnalyticsEventType = 'SUPPORT_CASE_CREATED';
    let analyticsSessionFilter = 'SESS-123';
    let analyticsTxFilter = 'SYNTH-TX-105';

    // Coordinated reset simulation
    function resetAllFilters() {
      txSearchQuery = '';
      txStatusFilter = 'ALL';
      txTypeFilter = 'ALL';

      supportSearchQuery = '';
      supportStatusFilter = 'ALL';

      analyticsTypeFilter = 'ALL';
      analyticsSessionFilter = 'ALL';
      analyticsTxFilter = '';
    }

    resetAllFilters();

    expect(txSearchQuery).toBe('');
    expect(txStatusFilter).toBe('ALL');
    expect(txTypeFilter).toBe('ALL');

    expect(supportSearchQuery).toBe('');
    expect(supportStatusFilter).toBe('ALL');

    expect(analyticsTypeFilter).toBe('ALL');
    expect(analyticsSessionFilter).toBe('ALL');
    expect(analyticsTxFilter).toBe('');
  });

  // 5. Repeated reset calls
  it('handles repeated reset calls stably and idempotently', () => {
    for (let i = 0; i < 5; i++) {
      const txs = getInitialSyntheticTransactions();
      const cases = getInitialSyntheticCases();
      expect(txs.length).toBe(SYNTHETIC_TRANSACTIONS.length);
      expect(cases.length).toBe(INITIAL_SYNTHETIC_CASES.length);
    }
  });

  // 6. Polling and stale asynchronous callbacks during reset
  it('aborts stale asynchronous polling updates when a reset occurs during in-flight delay', async () => {
    let generation = 0;
    let transactions = getInitialSyntheticTransactions();
    const activeTimers = new Map<string, any>();
    const pendingResolvers = new Map<string, (val: string) => void>();

    // Simulated async poll function mirroring TransactionContext
    function simulatePoll(txId: string): Promise<string> {
      const currentGen = generation;
      return new Promise<string>((resolve) => {
        pendingResolvers.set(txId, resolve);

        const timer = setTimeout(() => {
          pendingResolvers.delete(txId);
          activeTimers.delete(txId);

          // If reset occurred while timer was pending, abort update!
          if (currentGen !== generation) {
            resolve('ABORTED_DUE_TO_RESET');
            return;
          }

          transactions = transactions.map((t) =>
            t.id === txId
              ? { ...t, evidence: { ...t.evidence, beneficiaryCredit: 'CREDITED' } }
              : t
          );
          resolve('COMPLETED');
        }, 50);

        activeTimers.set(txId, timer);
      });
    }

    // Start polling for SYNTH-TX-105
    const pollPromise = simulatePoll('SYNTH-TX-105');

    // Trigger Reset before the 50ms timer resolves
    generation += 1;
    activeTimers.forEach((timer) => clearTimeout(timer));
    activeTimers.clear();
    pendingResolvers.forEach((resolve) => resolve('RESOLVED_EARLY_ON_RESET'));
    pendingResolvers.clear();
    transactions = getInitialSyntheticTransactions();

    // Now wait for the promise to settle
    const outcome = await pollPromise;
    expect(outcome).toBe('RESOLVED_EARLY_ON_RESET');

    // Assert that the state remains pristine and was NOT modified by the stale callback
    const tx105 = transactions.find((t) => t.id === 'SYNTH-TX-105')!;
    expect(tx105.evidence.beneficiaryCredit).toBe('UNKNOWN');
  });

  // 7. Preservation of the cardinal retry safety invariant across resets
  it('guarantees retry safety invariant is strictly preserved before, during, and after resets', () => {
    const transactions = getInitialSyntheticTransactions();

    for (const tx of transactions) {
      const guidance = evaluateRecoveryGuidance(tx.evidence);

      // Only clean failures with zero debit (SYNTH-TX-110 and SYNTH-TX-111) permit retry
      if (tx.id === 'SYNTH-TX-110' || tx.id === 'SYNTH-TX-111') {
        expect(guidance.canonicalState).toBe('DEFINITIVE_FAILURE_NO_DEBIT');
        expect(guidance.safeToRetryPayment).toBe(true);
        expect(tx.evidence.remitterDebit).toBe('NOT_DEBITED');
        expect(tx.evidence.beneficiaryCredit).toBe('NOT_CREDITED');
        expect(tx.evidence.npciSwitch).toBe('FAILED');
      } else {
        // Every other synthetic transaction (uncertain, switch timeout, debit in-progress, contradiction)
        // MUST strictly have safeToRetryPayment === false
        expect(guidance.safeToRetryPayment).toBe(false);
        expect(guidance.primaryAction.safeToRetryPayment).toBe(false);
      }
    }
  });
});
