'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useTransactions } from '@/context/TransactionContext';
import { useSupport } from '@/context/SupportContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { StatusBadge, SafetyTag } from '@/components/common/StatusBadge';
import { CaseStatusBadge } from '@/components/support/CaseStatusBadge';
import { RecoveryGuidanceCard } from '@/components/guidance/RecoveryGuidanceCard';
import { MultiPartyEvidenceBreakdown } from '@/components/guidance/MultiPartyEvidenceBreakdown';
import { TransactionTimeline } from '@/components/guidance/TransactionTimeline';
import { CreateCaseModal } from '@/components/support/CreateCaseModal';
import { formatINR, formatDateTime, formatRelativeMinutes } from '@/lib/formatters';
import {
  ArrowLeft,
  SearchX,
  Clock,
  Layers,
  ShieldCheck,
  RefreshCw,
  FileQuestion,
  ArrowUpRight,
  Building2,
} from 'lucide-react';

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { transactions, isPolling, simulateTelemetryPoll } = useTransactions();
  const { getCasesForTransaction } = useSupport();
  const { trackEvent } = useAnalytics();

  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);

  const tx = transactions.find((t) => t.id === id);
  const linkedCases = tx ? getCasesForTransaction(tx.id) : [];

  // Track detail page view upon mounting
  React.useEffect(() => {
    if (tx) {
      trackEvent(
        'TRANSACTION_DETAILS_OPENED',
        {
          canonicalState: tx.guidance.canonicalState,
          safeToRetry: tx.guidance.safeToRetryPayment,
          transactionType: tx.type,
        },
        tx.id
      );
      trackEvent('RECOVERY_GUIDANCE_VIEWED', { ruleMatched: tx.guidance.ruleMatchedId }, tx.id);
      trackEvent('EVIDENCE_BREAKDOWN_INSPECTED', { remitterStatus: tx.evidence.remitterDebit }, tx.id);
    }
  }, [tx, trackEvent]);

  // 1. Clear Not-Found State for invalid transaction IDs
  if (!tx) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <SearchX className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Transaction Not Found</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          The synthetic transaction reference <span className="font-mono font-semibold text-slate-700">{id}</span> does not exist in the local dataset.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Transactions Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const { evidence, guidance } = tx;
  const pollingActive = isPolling(tx.id);

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-950 transition-all duration-200 hover:-translate-x-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&larr; Back to Transactions</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCaseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-white text-slate-900 hover:bg-slate-50 border border-slate-300 transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-2xs"
            title="Create a synthetic support dispute for this transaction"
          >
            <FileQuestion className="w-3.5 h-3.5 text-amber-500" />
            <span>Raise Support Case</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              trackEvent('TELEMETRY_POLL_TRIGGERED', { elapsedMinutes: evidence.elapsedMinutes }, tx.id);
              await simulateTelemetryPoll(tx.id);
              trackEvent('TELEMETRY_POLL_COMPLETED', { elapsedMinutes: evidence.elapsedMinutes + 1 }, tx.id);
            }}
            disabled={pollingActive}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
              pollingActive
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-slate-950 text-white hover:bg-slate-850 border-slate-800 shadow-2xs'
            }`}
            title="Simulate polling bank switch for updated telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pollingActive ? 'animate-spin text-amber-400' : 'text-slate-300'}`} />
            <span>{pollingActive ? 'Checking Switch...' : 'Refresh Status'}</span>
          </button>
        </div>
      </div>

      {/* Linked Support Cases Banner if any exist */}
      {linkedCases.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs animate-fade-in animate-delay-1">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Active Disputes ({linkedCases.length}):
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {linkedCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/support/${c.id}`}
                  className="inline-flex items-center gap-1.5 font-mono font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-750 transition-colors"
                >
                  <span>{c.id}</span>
                  <CaseStatusBadge status={c.status} />
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/support"
            className="text-amber-400 hover:text-amber-300 font-bold text-xs shrink-0 transition-colors"
          >
            View All Cases &rarr;
          </Link>
        </div>
      )}

      {/* Hero Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs animate-fade-in animate-delay-1">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="font-mono text-xs font-bold text-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {tx.id}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  tx.type === 'P2M'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {tx.type === 'P2M' ? 'P2M (Merchant)' : 'P2P (Personal)'}
              </span>
              <StatusBadge state={guidance.canonicalState} />
              <SafetyTag safeToRetry={guidance.safeToRetryPayment} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {tx.counterparty}
            </h1>
            <p className="text-xs font-mono text-slate-500 mt-1">
              VPA: <span className="font-semibold text-slate-700">{tx.counterpartyVpa}</span> &bull; Bank UTR:{' '}
              <span className="font-bold text-slate-900 tabular-nums">{tx.utr}</span>
            </p>

            <div className="text-xs text-slate-500 mt-3 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Initiated: {formatDateTime(tx.timestamp)}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="font-mono">
                Elapsed: <strong className="text-slate-900">{formatRelativeMinutes(evidence.elapsedMinutes)}</strong>
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="font-medium text-slate-700">
                Routing: {evidence.remitterBankName} &rarr; {evidence.beneficiaryBankName}
              </span>
            </div>
          </div>

          <div className="text-left lg:text-right shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Transaction Amount
            </span>
            <span className="text-3xl sm:text-4xl font-mono font-black text-slate-950 tabular-nums">
              {formatINR(tx.amount)}
            </span>
            <div className="text-xs mt-1.5">
              {evidence.remitterDebit === 'DEBITED' ? (
                <span className="text-amber-950 font-bold bg-amber-50 px-2.5 py-0.5 rounded border border-amber-300/80 inline-block shadow-2xs">
                  Debited from {evidence.remitterBankName}
                </span>
              ) : evidence.remitterDebit === 'NOT_DEBITED' ? (
                <span className="text-slate-700 font-semibold bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 inline-block">
                  No Debit from account
                </span>
              ) : (
                <span className="text-slate-400">Debit status unconfirmed</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Recovery Guidance Card */}
      <section className="space-y-2.5 animate-fade-in animate-delay-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-900" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Deterministic Recovery Guidance
          </h2>
        </div>
        <RecoveryGuidanceCard
          guidance={guidance}
          isPolling={pollingActive}
          onPoll={() => simulateTelemetryPoll(tx.id)}
        />
      </section>

      {/* Section 2: Multi-Party Evidence Breakdown */}
      <section className="space-y-2.5 animate-fade-in animate-delay-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-900" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Multi-Party Telemetry Breakdown
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">4-Party Clearing Rails</span>
        </div>
        <MultiPartyEvidenceBreakdown evidence={evidence} type={tx.type} />
      </section>

      {/* Section 3: Chronological Transaction Timeline */}
      <section className="space-y-2.5 animate-fade-in animate-delay-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-900" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Chronological Event Log
          </h2>
        </div>
        <TransactionTimeline tx={tx} />
      </section>

      {/* Modal for raising synthetic support cases */}
      <CreateCaseModal
        tx={tx}
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
      />
    </div>
  );
}
