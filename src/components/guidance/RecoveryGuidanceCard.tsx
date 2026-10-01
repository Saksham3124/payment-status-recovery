'use client';

import React from 'react';
import { RecoveryGuidance } from '@/engine/types';
import {
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  FileText,
  ExternalLink,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface RecoveryGuidanceCardProps {
  guidance: RecoveryGuidance;
  isPolling?: boolean;
  onPoll?: () => void;
}

export function RecoveryGuidanceCard({
  guidance,
  isPolling = false,
  onPoll,
}: RecoveryGuidanceCardProps) {
  const {
    knownFacts,
    unknownFacts,
    primaryAction,
    secondaryAction,
    regulatoryCitation,
    simulationThreshold,
    safeToRetryPayment,
  } = guidance;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-6">
      {/* Header Directive Banner */}
      <div
        className={`p-5 border-b transition-colors ${
          safeToRetryPayment
            ? 'bg-emerald-950 text-white border-emerald-900'
            : guidance.severity === 'CRITICAL_HOLD'
            ? 'bg-[#121824] text-white border-red-500/50 ring-1 ring-red-500/30'
            : 'bg-[#121824] text-white border-amber-500/40 ring-1 ring-amber-500/20'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2 rounded-lg shrink-0 mt-0.5 shadow-xs ${
                safeToRetryPayment
                  ? 'bg-emerald-600 text-white'
                  : guidance.severity === 'CRITICAL_HOLD'
                  ? 'bg-red-600 text-white'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              {safeToRetryPayment ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded shadow-2xs border ${
                    safeToRetryPayment
                      ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700'
                      : 'bg-red-950/80 text-red-200 border-red-700'
                  }`}
                >
                  {safeToRetryPayment ? 'Safe to Retry' : 'Strict Directive: DO NOT RETRY'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Rule: {guidance.ruleMatchedId}
                </span>
              </div>
              <h2 className="text-lg font-bold mt-1.5 text-white tracking-tight">{guidance.headline}</h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{guidance.subheadline}</p>
            </div>
          </div>

          {onPoll && (
            <button
              type="button"
              onClick={onPoll}
              disabled={isPolling}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-95 shrink-0 ${
                isPolling
                  ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed'
                  : 'bg-slate-900 text-slate-200 hover:text-white hover:bg-slate-800 border-slate-700 shadow-2xs'
              }`}
              title="Simulate refreshing banking telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
              <span>{isPolling ? 'Polling Bank...' : 'Re-check Telemetry'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Three Distinct Sections: What We Know, What Remains Uncertain, Recommended Action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: What We Know */}
          <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/90">
            <div className="flex items-center gap-2 mb-3 text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                What We Know
              </h3>
            </div>
            {knownFacts.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-700">
                {knownFacts.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">No confirmed telemetry recorded yet.</p>
            )}
          </div>

          {/* Section 2: What Remains Uncertain */}
          <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/90">
            <div className="flex items-center gap-2 mb-3 text-slate-900">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                What Remains Uncertain
              </h3>
            </div>
            {unknownFacts.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-700">
                {unknownFacts.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">All multi-party telemetry signals have been fully reconciled.</p>
            )}
          </div>
        </div>

        {/* Section 3: Recommended Next Step */}
        <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/70">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-4 h-4 text-slate-900 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Recommended Next Step
            </h3>
          </div>
          <div className="text-sm font-bold text-slate-950">{primaryAction.label}</div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {primaryAction.description}
          </p>

          {secondaryAction && (
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                <strong className="text-slate-900">Alternative Escalation:</strong> {secondaryAction.description}
              </span>
            </div>
          )}
        </div>

        {/* Product Simulation Threshold Clarification */}
        {simulationThreshold && (
          <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950">
                {simulationThreshold.windowName} ({simulationThreshold.thresholdMinutes} minutes):
              </span>{' '}
              {simulationThreshold.purpose}
            </div>
          </div>
        )}

        {/* Statutory Regulatory Citation (RBI TAT Framework) */}
        {regulatoryCitation && (
          <div className="p-5 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Applicable Statutory Regulatory Mandate
                </h4>
              </div>
              <a
                href={regulatoryCitation.officialDocUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:text-amber-300 underline inline-flex items-center gap-1 font-semibold transition-colors"
              >
                <span>RBI Circular</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="text-xs font-bold text-white">
              {regulatoryCitation.framework} ({regulatoryCitation.circularRef})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2.5 border-t border-slate-800">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Applicable Clause:</span>
                <span className="text-slate-200 font-medium">{regulatoryCitation.applicableClause}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Mandated Auto-Reversal TAT:</span>
                <span className="text-emerald-400 font-bold">{regulatoryCitation.mandatedTat}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Delay Compensation Policy:</span>
                <span className="text-amber-300 font-medium">{regulatoryCitation.compensationPolicy}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-800">
              Important Distinction: Statutory TAT is an official regulatory banking deadline and does not promise immediate instantaneous refund. It is separate from the app’s 15-minute UX cooldown.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
