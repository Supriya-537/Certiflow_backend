import { describe, expect, it } from 'vitest';
import { canTransitionApplication, buildReferenceNumber } from '../utils/applicationFlow.js';

describe('application workflow', () => {
  it('allows only valid transitions', () => {
    expect(canTransitionApplication('DRAFT', 'SUBMITTED')).toBe(true);
    expect(canTransitionApplication('SUBMITTED', 'UNDER_REVIEW')).toBe(true);
    expect(canTransitionApplication('UNDER_REVIEW', 'APPROVED')).toBe(true);
    expect(canTransitionApplication('APPROVED', 'REJECTED')).toBe(false);
  });

  it('builds unique application references', () => {
    const ref1 = buildReferenceNumber();
    const ref2 = buildReferenceNumber();

    expect(ref1).toMatch(/^CERI-/);
    expect(ref1).not.toBe(ref2);
  });
});
