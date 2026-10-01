'use client';

import React, { useState } from 'react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { AnalyticsEvent, AnalyticsEventType } from '@/analytics/types';
import { formatDateTime } from '@/lib/formatters';
import {
  Search,
  X,
  Filter,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileCode,
  SearchX,
  Database,
  AlertTriangle,
} from 'lucide-react';

const EVENT_TYPE_OPTIONS: { label: string; value: 'ALL' | AnalyticsEventType }[] = [
  { label: 'All Event Types', value: 'ALL' },
  { label: 'DASHBOARD_VIEWED', value: 'DASHBOARD_VIEWED' },
  { label: 'FILTER_APPLIED', value: 'FILTER_APPLIED' },
  { label: 'FILTERS_CLEARED', value: 'FILTERS_CLEARED' },
  { label: 'TRANSACTION_DETAILS_OPENED', value: 'TRANSACTION_DETAILS_OPENED' },
  { label: 'RECOVERY_GUIDANCE_VIEWED', value: 'RECOVERY_GUIDANCE_VIEWED' },
  { label: 'EVIDENCE_BREAKDOWN_INSPECTED', value: 'EVIDENCE_BREAKDOWN_INSPECTED' },
  { label: 'SUPPORT_CASE_FLOW_STARTED', value: 'SUPPORT_CASE_FLOW_STARTED' },
  { label: 'SUPPORT_CASE_CREATED', value: 'SUPPORT_CASE_CREATED' },
  { label: 'SUPPORT_CASE_CANCELLED', value: 'SUPPORT_CASE_CANCELLED' },
  { label: 'SUPPORT_CASE_STATUS_CHANGED', value: 'SUPPORT_CASE_STATUS_CHANGED' },
  { label: 'TELEMETRY_POLL_TRIGGERED', value: 'TELEMETRY_POLL_TRIGGERED' },
  { label: 'TELEMETRY_POLL_COMPLETED', value: 'TELEMETRY_POLL_COMPLETED' },
  { label: 'DEMO_DATA_RESET', value: 'DEMO_DATA_RESET' },
];

export function EventStreamTable() {
  const {
    events,
    filteredEvents,
    eventTypeFilter,
    setEventTypeFilter,
    transactionFilter,
    setTransactionFilter,
    clearFilters,
    clearAnalytics,
  } = useAnalytics();

  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const isFiltered = eventTypeFilter !== 'ALL' || transactionFilter !== '';

  const toggleExpand = (id: string) => {
    setExpandedEventId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search by Reference */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={transactionFilter}
              onChange={(e) => setTransactionFilter(e.target.value)}
              placeholder="Search by Transaction ID (SYNTH-TX...), Case ID, or Event ID..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 font-medium"
            />
            {transactionFilter && (
              <button
                type="button"
                onClick={() => setTransactionFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Event Type Filter */}
          <div className="relative min-w-[200px]">
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value as 'ALL' | AnalyticsEventType)}
              aria-label="Filter by Event Type"
              className="w-full text-xs font-semibold py-2 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
            >
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {isFiltered && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#EB001B] bg-[#EB001B]/10 hover:bg-[#EB001B]/20 rounded-lg border border-[#EB001B]/30 transition-colors shrink-0 shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          {/* Reset Analytics Action */}
          <div className="relative">
            {showConfirmReset ? (
              <div className="inline-flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 shadow-2xs">
                <span className="text-[11px] font-bold text-red-900 px-1.5">Confirm Clear?</span>
                <button
                  type="button"
                  onClick={() => {
                    clearAnalytics();
                    setShowConfirmReset(false);
                  }}
                  className="px-2 py-1 text-[11px] font-bold text-white bg-[#EB001B] hover:bg-red-700 rounded transition-colors shadow-2xs"
                >
                  Yes, Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-[#EB001B] hover:bg-red-50 rounded-lg border border-slate-200 transition-colors shrink-0 shadow-2xs"
                title="Clear in-memory analytics event log"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Events</span>
              </button>
            )}
          </div>
        </div>

        {/* Storage Mode Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
          <div className="flex items-center gap-1.5 font-medium">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>
              <strong>Storage Architecture:</strong> In-Memory Session Storage (Zero database, resets on page reload)
            </span>
          </div>
          <div>
            Showing <strong className="text-slate-900 font-mono tabular-nums">{filteredEvents.length}</strong> of{' '}
            <strong className="text-slate-900 font-mono tabular-nums">{events.length}</strong> events
          </div>
        </div>
      </div>

      {/* Events Table */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <SearchX className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No matching analytics events</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {events.length === 0
              ? 'No telemetry events recorded yet. Navigate transactions to generate event stream.'
              : 'Adjust search query or event type filter to inspect recorded events.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121824] border-b border-slate-800 font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-4 py-3">Timestamp</th>
                <th scope="col" className="px-4 py-3">Event Type</th>
                <th scope="col" className="px-4 py-3">Actor</th>
                <th scope="col" className="px-4 py-3">Associated Target</th>
                <th scope="col" className="px-4 py-3">Properties Summary</th>
                <th scope="col" className="px-4 py-3 text-right">Raw Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((evt) => {
                const isExpanded = expandedEventId === evt.id;

                let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                if (evt.eventType.includes('SUPPORT_CASE')) {
                  badgeColor = 'bg-purple-50 text-purple-900 border-purple-200';
                } else if (evt.eventType.includes('DETAILS') || evt.eventType.includes('GUIDANCE')) {
                  badgeColor = 'bg-emerald-50 text-emerald-900 border-emerald-200';
                } else if (evt.eventType.includes('POLL')) {
                  badgeColor = 'bg-amber-50 text-amber-950 border-amber-300';
                } else if (evt.eventType.includes('FILTER') || evt.eventType.includes('SEARCH')) {
                  badgeColor = 'bg-blue-50 text-blue-900 border-blue-200';
                }

                return (
                  <React.Fragment key={evt.id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 align-top whitespace-nowrap text-slate-500 font-mono tabular-nums">
                        {formatDateTime(evt.timestamp)}
                      </td>

                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] border shadow-2xs ${badgeColor}`}>
                          {evt.eventType}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span className="text-slate-700 font-semibold">{evt.actor}</span>
                      </td>

                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        {evt.transactionId ? (
                          <span className="font-mono text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                            {evt.transactionId}
                          </span>
                        ) : evt.caseId ? (
                          <span className="font-mono text-purple-900 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            {evt.caseId}
                          </span>
                        ) : (
                          <span className="text-slate-400">&mdash;</span>
                        )}
                      </td>

                      <td className="px-4 py-3 align-top max-w-xs truncate text-slate-600 font-mono text-[11px]">
                        {JSON.stringify(evt.properties)}
                      </td>

                      <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleExpand(evt.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors border border-slate-200 shadow-2xs"
                        >
                          <FileCode className="w-3 h-3 text-[#F79E1B]" />
                          <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Payload Viewer */}
                    {isExpanded && (
                      <tr className="bg-slate-950 text-slate-100">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px]">
                            <span className="font-mono text-[#F79E1B] font-bold">
                              Event Record: {evt.id} (Schema v{evt.schemaVersion})
                            </span>
                            <span className="font-mono text-slate-400">Session: {evt.sessionId}</span>
                          </div>
                          <pre className="font-mono text-[11px] text-emerald-400 overflow-x-auto p-3 bg-[#0B0E14] rounded-lg border border-slate-800">
                            {JSON.stringify(evt, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
