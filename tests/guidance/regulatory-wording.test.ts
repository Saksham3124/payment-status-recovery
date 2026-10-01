import { describe, it, expect } from 'vitest';
import { evaluateRecoveryGuidance } from '@/engine/recovery-engine';
import { SYNTHETIC_TRANSACTIONS } from '@/mock/synthetic-transactions';

describe('Recovery Guidance - Regulatory Text & TAT Differentiation', () => {
  it('displays P2M T+5 auto-reversal mandate on unresolved merchant timeout (SYNTH-TX-107)', () => {
    const tx = SYNTHETIC_TRANSACTIONS.find((t) => t.id === 'SYNTH-TX-107')!;
    expect(tx.type).toBe('P2M');
    expect(tx.evidence.elapsedMinutes).toBeGreaterThanOrEqual(15);

    const guidance = evaluateRecoveryGuidance(tx.evidence);
    expect(guidance.canonicalState).toBe('UNRESOLVED_DEBIT_TIMEOUT');
    expect(guidance.regulatoryCitation).toBeDefined();
    expect(guidance.regulatoryCitation?.applicableClause).toContain('5(b) - UPI Person to Merchant');
    expect(guidance.regulatoryCitation?.mandatedTat).toContain('T + 5');
    expect(guidance.regulatoryCitation?.compensationPolicy).toContain('₹100 per calendar day');
  });

  it('displays P2P T+1 auto-reversal mandate on unresolved personal transfer timeout (SYNTH-TX-108)', () => {
    const tx = SYNTHETIC_TRANSACTIONS.find((t) => t.id === 'SYNTH-TX-108')!;
    expect(tx.type).toBe('P2P');
    expect(tx.evidence.elapsedMinutes).toBeGreaterThanOrEqual(15);

    const guidance = evaluateRecoveryGuidance(tx.evidence);
    expect(guidance.canonicalState).toBe('UNRESOLVED_DEBIT_TIMEOUT');
    expect(guidance.regulatoryCitation).toBeDefined();
    expect(guidance.regulatoryCitation?.applicableClause).toContain('5(a) - UPI Person to Person');
    expect(guidance.regulatoryCitation?.mandatedTat).toContain('T + 1');
  });

  it('preserves distinct 15-minute product cooling-off threshold on in-flight transactions', () => {
    const inFlightTx = SYNTHETIC_TRANSACTIONS.find((t) => t.id === 'SYNTH-TX-105')!;
    const guidance = evaluateRecoveryGuidance(inFlightTx.evidence);

    expect(guidance.simulationThreshold).toBeDefined();
    expect(guidance.simulationThreshold?.thresholdMinutes).toBe(15);
    expect(guidance.simulationThreshold?.purpose).toContain('NOT an RBI regulatory requirement');
  });
});
