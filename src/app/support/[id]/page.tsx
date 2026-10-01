'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useSupport } from '@/context/SupportContext';
import { useTransactions } from '@/context/TransactionContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { CaseStatus } from '@/support/types';
import { CATEGORY_METADATA } from '@/support/category-suggestions';
import { CaseStatusBadge } from '@/components/support/CaseStatusBadge';
import { StatusBadge, SafetyTag } from '@/components/common/StatusBadge';
import { formatINR, formatDateTime } from '@/lib/formatters';
import {
  ArrowLeft,
  SearchX,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Lock,
  User,
  Headphones,
  Settings,
  ArrowRight,
} from 'lucide-react';

export default function SupportCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getCaseById, transitionCaseStatus } = useSupport();
  const { transactions } = useTransactions();
  const { trackEvent } = useAnalytics();

  const [transitionNote, setTransitionNote] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const supportCase = getCaseById(id);

  if (!supportCase) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <SearchX className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Support Case Not Found</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          The synthetic case reference <span className="font-mono font-semibold text-slate-700">{id}</span> does not exist in the active session.
        </p>
        <div className="mt-6">
          <Link
            href="/support"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Support Cases</span>
          </Link>
        </div>
      </div>
    );
  }

  const linkedTx = transactions.find((t) => t.id === supportCase.transactionId);

  const handleAdvanceStatus = (targetStatus: CaseStatus, defaultNote: string) => {
    setTransitionError(null);
    const note = transitionNote.trim() || defaultNote;
    const res = transitionCaseStatus(supportCase.id, targetStatus, note);
    if (!res.success) {
      setTransitionError(res.error || 'Transition not allowed.');
    } else {
      setTransitionNote('');
      trackEvent(
        'SUPPORT_CASE_STATUS_CHANGED',
        {
          fromStatus: supportCase.status,
          toStatus: targetStatus,
        },
        supportCase.transactionId,
        supportCase.id
      );
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/support"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-950 transition-all duration-200 hover:-translate-x-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&larr; Back to Support Cases</span>
        </Link>

        <span className="text-[11px] font-mono text-slate-400">
          Synthetic Case Tracker &bull; Local Only
        </span>
      </div>

      {/* Main Case Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs animate-fade-in animate-delay-1">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {supportCase.id}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {CATEGORY_METADATA[supportCase.category]?.label || supportCase.category}
              </span>
              <CaseStatusBadge status={supportCase.status} />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              {supportCase.subject}
            </h1>
          </div>

          <div className="text-left sm:text-right text-xs font-mono text-slate-500 shrink-0">
            <div>Created: <span className="tabular-nums">{formatDateTime(supportCase.createdAt)}</span></div>
            <div className="mt-0.5">Updated: <span className="tabular-nums">{formatDateTime(supportCase.updatedAt)}</span></div>
          </div>
        </div>

        <div className="py-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Reported Issue Description
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/90 whitespace-pre-wrap leading-relaxed">
            {supportCase.description}
          </p>
        </div>

        {/* Linked Transaction Reference */}
        {linkedTx && (
          <div className="mt-2 p-4 rounded-xl bg-slate-50/90 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Associated Synthetic Transaction
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-950 text-sm">
                  {linkedTx.counterparty}
                </span>
                <span className="font-mono font-black text-slate-950 text-sm tabular-nums">
                  {formatINR(linkedTx.amount)}
                </span>
                <span className="font-mono text-slate-500 tabular-nums">UTR: {linkedTx.utr}</span>
                <StatusBadge state={linkedTx.guidance.canonicalState} />
                <SafetyTag safeToRetry={linkedTx.guidance.safeToRetryPayment} />
              </div>
            </div>

            <Link
              href={`/tx/${linkedTx.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs text-white bg-slate-950 hover:bg-slate-850 rounded-lg shadow-2xs transition-colors border border-slate-800 shrink-0"
            >
              <span>View Full Evidence Breakdown</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Lifecycle Status Management */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950">
              Simulate Case Lifecycle Progression
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Advance the simulated dispute status through pure lifecycle transition rules (OPEN &rarr; UNDER_REVIEW &rarr; RESOLVED &rarr; CLOSED).
            </p>
          </div>
          <CaseStatusBadge status={supportCase.status} />
        </div>

        {/* Note input for transition */}
        {supportCase.status !== 'CLOSED' && (
          <div>
            <label htmlFor="transition-note" className="block text-xs font-bold text-slate-800 mb-1">
              Optional Activity Note
            </label>
            <input
              id="transition-note"
              type="text"
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              placeholder="e.g. Bank operations acknowledged inquiry; gateway logs inspected..."
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 font-medium"
            />
          </div>
        )}

        {/* Action Buttons based on current state */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {supportCase.status === 'OPEN' && (
            <button
              type="button"
              onClick={() =>
                handleAdvanceStatus(
                  'UNDER_REVIEW',
                  'Simulated agent assigned ticket to Bank Operations review queue.'
                )
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-[#F79E1B] hover:bg-[#FFA800] rounded-lg shadow-2xs transition-colors"
            >
              <span>Advance to Under Bank Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {supportCase.status === 'UNDER_REVIEW' && (
            <>
              <button
                type="button"
                onClick={() =>
                  handleAdvanceStatus(
                    'RESOLVED',
                    'Bank confirmed resolution. Settlement confirmation or refund credit validated.'
                  )
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Resolved</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAdvanceStatus(
                    'OPEN',
                    'Case returned to Open queue awaiting customer feedback.'
                  )
                }
                className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                Revert to Open
              </button>
            </>
          )}

          {supportCase.status === 'RESOLVED' && (
            <button
              type="button"
              onClick={() =>
                handleAdvanceStatus(
                  'CLOSED',
                  'Customer inquiry closed after resolution acknowledgment.'
                )
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Close Case (Final)</span>
            </button>
          )}

          {supportCase.status === 'CLOSED' && (
            <div className="text-xs text-slate-500 italic flex items-center gap-1.5 font-medium">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>This case is CLOSED. No further lifecycle modifications are allowed.</span>
            </div>
          )}
        </div>

        {transitionError && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {transitionError}
          </div>
        )}

        {/* Safety Invariant Notice - High-Trust Alert Card */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300/80 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold text-amber-950">
              Safety Isolation Guarantee:
            </strong>{' '}
            Advancing or resolving a support case is an administrative tracking mechanism. It{' '}
            <strong>never modifies</strong> the underlying bank debit evidence or authorizes a payment
            retry. Retry safety is governed strictly by the deterministic recovery engine.
          </div>
        </div>
      </div>

      {/* Chronological Activity History */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4 animate-fade-in animate-delay-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950">
          Case Activity History ({supportCase.history.length})
        </h3>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {supportCase.history.map((act) => {
            let ActorIcon = User;
            let actorLabel = 'Customer';
            let iconBg = 'bg-blue-600 text-white';

            if (act.actor === 'SUPPORT_AGENT') {
              ActorIcon = Headphones;
              actorLabel = 'Simulated Support Specialist';
              iconBg = 'bg-slate-950 text-white';
            } else if (act.actor === 'SYSTEM') {
              ActorIcon = Settings;
              actorLabel = 'System Automation';
              iconBg = 'bg-slate-700 text-white';
            }

            return (
              <div key={act.id} className="relative">
                <div
                  className={`absolute -left-6 top-1 w-5 h-5 rounded-full ${iconBg} flex items-center justify-center ring-4 ring-white shadow-2xs`}
                >
                  <ActorIcon className="w-3 h-3" />
                </div>

                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 text-xs shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-950">{act.action}</span>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {formatDateTime(act.timestamp)}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mb-1">
                    Actor: <span className="font-bold text-slate-800">{actorLabel}</span>
                    {act.fromStatus && act.toStatus && (
                      <span className="ml-2 font-mono text-slate-600">
                        ({act.fromStatus} &rarr; {act.toStatus})
                      </span>
                    )}
                  </div>

                  <p className="text-slate-700 leading-relaxed">{act.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
