'use client';

import React from 'react';
import Link from 'next/link';
import { useAnalytics } from '@/context/AnalyticsContext';
import { MetricCards } from '@/components/analytics/MetricCards';
import { FunnelSummaryCard } from '@/components/analytics/FunnelSummaryCard';
import { EventStreamTable } from '@/components/analytics/EventStreamTable';
import {
  BarChart3,
  ArrowLeft,
  Info,
  Layers,
  Filter,
  Activity,
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const { metrics } = useAnalytics();

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-900 text-slate-200 border border-slate-800 mb-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span>PRODUCT INSTRUMENTATION ACTIVE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Product Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Understand transaction uncertainty, recovery guidance, and support-case journeys.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-all duration-200 hover:scale-[1.02] active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Transactions</span>
        </Link>
      </div>

      {/* Reduced-Dominance PM Methodology Note */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-600 shadow-2xs animate-fade-in animate-delay-1">
        <Info className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="text-slate-950 font-bold">PM Methodology &amp; Synthetic Data Notice:</strong> All metrics,
          funnel calculations, and telemetry records reflect{' '}
          <strong>in-session synthetic demo activity only</strong>. They are not extrapolated into claims
          of real-world conversion improvements, avoided double debits, or reduced support escalations.
          Privacy-sensitive attributes (VPAs, account numbers, free-text inquiries) are strictly sanitized prior
          to recording.
        </div>
      </div>

      {/* Section 1: Overview */}
      <section className="space-y-3 animate-fade-in animate-delay-1">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-900" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Overview
          </h2>
        </div>
        <MetricCards metrics={metrics} />
      </section>

      {/* Section 2: Recovery Funnel */}
      <section className="space-y-3 animate-fade-in animate-delay-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-900" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recovery Funnel
          </h2>
        </div>
        <FunnelSummaryCard metrics={metrics} />
      </section>

      {/* Section 3: Event Stream */}
      <section className="space-y-3 animate-fade-in animate-delay-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-900" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Event Stream
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Chronological Telemetry</span>
        </div>
        <EventStreamTable />
      </section>
    </div>
  );
}
