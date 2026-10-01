import { describe, it, expect } from 'vitest';
import { calculateFunnelMetrics } from '@/analytics/metrics';
import { AnalyticsEvent } from '@/analytics/types';
import { createValidEvent } from '@/analytics/schema';

describe('Analytics Metric Calculations & Counting Rules', () => {
  const sess1 = 'SESS-AAA-111';
  const sess2 = 'SESS-BBB-222';

  it('handles empty event streams safely without division by zero', () => {
    const metrics = calculateFunnelMetrics([]);
    expect(metrics.totalEvents).toBe(0);
    expect(metrics.uniqueSessions).toBe(0);
    expect(metrics.caseCreationCompletionRate).toBe(0);
    expect(metrics.caseCreationExplicitAbandonmentRate).toBe(0);
  });

  it('calculates completion and explicit abandonment rates accurately', () => {
    const events: AnalyticsEvent[] = [
      // Session 1: 2 flows started, 1 completed, 1 explicitly cancelled
      createValidEvent('SUPPORT_CASE_FLOW_STARTED', sess1, 'USER', {}, 'SYNTH-TX-101'),
      createValidEvent('SUPPORT_CASE_CREATED', sess1, 'USER', {}, 'SYNTH-TX-101', 'CASE-1001'),

      createValidEvent('SUPPORT_CASE_FLOW_STARTED', sess1, 'USER', {}, 'SYNTH-TX-105'),
      createValidEvent('SUPPORT_CASE_CANCELLED', sess1, 'USER', { exitStep: 'REVIEW' }, 'SYNTH-TX-105'),

      // Session 2: 1 flow started, 1 completed
      createValidEvent('SUPPORT_CASE_FLOW_STARTED', sess2, 'USER', {}, 'SYNTH-TX-107'),
      createValidEvent('SUPPORT_CASE_CREATED', sess2, 'USER', {}, 'SYNTH-TX-107', 'CASE-1002'),

      // Other actions
      createValidEvent('DASHBOARD_VIEWED', sess1, 'USER', {}),
      createValidEvent('TRANSACTION_DETAILS_OPENED', sess1, 'USER', {}, 'SYNTH-TX-101'),
      createValidEvent('TELEMETRY_POLL_TRIGGERED', sess2, 'USER', {}, 'SYNTH-TX-107'),
    ];

    const metrics = calculateFunnelMetrics(events);

    expect(metrics.totalEvents).toBe(9);
    expect(metrics.uniqueSessions).toBe(2);
    expect(metrics.dashboardViews).toBe(1);
    expect(metrics.transactionDetailViews).toBe(1);
    expect(metrics.pollingTriggers).toBe(1);

    // Funnel calculations: 3 started, 2 completed, 1 cancelled
    expect(metrics.caseCreationFlowsStarted).toBe(3);
    expect(metrics.caseCreationsCompleted).toBe(2);
    expect(metrics.caseCreationsCancelled).toBe(1);

    // Completion rate = 2 / 3 = 0.666...
    expect(metrics.caseCreationCompletionRate).toBeCloseTo(2 / 3, 2);

    // Explicit abandonment rate = 1 / 3 = 0.333...
    expect(metrics.caseCreationExplicitAbandonmentRate).toBeCloseTo(1 / 3, 2);
  });

  it('does NOT falsely count unfinished in-progress flows as abandonment', () => {
    const events: AnalyticsEvent[] = [
      // User started flow, but has not cancelled or submitted yet (in progress)
      createValidEvent('SUPPORT_CASE_FLOW_STARTED', sess1, 'USER', {}, 'SYNTH-TX-103'),
    ];

    const metrics = calculateFunnelMetrics(events);
    expect(metrics.caseCreationFlowsStarted).toBe(1);
    expect(metrics.caseCreationsCompleted).toBe(0);
    expect(metrics.caseCreationsCancelled).toBe(0);
    // Crucial PM rule: unproven abandonment is NOT inferred!
    expect(metrics.caseCreationExplicitAbandonmentRate).toBe(0);
  });
});
