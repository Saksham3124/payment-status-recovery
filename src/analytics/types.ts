/**
 * Product Event Logging - Typed Schema & Contracts
 *
 * Defines versioned, privacy-preserving event contracts for PM analytics.
 * Strictly avoids logging free-text PII, VPAs, bank credentials, or raw query text.
 */

export const ANALYTICS_SCHEMA_VERSION = '1.0.0';

export type EventActor = 'USER' | 'SYSTEM';

export type AnalyticsEventType =
  | 'DASHBOARD_VIEWED'
  | 'FILTER_APPLIED'
  | 'FILTERS_CLEARED'
  | 'SEARCH_PERFORMED'
  | 'TRANSACTION_DETAILS_OPENED'
  | 'RECOVERY_GUIDANCE_VIEWED'
  | 'EVIDENCE_BREAKDOWN_INSPECTED'
  | 'SUPPORT_CASE_FLOW_STARTED'
  | 'SUPPORT_CASE_CREATED'
  | 'SUPPORT_CASE_CANCELLED'
  | 'SUPPORT_CASE_STATUS_CHANGED'
  | 'TELEMETRY_POLL_TRIGGERED'
  | 'TELEMETRY_POLL_COMPLETED'
  | 'DEMO_DATA_RESET';

export interface BaseEventProperties {
  [key: string]: string | number | boolean | undefined;
}

export interface AnalyticsEvent<T extends BaseEventProperties = BaseEventProperties> {
  id: string; // Unique event ID e.g. EVT-172778...-abc
  schemaVersion: typeof ANALYTICS_SCHEMA_VERSION;
  eventType: AnalyticsEventType;
  sessionId: string; // Ephemeral synthetic session ID
  timestamp: string; // ISO 8601
  actor: EventActor;
  transactionId?: string; // Optional linked synthetic TX
  caseId?: string; // Optional linked synthetic support case
  properties: T;
  isSynthetic: true;
}

/**
 * Metric calculation results with explicit documentation of formulas.
 */
export interface FunnelMetrics {
  totalEvents: number;
  uniqueSessions: number;
  dashboardViews: number;
  transactionDetailViews: number;
  evidenceBreakdownInspections: number;
  pollingTriggers: number;
  searchFilterActions: number;

  // Case creation funnel metrics
  caseCreationFlowsStarted: number;
  caseCreationsCompleted: number;
  caseCreationsCancelled: number; // Explicit user cancellation
  caseCreationCompletionRate: number; // completed / started (0 to 1)
  caseCreationExplicitAbandonmentRate: number; // cancelled / started (0 to 1)

  // Support lifecycle metrics
  caseStatusTransitions: number;
}
