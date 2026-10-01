/**
 * Payment Status Recovery - Domain Types & Engine Interfaces
 *
 * Strict Architectural Separation:
 * 1. Pure types with zero dependencies on React or browser APIs.
 * 2. Explicit distinction between statutory regulatory mandates (RBI DPSS)
 *    and client-side product simulation thresholds (15-min UX cooldowns).
 */

export type TransactionType = 'P2P' | 'P2M';

export type RemitterDebitStatus = 'DEBITED' | 'NOT_DEBITED' | 'UNKNOWN';

export type NpciSwitchStatus =
  | 'SUCCESS'
  | 'DEEMED_SUCCESS'
  | 'PENDING'
  | 'TIMEOUT'
  | 'FAILED'
  | 'UNKNOWN';

export type BeneficiaryCreditStatus = 'CREDITED' | 'NOT_CREDITED' | 'UNKNOWN';

export type MerchantOrderStatus =
  | 'CONFIRMED'
  | 'PENDING'
  | 'FAILED'
  | 'NOT_APPLICABLE'
  | 'UNKNOWN';

export type CanonicalRecoveryState =
  | 'DEFINITIVE_SUCCESS'
  | 'CREDITED_MERCHANT_SYNC_LAG'
  | 'IN_FLIGHT_SWITCH_ACCEPTED'
  | 'IN_FLIGHT_REMITTER_DEBITED'
  | 'UNRESOLVED_DEBIT_TIMEOUT'
  | 'AUTO_REVERSAL_IN_PROGRESS'
  | 'DEFINITIVE_FAILURE_NO_DEBIT'
  | 'ANOMALOUS_CONTRADICTION'
  | 'INDETERMINATE_SAFEGUARD';

export type ActionDirectiveType =
  | 'SHOW_RECEIPT'
  | 'SHOW_UTR_TO_MERCHANT'
  | 'WAIT_BENEFICIARY_SYNC'
  | 'WAIT_NETWORK_SETTLEMENT'
  | 'RAISE_BANK_DISPUTE'
  | 'TRACK_AUTO_REVERSAL'
  | 'SAFE_TO_RETRY_OR_SWITCH'
  | 'SAFE_FREEZE_DISPUTE'
  | 'HOLD_AND_VERIFY_STATEMENT';

export type GuidanceSeverity = 'SUCCESS' | 'INFO' | 'WARNING' | 'CRITICAL_HOLD';

export interface MultiPartyEvidence {
  transactionId: string;
  utr: string; // 12-digit UPI Unique Transaction Reference
  type: TransactionType;
  amount: number;
  remitterDebit: RemitterDebitStatus;
  npciSwitch: NpciSwitchStatus;
  beneficiaryCredit: BeneficiaryCreditStatus;
  merchantOrder: MerchantOrderStatus;
  elapsedMinutes: number;
  remitterBankName: string;
  beneficiaryBankName: string;
  merchantName?: string;
  timestamp: string;
}

/**
 * Statutory regulatory references (RBI DPSS Harmonisation of TAT).
 * Guaranteed separate from product UX cooling-off periods.
 */
export interface RegulatoryCitation {
  framework: string;
  circularRef: string;
  applicableClause: string;
  mandatedTat: string;
  compensationPolicy: string;
  officialDocUrl: string;
}

/**
 * App-level UX simulation thresholds (e.g. 15-minute wait window).
 * Never conflated with RBI mandates.
 */
export interface SimulationThreshold {
  windowName: string;
  thresholdMinutes: number;
  purpose: string;
}

export interface ActionPlan {
  type: ActionDirectiveType;
  label: string;
  description: string;
  safeToRetryPayment: boolean;
  ctaButtonText?: string;
  ctaAction?: 'REFRESH_TELEMETRY' | 'OPEN_DISPUTE_MODAL' | 'SHOW_RECEIPT' | 'RETRY_PAYMENT' | 'NONE';
}

export interface RecoveryGuidance {
  canonicalState: CanonicalRecoveryState;
  severity: GuidanceSeverity;
  headline: string;
  subheadline: string;
  knownFacts: string[];
  unknownFacts: string[];
  /**
   * CARDINAL SAFETY INVARIANT:
   * Must evaluate to true IF AND ONLY IF:
   * remitterDebit === 'NOT_DEBITED' && npciSwitch === 'FAILED' && beneficiaryCredit === 'NOT_CREDITED'
   */
  safeToRetryPayment: boolean;
  primaryAction: ActionPlan;
  secondaryAction?: ActionPlan;
  regulatoryCitation?: RegulatoryCitation;
  simulationThreshold?: SimulationThreshold;
  ruleMatchedId: string;
  evidenceSnapshot: MultiPartyEvidence;
}

export interface DecisionRule {
  id: string;
  name: string;
  description: string;
  predicate: (evidence: MultiPartyEvidence) => boolean;
  evaluate: (evidence: MultiPartyEvidence) => Omit<RecoveryGuidance, 'evidenceSnapshot' | 'ruleMatchedId'>;
}
