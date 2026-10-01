'use client';

import React from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { CanonicalRecoveryState, TransactionType } from '@/engine/types';
import { Search, X, Filter } from 'lucide-react';

const STATUS_OPTIONS: { label: string; value: 'ALL' | CanonicalRecoveryState }[] = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Settled (Success)', value: 'DEFINITIVE_SUCCESS' },
  { label: 'Credited • POS Delayed', value: 'CREDITED_MERCHANT_SYNC_LAG' },
  { label: 'In-Flight • Settling', value: 'IN_FLIGHT_SWITCH_ACCEPTED' },
  { label: 'Debited • In-Flight (<15m)', value: 'IN_FLIGHT_REMITTER_DEBITED' },
  { label: 'Debited • Timeout Hold (≥15m)', value: 'UNRESOLVED_DEBIT_TIMEOUT' },
  { label: 'Auto-Reversal In Progress', value: 'AUTO_REVERSAL_IN_PROGRESS' },
  { label: 'Failed • No Debit', value: 'DEFINITIVE_FAILURE_NO_DEBIT' },
  { label: 'Telemetry Contradiction', value: 'ANOMALOUS_CONTRADICTION' },
  { label: 'Status Indeterminate', value: 'INDETERMINATE_SAFEGUARD' },
];

export function TransactionFilterBar() {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    clearFilters,
    filteredTransactions,
    transactions,
  } = useTransactions();
  const { trackEvent } = useAnalytics();

  const isFiltered = searchQuery !== '' || statusFilter !== 'ALL' || typeFilter !== 'ALL';

  const handleStatusChange = (val: 'ALL' | CanonicalRecoveryState) => {
    setStatusFilter(val);
    trackEvent('FILTER_APPLIED', { filterType: 'STATUS', value: val });
  };

  const handleTypeChange = (type: 'ALL' | TransactionType) => {
    setTypeFilter(type);
    trackEvent('FILTER_APPLIED', { filterType: 'TYPE', value: type });
  };

  const handleClearFilters = () => {
    clearFilters();
    trackEvent('FILTERS_CLEARED');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs mb-6 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID (SYNTH-TX...), UTR, merchant, or recipient..."
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Select */}
          <div className="relative min-w-[200px]">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as 'ALL' | CanonicalRecoveryState)}
              aria-label="Filter by Recovery Status"
              className="w-full text-xs font-semibold py-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs transition-all"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter Segmented Control */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs shadow-inner">
            {(['ALL', 'P2M', 'P2P'] as ('ALL' | TransactionType)[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all duration-200 ease-out transform active:scale-95 ${
                  typeFilter === type
                    ? 'bg-slate-900 text-white shadow-xs scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {type === 'ALL' ? 'All Types' : type === 'P2M' ? 'P2M (Merchant)' : 'P2P (Personal)'}
              </button>
            ))}
          </div>

          {/* Clear Filters Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200/80 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-95 shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Result Metrics */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div>
          Showing <span className="font-mono font-bold text-slate-900 tabular-nums">{filteredTransactions.length}</span> of{' '}
          <span className="font-mono font-bold text-slate-900 tabular-nums">{transactions.length}</span> synthetic transactions
        </div>
        {isFiltered && (
          <div className="text-[#F79E1B] font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <Filter className="w-3 h-3" />
            <span>Filters Active</span>
          </div>
        )}
      </div>
    </div>
  );
}
