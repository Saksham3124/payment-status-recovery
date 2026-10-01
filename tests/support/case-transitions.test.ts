import { describe, it, expect } from 'vitest';
import { validateCaseTransition } from '@/support/case-transitions';
import { CaseStatus } from '@/support/types';

describe('Support Case State Machine & Lifecycle Transitions', () => {
  it('allows valid progressive lifecycle transitions', () => {
    // OPEN -> UNDER_REVIEW
    const res1 = validateCaseTransition('OPEN', 'UNDER_REVIEW');
    expect(res1.allowed).toBe(true);

    // UNDER_REVIEW -> RESOLVED
    const res2 = validateCaseTransition('UNDER_REVIEW', 'RESOLVED');
    expect(res2.allowed).toBe(true);

    // RESOLVED -> CLOSED
    const res3 = validateCaseTransition('RESOLVED', 'CLOSED');
    expect(res3.allowed).toBe(true);

    // UNDER_REVIEW -> OPEN (revert/feedback)
    const res4 = validateCaseTransition('UNDER_REVIEW', 'OPEN');
    expect(res4.allowed).toBe(true);
  });

  it('permits same-state transitions as safe no-ops', () => {
    const statuses: CaseStatus[] = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'];
    for (const s of statuses) {
      const res = validateCaseTransition(s, s);
      expect(res.allowed).toBe(true);
    }
  });

  it('strictly prohibits skipping required review stages', () => {
    // OPEN cannot jump directly to RESOLVED without review
    const res1 = validateCaseTransition('OPEN', 'RESOLVED');
    expect(res1.allowed).toBe(false);
    expect(res1.reason).toContain('Prohibited');

    // OPEN cannot jump directly to CLOSED
    const res2 = validateCaseTransition('OPEN', 'CLOSED');
    expect(res2.allowed).toBe(false);
  });

  it('locks CLOSED as an immutable terminal state', () => {
    const targets: CaseStatus[] = ['OPEN', 'UNDER_REVIEW', 'RESOLVED'];
    for (const t of targets) {
      const res = validateCaseTransition('CLOSED', t);
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('Case is CLOSED and cannot be modified');
    }
  });

  it('prohibits reverting from RESOLVED back to OPEN directly', () => {
    const res = validateCaseTransition('RESOLVED', 'OPEN');
    expect(res.allowed).toBe(false);
  });
});
