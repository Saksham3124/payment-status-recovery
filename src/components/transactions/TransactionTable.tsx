'use client';

import React from 'react';
import Link from 'next/link';
import { useTransactions, EvaluatedTransaction } from '@/context/TransactionContext';
import { StatusBadge, SafetyTag } from '@/components/common/StatusBadge';
import { formatINR, formatDateTime, formatRelativeMinutes } from '@/lib/formatters';
import { RefreshCw, ArrowUpRight, SearchX, CheckCircle, ShieldAlert } from 'lucide-react';

export function TransactionTable() {
  const { filteredTransactions, isPolling, simulateTelemetryPoll, clearFilters } = useTransactions();

  if (filteredTransactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No matching synthetic transactions</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
          No records match your active query or status filter. Try clearing your filters to view the complete synthetic ledger.
        </p>
        <button
          type="button"
          onClick={clearFilters}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors shadow-2xs"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden animate-fade-in">
      {/* Ledger Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#121824] border-b border-slate-800 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-5 py-3.5">Transaction &amp; UTR</th>
              <th scope="col" className="px-5 py-3.5">Counterparty</th>
              <th scope="col" className="px-5 py-3.5">Type</th>
              <th scope="col" className="px-5 py-3.5 text-right">Amount</th>
              <th scope="col" className="px-5 py-3.5">Status &amp; Recovery State</th>
              <th scope="col" className="px-5 py-3.5">Safety Guidance</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isPolling={isPolling(tx.id)}
                onPoll={() => simulateTelemetryPoll(tx.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionRow({
  tx,
  isPolling,
  onPoll,
}: {
  tx: EvaluatedTransaction;
  isPolling: boolean;
  onPoll: () => void;
}) {
  const { guidance } = tx;

  return (
    <tr className="hover:bg-slate-50/90 transition-all duration-200">
      {/* ID & UTR */}
      <td className="px-5 py-4 align-top whitespace-nowrap">
        <div className="font-mono text-xs font-bold text-slate-950 tracking-tight">{tx.id}</div>
        <div className="text-[11px] font-mono text-slate-500 tabular-nums mt-0.5" title="12-digit Bank Unique Transaction Reference">
          UTR: {tx.utr}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-mono">
          {formatRelativeMinutes(tx.evidence.elapsedMinutes)} &bull; {formatDateTime(tx.timestamp)}
        </div>
      </td>

      {/* Counterparty */}
      <td className="px-5 py-4 align-top">
        <div className="font-bold text-slate-900">{tx.counterparty}</div>
        <div className="text-xs text-slate-500 font-mono mt-0.5">{tx.counterpartyVpa}</div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">
          {tx.evidence.remitterBankName} &rarr; {tx.evidence.beneficiaryBankName}
        </div>
      </td>

      {/* Type */}
      <td className="px-5 py-4 align-top whitespace-nowrap">
        <span
          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
            tx.type === 'P2M'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {tx.type === 'P2M' ? 'P2M (Merchant)' : 'P2P (Personal)'}
        </span>
      </td>

      {/* Amount - Right Aligned with Tabular Numerals */}
      <td className="px-5 py-4 align-top whitespace-nowrap text-right">
        <div className="font-mono font-bold text-slate-950 text-base tabular-nums">{formatINR(tx.amount)}</div>
        {tx.evidence.remitterDebit === 'DEBITED' ? (
          <span className="text-[11px] text-amber-900 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 inline-block mt-0.5">
            Bank debited
          </span>
        ) : tx.evidence.remitterDebit === 'NOT_DEBITED' ? (
          <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
            Not debited
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 inline-block mt-0.5">Debit unknown</span>
        )}
      </td>

      {/* Status & Recovery State */}
      <td className="px-5 py-4 align-top">
        <div>
          <StatusBadge state={guidance.canonicalState} />
        </div>
        <p className="text-xs text-slate-600 mt-1.5 max-w-xs line-clamp-2 leading-relaxed" title={guidance.headline}>
          {guidance.headline}
        </p>
      </td>

      {/* Safety Guidance */}
      <td className="px-5 py-4 align-top whitespace-nowrap">
        <div>
          <SafetyTag safeToRetry={guidance.safeToRetryPayment} />
        </div>
        <div className="text-[11px] text-slate-500 mt-1 max-w-[180px] truncate font-medium" title={guidance.primaryAction.label}>
          {guidance.primaryAction.label}
        </div>
      </td>

      {/* Actions */}
      <td className="px-5 py-4 align-top text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-2">
          {/* Simulate Bank Refresh */}
          <button
            type="button"
            onClick={onPoll}
            disabled={isPolling}
            className={`p-1.5 rounded-lg border text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all duration-200 hover:scale-105 active:scale-95 ${
              isPolling ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'border-slate-200 shadow-2xs'
            }`}
            title="Simulate querying banking switch for telemetry refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {/* Inspect Recovery */}
          <Link
            href={`/tx/${tx.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-950 hover:bg-slate-850 rounded-lg shadow-2xs transition-all duration-200 hover:scale-[1.02] active:scale-95 border border-slate-800"
          >
            <span>Inspect</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
