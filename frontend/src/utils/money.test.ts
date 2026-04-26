import { describe, expect, it } from 'vitest';
import { paiseToCurrency } from './money';

describe('money utils', () => {
  it('returns a string', () => {
    expect(typeof paiseToCurrency(100)).toBe('string');
  });
});
