'use client';

import React from 'react';
import { EvaluatedTransaction } from '@/context/TransactionContext';
import { formatDateTime } from '@/lib/formatters';
import {
  Send,
  Landmark,
  Cpu,
  Building2,
  Store,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertOctagon,
} from 'lucide-react';

interface TimelineStep {
  title: string;
  source: string;
  isRecordedEvent: boolean; // true = concrete synthetic event; false = inferred explanation
  timestampLabel?: string;
  status: 'SUCCESS' | 'WARNING' | 'PENDING' | 'FAILED' | 'CONTRADICTORY';
  description: string;
  technicalNote?: string;
}

export function TransactionTimeline({ tx }: { tx: EvaluatedTransaction }) {
  const { evidence, guidance } = tx;

  // Build sequential timeline steps grounded exclusively in data model
  const steps: TimelineStep[] = [];

  // Step 1: Payment Initiated (Concrete event with recorded timestamp)
  steps.push({
    title: 'Payment Request Initiated',
    source: 'UPI Client App (Synthetic)',
    isRecordedEvent: true,
    timestampLabel: formatDateTime(tx.timestamp),
    status: 'SUCCESS',
    description: `Initiated transfer of ₹${evidence.amount.toLocaleString('en-IN')} to ${tx.counterparty}. Assigned UPI UTR ${evidence.utr}.`,
    technicalNote: `Type: ${evidence.type}`,
  });

  // Step 2: Remitter Debit Step
  if (evidence.remitterDebit === 'DEBITED') {
    steps.push({
      title: 'Remitter Debit Confirmed',
      source: evidence.remitterBankName,
      isRecordedEvent: true,
      status: 'SUCCESS',
      description: `Account debited ₹${evidence.amount.toLocaleString('en-IN')} by ${evidence.remitterBankName}. Debit authorization logged.`,
      technicalNote: 'remitterDebit: DEBITED',
    });
  } else if (evidence.remitterDebit === 'NOT_DEBITED') {
    steps.push({
      title: 'Debit Not Executed',
      source: evidence.remitterBankName,
      isRecordedEvent: true,
      status: 'FAILED',
      description: `Remitter bank rejected transaction prior to debit (e.g. incorrect PIN or limit check). Zero funds removed.`,
      technicalNote: 'remitterDebit: NOT_DEBITED',
    });
  } else {
    steps.push({
      title: 'Remitter Debit Signal Missing',
      source: evidence.remitterBankName,
      isRecordedEvent: false,
      status: 'WARNING',
      description: `Core banking interface has not provided a definitive debit confirmation.`,
      technicalNote: 'remitterDebit: UNKNOWN',
    });
  }

  // Step 3: NPCI Switch Step
  if (evidence.npciSwitch === 'SUCCESS') {
    steps.push({
      title: 'NPCI Switch Routing Successful',
      source: 'NPCI UPI Central Switch',
      isRecordedEvent: true,
      status: 'SUCCESS',
      description: 'Central switch received debit acknowledgment and routed settlement packet to beneficiary bank.',
      technicalNote: 'npciSwitch: SUCCESS',
    });
  } else if (evidence.npciSwitch === 'DEEMED_SUCCESS') {
    steps.push({
      title: 'Switch Recorded Deemed Success',
      source: 'NPCI UPI Central Switch',
      isRecordedEvent: true,
      status: 'PENDING',
      description: 'Switch debited remitter account and forwarded to beneficiary bank; awaiting final credit completion ACK.',
      technicalNote: 'npciSwitch: DEEMED_SUCCESS',
    });
  } else if (evidence.npciSwitch === 'TIMEOUT') {
    steps.push({
      title: 'Switch Network Timeout Observed',
      source: 'NPCI UPI Central Switch',
      isRecordedEvent: true,
      status: 'WARNING',
      description: `Network switch session timed out without a definitive terminal packet. In-flight reconciliation active (${Math.round(evidence.elapsedMinutes)} mins elapsed).`,
      technicalNote: 'npciSwitch: TIMEOUT',
    });
  } else if (evidence.npciSwitch === 'FAILED') {
    steps.push({
      title: 'Switch Terminal Failure Recorded',
      source: 'NPCI UPI Central Switch',
      isRecordedEvent: true,
      status: 'FAILED',
      description: 'Switch terminated transfer due to network or beneficiary gateway rejection code.',
      technicalNote: 'npciSwitch: FAILED',
    });
  } else {
    steps.push({
      title: 'Switch Telemetry Awaited',
      source: 'NPCI UPI Central Switch',
      isRecordedEvent: false,
      status: 'WARNING',
      description: 'Switch routing packet is missing from telemetry record.',
      technicalNote: 'npciSwitch: UNKNOWN',
    });
  }

  // Step 4: Beneficiary Credit Step
  if (evidence.beneficiaryCredit === 'CREDITED') {
    steps.push({
      title: 'Beneficiary Bank Credit Confirmed',
      source: evidence.beneficiaryBankName,
      isRecordedEvent: true,
      status: 'SUCCESS',
      description: `Beneficiary account credited by ${evidence.beneficiaryBankName}. Settlement completed.`,
      technicalNote: 'beneficiaryCredit: CREDITED',
    });
  } else if (evidence.beneficiaryCredit === 'NOT_CREDITED') {
    steps.push({
      title: 'Beneficiary Bank Reports No Credit',
      source: evidence.beneficiaryBankName,
      isRecordedEvent: true,
      status: 'FAILED',
      description: `Receiving bank verified that zero funds were deposited into beneficiary account.`,
      technicalNote: 'beneficiaryCredit: NOT_CREDITED',
    });
  } else {
    steps.push({
      title: 'Beneficiary Credit Pending / Unconfirmed',
      source: evidence.beneficiaryBankName,
      isRecordedEvent: false,
      status: 'PENDING',
      description: `Final credit settlement has not yet been acknowledged by ${evidence.beneficiaryBankName}.`,
      technicalNote: 'beneficiaryCredit: UNKNOWN',
    });
  }

  // Step 5: Merchant POS Step (P2M only)
  if (evidence.type === 'P2M') {
    if (evidence.merchantOrder === 'CONFIRMED') {
      steps.push({
        title: 'Merchant Order Confirmed',
        source: evidence.merchantName || 'Merchant POS',
        isRecordedEvent: true,
        status: 'SUCCESS',
        description: 'Merchant counter terminal and order webhook acknowledged invoice settlement.',
        technicalNote: 'merchantOrder: CONFIRMED',
      });
    } else if (evidence.merchantOrder === 'PENDING') {
      steps.push({
        title: 'Merchant Soundbox / Terminal Lag',
        source: evidence.merchantName || 'Merchant POS',
        isRecordedEvent: true,
        status: 'WARNING',
        description: 'Funds were credited to merchant bank, but the store soundbox/POS webhook is lagging.',
        technicalNote: 'merchantOrder: PENDING',
      });
    } else if (evidence.merchantOrder === 'FAILED') {
      steps.push({
        title: 'Merchant Terminal Order Expired / Cancelled',
        source: evidence.merchantName || 'Merchant POS',
        isRecordedEvent: true,
        status: 'FAILED',
        description: 'Merchant checkout session expired due to timeout.',
        technicalNote: 'merchantOrder: FAILED',
      });
    }
  }

  // Step 6: Deterministic Recovery Engine Decision
  steps.push({
    title: `Recovery Engine: ${guidance.canonicalState}`,
    source: 'Payment Status Recovery Engine',
    isRecordedEvent: true,
    status: guidance.safeToRetryPayment ? 'SUCCESS' : guidance.severity === 'CRITICAL_HOLD' ? 'CONTRADICTORY' : 'WARNING',
    description: guidance.headline,
    technicalNote: `Rule: ${guidance.ruleMatchedId} | safeToRetry: ${guidance.safeToRetryPayment}`,
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">Multi-Party Event Timeline</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological sequence of synthetic network events and deterministic evaluation steps.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 inline-block" />
            Recorded Event
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-slate-400 inline-block" />
            Inferred State
          </span>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => {
          let dotBg = 'bg-slate-400';
          let DotIcon = Clock;

          if (step.status === 'SUCCESS') {
            dotBg = 'bg-emerald-600';
            DotIcon = CheckCircle2;
          } else if (step.status === 'WARNING') {
            dotBg = 'bg-[#F79E1B]';
            DotIcon = AlertTriangle;
          } else if (step.status === 'FAILED') {
            dotBg = 'bg-slate-700';
            DotIcon = XCircle;
          } else if (step.status === 'CONTRADICTORY') {
            dotBg = 'bg-[#EB001B]';
            DotIcon = AlertOctagon;
          } else if (step.status === 'PENDING') {
            dotBg = 'bg-blue-600';
            DotIcon = Clock;
          }

          return (
            <div key={`${step.title}-${idx}`} className="relative group">
              {/* Dot on timeline */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full ${dotBg} text-white flex items-center justify-center ring-4 ring-white shadow-2xs`}
              >
                <DotIcon className="w-3 h-3" />
              </div>

              {/* Step Content */}
              <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 transition-colors shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-950 text-xs sm:text-sm">{step.title}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        step.isRecordedEvent
                          ? 'bg-slate-900 text-slate-200 border-slate-800'
                          : 'bg-white text-slate-500 border-dashed border-slate-300'
                      }`}
                    >
                      {step.isRecordedEvent ? 'Synthetic Event' : 'Inferred Observation'}
                    </span>
                  </div>
                  {step.timestampLabel && (
                    <span className="text-xs font-mono text-slate-400 tabular-nums">{step.timestampLabel}</span>
                  )}
                </div>

                <div className="text-xs font-medium text-slate-500 mt-1">Source: {step.source}</div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{step.description}</p>

                {step.technicalNote && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                    <code className="text-[10px] font-mono text-slate-500">{step.technicalNote}</code>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
