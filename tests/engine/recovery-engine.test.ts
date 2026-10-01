import { describe, it, expect } from 'vitest';
import { evaluateRecoveryGuidance } from '@/engine/recovery-engine';
import { MultiPartyEvidence } from '@/engine/types';

describe('Recovery Engine - Decision Table Rules', () => {
  const baseEvidence: MultiPartyEvidence = {
    transactionId: 'SYNTH-TX-BASE',
    utr: '908234123456',
    type: 'P2M',
    amount: 1500,
    remitterDebit: 'DEBITED',
    npciSwitch: 'SUCCESS',
    beneficiaryCredit: 'CREDITED',
    merchantOrder: 'CONFIRMED',
    elapsedMinutes: 2,
    remitterBankName: 'HDFC Bank',
    beneficiaryBankName: 'ICICI Bank',
    merchantName: 'Blue Tokai [SYNTHETIC]',
    timestamp: '2026-10-01T10:00:00Z',
  };

  it('Rule 1: Evaluates clean definitive success', () => {
    const guidance = evaluateRecoveryGuidance({
      ...baseEvidence,
      remitterDebit: 'DEBITED',
      npciSwitch: 'SUCCESS',
      beneficiaryCredit: 'CREDITED',
      merchantOrder: 'CONFIRMED',
    });

    expect(guidance.canonicalState).toBe('DEFINITIVE_SUCCESS');
    expect(guidance.severity).toBe('SUCCESS');
    expect(guidance.safeToRetryPayment).toBe(false);
    expect(guidance.primaryAction.type).toBe('SHOW_RECEIPT');
    expect(guidance.headline).toContain('Payment Successful');
  });

  it('Rule 3: Evaluates merchant POS sync lag (P2M)', () => {
    const guidance = evaluateRecoveryGuidance({
      ...baseEvidence,
      type: 'P2M',
      remitterDebit: 'DEBITED',
      npciSwitch: 'SUCCESS',
      beneficiaryCredit: 'CREDITED',
      merchantOrder: 'PENDING',
    });

    expect(guidance.canonicalState).toBe('CREDITED_MERCHANT_SYNC_LAG');
    expect(guidance.severity).toBe('WARNING');
    expect(guidance.safeToRetryPayment).toBe(false);
    expect(guidance.primaryAction.type).toBe('SHOW_UTR_TO_MERCHANT');
    expect(guidance.headline).toContain('Soundbox/POS Delayed');
    expect(guidance.primaryAction.safeToRetryPayment).toBe(false);
  });

  it('Rule 4: Evaluates in-flight deemed success (< 15 mins)', () => {
    const guidance = evaluateRecoveryGuidance({
      ...baseEvidence,
      remitterDebit: 'DEBITED',
      npciSwitch: 'DEEMED_SUCCESS',
      beneficiaryCredit: 'UNKNOWN',
      merchantOrder: 'PENDING',
      elapsedMinutes: 4,
    });

    expect(guidance.canonicalState).toBe('IN_FLIGHT_SWITCH_ACCEPTED');
    expect(guidance.safeToRetryPayment).toBe(false);
    expect(guidance.primaryAction.type).toBe('WAIT_BENEFICIARY_SYNC');
    expect(guidance.simulationThreshold?.thresholdMinutes).toBe(15);
  });

  it('Rule 5: Evaluates in-flight remitter debited (< 15 mins)', () => {
    const guidance = evaluateRecoveryGuidance({
      ...baseEvidence,
      remitterDebit: 'DEBITED',
      npciSwitch: 'TIMEOUT',
      beneficiaryCredit: 'UNKNOWN',
      merchantOrder: 'PENDING',
      elapsedMinutes: 5,
    });

    expect(guidance.canonicalState).toBe('IN_FLIGHT_REMITTER_DEBITED');
    expect(guidance.severity).toBe('WARNING');
    expect(guidance.safeToRetryPayment).toBe(false);
    expect(guidance.primaryAction.type).toBe('WAIT_NETWORK_SETTLEMENT');
    expect(guidance.primaryAction.safeToRetryPayment).toBe(false);
  });

  it('Rule 6: Evaluates unresolved debit timeout (>= 15 mins) for P2P (T+1)', () => {
    const guidance = evaluateRecoveryGuidance({
      ...baseEvidence,
      type: 'P2P',
      remitterDebit: 'DEBITED',
      npciSwitch: 'TIMEOUT',
      beneficiaryCredit: 'UNKNOWN',
      merchantOrder: 'NOT_APPLICABLE',
      elapsedMinutes: 20,
    });

    expect(guidance.canonicalState).toBe('UNRESOLVED_DEBIT_TIMEOUT');
    expect(guidance.severity).toBe('CRITICAL_HOLD');
    expect(guidance.safeToRetryPayment).toBe(false);
    expect(guidance.primaryAction.type).toBe('RAISE_BANK_DISPUTE');
    expect(guidance.regulatoryCitation?.applicableClause).toContain('5(a) - UPI Person to Person');
    expect(guidance.regulatoryCitation?.mandatedTat).toContain('T + 1');
  });

  it('Rule 6: Evaluates unresolved debit timeout (>= 15 mins) for P2M (T+5)', () => {
    const guidance = evaluateRecoveryGuidance({
      ...baseEvidence,
      type: 'P2M',
      remitterDebit: 'DEBITED',
      npciSwitch: 'TIMEOUT',
      beneficiaryCredit: 'UNKNOWN',
      merchantOrder: 'PENDING',
      elapsedMinutes: 25,
    });

    expect(guidance.canonicalState).toBe('UNRESOLVED_DEBIT_TIMEOUT');
    expect(guidance.regulatoryCitation?.applicableClause).toContain('5(b) - UPI Person to Merchant');
    expect(guidance.regulatoryCitation?.mandatedTat).toContain('T + 5');
  });

  it('Rule 7: Evaluates switch failed with auto-reversal in progress', () => {
    const guidance = evaluateRecoveryGuidance({
      ...baseEvidence,
      remitterDebit: 'DEBITED',
      npciSwitch: 'FAILED',
      beneficiaryCredit: 'NOT_CREDITED',
      merchantOrder: 'FAILED',
    });

    expect(guidance.canonicalState).toBe('AUTO_REVERSAL_IN_PROGRESS');
    expect(guidance.safeToRetryPayment).toBe(false);
    expect(guidance.primaryAction.type).toBe('TRACK_AUTO_REVERSAL');
  });

  it('Rule 8: Evaluates definitive failure with no debit (Safe to retry)', () => {
    const guidance = evaluateRecoveryGuidance({
      ...baseEvidence,
      remitterDebit: 'NOT_DEBITED',
      npciSwitch: 'FAILED',
      beneficiaryCredit: 'NOT_CREDITED',
      merchantOrder: 'FAILED',
    });

    expect(guidance.canonicalState).toBe('DEFINITIVE_FAILURE_NO_DEBIT');
    expect(guidance.severity).toBe('INFO');
    // Positive evidence of failure and zero debit -> retry allowed
    expect(guidance.safeToRetryPayment).toBe(true);
    expect(guidance.primaryAction.safeToRetryPayment).toBe(true);
    expect(guidance.primaryAction.type).toBe('SAFE_TO_RETRY_OR_SWITCH');
  });

  it('Rule 9: Evaluates indeterminate safeguard for unknown telemetry', () => {
    const guidance = evaluateRecoveryGuidance({
      ...baseEvidence,
      remitterDebit: 'UNKNOWN',
      npciSwitch: 'UNKNOWN',
      beneficiaryCredit: 'UNKNOWN',
      merchantOrder: 'UNKNOWN',
    });

    expect(guidance.canonicalState).toBe('INDETERMINATE_SAFEGUARD');
    expect(guidance.safeToRetryPayment).toBe(false);
    expect(guidance.primaryAction.type).toBe('HOLD_AND_VERIFY_STATEMENT');
  });
});
