/**
 * Honest Metric Definitions & Computations
 *
 * Implements pure metric computation over recorded synthetic events.
 * Clearly documents counting rules, numerators, and denominators.
 */

import { AnalyticsEvent, FunnelMetrics } from './types';

/**
 * Computes product funnel metrics over an array of recorded events.
 *
 * FORMULA SPECIFICATION:
 * 1. caseCreationCompletionRate:
 *    - Numerator: Count of 'SUPPORT_CASE_CREATED' events
 *    - Denominator: Count of 'SUPPORT_CASE_FLOW_STARTED' events
 *    - Guard: Evaluates to 0 if Denominator === 0.
 *
 * 2. caseCreationExplicitAbandonmentRate:
 *    - Numerator: Count of 'SUPPORT_CASE_CANCELLED' events (explicit user dismissal)
 *    - Denominator: Count of 'SUPPORT_CASE_FLOW_STARTED' events
 *    - Guard: Evaluates to 0 if Denominator === 0.
 *    - Note: Only explicit cancellations are counted; uncompleted in-progress sessions
 *      are never assumed to be abandoned.
 *
 * 3. uniqueSessions:
 *    - Count of distinct session identifiers observed.
 */
export function calculateFunnelMetrics(events: AnalyticsEvent[]): FunnelMetrics {
  const sessionSet = new Set<string>();

  let dashboardViews = 0;
  let transactionDetailViews = 0;
  let evidenceBreakdownInspections = 0;
  let pollingTriggers = 0;
  let searchFilterActions = 0;

  let caseCreationFlowsStarted = 0;
  let caseCreationsCompleted = 0;
  let caseCreationsCancelled = 0;
  let caseStatusTransitions = 0;

  for (const e of events) {
    if (e.sessionId) {
      sessionSet.add(e.sessionId);
    }

    switch (e.eventType) {
      case 'DASHBOARD_VIEWED':
        dashboardViews++;
        break;
      case 'TRANSACTION_DETAILS_OPENED':
        transactionDetailViews++;
        break;
      case 'EVIDENCE_BREAKDOWN_INSPECTED':
        evidenceBreakdownInspections++;
        break;
      case 'TELEMETRY_POLL_TRIGGERED':
        pollingTriggers++;
        break;
      case 'FILTER_APPLIED':
      case 'FILTERS_CLEARED':
      case 'SEARCH_PERFORMED':
        searchFilterActions++;
        break;
      case 'SUPPORT_CASE_FLOW_STARTED':
        caseCreationFlowsStarted++;
        break;
      case 'SUPPORT_CASE_CREATED':
        caseCreationsCompleted++;
        break;
      case 'SUPPORT_CASE_CANCELLED':
        caseCreationsCancelled++;
        break;
      case 'SUPPORT_CASE_STATUS_CHANGED':
        caseStatusTransitions++;
        break;
      default:
        break;
    }
  }

  const caseCreationCompletionRate =
    caseCreationFlowsStarted > 0
      ? caseCreationsCompleted / caseCreationFlowsStarted
      : 0;

  const caseCreationExplicitAbandonmentRate =
    caseCreationFlowsStarted > 0
      ? caseCreationsCancelled / caseCreationFlowsStarted
      : 0;

  return {
    totalEvents: events.length,
    uniqueSessions: sessionSet.size,
    dashboardViews,
    transactionDetailViews,
    evidenceBreakdownInspections,
    pollingTriggers,
    searchFilterActions,
    caseCreationFlowsStarted,
    caseCreationsCompleted,
    caseCreationsCancelled,
    caseCreationCompletionRate,
    caseCreationExplicitAbandonmentRate,
    caseStatusTransitions,
  };
}
