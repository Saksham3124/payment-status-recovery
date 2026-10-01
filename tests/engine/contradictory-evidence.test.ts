import { describe, it, expect } from 'vitest';
import { evaluateRecoveryGuidance } from '@/engine/recovery-engine';
import { isContradictoryEvidence } from '@/engine/decision-table';
import { MultiPartyEvidence } from '@/engine/types';

describe('Recovery Engine - Contradictory Evidence & Edge Cases', () => {
  const base: MultiPartyEvidence = {
    transactionId: 'SYNTH-TX-ANOMALY',
    utr: '908234999999',
    type: 'P2M',
    amount: 5000,
    remitterDebit: 'DEBITED',
    npciSwitch: 'SUCCESS',
    beneficiaryCredit: 'CREDITED',
    merchantOrder: 'CONFIRMED',
    elapsedMinutes: 3,
    remitterBankName: 'State Bank of India',
    beneficiaryBankName: 'Axis Bank',
    merchantName: 'Flipkart [SYNTHETIC]',
    timestamp: '2026-10-01T10:00:00Z',
  };

  it('detects contradiction: Remitter says NOT_DEBITED, but Beneficiary is CREDITED', () => {
    const evidence: MultiPartyEvidence = {
      ...base,
      remitterDebit: 'NOT_DEBITED',
      npciSwitch: 'PENDING',
      beneficiaryCredit: 'CREDITED',
    };

    expect(isContradictoryEvidence(evidence)).toBe(true);

    const guidance = evaluateRecoveryGuidance(evidence);
    expect(guidance.canonicalState).toBe('ANOMALOUS_CONTRADICTION');
    expect(guidance.severity).toBe('CRITICAL_HOLD');
    expect(guidance.safeToRetryPayment).toBe(false);
    expect(guidance.primaryAction.type).toBe('SAFE_FREEZE_DISPUTE');
  });

  it('detects contradiction: Remitter says NOT_DEBITED, but Switch says SUCCESS', () => {
    const evidence: MultiPartyEvidence = {
      ...base,
      remitterDebit: 'NOT_DEBITED',
      npciSwitch: 'SUCCESS',
      beneficiaryCredit: 'UNKNOWN',
    };

    expect(isContradictoryEvidence(evidence)).toBe(true);

    const guidance = evaluateRecoveryGuidance(evidence);
    expect(guidance.canonicalState).toBe('ANOMALOUS_CONTRADICTION');
    expect(guidance.safeToRetryPayment).toBe(false);
  });

  it('detects contradiction: NPCI Switch says FAILED, but Beneficiary says CREDITED', () => {
    const evidence: MultiPartyEvidence = {
      ...base,
      remitterDebit: 'DEBITED',
      npciSwitch: 'FAILED',
      beneficiaryCredit: 'CREDITED',
    };

    expect(isContradictoryEvidence(evidence)).toBe(true);

    const guidance = evaluateRecoveryGuidance(evidence);
    expect(guidance.canonicalState).toBe('ANOMALOUS_CONTRADICTION');
    expect(guidance.safeToRetryPayment).toBe(false);
    expect(guidance.headline).toContain('Conflicting Bank Responses');
  });
});
