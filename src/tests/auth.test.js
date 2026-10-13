import { describe, expect, it } from 'vitest';
import { hashPassword, comparePassword } from '../utils/auth.js';

describe('auth utilities', () => {
  it('hashes and verifies passwords', async () => {
    const password = 'StrongPass123!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await comparePassword(password, hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });
});
