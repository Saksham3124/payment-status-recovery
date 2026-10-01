'use client';

import React from 'react';
import { MultiPartyEvidence, TransactionType } from '@/engine/types';
import { isContradictoryEvidence } from '@/engine/decision-table';
import {
  Building2,
  Cpu,
  Landmark,
  Store,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle,
  XCircle,
  AlertOctagon,
} from 'lucide-react';

interface MultiPartyEvidenceBreakdownProps {
  evidence: MultiPartyEvidence;
  type: TransactionType;
}

type EvidenceStatusType = 'CONFIRMED' | 'PENDING' | 'MISSING' | 'CONTRADICTORY' | 'NOT_APPLICABLE';

interface PartyCardConfig {
  title: string;
  institution: string;
  role: string;
  icon: React.ElementType;
  rawSignal: string;
  statusType: EvidenceStatusType;
  statusLabel: string;
  explanation: string;
}

export function MultiPartyEvidenceBreakdown({ evidence, type }: MultiPartyEvidenceBreakdownProps) {
  const hasContradiction = isContradictoryEvidence(evidence);

  // 1. Remitter Bank Card Config
  let remitterStatusType: EvidenceStatusType = 'CONFIRMED';
  let remitterLabel = 'Debited';
  let remitterExplanation = `Confirmed funds deduction of ₹${evidence.amount.toLocaleString('en-IN')} from customer account.`;

  if (evidence.remitterDebit === 'NOT_DEBITED') {
    remitterLabel = 'No Debit';
    remitterExplanation = 'Account balance was not debited. Transaction rejected prior to account charge.';
  } else if (evidence.remitterDebit === 'UNKNOWN') {
    remitterStatusType = 'MISSING';
    remitterLabel = 'Unknown Telemetry';
    remitterExplanation = 'Remitter core banking gateway did not return a definitive debit signal.';
  }

  // 2. NPCI Switch Card Config
  let switchStatusType: EvidenceStatusType = 'CONFIRMED';
  let switchLabel = 'Success';
  let switchExplanation = 'Central UPI Switch processed and verified the transfer packet.';

  if (evidence.npciSwitch === 'DEEMED_SUCCESS') {
    switchStatusType = 'PENDING';
    switchLabel = 'Deemed Success';
    switchExplanation = 'Switch accepted debit from remitter; awaiting final settlement ack from payee bank.';
  } else if (evidence.npciSwitch === 'TIMEOUT') {
    switchStatusType = 'PENDING';
    switchLabel = 'Network Timeout';
    switchExplanation = 'Switch session timed out during transit. Packet state is non-terminal / unresolved.';
  } else if (evidence.npciSwitch === 'FAILED') {
    switchStatusType = 'CONFIRMED';
    switchLabel = 'Terminal Failure';
    switchExplanation = 'Switch routed terminal failure code (e.g. limit exceeded, route rejected).';
  } else if (evidence.npciSwitch === 'PENDING') {
    switchStatusType = 'PENDING';
    switchLabel = 'Switch In-Flight';
    switchExplanation = 'Switch queue is actively processing the transaction.';
  } else if (evidence.npciSwitch === 'UNKNOWN') {
    switchStatusType = 'MISSING';
    switchLabel = 'Missing Switch Signal';
    switchExplanation = 'No switch response recorded in telemetry.';
  }

  // 3. Beneficiary Bank Card Config
  let benStatusType: EvidenceStatusType = 'CONFIRMED';
  let benLabel = 'Credited';
  let benExplanation = `Payee bank (${evidence.beneficiaryBankName}) confirmed funds received and credited to account.`;

  if (evidence.beneficiaryCredit === 'NOT_CREDITED') {
    benLabel = 'Not Credited';
    benExplanation = 'Payee bank confirmed zero funds received or credited.';
  } else if (evidence.beneficiaryCredit === 'UNKNOWN') {
    benStatusType = 'PENDING';
    benLabel = 'Credit Pending / Unknown';
    benExplanation = 'Payee bank has not yet posted credit confirmation to the central switch.';
  }

  // 4. Merchant POS Card Config
  let merchStatusType: EvidenceStatusType = 'CONFIRMED';
  let merchLabel = 'Order Confirmed';
  let merchExplanation = 'Merchant terminal / billing system reconciled payment against invoice.';

  if (type === 'P2P') {
    merchStatusType = 'NOT_APPLICABLE';
    merchLabel = 'N/A (P2P Transfer)';
    merchExplanation = 'Person-to-person transfer; no merchant point-of-sale integration involved.';
  } else if (evidence.merchantOrder === 'PENDING') {
    merchStatusType = 'PENDING';
    merchLabel = 'Sync Delayed (Pending)';
    merchExplanation = 'Beneficiary bank received credit, but merchant soundbox/POS webhook has not refreshed.';
  } else if (evidence.merchantOrder === 'FAILED') {
    merchStatusType = 'CONFIRMED';
    merchLabel = 'Order Expired / Failed';
    merchExplanation = 'Merchant cart or counter POS timed out while waiting for soundbox notification.';
  } else if (evidence.merchantOrder === 'UNKNOWN') {
    merchStatusType = 'MISSING';
    merchLabel = 'Status Unknown';
    merchExplanation = 'Merchant system status is unpolled or unreachable.';
  }

  // Check for contradiction flags
  if (hasContradiction) {
    if (evidence.remitterDebit === 'NOT_DEBITED' && evidence.beneficiaryCredit === 'CREDITED') {
      remitterStatusType = 'CONTRADICTORY';
      benStatusType = 'CONTRADICTORY';
    }
    if (evidence.npciSwitch === 'FAILED' && evidence.beneficiaryCredit === 'CREDITED') {
      switchStatusType = 'CONTRADICTORY';
      benStatusType = 'CONTRADICTORY';
    }
  }

  const parties: PartyCardConfig[] = [
    {
      title: 'Remitter Bank (Payer)',
      institution: evidence.remitterBankName,
      role: 'Issuing bank holding user account',
      icon: Landmark,
      rawSignal: `remitterDebit = ${evidence.remitterDebit}`,
      statusType: remitterStatusType,
      statusLabel: remitterLabel,
      explanation: remitterExplanation,
    },
    {
      title: 'NPCI UPI Switch',
      institution: 'NPCI Central Network',
      role: 'National payment switch & router',
      icon: Cpu,
      rawSignal: `npciSwitch = ${evidence.npciSwitch}`,
      statusType: switchStatusType,
      statusLabel: switchLabel,
      explanation: switchExplanation,
    },
    {
      title: 'Beneficiary Bank',
      institution: evidence.beneficiaryBankName,
      role: 'Receiving bank holding payee account',
      icon: Building2,
      rawSignal: `beneficiaryCredit = ${evidence.beneficiaryCredit}`,
      statusType: benStatusType,
      statusLabel: benLabel,
      explanation: benExplanation,
    },
    {
      title: 'Merchant POS / Soundbox',
      institution: evidence.merchantName || (type === 'P2M' ? 'Merchant Terminal' : 'Not Applicable'),
      role: type === 'P2M' ? 'Aggregator / Counter billing terminal' : 'Individual recipient',
      icon: Store,
      rawSignal: `merchantOrder = ${evidence.merchantOrder}`,
      statusType: merchStatusType,
      statusLabel: merchLabel,
      explanation: merchExplanation,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Contradiction Alert if applicable - High-visibility Red Hazard Card */}
      {hasContradiction && (
        <div className="p-4 rounded-xl bg-red-50/90 border border-red-300 text-red-950 flex items-start gap-3 shadow-2xs ring-1 ring-red-200 animate-fade-in">
          <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-extrabold text-red-600 tracking-tight">Telemetry Contradiction Detected Across Independent Systems</h4>
            <p className="mt-1 text-red-900 leading-relaxed text-xs sm:text-sm">
              The remitter bank, central switch, and beneficiary bank have returned mutually incompatible signals (e.g. switch reported failure while beneficiary bank reported credit).
            </p>
            <p className="mt-1.5 font-bold text-red-950 text-xs">
              Why Retry is Blocked: Authorizing a second payment while bank balances are in conflict creates severe double-debit hazard. The recovery engine has enforced an immediate safe freeze.
            </p>
          </div>
        </div>
      )}

      {/* 4-Party Evidence Clearing Rail Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {parties.map((party, index) => (
          <PartyCard key={party.title} party={party} stepNumber={index + 1} />
        ))}
      </div>

      <div className="text-[11px] font-mono text-slate-400 italic">
        * Multi-party signals modeled after UPI ISO 8583 / XML clearing protocol. 100% simulated synthetic telemetry.
      </div>
    </div>
  );
}

function PartyCard({ party, stepNumber }: { party: PartyCardConfig; stepNumber: number }) {
  const Icon = party.icon;

  let badgeBg = 'bg-slate-100 text-slate-700 border-slate-300';
  let StatusIcon = HelpCircle;

  if (party.statusType === 'CONFIRMED') {
    badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs';
    StatusIcon = CheckCircle2;
  } else if (party.statusType === 'PENDING') {
    badgeBg = 'bg-blue-50 text-blue-800 border-blue-300 shadow-2xs';
    StatusIcon = Clock;
  } else if (party.statusType === 'MISSING') {
    badgeBg = 'bg-amber-500/15 text-amber-950 border-amber-500/40 shadow-2xs';
    StatusIcon = AlertTriangle;
  } else if (party.statusType === 'CONTRADICTORY') {
    badgeBg = 'bg-red-500/15 text-red-700 border-red-500/40 font-bold shadow-2xs';
    StatusIcon = AlertOctagon;
  } else if (party.statusType === 'NOT_APPLICABLE') {
    badgeBg = 'bg-slate-50 text-slate-400 border-slate-200';
    StatusIcon = HelpCircle;
  }

  return (
    <div className={`p-4 rounded-xl border bg-white shadow-2xs flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md ${
      party.statusType === 'CONTRADICTORY' ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200/90'
    }`}>
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
              {stepNumber}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeBg}`}>
            <StatusIcon className="w-3 h-3 shrink-0" />
            <span>{party.statusLabel}</span>
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-950 mt-1">{party.title}</h4>
        <div className="text-xs font-semibold text-slate-800 mt-0.5">{party.institution}</div>
        <p className="text-[11px] text-slate-500 mt-0.5">{party.role}</p>

        <p className="text-xs text-slate-600 mt-3 leading-relaxed">
          {party.explanation}
        </p>
      </div>

      <div className="mt-4 pt-2.5 border-t border-slate-100">
        <code className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 block truncate" title={party.rawSignal}>
          {party.rawSignal}
        </code>
      </div>
    </div>
  );
}
