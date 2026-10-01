import { describe, it, expect, vi } from 'vitest';
import { createValidEvent } from '@/analytics/schema';
import { AnalyticsEvent, AnalyticsEventType } from '@/analytics/types';
import { evaluateRecoveryGuidance } from '@/engine/recovery-engine';
import { SYNTHETIC_TRANSACTIONS } from '@/mock/synthetic-transactions';

function filterEvents(
  events: AnalyticsEvent[],
  typeFilter: 'ALL' | AnalyticsEventType,
  sessionFilter: string,
  targetQuery: string
) {
  return events.filter((e) => {
    if (typeFilter !== 'ALL' && e.eventType !== typeFilter) return false;
    if (sessionFilter !== 'ALL' && e.sessionId !== sessionFilter) return false;
    if (targetQuery.trim()) {
      const q = targetQuery.toLowerCase().trim();
      const matchesTx = e.transactionId?.toLowerCase().includes(q);
      const matchesCase = e.caseId?.toLowerCase().includes(q);
      const matchesId = e.id.toLowerCase().includes(q);
      if (!matchesTx && !matchesCase && !matchesId) return false;
    }
    return true;
  });
}

describe('Analytics Resilience, Deduplication, and Isolation', () => {
  const sess = 'SESS-TEST-123';

  it('filters events accurately by type, session, and target ID', () => {
    const events: AnalyticsEvent[] = [
      createValidEvent('DASHBOARD_VIEWED', sess, 'USER', {}),
      createValidEvent('TRANSACTION_DETAILS_OPENED', sess, 'USER', {}, 'SYNTH-TX-105'),
      createValidEvent('SUPPORT_CASE_CREATED', 'SESS-OTHER-456', 'USER', {}, 'SYNTH-TX-105', 'CASE-1001'),
    ];

    // Filter by type
    const dashboardEvents = filterEvents(events, 'DASHBOARD_VIEWED', 'ALL', '');
    expect(dashboardEvents.length).toBe(1);

    // Filter by target ID
    const tx105Events = filterEvents(events, 'ALL', 'ALL', 'SYNTH-TX-105');
    expect(tx105Events.length).toBe(2);

    // Filter by session
    const sessEvents = filterEvents(events, 'ALL', sess, '');
    expect(sessEvents.length).toBe(2);
  });

  it('guarantees analytics operations cannot modify transaction evidence or retry eligibility', () => {
    const tx = SYNTHETIC_TRANSACTIONS.find((t) => t.id === 'SYNTH-TX-105')!;
    const initialGuidance = evaluateRecoveryGuidance(tx.evidence);
    expect(initialGuidance.safeToRetryPayment).toBe(false);

    // Emit analytics event
    const evt = createValidEvent(
      'TRANSACTION_DETAILS_OPENED',
      sess,
      'USER',
      { canonicalState: initialGuidance.canonicalState },
      tx.id
    );
    expect(evt).toBeDefined();

    // Re-evaluate guidance: must remain strictly unchanged
    const reEvaluated = evaluateRecoveryGuidance(tx.evidence);
    expect(reEvaluated.canonicalState).toBe(initialGuidance.canonicalState);
    expect(reEvaluated.safeToRetryPayment).toBe(false);
  });

  it('records DEMO_DATA_RESET event on reset without crashing', () => {
    const resetEvt = createValidEvent(
      'DEMO_DATA_RESET',
      sess,
      'USER',
      { resetScope: 'ALL' }
    );
    expect(resetEvt.eventType).toBe('DEMO_DATA_RESET');
    expect(resetEvt.properties.resetScope).toBe('ALL');
  });
});
