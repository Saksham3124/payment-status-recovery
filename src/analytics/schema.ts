/**
 * Analytics Schema Validation & Privacy Sanitizer
 *
 * Ensures all events conform to strict privacy guidelines:
 * 1. Prohibits logging of raw search text, user descriptions, VPAs, or credentials.
 * 2. Validates versioned event structures.
 */

import {
  ANALYTICS_SCHEMA_VERSION,
  AnalyticsEvent,
  AnalyticsEventType,
  BaseEventProperties,
  EventActor,
} from './types';

// Sensitive keys strictly forbidden from event property payloads
const FORBIDDEN_PROPERTY_KEYS = new Set([
  'vpa',
  'upiId',
  'pin',
  'otp',
  'accountNumber',
  'account',
  'password',
  'rawQuery',
  'searchQuery',
  'description',
  'freeText',
  'userNotes',
]);

export function generateSessionId(): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timePart = Date.now().toString(36).toUpperCase();
  return `SESS-${timePart}-${rand}`;
}

export function generateEventId(): string {
  const rand = Math.random().toString(36).substring(2, 7);
  return `EVT-${Date.now()}-${rand}`;
}

/**
 * Sanitizes event properties to eliminate any accidental sensitive free-text data.
 */
export function sanitizeEventProperties<T extends BaseEventProperties>(rawProps: T): BaseEventProperties {
  const sanitized: BaseEventProperties = {};

  for (const [key, value] of Object.entries(rawProps || {})) {
    const lowerKey = key.toLowerCase();

    // Check against forbidden keys
    if (FORBIDDEN_PROPERTY_KEYS.has(key) || lowerKey.includes('pin') || lowerKey.includes('password')) {
      continue; // Strip forbidden property entirely
    }

    // Only allow primitive types (string, number, boolean)
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function createValidEvent<T extends BaseEventProperties>(
  eventType: AnalyticsEventType,
  sessionId: string,
  actor: EventActor,
  properties: T,
  transactionId?: string,
  caseId?: string
): AnalyticsEvent {
  const sanitizedProps = sanitizeEventProperties(properties);

  return {
    id: generateEventId(),
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    eventType,
    sessionId: sessionId || 'SESS-DEFAULT',
    timestamp: new Date().toISOString(),
    actor: actor || 'USER',
    transactionId: transactionId ? String(transactionId) : undefined,
    caseId: caseId ? String(caseId) : undefined,
    properties: sanitizedProps,
    isSynthetic: true,
  };
}
