import { describe, expect, it } from 'vitest';
import { calculateDelayHours } from '../utils/delayMonitoring.js';

describe('delay monitoring', () => {
  it('calculates overdue hours based on actual timestamps', () => {
    const createdAt = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const thresholdHours = 2;

    expect(calculateDelayHours(createdAt, thresholdHours)).toBeGreaterThanOrEqual(2);
  });
});
