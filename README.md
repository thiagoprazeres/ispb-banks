# ispb-banks

[![npm](https://img.shields.io/npm/v/ispb-banks)](https://www.npmjs.com/package/ispb-banks)
[![license](https://img.shields.io/npm/l/ispb-banks)](./LICENSE)

ISPB → institution name mapping for **all Brazilian Pix participants (SPI)** — sourced from the official BACEN dataset.

Most libraries only cover ~300 traditional banks from the STR list. This package covers the full **SPI participant list**: fintechs, payment institutions, credit unions, and every entity registered for Pix.

---

## Install

```bash
npm install ispb-banks
# or
pnpm add ispb-banks
```

---

## Usage

### Look up an institution by ISPB

```ts
import { getInstitution, hasIspb } from 'ispb-banks';

getInstitution('60746948');
// { ispb: '60746948', name: 'Banco Bradesco S.A.', shortName: 'Banco Bradesco S.A.', cnpj: '60746948000112' }

getInstitution('99999999'); // → undefined

hasIspb('18236120'); // → true
hasIspb('99999999'); // → false
```

### Search institutions

```ts
import { searchInstitutions } from 'ispb-banks';

searchInstitutions('nubank');
// [{ ispb: '18236120', name: 'Nu Pagamentos S.A.', ... }]
```

### Dataset metadata

```ts
import { getMetadata } from 'ispb-banks';

getMetadata();
// {
//   source: 'BACEN SPI (ParticipantesSPI.csv)',
//   sourceUrl: 'https://www.bcb.gov.br/...',
//   sourceDate: '2026-04-08',
//   recordCount: 927
// }
```

### Parse a Pix endToEndId

```ts
import { parseE2EId } from 'ispb-banks';

const result = parseE2EId('E6074694820230615143012345678901');
// {
//   ispb: '60746948',
//   institutionName: 'Banco Bradesco S.A.',
//   initiatedAt: Date(2023-06-15T14:30:00.000Z),
//   suffix: '12345678901'
// }
```

The parser validates both format **and** semantics — impossible dates/times throw an explicit error instead of being silently normalized by JavaScript.

The endToEndId format follows the [BACEN Pix specification](https://www.bcb.gov.br/estabilidadefinanceira/pix):

```
E  {ISPB 8 digits}  {YYYYMMDD}  {HHmm}  {11 alphanumeric chars}
```

---

## API

### `INSTITUTIONS`

```ts
const INSTITUTIONS: Record<string, Institution>
```

Full dataset with rich records per participant.

```ts
interface Institution {
  ispb: string;
  name: string;
  shortName: string;
  cnpj?: string;
  spiParticipationType?: string;
  pixParticipationType?: string;
}
```

---

### `getInstitution(ispb: string): Institution | undefined`

Returns the full `Institution` record for an ISPB, or `undefined` if not found.

---

### `hasIspb(ispb: string): boolean`

Returns `true` if the ISPB exists in the dataset.

---

### `searchInstitutions(query: string): Institution[]`

Case-insensitive search across `name` and `shortName`. Returns all matching records.

---

### `getMetadata(): Metadata`

```ts
interface Metadata {
  source: string;
  sourceUrl: string;
  sourceDate: string;  // YYYY-MM-DD
  recordCount: number;
}
```

---

### `parseE2EId(e2eId: string): ParsedE2EId`

Parses a Pix endToEndId. Throws `Error` on invalid format **or** impossible date/time values (e.g. month 13, hour 25).

```ts
interface ParsedE2EId {
  ispb: string;
  institutionName: string | undefined;
  initiatedAt: Date;   // UTC
  suffix: string;
}
```

---

## Data source

Sourced from the official **BACEN SPI participant list** (`ParticipantesSPI.csv`), available at [bcb.gov.br](https://www.bcb.gov.br/estabilidadefinanceira/participantespi).

Run `npm run generate` to pull a fresh copy of the data.

---

## License

[Apache 2.0](./LICENSE)
