import { describe, it, expect } from 'vitest';
import { evaluateRecoveryGuidance } from '@/engine/recovery-engine';
import { MultiPartyEvidence, RemitterDebitStatus, BeneficiaryCreditStatus } from '@/engine/types';

describe('Safety Invariant - NPCI Switch Timeout Safety Guard', () => {
  const remitterStatuses: RemitterDebitStatus[] = ['DEBITED', 'NOT_DEBITED', 'UNKNOWN'];
  const beneficiaryStatuses: BeneficiaryCreditStatus[] = ['CREDITED', 'NOT_CREDITED', 'UNKNOWN'];

  it('guarantees that npciSwitch === TIMEOUT can NEVER authorize a retry under any conditions', () => {
    for (const remitter of remitterStatuses) {
      for (const ben of beneficiaryStatuses) {
        for (const elapsed of [0, 5, 14, 15, 30, 120]) {
          const evidence: Partial<MultiPartyEvidence> = {
            transactionId: 'TIMEOUT-REGRESSION-TEST',
            utr: '908234999111',
            type: 'P2M',
            amount: 1500,
            remitterDebit: remitter,
            npciSwitch: 'TIMEOUT',
            beneficiaryCredit: ben,
            merchantOrder: 'PENDING',
            elapsedMinutes: elapsed,
            remitterBankName: 'HDFC Bank',
            beneficiaryBankName: 'ICICI Bank',
          };

          const guidance = evaluateRecoveryGuidance(evidence);

          // CRITICAL INVARIANT: A switch timeout is non-terminal and can NEVER authorize a retry!
          expect(guidance.safeToRetryPayment).toBe(false);
          expect(guidance.primaryAction.safeToRetryPayment).toBe(false);
          expect(guidance.canonicalState).not.toBe('DEFINITIVE_FAILURE_NO_DEBIT');
        }
      }
    }
  });

  it('safely holds when remitterDebit says NOT_DEBITED but switch says TIMEOUT', () => {
    // Edge case: Bank says NOT_DEBITED (perhaps delayed), but switch TIMED OUT.
    // The outcome is unconfirmed/non-terminal, NOT a clean terminal failure!
    const evidence: Partial<MultiPartyEvidence> = {
      remitterDebit: 'NOT_DEBITED',
      npciSwitch: 'TIMEOUT',
      beneficiaryCredit: 'NOT_CREDITED',
      merchantOrder: 'FAILED',
    };

    const guidance = evaluateRecoveryGuidance(evidence);
    expect(guidance.safeToRetryPayment).toBe(false);
    expect(guidance.primaryAction.safeToRetryPayment).toBe(false);
    expect(guidance.canonicalState).not.toBe('DEFINITIVE_FAILURE_NO_DEBIT');
  });
});
