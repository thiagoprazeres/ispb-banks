import { describe, it, expect } from 'vitest';
import {
  INSTITUTIONS,
  getInstitution,
  hasIspb,
  searchInstitutions,
  getMetadata,
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

