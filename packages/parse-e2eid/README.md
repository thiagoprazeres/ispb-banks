# @thiagoprazeres/parse-e2eid

[![npm](https://img.shields.io/npm/v/@thiagoprazeres/parse-e2eid)](https://www.npmjs.com/package/@thiagoprazeres/parse-e2eid)
[![license](https://img.shields.io/npm/l/@thiagoprazeres/parse-e2eid)](../../LICENSE)

Parse and validate Brazilian Pix **endToEndId** (E2EId) — zero runtime dependencies.

## Install

```bash
npm install @thiagoprazeres/parse-e2eid
# or
pnpm add @thiagoprazeres/parse-e2eid
```

## Usage

```ts
import { parseE2EId, isValidE2EId } from '@thiagoprazeres/parse-e2eid';

parseE2EId('E6074694820230615143012345678901');
// {
//   ispb: '60746948',
//   initiatedAt: Date('2023-06-15T14:30:00.000Z'),
//   suffix: '12345678901'
// }

isValidE2EId('E6074694820230615143012345678901'); // → true
isValidE2EId('invalid');                          // → false
isValidE2EId('E6074694820230231143012345678901'); // → false (Feb 31 doesn't exist)
```

## Format

```
E  {ISPB — 8 digits}  {YYYY MM DD}  {HH mm}  {11 alphanumeric chars}
```

`parseE2EId` validates **both format and semantics** — impossible dates (Feb 31, Feb 29 on non-leap years, month 13, hour 25…) throw an explicit error instead of being silently normalized by JavaScript's `Date`.

## API

### `parseE2EId(e2eId: string): ParsedE2EId`

Parses the endToEndId. Throws `Error` on invalid format or impossible date/time values.

```ts
interface ParsedE2EId {
  ispb: string;       // 8-digit initiating institution ISPB
  initiatedAt: Date;  // UTC
  suffix: string;     // 11-char unique suffix
}
```

### `isValidE2EId(e2eId: string): boolean`

Returns `true` if the string is a valid endToEndId. Never throws.

## Enriching with institution name

This package is intentionally zero-dependency and does not include institution name resolution. Compose with [`@thiagoprazeres/ispb-participants`](../ispb-participants) if needed:

```ts
import { parseE2EId } from '@thiagoprazeres/parse-e2eid';
import { getInstitution } from '@thiagoprazeres/ispb-participants';

const { ispb, initiatedAt, suffix } = parseE2EId(e2eId);
const institution = getInstitution(ispb);
// { ispb: '60746948', name: 'Banco Bradesco S.A.', ... }
```

## References

- [BACEN Pix specification](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [Manual de Padrões para Iniciação do Pix](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf)

## License

[Apache 2.0](../../LICENSE)
