'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  AnalyticsEvent,
  AnalyticsEventType,
  BaseEventProperties,
  EventActor,
  FunnelMetrics,
} from '@/analytics/types';
import { generateSessionId, createValidEvent } from '@/analytics/schema';
import { calculateFunnelMetrics } from '@/analytics/metrics';

interface AnalyticsContextType {
  events: AnalyticsEvent[];
  filteredEvents: AnalyticsEvent[];
  sessionId: string;
  metrics: FunnelMetrics;
  trackEvent: (
    eventType: AnalyticsEventType,
    properties?: BaseEventProperties,
    transactionId?: string,
    caseId?: string,
    actor?: EventActor
  ) => void;
  eventTypeFilter: 'ALL' | AnalyticsEventType;
  setEventTypeFilter: (t: 'ALL' | AnalyticsEventType) => void;
  sessionFilter: string;
  setSessionFilter: (s: string) => void;
  transactionFilter: string;
  setTransactionFilter: (txId: string) => void;
  clearFilters: () => void;
  clearAnalytics: () => void;
  resetAnalytics: (retainAuditEvent?: boolean) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [sessionId] = useState<string>(() => generateSessionId());
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  // Filter state for analytics table
  const [eventTypeFilter, setEventTypeFilter] = useState<'ALL' | AnalyticsEventType>('ALL');
  const [sessionFilter, setSessionFilter] = useState<string>('ALL');
  const [transactionFilter, setTransactionFilter] = useState<string>('');

  // Deduplication cache: tracks event signatures within a short time window (500ms)
  const recentEventsRef = useRef<Map<string, number>>(new Map());

  /**
   * Safe, non-blocking event tracker.
   */
  const trackEvent = useCallback(
    (
      eventType: AnalyticsEventType,
      properties: BaseEventProperties = {},
      transactionId?: string,
      caseId?: string,
      actor: EventActor = 'USER'
    ) => {
      try {
        const now = Date.now();
        const dedupKey = `${eventType}-${transactionId || ''}-${caseId || ''}-${properties.canonicalState || ''}`;

        // Deduplicate rapid repeat events (e.g. React StrictMode or double re-renders within 400ms)
        const lastTime = recentEventsRef.current.get(dedupKey);
        if (lastTime && now - lastTime < 400) {
          return;
        }
        recentEventsRef.current.set(dedupKey, now);

        // Periodically purge old dedup keys
        if (recentEventsRef.current.size > 100) {
          recentEventsRef.current.clear();
        }

        const validEvent = createValidEvent(
          eventType,
          sessionId,
          actor,
          properties,
          transactionId,
          caseId
        );

        setEvents((prev) => [validEvent, ...prev]);
      } catch (err) {
        // Analytics failures must NEVER break transaction or support flows
        console.warn('[Analytics Tracker Silent Warning]:', err);
      }
    },
    [sessionId]
  );

  /**
   * Resets analytics state.
   * If retainAuditEvent is true (default for demo data reset), clears prior events and
   * leaves a single isolated DEMO_DATA_RESET audit record with all filters reset.
   * If false, completely empties the event stream.
   */
  const resetAnalytics = useCallback((retainAuditEvent = true) => {
    recentEventsRef.current.clear();
    setEventTypeFilter('ALL');
    setSessionFilter('ALL');
    setTransactionFilter('');

    if (retainAuditEvent) {
      const resetEvent = createValidEvent(
        'DEMO_DATA_RESET',
        sessionId,
        'SYSTEM',
        { resetScope: 'ALL_DATA', reason: 'USER_INITIATED_RESET' }
      );
      setEvents([resetEvent]);
    } else {
      setEvents([]);
    }
  }, [sessionId]);

  const clearAnalytics = useCallback(() => {
    resetAnalytics(false);
  }, [resetAnalytics]);

  const clearFilters = useCallback(() => {
    setEventTypeFilter('ALL');
    setSessionFilter('ALL');
    setTransactionFilter('');
  }, []);

  const metrics = useMemo(() => calculateFunnelMetrics(events), [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (eventTypeFilter !== 'ALL' && e.eventType !== eventTypeFilter) {
        return false;
      }
      if (sessionFilter !== 'ALL' && e.sessionId !== sessionFilter) {
        return false;
      }
      if (transactionFilter.trim()) {
        const q = transactionFilter.toLowerCase().trim();
        const matchesTx = e.transactionId?.toLowerCase().includes(q);
        const matchesCase = e.caseId?.toLowerCase().includes(q);
        const matchesId = e.id.toLowerCase().includes(q);
        if (!matchesTx && !matchesCase && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [events, eventTypeFilter, sessionFilter, transactionFilter]);

  return (
    <AnalyticsContext.Provider
      value={{
        events,
        filteredEvents,
        sessionId,
        metrics,
        trackEvent,
        eventTypeFilter,
        setEventTypeFilter,
        sessionFilter,
        setSessionFilter,
        transactionFilter,
        setTransactionFilter,
        clearFilters,
        clearAnalytics,
        resetAnalytics,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
