import { describe, it, expect } from 'vitest';
import {
  RBI_P2P_CITATION,
  RBI_P2M_CITATION,
  PRODUCT_COOLING_OFF_THRESHOLD,
} from '@/engine/decision-table';
import { evaluateRecoveryGuidance } from '@/engine/recovery-engine';
import { MultiPartyEvidence } from '@/engine/types';

describe('Regulatory Accuracy - Separation of Regulation and UX Simulation', () => {
  it('strictly distinguishes RBI P2P T+1 auto-reversal from P2M T+5 auto-reversal', () => {
    // Statutory citations must match RBI DPSS circular
    expect(RBI_P2P_CITATION.circularRef).toBe('RBI/2019-20/67 DPSS.CO.PD No.629/02.01.014/2019-20');
    expect(RBI_P2P_CITATION.applicableClause).toContain('Table 5(a)');
    expect(RBI_P2P_CITATION.mandatedTat).toContain('T + 1');
    expect(RBI_P2P_CITATION.compensationPolicy).toContain('₹100 per calendar day');

    expect(RBI_P2M_CITATION.applicableClause).toContain('Table 5(b)');
    expect(RBI_P2M_CITATION.mandatedTat).toContain('T + 5');
    expect(RBI_P2M_CITATION.compensationPolicy).toContain('₹100 per calendar day');
  });

  it('guarantees that 15-minute cooling off threshold is explicitly isolated as a product UX decision', () => {
    expect(PRODUCT_COOLING_OFF_THRESHOLD.thresholdMinutes).toBe(15);
    expect(PRODUCT_COOLING_OFF_THRESHOLD.purpose).toContain('NOT an RBI regulatory requirement');
    expect(PRODUCT_COOLING_OFF_THRESHOLD.windowName).toContain('Product Design Threshold');
  });

  it('correctly associates P2P transactions with T+1 and P2M transactions with T+5 during timeout', () => {
    const p2pEvidence: Partial<MultiPartyEvidence> = {
      type: 'P2P',
      amount: 2000,
      remitterDebit: 'DEBITED',
      npciSwitch: 'TIMEOUT',
      beneficiaryCredit: 'UNKNOWN',
      merchantOrder: 'NOT_APPLICABLE',
      elapsedMinutes: 16,
    };

    const p2pGuidance = evaluateRecoveryGuidance(p2pEvidence);
    expect(p2pGuidance.regulatoryCitation?.applicableClause).toContain('5(a)');
    expect(p2pGuidance.regulatoryCitation?.mandatedTat).toContain('T + 1');

    const p2mEvidence: Partial<MultiPartyEvidence> = {
      type: 'P2M',
      amount: 2000,
      remitterDebit: 'DEBITED',
      npciSwitch: 'TIMEOUT',
      beneficiaryCredit: 'UNKNOWN',
      merchantOrder: 'PENDING',
      elapsedMinutes: 16,
    };

    const p2mGuidance = evaluateRecoveryGuidance(p2mEvidence);
    expect(p2mGuidance.regulatoryCitation?.applicableClause).toContain('5(b)');
    expect(p2mGuidance.regulatoryCitation?.mandatedTat).toContain('T + 5');
  });
});
