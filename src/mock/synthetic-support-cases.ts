/**
 * Deterministic Synthetic Support Cases Fixture
 *
 * Provides reproducible seed support cases linking to synthetic transactions.
 */

import { SupportCase } from '@/support/types';

export const INITIAL_SYNTHETIC_CASES: SupportCase[] = [
  {
    id: 'CASE-1001',
    transactionId: 'SYNTH-TX-107',
    utr: '908234120917',
    category: 'DEBITED_CONFIRMATION_MISSING',
    subject: 'Unresolved debit timeout of ₹8,499 at Croma Electronics [SYNTHETIC]',
    description:
      'Account was debited at store checkout, but billing screen showed network timeout. Waited 30 minutes without receipt.',
    status: 'UNDER_REVIEW',
    createdAt: '2026-10-01T13:30:00Z',
    updatedAt: '2026-10-01T13:45:00Z',
    isSimulated: true,
    history: [
      {
        id: 'ACT-1001-1',
        timestamp: '2026-10-01T13:30:00Z',
        action: 'CASE_CREATED',
        toStatus: 'OPEN',
        note: 'Customer initiated synthetic support dispute with attached UTR 908234120917.',
        actor: 'CUSTOMER',
      },
      {
        id: 'ACT-1001-2',
        timestamp: '2026-10-01T13:45:00Z',
        action: 'STATUS_ADVANCED',
        fromStatus: 'OPEN',
        toStatus: 'UNDER_REVIEW',
        note: 'Simulated support specialist logged claim under RBI Table 5(b) T+5 merchant auto-reversal protocol.',
        actor: 'SUPPORT_AGENT',
      },
    ],
  },
  {
    id: 'CASE-1002',
    transactionId: 'SYNTH-TX-103',
    utr: '908234120913',
    category: 'MERCHANT_CONFIRMATION_DELAY',
    subject: 'Soundbox silence for ₹1,420 payment at Kaveri Supermarket [SYNTHETIC]',
    description:
      'Cashier stated soundbox did not announce payment. Bank SMS confirmed debit. Customer showed UTR on app.',
    status: 'OPEN',
    createdAt: '2026-10-01T13:54:00Z',
    updatedAt: '2026-10-01T13:54:00Z',
    isSimulated: true,
    history: [
      {
        id: 'ACT-1002-1',
        timestamp: '2026-10-01T13:54:00Z',
        action: 'CASE_CREATED',
        toStatus: 'OPEN',
        note: 'Simulated dispute ticket logged. Payee bank credit confirmed; awaiting store counter reconciliation.',
        actor: 'CUSTOMER',
      },
    ],
  },
  {
    id: 'CASE-1003',
    transactionId: 'SYNTH-TX-109',
    utr: '908234120919',
    category: 'REVERSAL_TRACKING',
    subject: 'Auto-reversal tracking for failed fuel payment (₹2,100)',
    description:
      'Debit occurred during fuel pump authorization, but switch reported terminal routing failure.',
    status: 'RESOLVED',
    createdAt: '2026-10-01T13:42:00Z',
    updatedAt: '2026-10-01T14:10:00Z',
    isSimulated: true,
    history: [
      {
        id: 'ACT-1003-1',
        timestamp: '2026-10-01T13:42:00Z',
        action: 'CASE_CREATED',
        toStatus: 'OPEN',
        note: 'Claim initiated for auto-reversal SLA monitoring.',
        actor: 'CUSTOMER',
      },
      {
        id: 'ACT-1003-2',
        timestamp: '2026-10-01T13:55:00Z',
        action: 'STATUS_ADVANCED',
        fromStatus: 'OPEN',
        toStatus: 'UNDER_REVIEW',
        note: 'Switch failure acknowledgment verified with Punjab National Bank gateway.',
        actor: 'SUPPORT_AGENT',
      },
      {
        id: 'ACT-1003-3',
        timestamp: '2026-10-01T14:10:00Z',
        action: 'STATUS_ADVANCED',
        fromStatus: 'UNDER_REVIEW',
        toStatus: 'RESOLVED',
        note: 'Case resolved: Remitter bank posted auto-reversal batch credit back to source savings account.',
        actor: 'SUPPORT_AGENT',
      },
    ],
  },
];

/**
 * Returns a pristine deep clone of the synthetic support cases fixture.
 * Prevents reference pollution across demo resets.
 */
export function getInitialSyntheticCases(): SupportCase[] {
  return JSON.parse(JSON.stringify(INITIAL_SYNTHETIC_CASES));
}
