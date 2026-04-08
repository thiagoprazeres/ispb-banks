import { describe, it, expect } from 'vitest';
import {
  INSTITUTIONS,
  getInstitution,
  hasIspb,
  searchInstitutions,
  getMetadata,
  parseE2EId,
} from './index.js';

describe('INSTITUTIONS', () => {
  it('has 900+ entries', () => {
    expect(Object.keys(INSTITUTIONS).length).toBeGreaterThan(900);
  });

  it('returns Institution record with expected shape', () => {
    const inst = INSTITUTIONS['60746948'];
    expect(inst).toBeDefined();
    expect(inst?.ispb).toBe('60746948');
    expect(inst?.name).toBe('Banco Bradesco S.A.');
    expect(typeof inst?.shortName).toBe('string');
  });
});

describe('getInstitution', () => {
  it('returns full record for known ISPB', () => {
    const inst = getInstitution('60746948');
    expect(inst?.name).toBe('Banco Bradesco S.A.');
    expect(inst?.ispb).toBe('60746948');
  });

  it('returns undefined for unknown ISPB', () => {
    expect(getInstitution('99999999')).toBeUndefined();
  });
});

describe('hasIspb', () => {
  it('returns true for known ISPB', () => {
    expect(hasIspb('60746948')).toBe(true);
    expect(hasIspb('00000000')).toBe(true);
  });

  it('returns false for unknown ISPB', () => {
    expect(hasIspb('99999999')).toBe(false);
  });
});

describe('searchInstitutions', () => {
  it('finds by partial name (case-insensitive)', () => {
    const results = searchInstitutions('bradesco');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name.toLowerCase()).toContain('bradesco');
  });

  it('returns empty array for no match', () => {
    expect(searchInstitutions('xyznotexistent12345')).toEqual([]);
  });
});

describe('getMetadata', () => {
  it('returns correct shape', () => {
    const meta = getMetadata();
    expect(meta.source).toBeTruthy();
    expect(meta.sourceUrl).toContain('bcb.gov.br');
    expect(meta.sourceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(meta.recordCount).toBeGreaterThan(900);
  });
});

describe('parseE2EId', () => {
  const VALID = 'E6074694820230615143012345678901';

  it('parses a valid E2E ID', () => {
    const result = parseE2EId(VALID);
    expect(result.ispb).toBe('60746948');
    expect(result.institutionName).toBe('Banco Bradesco S.A.');
    expect(result.initiatedAt).toEqual(new Date('2023-06-15T14:30:00.000Z'));
    expect(result.suffix).toBe('12345678901');
  });

  it('throws on wrong format', () => {
    expect(() => parseE2EId('invalid')).toThrow('Invalid endToEndId');
    expect(() => parseE2EId('X6074694820230615143012345678901')).toThrow();
    expect(() => parseE2EId('')).toThrow();
  });

  it('throws on impossible month', () => {
    // month 13
    expect(() => parseE2EId('E6074694820231315143012345678901')).toThrow('month');
  });

  it('throws on impossible day', () => {
    // day 32
    expect(() => parseE2EId('E6074694820230132143012345678901')).toThrow('day');
  });

  it('throws on impossible hour', () => {
    // hour 25
    expect(() => parseE2EId('E6074694820230115250012345678901')).toThrow('hour');
  });

  it('throws on impossible minute', () => {
    // minute 60
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

  it('handles unknown ISPB gracefully', () => {
    const result = parseE2EId('E9999999920230615143012345678901');
    expect(result.ispb).toBe('99999999');
    expect(result.institutionName).toBeUndefined();
  });
});
