import { INSTITUTIONS, METADATA } from './data.js';
export type { Institution } from './data.js';

export { INSTITUTIONS };

export interface Metadata {
  source: string;
  sourceUrl: string;
  sourceDate: string;
  recordCount: number;
}

/**
 * Returns the full Institution record for the given ISPB code.
 * Returns `undefined` if the ISPB is not found.
 */
export function getInstitution(ispb: string) {
  return INSTITUTIONS[ispb.padStart(8, '0')];
}

/**
 * Returns `true` if the given ISPB code exists in the dataset.
 */
export function hasIspb(ispb: string): boolean {
  return ispb.padStart(8, '0') in INSTITUTIONS;
}

/**
 * Case-insensitive search across institution names and short names.
 * Returns all matching Institution records.
 */
export function searchInstitutions(query: string) {
  const q = query.toLowerCase();
  return Object.values(INSTITUTIONS).filter(
    inst =>
      inst.name.toLowerCase().includes(q) ||
      inst.shortName.toLowerCase().includes(q)
  );
}

/**
 * Returns dataset metadata: source, sourceDate, and record count.
 */
export function getMetadata(): Metadata {
  return { ...METADATA };
}

