/**
 * Deterministic Decision Table for Payment Status Recovery
 *
 * Implements priority-ordered evaluation rules.
 * Strictly separates:
 * 1. Statutory RBI DPSS mandates (P2P T+1 vs P2M T+5)
 * 2. Product-defined simulation thresholds (15-min cooling-off)
 * 3. Cardinal safety invariant: safeToRetryPayment === true ONLY on confirmed non-debit failures.
 */

import {
  DecisionRule,
  MultiPartyEvidence,
  RegulatoryCitation,
  SimulationThreshold,
} from './types';

export const RBI_P2P_CITATION: RegulatoryCitation = {
  framework: 'RBI Harmonisation of Turn Around Time (TAT) and Customer Compensation',
  circularRef: 'RBI/2019-20/67 DPSS.CO.PD No.629/02.01.014/2019-20',
  applicableClause: 'Table 5(a) - UPI Person to Person (P2P): Debited but beneficiary not credited',
  mandatedTat: 'T + 1 Business Day (Auto-reversal by remitter bank)',
  compensationPolicy: '₹100 per calendar day of delay beyond T + 1 day',
  officialDocUrl: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11693&Mode=0',
};

export const RBI_P2M_CITATION: RegulatoryCitation = {
  framework: 'RBI Harmonisation of Turn Around Time (TAT) and Customer Compensation',
  circularRef: 'RBI/2019-20/67 DPSS.CO.PD No.629/02.01.014/2019-20',
  applicableClause: 'Table 5(b) - UPI Person to Merchant (P2M): Debited but merchant confirmation not received',
  mandatedTat: 'T + 5 Business Days (Auto-reversal by remitter bank)',
  compensationPolicy: '₹100 per calendar day of delay beyond T + 5 days',
  officialDocUrl: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11693&Mode=0',
};

export const PRODUCT_COOLING_OFF_THRESHOLD: SimulationThreshold = {
  windowName: 'App Cooling-Off Window (Product Design Threshold)',
  thresholdMinutes: 15,
  purpose: 'Client-side synchronization window allowing banking networks to reconcile before prompting dispute escalation. This is a product UX decision and NOT an RBI regulatory requirement.',
};

/**
 * Checks if the evidence contains contradictory claims across independent parties.
 */
export function isContradictoryEvidence(e: MultiPartyEvidence): boolean {
  // Contradiction 1: Remitter says NOT_DEBITED, but Beneficiary says CREDITED
  if (e.remitterDebit === 'NOT_DEBITED' && e.beneficiaryCredit === 'CREDITED') {
    return true;
  }
  // Contradiction 2: Remitter says NOT_DEBITED, but NPCI says SUCCESS
  if (e.remitterDebit === 'NOT_DEBITED' && e.npciSwitch === 'SUCCESS') {
    return true;
  }
  // Contradiction 3: NPCI Switch says FAILED, but Beneficiary is CREDITED
  if (e.npciSwitch === 'FAILED' && e.beneficiaryCredit === 'CREDITED') {
    return true;
  }
  // Contradiction 4: NPCI Switch says SUCCESS, but Remitter says NOT_DEBITED
  if (e.npciSwitch === 'SUCCESS' && e.remitterDebit === 'NOT_DEBITED') {
    return true;
  }
  return false;
}

export const DECISION_RULES: DecisionRule[] = [
  // -------------------------------------------------------------
  // RULE 1: Definitive Clean Success
  // -------------------------------------------------------------
  {
    id: 'RULE_01_DEFINITIVE_SUCCESS',
    name: 'Definitive Clean Success',
    description: 'All parties confirm successful debit, switch transfer, credit, and order fulfillment.',
    predicate: (e) =>
      e.remitterDebit === 'DEBITED' &&
      e.npciSwitch === 'SUCCESS' &&
      e.beneficiaryCredit === 'CREDITED' &&
      (e.merchantOrder === 'CONFIRMED' || e.merchantOrder === 'NOT_APPLICABLE'),
    evaluate: (e) => ({
      canonicalState: 'DEFINITIVE_SUCCESS',
      severity: 'SUCCESS',
      headline: 'Payment Successful',
      subheadline: 'All systems confirmed settlement and completion.',
      knownFacts: [
        `₹${e.amount.toLocaleString('en-IN')} debited from ${e.remitterBankName}.`,
        'NPCI UPI Switch successfully routed the transfer.',
        `Beneficiary bank (${e.beneficiaryBankName}) confirmed receipt.`,
        e.type === 'P2M'
          ? `Merchant (${e.merchantName || 'Payee'}) confirmed order fulfillment.`
          : 'Beneficiary account credited.',
        `Bank Reference (UTR): ${e.utr}`,
      ],
      unknownFacts: [],
      safeToRetryPayment: false,
      primaryAction: {
        type: 'SHOW_RECEIPT',
        label: 'View Receipt',
        description: 'Transaction is complete. You can download or share your payment confirmation.',
        safeToRetryPayment: false,
        ctaButtonText: 'Download Receipt',
        ctaAction: 'SHOW_RECEIPT',
      },
    }),
  },

  // -------------------------------------------------------------
  // RULE 2: Contradictory Telemetry Anomaly (High Priority Guard)
  // -------------------------------------------------------------
  {
    id: 'RULE_02_CONTRADICTORY_ANOMALY',
    name: 'Contradictory Telemetry Anomaly',
    description: 'Independent system sources have provided mutually exclusive reports.',
    predicate: (e) => isContradictoryEvidence(e),
    evaluate: (e) => ({
      canonicalState: 'ANOMALOUS_CONTRADICTION',
      severity: 'CRITICAL_HOLD',
      headline: 'Conflicting Bank Responses Detected',
      subheadline: 'Systems report inconsistent statuses. DO NOT PAY AGAIN.',
      knownFacts: [
        `Remitter Bank (${e.remitterBankName}) reports: ${e.remitterDebit}`,
        `NPCI Central Switch reports: ${e.npciSwitch}`,
        `Beneficiary Bank (${e.beneficiaryBankName}) reports: ${e.beneficiaryCredit}`,
        `Transaction Reference (UTR): ${e.utr}`,
      ],
      unknownFacts: [
        'Final state of funds settlement is disputed between the remitter and beneficiary switches.',
      ],
      safeToRetryPayment: false,
      primaryAction: {
        type: 'SAFE_FREEZE_DISPUTE',
        label: 'Do Not Pay Again - Safe Freeze',
        description:
          'Because bank responses contradict each other, attempting another payment creates an acute risk of double-debit. A high-priority system dispute must be filed.',
        safeToRetryPayment: false,
        ctaButtonText: 'Raise Priority Dispute',
        ctaAction: 'OPEN_DISPUTE_MODAL',
      },
      secondaryAction: {
        type: 'WAIT_NETWORK_SETTLEMENT',
        label: 'Re-fetch Telemetry',
        description: 'Request updated status from central switch.',
        safeToRetryPayment: false,
        ctaButtonText: 'Re-check Status',
        ctaAction: 'REFRESH_TELEMETRY',
      },
      regulatoryCitation: e.type === 'P2P' ? RBI_P2P_CITATION : RBI_P2M_CITATION,
    }),
  },

  // -------------------------------------------------------------
  // RULE 3: Beneficiary Credited but Merchant POS Sync Lag (P2M)
  // -------------------------------------------------------------
  {
    id: 'RULE_03_MERCHANT_SYNC_LAG',
    name: 'Merchant POS Confirmation Lag',
    description: 'Beneficiary bank has received funds, but merchant POS/soundbox has not acknowledged.',
    predicate: (e) =>
      e.type === 'P2M' &&
      e.remitterDebit === 'DEBITED' &&
      e.npciSwitch === 'SUCCESS' &&
      e.beneficiaryCredit === 'CREDITED' &&
      (e.merchantOrder === 'PENDING' || e.merchantOrder === 'UNKNOWN' || e.merchantOrder === 'FAILED'),
    evaluate: (e) => ({
      canonicalState: 'CREDITED_MERCHANT_SYNC_LAG',
      severity: 'WARNING',
      headline: 'Money Credited to Merchant - Soundbox/POS Delayed',
      subheadline: 'Do NOT pay again. The merchant’s bank has received your money.',
      knownFacts: [
        `₹${e.amount.toLocaleString('en-IN')} was debited from ${e.remitterBankName}.`,
        'NPCI Switch completed the routing.',
        `Merchant’s bank (${e.beneficiaryBankName}) confirmed receipt of funds.`,
        `12-digit UPI UTR: ${e.utr}`,
      ],
      unknownFacts: [
        `The merchant's counter terminal / soundbox has not refreshed its local order status yet.`,
      ],
      safeToRetryPayment: false,
      primaryAction: {
        type: 'SHOW_UTR_TO_MERCHANT',
        label: 'Show 12-Digit UTR to Merchant',
        description:
          'Show this screen with UTR to the cashier. Funds have legally entered the merchant account. Do NOT make a second payment.',
        safeToRetryPayment: false,
        ctaButtonText: 'Show Cashier Proof',
        ctaAction: 'SHOW_RECEIPT',
      },
      secondaryAction: {
        type: 'RAISE_BANK_DISPUTE',
        label: 'File Merchant Dispute',
        description: 'If merchant refuses goods/services, record a dispute referencing this UTR.',
        safeToRetryPayment: false,
        ctaButtonText: 'File Dispute',
        ctaAction: 'OPEN_DISPUTE_MODAL',
      },
    }),
  },

  // -------------------------------------------------------------
  // RULE 4: In-Flight Deemed Success (< 15 mins)
  // -------------------------------------------------------------
  {
    id: 'RULE_04_IN_FLIGHT_SWITCH_ACCEPTED',
    name: 'In-Flight Deemed Success',
    description: 'Switch accepted the debit; beneficiary bank settlement response is in progress.',
    predicate: (e) =>
      e.remitterDebit === 'DEBITED' &&
      e.npciSwitch === 'DEEMED_SUCCESS' &&
      e.beneficiaryCredit !== 'NOT_CREDITED' &&
      e.elapsedMinutes < 15,
    evaluate: (e) => ({
      canonicalState: 'IN_FLIGHT_SWITCH_ACCEPTED',
      severity: 'INFO',
      headline: 'Payment Accepted by Switch - Settling with Payee Bank',
      subheadline: 'The transfer is actively completing. Do not retry.',
      knownFacts: [
        `₹${e.amount.toLocaleString('en-IN')} debited from ${e.remitterBankName}.`,
        'NPCI Switch validated the transaction as Deemed Success.',
        `Elapsed time: ${Math.round(e.elapsedMinutes)} minute(s).`,
      ],
      unknownFacts: [
        `Final credit confirmation from ${e.beneficiaryBankName} is pending.`,
      ],
      safeToRetryPayment: false,
      primaryAction: {
        type: 'WAIT_BENEFICIARY_SYNC',
        label: 'Wait for Payee Bank Confirmation',
        description:
          'The UPI switch has accepted the transfer. The payee bank typically reconciles within minutes. Retrying now will cause a duplicate debit.',
        safeToRetryPayment: false,
        ctaButtonText: 'Check for Updates',
        ctaAction: 'REFRESH_TELEMETRY',
      },
      simulationThreshold: PRODUCT_COOLING_OFF_THRESHOLD,
    }),
  },

  // -------------------------------------------------------------
  // RULE 5: In-Flight Debited with Switch Timeout (< 15 mins)
  // -------------------------------------------------------------
  {
    id: 'RULE_05_IN_FLIGHT_REMITTER_DEBITED',
    name: 'In-Flight Remitter Debited',
    description: 'Money debited from remitter bank; switch response timed out; within UX cooling-off period.',
    predicate: (e) =>
      e.remitterDebit === 'DEBITED' &&
      (e.npciSwitch === 'TIMEOUT' || e.npciSwitch === 'PENDING') &&
      e.beneficiaryCredit !== 'CREDITED' &&
      e.elapsedMinutes < 15,
    evaluate: (e) => ({
      canonicalState: 'IN_FLIGHT_REMITTER_DEBITED',
      severity: 'WARNING',
      headline: 'Money Debited - Banking Network Reconciling',
      subheadline: 'DO NOT PAY AGAIN. Your account was debited; settlement is underway.',
      knownFacts: [
        `₹${e.amount.toLocaleString('en-IN')} was debited from ${e.remitterBankName}.`,
        `Bank Reference (UTR): ${e.utr}`,
        `Elapsed time: ${Math.round(e.elapsedMinutes)} minute(s).`,
      ],
      unknownFacts: [
        'Whether the central switch completed transfer to beneficiary bank or will initiate auto-reversal.',
      ],
      safeToRetryPayment: false,
      primaryAction: {
        type: 'WAIT_NETWORK_SETTLEMENT',
        label: 'Do Not Pay Again - Network Sync In Progress',
        description:
          'Payment networks take up to 15 minutes to reconcile timed-out requests. If you retry now, you may be charged twice.',
        safeToRetryPayment: false,
        ctaButtonText: 'Refresh Status',
        ctaAction: 'REFRESH_TELEMETRY',
      },
      secondaryAction: {
        type: 'RAISE_BANK_DISPUTE',
        label: 'Escalate to Support',
        description: 'You can raise a pre-filled ticket with your bank UTR.',
        safeToRetryPayment: false,
        ctaButtonText: 'Raise Ticket',
        ctaAction: 'OPEN_DISPUTE_MODAL',
      },
      simulationThreshold: PRODUCT_COOLING_OFF_THRESHOLD,
    }),
  },

  // -------------------------------------------------------------
  // RULE 6: Unresolved Debit Timeout (>= 15 mins)
  // -------------------------------------------------------------
  {
    id: 'RULE_06_UNRESOLVED_DEBIT_TIMEOUT',
    name: 'Unresolved Debit Beyond Cooling Window',
    description: 'Money debited; switch timed out; 15-minute product window exceeded. Mandate statutory auto-reversal / dispute.',
    predicate: (e) =>
      e.remitterDebit === 'DEBITED' &&
      (e.npciSwitch === 'TIMEOUT' || e.npciSwitch === 'PENDING') &&
      e.beneficiaryCredit !== 'CREDITED' &&
      e.elapsedMinutes >= 15,
    evaluate: (e) => ({
      canonicalState: 'UNRESOLVED_DEBIT_TIMEOUT',
      severity: 'CRITICAL_HOLD',
      headline: 'Settlement Window Exceeded - Formal Action Required',
      subheadline: 'Money was debited but unacknowledged. DO NOT RETRY. Eligible for auto-reversal.',
      knownFacts: [
        `₹${e.amount.toLocaleString('en-IN')} debited from ${e.remitterBankName}.`,
        `Transaction UTR: ${e.utr}`,
        `More than ${Math.round(e.elapsedMinutes)} minutes have elapsed since payment initiation.`,
      ],
      unknownFacts: [
        `Beneficiary confirmation was not received within the app cooling-off window.`,
      ],
      safeToRetryPayment: false,
      primaryAction: {
        type: 'RAISE_BANK_DISPUTE',
        label: 'File Bank Dispute / Auto-Reversal Claim',
        description:
          'The in-flight window has closed without positive credit confirmation. Under RBI guidelines, your bank must reverse the funds or provide confirmation.',
        safeToRetryPayment: false,
        ctaButtonText: 'File Formal Claim',
        ctaAction: 'OPEN_DISPUTE_MODAL',
      },
      secondaryAction: {
        type: 'WAIT_NETWORK_SETTLEMENT',
        label: 'Re-check Banking Switch',
        description: 'Query the switch one more time for delayed settlement flags.',
        safeToRetryPayment: false,
        ctaButtonText: 'Check Switch',
        ctaAction: 'REFRESH_TELEMETRY',
      },
      regulatoryCitation: e.type === 'P2P' ? RBI_P2P_CITATION : RBI_P2M_CITATION,
      simulationThreshold: PRODUCT_COOLING_OFF_THRESHOLD,
    }),
  },

  // -------------------------------------------------------------
  // RULE 7: Switch Failed with Debit - Auto-Reversal In Progress
  // -------------------------------------------------------------
  {
    id: 'RULE_07_AUTO_REVERSAL_IN_PROGRESS',
    name: 'Switch Failed - Auto-Reversal Mandated',
    description: 'Money was debited, but switch failed and payee was not credited. Auto-refund is legally mandated.',
    predicate: (e) =>
      e.remitterDebit === 'DEBITED' &&
      e.npciSwitch === 'FAILED' &&
      e.beneficiaryCredit === 'NOT_CREDITED',
    evaluate: (e) => ({
      canonicalState: 'AUTO_REVERSAL_IN_PROGRESS',
      severity: 'WARNING',
      headline: 'Payment Failed - Auto-Reversal Initiated',
      subheadline: 'Money was debited but the switch failed. Funds will be refunded to your account.',
      knownFacts: [
        `₹${e.amount.toLocaleString('en-IN')} was deducted by ${e.remitterBankName}.`,
        'NPCI Switch recorded a terminal routing failure.',
        `Beneficiary bank (${e.beneficiaryBankName}) did not receive any money.`,
        `Bank Reference (UTR): ${e.utr}`,
      ],
      unknownFacts: [
        'Exact bank batch cycle at which remitter will credit the reversal to your statement.',
      ],
      safeToRetryPayment: false,
      primaryAction: {
        type: 'TRACK_AUTO_REVERSAL',
        label: 'Track Refund to Bank Account',
        description:
          `Your bank is processing an auto-reversal. As per RBI guidelines for ${e.type === 'P2P' ? 'P2P' : 'merchant (P2M)'} transactions, refunds are mandated within ${e.type === 'P2P' ? 'T+1' : 'T+5'} business days.`,
        safeToRetryPayment: false,
        ctaButtonText: 'View Refund SLA',
        ctaAction: 'OPEN_DISPUTE_MODAL',
      },
      regulatoryCitation: e.type === 'P2P' ? RBI_P2P_CITATION : RBI_P2M_CITATION,
    }),
  },

  // -------------------------------------------------------------
  // RULE 8: Definitive Clean Failure - No Debit Occurred
  // -------------------------------------------------------------
  {
    id: 'RULE_08_DEFINITIVE_FAILURE_NO_DEBIT',
    name: 'Clean Failure - Zero Debit',
    description:
      'The transaction definitively failed before money left the remitter account (e.g. incorrect PIN, insufficient balance). Safe to retry.',
    predicate: (e) =>
      e.remitterDebit === 'NOT_DEBITED' &&
      e.npciSwitch === 'FAILED' &&
      e.beneficiaryCredit === 'NOT_CREDITED' &&
      (e.merchantOrder === 'FAILED' || e.merchantOrder === 'NOT_APPLICABLE' || e.merchantOrder === 'UNKNOWN'),
    evaluate: (e) => ({
      canonicalState: 'DEFINITIVE_FAILURE_NO_DEBIT',
      severity: 'INFO',
      headline: 'Payment Failed - No Money Deducted',
      subheadline: 'Your bank account was NOT debited. It is safe to retry.',
      knownFacts: [
        `No money was debited from ${e.remitterBankName}.`,
        'Transaction terminated without account charge.',
        'Beneficiary received no funds.',
      ],
      unknownFacts: [],
      // THE CARDINAL EXCEPTION: Positive evidence of failure and zero debit!
      safeToRetryPayment: true,
      primaryAction: {
        type: 'SAFE_TO_RETRY_OR_SWITCH',
        label: 'Safe to Retry Payment',
        description:
          'Because zero funds left your account, retrying will not create a double debit. You can try again or use another payment method.',
        safeToRetryPayment: true,
        ctaButtonText: 'Retry Payment',
        ctaAction: 'RETRY_PAYMENT',
      },
    }),
  },

  // -------------------------------------------------------------
  // RULE 9: Indeterminate Safeguard / Missing Data Fallback
  // -------------------------------------------------------------
  {
    id: 'RULE_09_INDETERMINATE_SAFEGUARD',
    name: 'Indeterminate Safeguard Fallback',
    description: 'Telemetry is unknown, incomplete, or corrupted. Strictly block retry as a precautionary safeguard.',
    predicate: () => true, // Fallback catch-all
    evaluate: (e) => ({
      canonicalState: 'INDETERMINATE_SAFEGUARD',
      severity: 'CRITICAL_HOLD',
      headline: 'Transaction Status Indeterminate',
      subheadline: 'Banking telemetry is unavailable. DO NOT RETRY until your account statement is checked.',
      knownFacts: [
        `Transaction ID: ${e.transactionId || 'UNKNOWN'}`,
        `Reported Remitter Status: ${e.remitterDebit || 'MISSING'}`,
        `Reported Switch Status: ${e.npciSwitch || 'MISSING'}`,
      ],
      unknownFacts: [
        'Whether your bank debited funds from your account.',
        'Whether the recipient or merchant received credit.',
      ],
      safeToRetryPayment: false,
      primaryAction: {
        type: 'HOLD_AND_VERIFY_STATEMENT',
        label: 'Do Not Pay Again - Check Bank Passbook',
        description:
          'When payment status is unknown, initiating a second payment risks double-debit. Check your official bank SMS or mobile banking statement before taking any action.',
        safeToRetryPayment: false,
        ctaButtonText: 'Contact Support',
        ctaAction: 'OPEN_DISPUTE_MODAL',
      },
      secondaryAction: {
        type: 'WAIT_NETWORK_SETTLEMENT',
        label: 'Attempt Telemetry Refresh',
        description: 'Try polling bank networks for an updated status.',
        safeToRetryPayment: false,
        ctaButtonText: 'Retry Status Query',
        ctaAction: 'REFRESH_TELEMETRY',
      },
    }),
  },
];
