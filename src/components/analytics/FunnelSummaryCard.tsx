'use client';

import React from 'react';
import { FunnelMetrics } from '@/analytics/types';
import { Info, CheckCircle2, XCircle, Clock, PlayCircle } from 'lucide-react';

interface FunnelSummaryCardProps {
  metrics: FunnelMetrics;
}

export function FunnelSummaryCard({ metrics }: FunnelSummaryCardProps) {
  const started = metrics.caseCreationFlowsStarted;
  const completed = metrics.caseCreationsCompleted;
  const cancelled = metrics.caseCreationsCancelled;
  const inProgress = Math.max(0, started - completed - cancelled);

  const completionPct = started > 0 ? Math.round((completed / started) * 100) : null;
  const cancellationPct = started > 0 ? Math.round((cancelled / started) * 100) : null;
  const inProgressPct = started > 0 ? Math.max(0, 100 - (completionPct || 0) - (cancellationPct || 0)) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-5">
      {/* Funnel KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Cases Started */}
        <div className="relative overflow-hidden bg-slate-50/90 border border-slate-200/90 rounded-xl p-4 shadow-2xs transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              1. Cases Started
            </span>
            <PlayCircle className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-mono font-black text-slate-950 tabular-nums mt-2">{started}</div>
          <p className="text-xs text-slate-500 mt-1">
            Support modal inquiries initiated
          </p>
        </div>

        {/* 2. Cases Created / Completed */}
        <div className="relative overflow-hidden bg-emerald-50/50 border border-emerald-200/90 rounded-xl p-4 shadow-2xs transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
              2. Cases Created
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-mono font-black text-emerald-950 tabular-nums">{completed}</span>
            <span className="text-xs font-mono font-bold text-emerald-700 tabular-nums">
              {completionPct !== null ? `${completionPct}%` : 'N/A'}
            </span>
          </div>
          <p className="text-xs text-emerald-800 mt-1">
            {completionPct !== null
              ? 'Confirmed case creation submissions'
              : 'N/A — No flows started yet in session'}
          </p>
        </div>

        {/* 3. Explicitly Cancelled */}
        <div className="relative overflow-hidden bg-amber-50/50 border border-amber-200/90 rounded-xl p-4 shadow-2xs transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950">
              3. Explicitly Cancelled
            </span>
            <XCircle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-mono font-black text-amber-950 tabular-nums">{cancelled}</span>
            <span className="text-xs font-mono font-bold text-amber-800 tabular-nums">
              {cancellationPct !== null ? `${cancellationPct}%` : 'N/A'}
            </span>
          </div>
          <p className="text-xs text-amber-800 mt-1">
            {cancellationPct !== null
              ? 'User closed modal before submission'
              : 'N/A — No flows started yet in session'}
          </p>
        </div>

        {/* 4. In-Progress Flows */}
        <div className="relative overflow-hidden bg-slate-50/90 border border-slate-200/90 rounded-xl p-4 shadow-2xs transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              4. In-Progress Flows
            </span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-mono font-black text-slate-950 tabular-nums mt-2">{inProgress}</div>
          <p className="text-xs text-slate-500 mt-1">
            Modal opened without terminal resolution
          </p>
        </div>
      </div>

      {/* Visual Proportional Bar */}
      {started > 0 ? (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="font-semibold text-slate-800">Funnel Flow Distribution ({started} total started)</span>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1.5 text-emerald-800 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                Completed: {completed} ({completionPct}%)
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-900 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Cancelled: {cancelled} ({cancellationPct}%)
              </span>
              {inProgress > 0 && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                  In-Progress: {inProgress} ({inProgressPct}%)
                </span>
              )}
            </div>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {completionPct! > 0 && (
              <div
                style={{ width: `${completionPct}%` }}
                className="bg-emerald-600 transition-all duration-700 ease-out"
                title={`Completed: ${completionPct}%`}
              />
            )}
            {cancellationPct! > 0 && (
              <div
                style={{ width: `${cancellationPct}%` }}
                className="bg-amber-500 transition-all duration-700 ease-out"
                title={`Cancelled: ${cancellationPct}%`}
              />
            )}
            {inProgressPct! > 0 && (
              <div
                style={{ width: `${inProgressPct}%` }}
                className="bg-slate-400 transition-all duration-700 ease-out"
                title={`In-Progress: ${inProgressPct}%`}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="py-4 px-3 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
          No support case creation flows have been started in this session yet. Open any transaction and select &ldquo;Raise Support Case&rdquo; to observe funnel events in real time.
        </div>
      )}

      {/* Methodology Rule Note */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800 font-semibold">Methodology Note:</strong> Abandonment is counted{' '}
          <strong>only upon explicit user dismissal or cancellation</strong>. In-progress or incomplete flows are not inferred as lost conversions. This metric tracks in-session prototype interactions and makes no claims regarding real-world dispute behaviors.
        </div>
      </div>
    </div>
  );
}
