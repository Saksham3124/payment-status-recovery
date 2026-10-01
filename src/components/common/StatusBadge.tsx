'use client';

import React from 'react';
import { CanonicalRecoveryState } from '@/engine/types';
import { CheckCircle2, Clock, AlertTriangle, RefreshCcw, XCircle, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  state: CanonicalRecoveryState;
  showIcon?: boolean;
}

export function StatusBadge({ state, showIcon = true }: StatusBadgeProps) {
  switch (state) {
    case 'DEFINITIVE_SUCCESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
          <span>Settled (Success)</span>
        </span>
      );

    case 'CREDITED_MERCHANT_SYNC_LAG':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300/80 shadow-2xs">
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
          <span>Credited &bull; POS Delayed</span>
        </span>
      );

    case 'IN_FLIGHT_SWITCH_ACCEPTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/90 shadow-2xs">
          {showIcon && <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse shrink-0" />}
          <span>In-Flight &bull; Settling</span>
        </span>
      );

    case 'IN_FLIGHT_REMITTER_DEBITED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F79E1B]/15 text-amber-950 border border-[#F79E1B]/40 shadow-2xs">
          {showIcon && <Clock className="w-3.5 h-3.5 text-[#F79E1B] animate-pulse shrink-0" />}
          <span>Debited &bull; In-Flight</span>
        </span>
      );

    case 'UNRESOLVED_DEBIT_TIMEOUT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-900 border border-rose-300 shadow-2xs">
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
          <span>Debited &bull; Timeout Hold</span>
        </span>
      );

    case 'AUTO_REVERSAL_IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-900 border border-purple-200 shadow-2xs">
          {showIcon && <RefreshCcw className="w-3.5 h-3.5 text-purple-600 animate-spin shrink-0" />}
          <span>Auto-Reversal In Progress</span>
        </span>
      );

    case 'DEFINITIVE_FAILURE_NO_DEBIT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
          {showIcon && <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
          <span>Failed (No Debit)</span>
        </span>
      );

    case 'ANOMALOUS_CONTRADICTION':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EB001B]/10 text-[#EB001B] border border-[#EB001B]/30 shadow-2xs">
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-[#EB001B] shrink-0" />}
          <span>Telemetry Contradiction</span>
        </span>
      );

    case 'INDETERMINATE_SAFEGUARD':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-900 border border-yellow-300 shadow-2xs">
          {showIcon && <HelpCircle className="w-3.5 h-3.5 text-yellow-700 shrink-0" />}
          <span>Status Indeterminate</span>
        </span>
      );
  }
}

export function SafetyTag({ safeToRetry }: { safeToRetry: boolean }) {
  if (safeToRetry) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
        Safe to Retry
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#EB001B]/10 text-[#EB001B] border border-[#EB001B]/30 tracking-wider uppercase shadow-2xs">
      DO NOT RETRY
    </span>
  );
}
