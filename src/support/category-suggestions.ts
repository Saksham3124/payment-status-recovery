/**
 * Pure Category Suggestion Helper
 *
 * Derives contextual support-case categories and draft subjects from
 * the evaluated transaction recovery state without altering engine outputs.
 */

import { CanonicalRecoveryState } from '@/engine/types';
import { CaseCategory } from './types';

export interface CategorySuggestion {
  category: CaseCategory;
  categoryLabel: string;
  defaultSubject: string;
  guidanceSummary: string;
}

export const CATEGORY_METADATA: Record<
  CaseCategory,
  { label: string; description: string }
> = {
  PAYMENT_PENDING: {
    label: 'Payment Pending / In-Flight Settlement',
    description: 'Transaction was initiated but network switch or payee bank response is awaiting settlement.',
  },
  DEBITED_CONFIRMATION_MISSING: {
    label: 'Amount Debited but Confirmation Missing',
    description: 'Account balance was deducted but payment confirmation or receipt was not received.',
  },
  MERCHANT_CONFIRMATION_DELAY: {
    label: 'Merchant Soundbox / POS Delay',
    description: 'Beneficiary bank received credit, but merchant billing terminal has not updated.',
  },
  REVERSAL_TRACKING: {
    label: 'Auto-Reversal / Refund Tracking',
    description: 'Transfer failed at switch and refund auto-reversal is being tracked under RBI TAT.',
  },
  CONFLICTING_EVIDENCE: {
    label: 'Conflicting Bank Responses',
    description: 'Independent system sources have returned mutually contradictory transaction statuses.',
  },
  GENERAL_INQUIRY: {
    label: 'General Transaction Inquiry',
    description: 'Question regarding transaction receipt, statement entry, or payment details.',
  },
};

export function suggestCaseCategory(
  canonicalState: CanonicalRecoveryState,
  amount: number,
  counterparty: string
): CategorySuggestion {
  switch (canonicalState) {
    case 'CREDITED_MERCHANT_SYNC_LAG':
      return {
        category: 'MERCHANT_CONFIRMATION_DELAY',
        categoryLabel: CATEGORY_METADATA.MERCHANT_CONFIRMATION_DELAY.label,
        defaultSubject: `Soundbox delay for ₹${amount} payment to ${counterparty}`,
        guidanceSummary:
          'Beneficiary account has received credit. Recommended to present 12-digit UTR to merchant cashier.',
      };

    case 'IN_FLIGHT_SWITCH_ACCEPTED':
    case 'IN_FLIGHT_REMITTER_DEBITED':
      return {
        category: 'PAYMENT_PENDING',
        categoryLabel: CATEGORY_METADATA.PAYMENT_PENDING.label,
        defaultSubject: `In-flight status check for ₹${amount} transfer to ${counterparty}`,
        guidanceSummary:
          'Settlement packet is in transit. Do not initiate a duplicate payment while status is pending.',
      };

    case 'UNRESOLVED_DEBIT_TIMEOUT':
    case 'INDETERMINATE_SAFEGUARD':
      return {
        category: 'DEBITED_CONFIRMATION_MISSING',
        categoryLabel: CATEGORY_METADATA.DEBITED_CONFIRMATION_MISSING.label,
        defaultSubject: `Unresolved debit timeout of ₹${amount} for ${counterparty}`,
        guidanceSummary:
          'Cooling-off window elapsed without credit ack. Eligible for statutory auto-reversal claim.',
      };

    case 'AUTO_REVERSAL_IN_PROGRESS':
      return {
        category: 'REVERSAL_TRACKING',
        categoryLabel: CATEGORY_METADATA.REVERSAL_TRACKING.label,
        defaultSubject: `Auto-reversal SLA tracking for failed transfer of ₹${amount}`,
        guidanceSummary:
          'Switch routing failed. Bank refund is in transit under RBI turnaround-time guidelines.',
      };

    case 'ANOMALOUS_CONTRADICTION':
      return {
        category: 'CONFLICTING_EVIDENCE',
        categoryLabel: CATEGORY_METADATA.CONFLICTING_EVIDENCE.label,
        defaultSubject: `Contradictory telemetry investigation for ₹${amount}`,
        guidanceSummary:
          'Bank and switch reports conflict. High-priority investigation required without retry.',
      };

    case 'DEFINITIVE_SUCCESS':
    case 'DEFINITIVE_FAILURE_NO_DEBIT':
    default:
      return {
        category: 'GENERAL_INQUIRY',
        categoryLabel: CATEGORY_METADATA.GENERAL_INQUIRY.label,
        defaultSubject: `Inquiry regarding ${counterparty} payment (₹${amount})`,
        guidanceSummary:
          'Transaction reached definitive state. General inquiry regarding receipt or statement.',
      };
  }
}
