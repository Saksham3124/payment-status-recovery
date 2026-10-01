'use client';

import React, { useEffect } from 'react';
import { StatusOverviewCards } from '@/components/transactions/StatusOverviewCards';
import { TransactionFilterBar } from '@/components/transactions/TransactionFilterBar';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { useAnalytics } from '@/context/AnalyticsContext';
import { ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent('DASHBOARD_VIEWED', { viewMode: 'TRANSACTION_OVERVIEW' });
  }, [trackEvent]);
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-slate-200 animate-fade-in">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-900 text-slate-200 border border-slate-800 mb-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>DETERMINISTIC RECOVERY ENGINE ACTIVE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            UPI Transaction Status Recovery
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Real-time status uncertainty resolution across Remitter Banks, NPCI Switch, Beneficiary Banks, and Merchant POS. Multi-source evidence evaluation strictly prevents accidental double debits.
          </p>
        </div>
      </div>

      {/* Status Overview Cards (Tiles) */}
      <section className="animate-fade-in animate-delay-1" aria-label="Transaction status metrics">
        <StatusOverviewCards />
      </section>

      {/* Search & Filters */}
      <section className="animate-fade-in animate-delay-2" aria-label="Filter transactions">
        <TransactionFilterBar />
      </section>

      {/* Transaction Table */}
      <section className="animate-fade-in animate-delay-3" aria-label="Transaction ledger">
        <TransactionTable />
      </section>
    </div>
  );
}
