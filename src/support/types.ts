/**
 * Support Case Data Model & Contracts
 *
 * Models simulated customer dispute and inquiry workflows.
 * ALL support cases are strictly synthetic and local to this demo.
 */

export type CaseStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

export type CaseCategory =
  | 'PAYMENT_PENDING'
  | 'DEBITED_CONFIRMATION_MISSING'
  | 'MERCHANT_CONFIRMATION_DELAY'
  | 'REVERSAL_TRACKING'
  | 'CONFLICTING_EVIDENCE'
  | 'GENERAL_INQUIRY';

export interface CaseActivity {
  id: string;
  timestamp: string;
  action: string;
  fromStatus?: CaseStatus;
  toStatus?: CaseStatus;
  note: string;
  actor: 'CUSTOMER' | 'SUPPORT_AGENT' | 'SYSTEM';
}

export interface SupportCase {
  id: string; // e.g. CASE-1001
  transactionId: string; // Linked synthetic transaction ID
  utr: string; // 12-digit UTR
  category: CaseCategory;
  subject: string;
  description: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  history: CaseActivity[];
  isSimulated: true;
}

export interface CreateCaseInput {
  transactionId: string;
  utr: string;
  category: CaseCategory;
  subject: string;
  description: string;
}
