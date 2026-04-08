import { crc16 } from './crc16.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function field(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

function parseField(payload: string, pos: number): { id: string; value: string; next: number } | null {
  if (pos + 4 > payload.length) return null;
  const id = payload.slice(pos, pos + 2);
  const len = parseInt(payload.slice(pos + 2, pos + 4), 10);
  if (isNaN(len) || pos + 4 + len > payload.length) return null;
  return { id, value: payload.slice(pos + 4, pos + 4 + len), next: pos + 4 + len };
}

// ─── Projections ─────────────────────────────────────────────────────────────

export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalizes a receiver name to BR Code spec:
 * removes accents and non-alphanumeric chars, uppercases, truncates to 25 chars.
 */
export function projectReceiverName(name: string): string {
  return removeAccents(name)
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .substring(0, 25)
    .toUpperCase();
}

/**
 * Normalizes a city to BR Code spec:
 * removes accents and non-alphanumeric chars, uppercases, truncates to 15 chars.
 */
export function projectCity(city: string): string {
  return removeAccents(city)
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .substring(0, 15)
    .toUpperCase();
}

/**
 * Builds a BR Code reference label from a UUID or similar ID.
 * Strips hyphens and truncates to 25 alphanumeric chars, uppercased.
 */
export function buildBrCodeRef(id: string): string {
  return id.replace(/-/g, '').substring(0, 25).toUpperCase();
}

// ─── Generation ──────────────────────────────────────────────────────────────

export interface BrCodeParams {
  /** Pix key (CPF, CNPJ, email, phone or EVP) */
  pixKey: string;
  /** Receiver name — already projected (no accents, uppercase, max 25 chars) */
  receiverName: string;
  /** Receiver city — already projected (no accents, uppercase, max 15 chars) */
  receiverCity: string;
  /** Reference label (field 62, sub-field 05). Max 25 alphanumeric chars. */
  referenceLabel: string;
  /** Amount in BRL. Will be formatted to 2 decimal places. Omit for open-value. */
  amount?: number | undefined;
  /** Optional message. Max 72 chars. */
  description?: string | undefined;
}

/**
 * Generates a static Pix BR Code payload (EMV QRCPS-MPM) with CRC-16/CCITT checksum.
 *
 * @see https://www.bcb.gov.br/content/estabilidadefinanceira/ativosdosite/Manual%20do%20BR%20Code.pdf
 */
export function generateStaticBrCode(params: BrCodeParams): string {
  const { pixKey, receiverName, receiverCity, referenceLabel, amount, description } = params;

  const merchantAccountInfoFields = [
    field('00', 'br.gov.bcb.pix'),
    field('01', pixKey),
    ...(description ? [field('02', description.substring(0, 72))] : []),
  ];
  const merchantAccountInfo = field('26', merchantAccountInfoFields.join(''));

  const label = referenceLabel.replace(/[^A-Za-z0-9]/g, '').substring(0, 25) || '***';
  const additionalDataField = field('62', field('05', label));

  const formattedAmount = amount !== undefined ? amount.toFixed(2) : undefined;

  const parts = [
    field('00', '01'),
    merchantAccountInfo,
    field('52', '0000'),
    field('53', '986'),
    ...(formattedAmount ? [field('54', formattedAmount)] : []),
    field('58', 'BR'),
    field('59', receiverName),
    field('60', receiverCity),
    additionalDataField,
    '6304',
  ];

  const payload = parts.join('');
  const checksum = crc16(payload);
  return payload + checksum;
}

// ─── Parse ───────────────────────────────────────────────────────────────────

export interface ParsedBrCode {
  pixKey: string;
  receiverName: string;
  receiverCity: string;
  referenceLabel?: string;
  amount?: number;
  description?: string;
}

/**
 * Parses a static Pix BR Code payload and returns its fields.
 * Validates CRC-16 checksum before parsing.
 *
 * @throws {Error} if the payload is malformed or the CRC-16 checksum is invalid
 */
export function parseStaticBrCode(payload: string): ParsedBrCode {
  if (!payload || payload.length < 4) {
    throw new Error('Invalid BR Code: payload too short');
  }

  if (!validateCrc16(payload)) {
    throw new Error('Invalid BR Code: CRC-16 checksum mismatch');
  }

  const body = payload.slice(0, -4);
  let pixKey: string | undefined;
  let receiverName: string | undefined;
  let receiverCity: string | undefined;
  let referenceLabel: string | undefined;
  let amount: number | undefined;
  let description: string | undefined;

  let pos = 0;
  while (pos < body.length) {
    const f = parseField(body, pos);
    if (!f) break;
    pos = f.next;

    if (f.id === '26') {
      // Merchant Account Info: parse sub-fields
      let subPos = 0;
      while (subPos < f.value.length) {
        const sub = parseField(f.value, subPos);
        if (!sub) break;
        subPos = sub.next;
        if (sub.id === '01') pixKey = sub.value;
        if (sub.id === '02') description = sub.value;
      }
    } else if (f.id === '54') {
      amount = parseFloat(f.value);
    } else if (f.id === '59') {
      receiverName = f.value;
    } else if (f.id === '60') {
      receiverCity = f.value;
    } else if (f.id === '62') {
      // Additional Data Field: parse sub-field 05 (reference label)
      let subPos = 0;
      while (subPos < f.value.length) {
        const sub = parseField(f.value, subPos);
        if (!sub) break;
        subPos = sub.next;
        if (sub.id === '05') referenceLabel = sub.value;
      }
    }
  }

  if (!pixKey) throw new Error('Invalid BR Code: missing Pix key (field 26/01)');
  if (!receiverName) throw new Error('Invalid BR Code: missing receiver name (field 59)');
  if (!receiverCity) throw new Error('Invalid BR Code: missing receiver city (field 60)');

  return {
    pixKey,
    receiverName,
    receiverCity,
    ...(referenceLabel !== undefined && referenceLabel !== '***' ? { referenceLabel } : {}),
    ...(amount !== undefined ? { amount } : {}),
    ...(description !== undefined ? { description } : {}),
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Returns `true` if the CRC-16/CCITT checksum of the payload is valid.
 * The last 4 chars must match the CRC of everything before them.
 */
export function validateCrc16(payload: string): boolean {
  if (payload.length < 4) return false;
  const body = payload.slice(0, -4);
  const expected = payload.slice(-4).toUpperCase();
  return crc16(body) === expected;
}

/**
 * Returns `true` if the payload is a valid static Pix BR Code (format + CRC + required fields).
 * Never throws.
 */
export function isValidBrCode(payload: string): boolean {
  try {
    parseStaticBrCode(payload);
    return true;
  } catch {
    return false;
  }
}
