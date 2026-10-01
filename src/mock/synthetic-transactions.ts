/**
 * Synthetic UPI Transaction Dataset
 *
 * ALL records in this file are simulated, synthetic test fixtures.
 * ZERO real banking credentials, PII, or live endpoints are utilized.
 *
 * Covers 13 varied scenarios:
 * 1. Clean P2M Success
 * 2. Clean P2P Success
 * 3. Merchant POS / Soundbox Sync Delay (P2M)
 * 4. In-Flight Deemed Success (<15m)
 * 5. In-Flight Remitter Debited Switch Timeout (<15m, P2M)
 * 6. In-Flight Remitter Debited Switch Timeout (<15m, P2P)
 * 7. Unresolved Debit Timeout (>=15m, P2M - T+5 Reversal Mandate)
 * 8. Unresolved Debit Timeout (>=15m, P2P - T+1 Reversal Mandate)
 * 9. Switch Routing Failure - Auto-Reversal in Progress
 * 10. Clean Failure - Insufficient Balance / Pin Error (P2M, Safe to Retry)
 * 11. Clean Failure - Initiation Rejection (P2P, Safe to Retry)
 * 12. Anomalous Contradiction (Bank Debited vs Switch Failed vs Beneficiary Credited)
 * 13. Indeterminate Safeguard (Missing / Corrupted Telemetry)
 */

import { MultiPartyEvidence, TransactionType } from '../engine/types';

export interface SyntheticTransaction {
  id: string;
  utr: string;
  counterparty: string;
  counterpartyVpa: string;
  type: TransactionType;
  amount: number;
  timestamp: string;
  evidence: MultiPartyEvidence;
  narrative: string;
}

export const SYNTHETIC_TRANSACTIONS: SyntheticTransaction[] = [
  {
    id: 'SYNTH-TX-101',
    utr: '908234120911',
    counterparty: 'Blue Tokai Coffee [SYNTHETIC]',
    counterpartyVpa: 'bluetokai@okhdfcbank',
    type: 'P2M',
    amount: 340,
    timestamp: '2026-10-01T13:45:00Z',
    evidence: {
      transactionId: 'SYNTH-TX-101',
      utr: '908234120911',
      type: 'P2M',
      amount: 340,
      remitterDebit: 'DEBITED',
      npciSwitch: 'SUCCESS',
      beneficiaryCredit: 'CREDITED',
      merchantOrder: 'CONFIRMED',
      elapsedMinutes: 14,
      remitterBankName: 'HDFC Bank',
      beneficiaryBankName: 'ICICI Bank',
      merchantName: 'Blue Tokai Coffee [SYNTHETIC]',
      timestamp: '2026-10-01T13:45:00Z',
    },
    narrative: 'Clean P2M transaction. All 4 parties acknowledge completion without delay.',
  },
  {
    id: 'SYNTH-TX-102',
    utr: '908234120912',
    counterparty: 'Rahul Sharma (P2P) [SYNTHETIC]',
    counterpartyVpa: 'rahul.s@oksbi',
    type: 'P2P',
    amount: 2500,
    timestamp: '2026-10-01T13:30:00Z',
    evidence: {
      transactionId: 'SYNTH-TX-102',
      utr: '908234120912',
      type: 'P2P',
      amount: 2500,
      remitterDebit: 'DEBITED',
      npciSwitch: 'SUCCESS',
      beneficiaryCredit: 'CREDITED',
      merchantOrder: 'NOT_APPLICABLE',
      elapsedMinutes: 29,
      remitterBankName: 'State Bank of India',
      beneficiaryBankName: 'Axis Bank',
      timestamp: '2026-10-01T13:30:00Z',
    },
    narrative: 'Clean P2P transfer between individuals. Confirmed credit in beneficiary account.',
  },
  {
    id: 'SYNTH-TX-103',
    utr: '908234120913',
    counterparty: 'Kaveri Supermarket [SYNTHETIC]',
    counterpartyVpa: 'kaveristore@icici',
    type: 'P2M',
    amount: 1420,
    timestamp: '2026-10-01T13:52:00Z',
    evidence: {
      transactionId: 'SYNTH-TX-103',
      utr: '908234120913',
      type: 'P2M',
      amount: 1420,
      remitterDebit: 'DEBITED',
      npciSwitch: 'SUCCESS',
      beneficiaryCredit: 'CREDITED',
      merchantOrder: 'PENDING',
      elapsedMinutes: 7,
      remitterBankName: 'Kotak Mahindra Bank',
      beneficiaryBankName: 'HDFC Bank',
      merchantName: 'Kaveri Supermarket [SYNTHETIC]',
      timestamp: '2026-10-01T13:52:00Z',
    },
    narrative:
      'Merchant soundbox / POS sync lag. Beneficiary account has received funds; customer must NOT retry. Instructed to show 12-digit UTR to cashier.',
  },
  {
    id: 'SYNTH-TX-104',
    utr: '908234120914',
    counterparty: 'Swiggy Food [SYNTHETIC]',
    counterpartyVpa: 'swiggyorders@yesbank',
    type: 'P2M',
    amount: 680,
    timestamp: '2026-10-01T13:56:00Z',
    evidence: {
      transactionId: 'SYNTH-TX-104',
      utr: '908234120914',
      type: 'P2M',
      amount: 680,
      remitterDebit: 'DEBITED',
      npciSwitch: 'DEEMED_SUCCESS',
      beneficiaryCredit: 'UNKNOWN',
      merchantOrder: 'PENDING',
      elapsedMinutes: 3,
      remitterBankName: 'ICICI Bank',
      beneficiaryBankName: 'Yes Bank',
      merchantName: 'Swiggy Food [SYNTHETIC]',
      timestamp: '2026-10-01T13:56:00Z',
    },
    narrative:
      'Switch accepted debit as Deemed Success. Payee bank confirmation in flight. Safe hold active; cooling off window in progress.',
  },
  {
    id: 'SYNTH-TX-105',
    utr: '908234120915',
    counterparty: 'Zomato Dining [SYNTHETIC]',
    counterpartyVpa: 'zomatodine@hdfcbank',
    type: 'P2M',
    amount: 2800,
    timestamp: '2026-10-01T13:54:00Z',
    evidence: {
      transactionId: 'SYNTH-TX-105',
      utr: '908234120915',
      type: 'P2M',
      amount: 2800,
      remitterDebit: 'DEBITED',
      npciSwitch: 'TIMEOUT',
      beneficiaryCredit: 'UNKNOWN',
      merchantOrder: 'PENDING',
      elapsedMinutes: 5,
      remitterBankName: 'HDFC Bank',
      beneficiaryBankName: 'Axis Bank',
      merchantName: 'Zomato Dining [SYNTHETIC]',
      timestamp: '2026-10-01T13:54:00Z',
    },
    narrative:
      'Central switch timed out during peak dinner rush. Money debited from remitter. Acute risk of double-debit if customer pays again. DO NOT RETRY.',
  },
  {
    id: 'SYNTH-TX-106',
    utr: '908234120916',
    counterparty: 'Sunil Kumar (Rent) [SYNTHETIC]',
    counterpartyVpa: 'sunil.landlord@sbi',
    type: 'P2P',
    amount: 18000,
    timestamp: '2026-10-01T13:55:00Z',
    evidence: {
      transactionId: 'SYNTH-TX-106',
      utr: '908234120916',
      type: 'P2P',
      amount: 18000,
      remitterDebit: 'DEBITED',
      npciSwitch: 'TIMEOUT',
      beneficiaryCredit: 'UNKNOWN',
      merchantOrder: 'NOT_APPLICABLE',
      elapsedMinutes: 4,
      remitterBankName: 'State Bank of India',
      beneficiaryBankName: 'Canara Bank',
      timestamp: '2026-10-01T13:55:00Z',
    },
    narrative:
      'High-value P2P transfer timed out. Money left user bank. Precautionary hold active; active polling simulation enabled.',
  },
  {
    id: 'SYNTH-TX-107',
    utr: '908234120917',
    counterparty: 'Croma Electronics [SYNTHETIC]',
    counterpartyVpa: 'croma.retail@hdfcbank',
    type: 'P2M',
    amount: 8499,
    timestamp: '2026-10-01T13:25:00Z',
    evidence: {
      transactionId: 'SYNTH-TX-107',
      utr: '908234120917',
      type: 'P2M',
      amount: 8499,
      remitterDebit: 'DEBITED',
      npciSwitch: 'TIMEOUT',
      beneficiaryCredit: 'UNKNOWN',
      merchantOrder: 'PENDING',
      elapsedMinutes: 34,
      remitterBankName: 'Axis Bank',
      beneficiaryBankName: 'HDFC Bank',
      merchantName: 'Croma Electronics [SYNTHETIC]',
      timestamp: '2026-10-01T13:25:00Z',
    },
    narrative:
      'Unresolved debit exceeding product cooling window (34 mins). Falls under RBI Table 5(b) merchant auto-reversal mandate (T+5 business days). Pre-filled dispute available.',
  },
  {
    id: 'SYNTH-TX-108',
    utr: '908234120918',
    counterparty: 'Priya Verma (P2P) [SYNTHETIC]',
    counterpartyVpa: 'priya.v@icici',
    type: 'P2P',
    amount: 4000,
    timestamp: '2026-10-01T13:10:00Z',
    evidence: {
      transactionId: 'SYNTH-TX-108',
      utr: '908234120918',
      type: 'P2P',
      amount: 4000,
      remitterDebit: 'DEBITED',
      npciSwitch: 'TIMEOUT',
      beneficiaryCredit: 'UNKNOWN',
      merchantOrder: 'NOT_APPLICABLE',
      elapsedMinutes: 49,
      remitterBankName: 'HDFC Bank',
      beneficiaryBankName: 'ICICI Bank',
      timestamp: '2026-10-01T13:10:00Z',
    },
    narrative:
      'P2P transfer timed out and unresolved after 49 mins. Governed by RBI Table 5(a) auto-reversal mandate (T+1 business day) with ₹100/day delay compensation.',
  },
  {
    id: 'SYNTH-TX-109',
    utr: '908234120919',
    counterparty: 'Indian Oil Fuel [SYNTHETIC]',
    counterpartyVpa: 'indianoil.pump@sbi',
    type: 'P2M',
    amount: 2100,
    timestamp: '2026-10-01T13:40:00Z',
    evidence: {
      transactionId: 'SYNTH-TX-109',
      utr: '908234120919',
      type: 'P2M',
      amount: 2100,
      remitterDebit: 'DEBITED',
      npciSwitch: 'FAILED',
      beneficiaryCredit: 'NOT_CREDITED',
      merchantOrder: 'FAILED',
      elapsedMinutes: 19,
      remitterBankName: 'Punjab National Bank',
      beneficiaryBankName: 'State Bank of India',
      merchantName: 'Indian Oil Fuel [SYNTHETIC]',
      timestamp: '2026-10-01T13:40:00Z',
    },
    narrative:
      'Bank debited account, but switch failed routing. Beneficiary received nothing. Bank auto-reversal is in transit; customer tracking SLA provided.',
  },
  {
    id: 'SYNTH-TX-110',
    utr: '908234120920',
    counterparty: 'Uber Rides [SYNTHETIC]',
    counterpartyVpa: 'uber.india@hdfcbank',
    type: 'P2M',
    amount: 350,
    timestamp: '2026-10-01T13:50:00Z',
    evidence: {
      transactionId: 'SYNTH-TX-110',
      utr: '908234120920',
      type: 'P2M',
      amount: 350,
      remitterDebit: 'NOT_DEBITED',
      npciSwitch: 'FAILED',
      beneficiaryCredit: 'NOT_CREDITED',
      merchantOrder: 'FAILED',
      elapsedMinutes: 9,
      remitterBankName: 'ICICI Bank',
      beneficiaryBankName: 'HDFC Bank',
      merchantName: 'Uber Rides [SYNTHETIC]',
      timestamp: '2026-10-01T13:50:00Z',
    },
    narrative:
      'Definitive clean failure (incorrect UPI PIN entered). Zero funds debited. Cardinal exception: SAFE TO RETRY PAYMENT.',
  },
  {
    id: 'SYNTH-TX-111',
    utr: '908234120921',
    counterparty: 'Vikram Mehta (Splitwise) [SYNTHETIC]',
    counterpartyVpa: 'vikram.m@paytm',
    type: 'P2P',
    amount: 550,
    timestamp: '2026-10-01T13:42:00Z',
    evidence: {
      transactionId: 'SYNTH-TX-111',
      utr: '908234120921',
      type: 'P2P',
      amount: 550,
      remitterDebit: 'NOT_DEBITED',
      npciSwitch: 'FAILED',
      beneficiaryCredit: 'NOT_CREDITED',
      merchantOrder: 'NOT_APPLICABLE',
      elapsedMinutes: 17,
      remitterBankName: 'State Bank of India',
      beneficiaryBankName: 'Paytm Payments Bank',
      timestamp: '2026-10-01T13:42:00Z',
    },
    narrative:
      'Bank rejected debit due to daily UPI transaction frequency limit. No money deducted. Safe to retry with another account.',
  },
  {
    id: 'SYNTH-TX-112',
    utr: '908234120922',
    counterparty: 'Reliance Digital [SYNTHETIC]',
    counterpartyVpa: 'reliancedigital@icici',
    type: 'P2M',
    amount: 14999,
    timestamp: '2026-10-01T13:38:00Z',
    evidence: {
      transactionId: 'SYNTH-TX-112',
      utr: '908234120922',
      type: 'P2M',
      amount: 14999,
      remitterDebit: 'DEBITED',
      npciSwitch: 'FAILED',
      beneficiaryCredit: 'CREDITED',
      merchantOrder: 'PENDING',
      elapsedMinutes: 21,
      remitterBankName: 'HDFC Bank',
      beneficiaryBankName: 'ICICI Bank',
      merchantName: 'Reliance Digital [SYNTHETIC]',
      timestamp: '2026-10-01T13:38:00Z',
    },
    narrative:
      'High-severity anomaly: Remitter says debited, switch says failed, yet beneficiary bank reports funds credited. Strict freeze and priority dispute flag.',
  },
  {
    id: 'SYNTH-TX-113',
    utr: '908234120923',
    counterparty: 'Metro Card Recharge [SYNTHETIC]',
    counterpartyVpa: 'delhimetro@dmrc',
    type: 'P2M',
    amount: 200,
    timestamp: '2026-10-01T13:58:00Z',
    evidence: {
      transactionId: 'SYNTH-TX-113',
      utr: '908234120923',
      type: 'P2M',
      amount: 200,
      remitterDebit: 'UNKNOWN',
      npciSwitch: 'UNKNOWN',
      beneficiaryCredit: 'UNKNOWN',
      merchantOrder: 'UNKNOWN',
      elapsedMinutes: 1,
      remitterBankName: 'Unknown Remitter',
      beneficiaryBankName: 'DMRC Bank',
      merchantName: 'Metro Card Recharge [SYNTHETIC]',
      timestamp: '2026-10-01T13:58:00Z',
    },
    narrative:
      'Missing / corrupt bank telemetry. Conservative safeguard activates: hold and verify official bank statement before attempting any new transfer.',
  },
];

/**
 * Returns a pristine deep clone of the synthetic transactions dataset.
 * Prevents reference pollution across demo resets.
 */
export function getInitialSyntheticTransactions(): SyntheticTransaction[] {
  return JSON.parse(JSON.stringify(SYNTHETIC_TRANSACTIONS));
}
