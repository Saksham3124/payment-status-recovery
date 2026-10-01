import { describe, it, expect } from 'vitest';
import {
  createValidEvent,
  sanitizeEventProperties,
  generateSessionId,
  generateEventId,
} from '@/analytics/schema';
import { ANALYTICS_SCHEMA_VERSION } from '@/analytics/types';

describe('Analytics Event Schema & Privacy Sanitization', () => {
  it('generates valid versioned events with required fields', () => {
    const sessionId = generateSessionId();
    expect(sessionId).toMatch(/^SESS-[A-Z0-9]+-[A-Z0-9]+$/);

    const event = createValidEvent(
      'DASHBOARD_VIEWED',
      sessionId,
      'USER',
      { viewMode: 'TRANSACTION_OVERVIEW', recordsCount: 13 },
      'SYNTH-TX-101'
    );

    expect(event.id).toMatch(/^EVT-\d+-[a-z0-9]+$/);
    expect(event.schemaVersion).toBe(ANALYTICS_SCHEMA_VERSION);
    expect(event.eventType).toBe('DASHBOARD_VIEWED');
    expect(event.sessionId).toBe(sessionId);
    expect(event.actor).toBe('USER');
    expect(event.transactionId).toBe('SYNTH-TX-101');
    expect(event.isSynthetic).toBe(true);
    expect(event.properties.viewMode).toBe('TRANSACTION_OVERVIEW');
    expect(event.properties.recordsCount).toBe(13);
  });

  it('strictly strips sensitive keys, VPAs, pins, and passwords from properties', () => {
    const sensitivePayload = {
      safeProperty: 'allowed_value',
      count: 42,
      vpa: 'user@okhdfcbank',
      pin: '1234',
      userPassword: 'secretPassword',
      accountNumber: '123456789012',
      description: 'Secret personal notes',
      nestedDangerousKey: 'xyz',
    };

    const sanitized = sanitizeEventProperties(sensitivePayload);

    // Allowed primitives must remain
    expect(sanitized.safeProperty).toBe('allowed_value');
    expect(sanitized.count).toBe(42);

    // Forbidden keys must be completely removed
    expect(sanitized.vpa).toBeUndefined();
    expect(sanitized.pin).toBeUndefined();
    expect(sanitized.userPassword).toBeUndefined();
    expect(sanitized.accountNumber).toBeUndefined();
    expect(sanitized.description).toBeUndefined();
  });
});
