'use client';

import React from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { CheckCircle2, AlertTriangle, RefreshCcw, XCircle, Layers } from 'lucide-react';

export function StatusOverviewCards() {
  const { statusCounts, statusFilter, setStatusFilter } = useTransactions();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
      {/* Total Card */}
      <button
        type="button"
        onClick={() => setStatusFilter('ALL')}
        className={`relative overflow-hidden p-4 rounded-xl border text-left transition-all duration-300 ease-out transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer group ${
          statusFilter === 'ALL'
            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/40'
            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700 transition-all duration-300 group-hover:h-1.5" />
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>
            Total Records
          </span>
          <Layers className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${statusFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`} />
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold tabular-nums">{statusCounts.total}</div>
        <div className={`text-[11px] mt-1 ${statusFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>
          Simulated synthetic dataset
        </div>
      </button>

      {/* Settled Success */}
      <button
        type="button"
        onClick={() => setStatusFilter('DEFINITIVE_SUCCESS')}
        className={`relative overflow-hidden p-4 rounded-xl border text-left transition-all duration-300 ease-out transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer group ${
          statusFilter === 'DEFINITIVE_SUCCESS'
            ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-700/40'
            : 'bg-white hover:bg-emerald-50/40 text-slate-800 border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-sm'
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 transition-all duration-300 group-hover:h-1.5" />
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'DEFINITIVE_SUCCESS' ? 'text-emerald-200' : 'text-emerald-700'}`}>
            Settled (Success)
          </span>
          <CheckCircle2 className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${statusFilter === 'DEFINITIVE_SUCCESS' ? 'text-emerald-300' : 'text-emerald-600'}`} />
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold tabular-nums text-emerald-600 group-hover:text-emerald-700 transition-colors">
          {statusCounts.settled}
        </div>
        <div className={`text-[11px] mt-1 ${statusFilter === 'DEFINITIVE_SUCCESS' ? 'text-emerald-200' : 'text-slate-500'}`}>
          4-party end-to-end receipt
        </div>
      </button>

      {/* Uncertain / In-Flight (Crucial PM focus - High Double Debit Risk) */}
      <button
        type="button"
        onClick={() => {
          setStatusFilter('IN_FLIGHT_REMITTER_DEBITED');
        }}
        className={`relative overflow-hidden p-4 rounded-xl border text-left transition-all duration-300 ease-out transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer group ${
          statusFilter === 'IN_FLIGHT_REMITTER_DEBITED' ||
          statusFilter === 'IN_FLIGHT_SWITCH_ACCEPTED' ||
          statusFilter === 'UNRESOLVED_DEBIT_TIMEOUT' ||
          statusFilter === 'CREDITED_MERCHANT_SYNC_LAG' ||
          statusFilter === 'ANOMALOUS_CONTRADICTION' ||
          statusFilter === 'INDETERMINATE_SAFEGUARD'
            ? 'bg-[#121824] text-white border-amber-500 shadow-md ring-2 ring-amber-500/40'
            : 'bg-white hover:bg-amber-50/40 text-slate-800 border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-sm'
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 transition-all duration-300 group-hover:h-1.5" />
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${
            statusFilter === 'IN_FLIGHT_REMITTER_DEBITED' ? 'text-amber-400' : 'text-amber-800'
          }`}>
            Uncertain / In-Flight
          </span>
          <AlertTriangle className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
            statusFilter === 'IN_FLIGHT_REMITTER_DEBITED' ? 'text-amber-400' : 'text-amber-600'
          }`} />
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold tabular-nums text-amber-500 group-hover:text-amber-600 transition-colors">
          {statusCounts.uncertain}
        </div>
        <div className={`text-[11px] mt-1 font-medium ${
          statusFilter === 'IN_FLIGHT_REMITTER_DEBITED' ? 'text-amber-200' : 'text-amber-800'
        }`}>
          High double-debit risk
        </div>
      </button>

      {/* Auto-Reversals */}
      <button
        type="button"
        onClick={() => setStatusFilter('AUTO_REVERSAL_IN_PROGRESS')}
        className={`relative overflow-hidden p-4 rounded-xl border text-left transition-all duration-300 ease-out transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer group ${
          statusFilter === 'AUTO_REVERSAL_IN_PROGRESS'
            ? 'bg-purple-900 text-white border-purple-800 shadow-md ring-2 ring-purple-600/40'
            : 'bg-white hover:bg-purple-50/40 text-slate-800 border-slate-200/90 shadow-2xs hover:border-purple-300 hover:shadow-sm'
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600 transition-all duration-300 group-hover:h-1.5" />
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${
            statusFilter === 'AUTO_REVERSAL_IN_PROGRESS' ? 'text-purple-200' : 'text-purple-700'
          }`}>
            Auto-Reversals
          </span>
          <RefreshCcw className={`w-4 h-4 transition-transform duration-300 group-hover:rotate-45 ${
            statusFilter === 'AUTO_REVERSAL_IN_PROGRESS' ? 'text-purple-300' : 'text-purple-600'
          }`} />
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold tabular-nums text-purple-700 group-hover:text-purple-800 transition-colors">
          {statusCounts.reversals}
        </div>
        <div className={`text-[11px] mt-1 ${
          statusFilter === 'AUTO_REVERSAL_IN_PROGRESS' ? 'text-purple-200' : 'text-slate-500'
        }`}>
          Refund SLA mandated
        </div>
      </button>

      {/* Clean Failures */}
      <button
        type="button"
        onClick={() => setStatusFilter('DEFINITIVE_FAILURE_NO_DEBIT')}
        className={`relative overflow-hidden p-4 rounded-xl border text-left transition-all duration-300 ease-out transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer group col-span-2 lg:col-span-1 ${
          statusFilter === 'DEFINITIVE_FAILURE_NO_DEBIT'
            ? 'bg-slate-900 text-white border-slate-800 shadow-md ring-2 ring-slate-700/40'
            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 transition-all duration-300 group-hover:h-1.5" />
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${
            statusFilter === 'DEFINITIVE_FAILURE_NO_DEBIT' ? 'text-slate-200' : 'text-slate-600'
          }`}>
            Failed (No Debit)
          </span>
          <XCircle className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
            statusFilter === 'DEFINITIVE_FAILURE_NO_DEBIT' ? 'text-slate-300' : 'text-slate-500'
          }`} />
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold tabular-nums text-slate-700 group-hover:text-slate-900 transition-colors">
          {statusCounts.failures}
        </div>
        <div className={`text-[11px] mt-1 ${
          statusFilter === 'DEFINITIVE_FAILURE_NO_DEBIT' ? 'text-slate-200' : 'text-slate-500'
        }`}>
          Safe to retry immediately
        </div>
      </button>
    </div>
  );
}
