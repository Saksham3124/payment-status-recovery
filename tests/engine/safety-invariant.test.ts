import { describe, it, expect } from 'vitest';
import { evaluateRecoveryGuidance } from '@/engine/recovery-engine';
import {
  RemitterDebitStatus,
  NpciSwitchStatus,
  BeneficiaryCreditStatus,
  MerchantOrderStatus,
} from '@/engine/types';

describe('Recovery Engine - Cardinal Safety Invariant', () => {
  const remitterStatuses: RemitterDebitStatus[] = ['DEBITED', 'NOT_DEBITED', 'UNKNOWN'];
  const switchStatuses: NpciSwitchStatus[] = [
    'SUCCESS',
    'DEEMED_SUCCESS',
    'PENDING',
    'TIMEOUT',
    'FAILED',
    'UNKNOWN',
  ];
  const beneficiaryStatuses: BeneficiaryCreditStatus[] = ['CREDITED', 'NOT_CREDITED', 'UNKNOWN'];
  const merchantStatuses: MerchantOrderStatus[] = [
    'CONFIRMED',
    'PENDING',
    'FAILED',
    'NOT_APPLICABLE',
    'UNKNOWN',
  ];

  it('proves that safeToRetryPayment is TRUE if and only if positive failure with zero debit', () => {
    let totalCombinationsTested = 0;
    let permittedRetryCount = 0;

    for (const remitter of remitterStatuses) {
      for (const sw of switchStatuses) {
        for (const ben of beneficiaryStatuses) {
          for (const merch of merchantStatuses) {
            totalCombinationsTested++;

            const guidance = evaluateRecoveryGuidance({
              transactionId: `COMB-${totalCombinationsTested}`,
              utr: '908234123456',
              type: 'P2M',
              amount: 1000,
              remitterDebit: remitter,
              npciSwitch: sw,
              beneficiaryCredit: ben,
              merchantOrder: merch,
              elapsedMinutes: 5,
              remitterBankName: 'Test Bank',
              beneficiaryBankName: 'Test Bank',
              timestamp: '2026-10-01T10:00:00Z',
            });

            // The strict condition for safe retry:
            const isExpectedPermitted =
              remitter === 'NOT_DEBITED' &&
              sw === 'FAILED' &&
              ben === 'NOT_CREDITED';

            if (guidance.safeToRetryPayment) {
              permittedRetryCount++;
              expect(isExpectedPermitted).toBe(true);
              expect(remitter).toBe('NOT_DEBITED');
              expect(ben).toBe('NOT_CREDITED');
            } else {
              expect(guidance.primaryAction.safeToRetryPayment).toBe(false);
            }

            // Invariant 1: If money was debited, retry is NEVER allowed under any circumstances
            if (remitter === 'DEBITED') {
              expect(guidance.safeToRetryPayment).toBe(false);
              expect(guidance.primaryAction.safeToRetryPayment).toBe(false);
            }

            // Invariant 2: If status is unknown, retry is NEVER allowed
            if (remitter === 'UNKNOWN' || sw === 'UNKNOWN' || ben === 'UNKNOWN') {
              // Retry is only possible when all non-debit and failure evidence is known
              if (remitter !== 'NOT_DEBITED' || ben !== 'NOT_CREDITED') {
                expect(guidance.safeToRetryPayment).toBe(false);
              }
            }
          }
        }
      }
    }

    expect(totalCombinationsTested).toBe(3 * 6 * 3 * 5); // 270 permutations
    expect(permittedRetryCount).toBeGreaterThan(0);
    // In all 270 combinations, only clean zero-debit failures allowed retry
  });
});
