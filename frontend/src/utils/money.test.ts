import { describe, expect, it } from 'vitest';
import { currencyToPaise, paiseToCurrency } from './money';

describe('money utils', () => {
  it('formats paise as INR', () => {
    const formatted = paiseToCurrency(15075);
    expect(formatted).toContain('₹');
    expect(formatted).toContain('150.75');
  });

  it('converts decimal amount string to paise', () => {
    expect(currencyToPaise('150.75')).toBe(15075);
    expect(currencyToPaise('1')).toBe(100);
    expect(currencyToPaise('1.2')).toBe(120);
  });

  it('handles currency symbols and commas while parsing', () => {
    expect(currencyToPaise('₹1,200.50')).toBe(120050);
  });

  it('rejects invalid money inputs', () => {
    expect(() => currencyToPaise('12.345')).toThrow();
    expect(() => currencyToPaise('abc')).toThrow();
  });
});
