import { describe, it, expect } from 'vitest';
import { isContradictoryEvidence } from '@/engine/decision-table';
import { MultiPartyEvidence } from '@/engine/types';
import { SYNTHETIC_TRANSACTIONS } from '@/mock/synthetic-transactions';

describe('Multi-Party Evidence Breakdown & Contradiction Detection', () => {
  it('correctly detects contradiction in SYNTH-TX-112', () => {
    const tx = SYNTHETIC_TRANSACTIONS.find((t) => t.id === 'SYNTH-TX-112')!;
    expect(tx).toBeDefined();

    // In SYNTH-TX-112: Remitter: DEBITED, Switch: FAILED, Beneficiary: CREDITED
    const hasContradiction = isContradictoryEvidence(tx.evidence);
    expect(hasContradiction).toBe(true);
  });

  it('correctly identifies non-contradictory clean transactions', () => {
    const cleanSuccess = SYNTHETIC_TRANSACTIONS.find((t) => t.id === 'SYNTH-TX-101')!;
    expect(isContradictoryEvidence(cleanSuccess.evidence)).toBe(false);

    const cleanFailure = SYNTHETIC_TRANSACTIONS.find((t) => t.id === 'SYNTH-TX-110')!;
    expect(isContradictoryEvidence(cleanFailure.evidence)).toBe(false);
  });

  it('correctly identifies missing telemetry in SYNTH-TX-113', () => {
    const missingTx = SYNTHETIC_TRANSACTIONS.find((t) => t.id === 'SYNTH-TX-113')!;
    expect(missingTx.evidence.remitterDebit).toBe('UNKNOWN');
    expect(missingTx.evidence.npciSwitch).toBe('UNKNOWN');
    expect(missingTx.evidence.beneficiaryCredit).toBe('UNKNOWN');
  });

  it('distinguishes P2P transfers where merchant POS is not applicable', () => {
    const p2pTx = SYNTHETIC_TRANSACTIONS.find((t) => t.type === 'P2P')!;
    expect(p2pTx.type).toBe('P2P');
    expect(p2pTx.evidence.merchantOrder).toBe('NOT_APPLICABLE');
  });
});
