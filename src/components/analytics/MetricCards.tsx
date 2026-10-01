'use client';

import React from 'react';
import { FunnelMetrics } from '@/analytics/types';
import { Activity, Users, Eye } from 'lucide-react';

interface MetricCardsProps {
  metrics: FunnelMetrics;
}

export function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Recorded Events */}
      <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-colors">
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Events
          </span>
          <Activity className="w-4 h-4 text-slate-700" />
        </div>
        <div className="text-2xl sm:text-3xl font-mono font-black text-slate-950 tabular-nums mt-2">
          {metrics.totalEvents}
        </div>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Discrete telemetry actions recorded in session
        </p>
      </div>

      {/* Unique Synthetic Sessions */}
      <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-colors">
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Unique Sessions
          </span>
          <Users className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-2xl sm:text-3xl font-mono font-black text-slate-950 tabular-nums mt-2">
          {metrics.uniqueSessions}
        </div>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Distinct synthetic session identifiers
        </p>
      </div>

      {/* Transaction Detail Views */}
      <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-colors">
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Transaction Detail Views
          </span>
          <Eye className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl sm:text-3xl font-mono font-black text-slate-950 tabular-nums mt-2">
          {metrics.transactionDetailViews}
        </div>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Recovery guidance and evidence breakdowns opened
        </p>
      </div>
    </div>
  );
}
