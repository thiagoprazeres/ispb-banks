import { describe, it, expect } from 'vitest';
import { parseE2EId, isValidE2EId } from './index.js';

const VALID = 'E6074694820230615143012345678901';

describe('parseE2EId', () => {
  it('parses a valid E2E ID', () => {
    const result = parseE2EId(VALID);
    expect(result.ispb).toBe('60746948');
    expect(result.initiatedAt).toEqual(new Date('2023-06-15T14:30:00.000Z'));
    expect(result.suffix).toBe('12345678901');
  });

  it('throws on wrong format', () => {
    expect(() => parseE2EId('invalid')).toThrow('Invalid endToEndId');
    expect(() => parseE2EId('X6074694820230615143012345678901')).toThrow();
    expect(() => parseE2EId('')).toThrow();
  });

  it('throws on impossible month', () => {
    expect(() => parseE2EId('E6074694820231315143012345678901')).toThrow('month');
  });

  it('throws on impossible day', () => {
    expect(() => parseE2EId('E6074694820230132143012345678901')).toThrow('day');
  });

  it('throws on impossible hour', () => {
    expect(() => parseE2EId('E6074694820230115250012345678901')).toThrow('hour');
  });

  it('throws on impossible minute', () => {
    expect(() => parseE2EId('E6074694820230115146012345678901')).toThrow('minute');
  });

  it('throws on Feb 31 (overflow date)', () => {
    expect(() => parseE2EId('E6074694820230231143012345678901')).toThrow('does not exist');
  });

  it('throws on Feb 29 in non-leap year', () => {
    expect(() => parseE2EId('E6074694820230229143012345678901')).toThrow('does not exist');
  });

  it('accepts Feb 29 in a leap year', () => {
    const result = parseE2EId('E6074694820240229143012345678901');
    expect(result.initiatedAt).toEqual(new Date('2024-02-29T14:30:00.000Z'));
  });

  it('returns ispb without institutionName (zero deps)', () => {
    const result = parseE2EId('E9999999920230615143012345678901');
    expect(result.ispb).toBe('99999999');
    expect(Object.keys(result)).not.toContain('institutionName');
  });
});

describe('isValidE2EId', () => {
  it('returns true for valid E2E ID', () => {
    expect(isValidE2EId(VALID)).toBe(true);
  });

  it('returns false for invalid format', () => {
    expect(isValidE2EId('invalid')).toBe(false);
    expect(isValidE2EId('')).toBe(false);
    expect(isValidE2EId('X6074694820230615143012345678901')).toBe(false);
  });

  it('returns false for impossible date', () => {
    expect(isValidE2EId('E6074694820230231143012345678901')).toBe(false);
    expect(isValidE2EId('E6074694820230229143012345678901')).toBe(false);
  });

  it('returns true for Feb 29 in leap year', () => {
    expect(isValidE2EId('E6074694820240229143012345678901')).toBe(true);
  });

  it('never throws', () => {
    expect(() => isValidE2EId('anything at all 💥')).not.toThrow();
  });
});
