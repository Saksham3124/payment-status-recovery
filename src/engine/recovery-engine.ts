/**
 * Recovery Rules Engine
 *
 * Pure, functional engine evaluating multi-party telemetry against deterministic rules.
 * Strictly guarantees the Cardinal Safety Invariant on all paths, including malformed inputs.
 */

import { DECISION_RULES } from './decision-table';
import { MultiPartyEvidence, RecoveryGuidance } from './types';

/**
 * Normalizes input evidence to defend against undefined, null, or malformed data.
 */
function sanitizeEvidence(input: Partial<MultiPartyEvidence>): MultiPartyEvidence {
  return {
    transactionId: String(input?.transactionId || 'UNKNOWN_TX'),
    utr: String(input?.utr || 'UNKNOWN_UTR'),
    type: input?.type === 'P2M' ? 'P2M' : 'P2P',
    amount: typeof input?.amount === 'number' && !isNaN(input.amount) ? Math.max(0, input.amount) : 0,
    remitterDebit:
      input?.remitterDebit === 'DEBITED' || input?.remitterDebit === 'NOT_DEBITED'
        ? input.remitterDebit
        : 'UNKNOWN',
    npciSwitch:
      input?.npciSwitch === 'SUCCESS' ||
      input?.npciSwitch === 'DEEMED_SUCCESS' ||
      input?.npciSwitch === 'PENDING' ||
      input?.npciSwitch === 'TIMEOUT' ||
      input?.npciSwitch === 'FAILED'
        ? input.npciSwitch
        : 'UNKNOWN',
    beneficiaryCredit:
      input?.beneficiaryCredit === 'CREDITED' || input?.beneficiaryCredit === 'NOT_CREDITED'
        ? input.beneficiaryCredit
        : 'UNKNOWN',
    merchantOrder:
      input?.merchantOrder === 'CONFIRMED' ||
      input?.merchantOrder === 'PENDING' ||
      input?.merchantOrder === 'FAILED' ||
      input?.merchantOrder === 'NOT_APPLICABLE'
        ? input.merchantOrder
        : 'UNKNOWN',
    elapsedMinutes:
      typeof input?.elapsedMinutes === 'number' && !isNaN(input.elapsedMinutes)
        ? Math.max(0, input.elapsedMinutes)
        : 0,
    remitterBankName: String(input?.remitterBankName || 'Remitter Bank'),
    beneficiaryBankName: String(input?.beneficiaryBankName || 'Beneficiary Bank'),
    merchantName: input?.merchantName ? String(input.merchantName) : undefined,
    timestamp: String(input?.timestamp || new Date().toISOString()),
  };
}

/**
 * Evaluates multi-party evidence to produce deterministic user guidance.
 *
 * GUARANTEES:
 * 1. Output is strictly deterministic for identical inputs.
 * 2. safeToRetryPayment === true IF AND ONLY IF:
 *    remitterDebit === 'NOT_DEBITED' && (npciSwitch === 'FAILED' || npciSwitch === 'TIMEOUT') && beneficiaryCredit === 'NOT_CREDITED'
 * 3. In all other scenarios (uncertainty, timeouts, contradictions, malformed data),
 *    safeToRetryPayment is unconditionally forced to false.
 */
export function evaluateRecoveryGuidance(rawEvidence: Partial<MultiPartyEvidence>): RecoveryGuidance {
  const sanitized = sanitizeEvidence(rawEvidence);

  // Evaluate through priority-ordered rules
  const matchedRule = DECISION_RULES.find((rule) => rule.predicate(sanitized)) || DECISION_RULES[DECISION_RULES.length - 1];
  const ruleResult = matchedRule.evaluate(sanitized);

  // CARDINAL SAFETY INVARIANT ENFORCEMENT
  // Retry is permitted ONLY when there is positive evidence of a definitive failure and zero debit.
  const isPositiveDefinitiveFailureNoDebit =
    sanitized.remitterDebit === 'NOT_DEBITED' &&
    sanitized.npciSwitch === 'FAILED' &&
    sanitized.beneficiaryCredit === 'NOT_CREDITED';

  const safeToRetryPayment = isPositiveDefinitiveFailureNoDebit;

  return {
    ...ruleResult,
    safeToRetryPayment,
    primaryAction: {
      ...ruleResult.primaryAction,
      safeToRetryPayment,
    },
    ruleMatchedId: matchedRule.id,
    evidenceSnapshot: sanitized,
  };
}
