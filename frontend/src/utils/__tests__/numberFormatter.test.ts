import { describe, it, expect } from 'vitest';
import { formatNumber, formatForScreenReader } from '../numberFormatter';

describe('formatNumber', () => {
  it('adds thousands separators to integers', () => {
    expect(formatNumber(1250)).toBe('1,250');
    expect(formatNumber(152340)).toBe('152,340');
  });

  it('preserves natural decimal precision by default', () => {
    expect(formatNumber(98.5)).toBe('98.5');
    expect(formatNumber(7.82)).toBe('7.82');
  });

  it('applies a suffix', () => {
    expect(formatNumber(98.5, { suffix: '%' })).toBe('98.5%');
    expect(formatNumber(7.82, { suffix: ' km/s' })).toBe('7.82 km/s');
    expect(formatNumber(420.34, { suffix: ' km' })).toBe('420.34 km');
  });

  it('applies a prefix', () => {
    expect(formatNumber(1250, { prefix: '$' })).toBe('$1,250');
  });

  it('supports compact notation for large numbers', () => {
    expect(formatNumber(152340, { compact: true })).toBe('152K');
  });

  it('respects an explicit decimals override', () => {
    expect(formatNumber(7.8234, { decimals: 1 })).toBe('7.8');
    expect(formatNumber(1250, { decimals: 2 })).toBe('1,250.00');
  });

  it('does not silently round tiny exponential-notation values to 0', () => {
    expect(formatNumber(1e-7)).toBe('0.0000001');
    expect(formatNumber(1.5e-8)).toBe('0.000000015');
  });

  it('can disable grouping', () => {
    expect(formatNumber(1250, { useGrouping: false })).toBe('1250');
  });
});

describe('formatForScreenReader', () => {
  it('never uses compact notation, even if requested', () => {
    expect(formatForScreenReader(152340, { compact: true })).toBe('152,340');
  });
});