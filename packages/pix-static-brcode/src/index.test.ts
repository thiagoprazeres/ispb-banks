import { describe, it, expect } from 'vitest';
import {
  generateStaticBrCode,
  parseStaticBrCode,
  validateCrc16,
  isValidBrCode,
  projectReceiverName,
  projectCity,
  buildBrCodeRef,
} from './index.js';

const BASE = {
  pixKey: '12345678901',
  receiverName: 'JOAO DA SILVA',
  receiverCity: 'SAO PAULO',
  referenceLabel: 'REF123',
};

describe('generateStaticBrCode', () => {
  it('generates valid BR Code with mandatory fields', () => {
    const payload = generateStaticBrCode(BASE);
    expect(payload).toContain('br.gov.bcb.pix');
    expect(payload).toContain('12345678901');
    expect(payload).toContain('JOAO DA SILVA');
    expect(payload).toContain('SAO PAULO');
    expect(payload).toContain('REF123');
  });

  it('starts with payload format indicator 000201', () => {
    expect(generateStaticBrCode(BASE).startsWith('000201')).toBe(true);
  });

  it('ends with 4-char CRC-16 checksum', () => {
    expect(generateStaticBrCode(BASE).slice(-4)).toMatch(/^[0-9A-F]{4}$/);
  });

  it('includes amount field (54) when provided', () => {
    expect(generateStaticBrCode({ ...BASE, amount: 100.5 })).toContain('5406100.50');
  });

  it('omits amount field when not provided', () => {
    expect(generateStaticBrCode(BASE)).not.toMatch(/54\d{2}\d+\.\d{2}/);
  });

  it('includes description in merchant account info', () => {
    expect(generateStaticBrCode({ ...BASE, description: 'Pagto pedido 42' })).toContain('Pagto pedido 42');
  });

  it('contains country code BR (field 58)', () => {
    expect(generateStaticBrCode(BASE)).toContain('5802BR');
  });

  it('contains currency code 986 (field 53)', () => {
    expect(generateStaticBrCode(BASE)).toContain('5303986');
  });
});

describe('validateCrc16', () => {
  it('returns true for a generated payload', () => {
    const payload = generateStaticBrCode(BASE);
    expect(validateCrc16(payload)).toBe(true);
  });

  it('returns false when checksum is tampered', () => {
    const payload = generateStaticBrCode(BASE);
    const tampered = payload.slice(0, -4) + '0000';
    expect(validateCrc16(tampered)).toBe(false);
  });

  it('returns false for too-short string', () => {
    expect(validateCrc16('abc')).toBe(false);
  });
});

describe('parseStaticBrCode', () => {
  it('round-trips: parse(generate()) returns original fields', () => {
    const payload = generateStaticBrCode(BASE);
    const parsed = parseStaticBrCode(payload);
    expect(parsed.pixKey).toBe('12345678901');
    expect(parsed.receiverName).toBe('JOAO DA SILVA');
    expect(parsed.receiverCity).toBe('SAO PAULO');
    expect(parsed.referenceLabel).toBe('REF123');
  });

  it('parses amount when present', () => {
    const payload = generateStaticBrCode({ ...BASE, amount: 42.5 });
    expect(parseStaticBrCode(payload).amount).toBe(42.5);
  });

  it('omits amount when not present', () => {
    const parsed = parseStaticBrCode(generateStaticBrCode(BASE));
    expect(parsed.amount).toBeUndefined();
  });

  it('parses description when present', () => {
    const payload = generateStaticBrCode({ ...BASE, description: 'Aluguel abril' });
    expect(parseStaticBrCode(payload).description).toBe('Aluguel abril');
  });

  it('throws on invalid CRC', () => {
    const payload = generateStaticBrCode(BASE);
    expect(() => parseStaticBrCode(payload.slice(0, -4) + '0000')).toThrow('CRC-16');
  });

  it('throws on empty string', () => {
    expect(() => parseStaticBrCode('')).toThrow();
  });
});

describe('isValidBrCode', () => {
  it('returns true for generated payload', () => {
    expect(isValidBrCode(generateStaticBrCode(BASE))).toBe(true);
  });

  it('returns false for tampered CRC', () => {
    const payload = generateStaticBrCode(BASE);
    expect(isValidBrCode(payload.slice(0, -4) + '0000')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidBrCode('')).toBe(false);
  });

  it('never throws', () => {
    expect(() => isValidBrCode('anything 💥')).not.toThrow();
  });
});

describe('projections', () => {
  it('projectReceiverName removes accents, uppercases, truncates to 25', () => {
    expect(projectReceiverName('João da Sílva')).toBe('JOAO DA SILVA');
    expect(projectReceiverName('a'.repeat(30))).toHaveLength(25);
  });

  it('projectCity removes accents, uppercases, truncates to 15', () => {
    expect(projectCity('São Paulo')).toBe('SAO PAULO');
    expect(projectCity('a'.repeat(20))).toHaveLength(15);
  });

  it('buildBrCodeRef strips hyphens and uppercases', () => {
    const ref = buildBrCodeRef('550e8400-e29b-41d4-a716-446655440000');
    expect(ref).not.toContain('-');
    expect(ref).toBe(ref.toUpperCase());
    expect(ref.length).toBeLessThanOrEqual(25);
  });
});
