# @thiagoprazeres/ispb-participants

[![npm](https://img.shields.io/npm/v/@thiagoprazeres/ispb-participants)](https://www.npmjs.com/package/@thiagoprazeres/ispb-participants)
[![license](https://img.shields.io/npm/l/@thiagoprazeres/ispb-participants)](../../LICENSE)

ISPB → institution mapping for **all Brazilian Pix participants (SPI)** — sourced from the official BACEN dataset.

Most libraries only cover ~300 traditional banks from the STR list. This package covers the full **SPI participant list**: fintechs, payment institutions, credit unions, and every entity registered for Pix.

## Install

```bash
npm install @thiagoprazeres/ispb-participants
# or
pnpm add @thiagoprazeres/ispb-participants
```

## Usage

```ts
import {
  INSTITUTIONS,
  getInstitution,
  hasIspb,
  searchInstitutions,
  getMetadata,
} from '@thiagoprazeres/ispb-participants';

// Look up by ISPB
getInstitution('60746948');
// { ispb: '60746948', name: 'Banco Bradesco S.A.', shortName: 'Banco Bradesco S.A.', cnpj: '60746948000112' }

getInstitution('99999999'); // → undefined

// Check existence
hasIspb('18236120'); // → true
hasIspb('99999999'); // → false

// Search by name
searchInstitutions('nubank');
// [{ ispb: '18236120', name: 'Nu Pagamentos S.A.', ... }]

// Dataset metadata
getMetadata();
// { source: 'BACEN SPI', sourceDate: '2026-04-08', recordCount: 927, ... }
```

## API

### `INSTITUTIONS`

```ts
const INSTITUTIONS: Record<string, Institution>

interface Institution {
  ispb: string;
  name: string;
  shortName: string;
  cnpj?: string;
  spiParticipationType?: string;
  pixParticipationType?: string;
}
```

### `getInstitution(ispb: string): Institution | undefined`

Returns the full `Institution` record, or `undefined` if not found. Pads ISPB with leading zeros automatically.

### `hasIspb(ispb: string): boolean`

Returns `true` if the ISPB exists in the dataset.

### `searchInstitutions(query: string): Institution[]`

Case-insensitive search across `name` and `shortName`.

### `getMetadata(): Metadata`

```ts
interface Metadata {
  source: string;
  sourceUrl: string;
  sourceDate: string;  // YYYY-MM-DD
  recordCount: number;
}
```

## Data source

Generated from the official **BACEN SPI participant list** (`ParticipantesSPI.csv`), available at [bcb.gov.br](https://www.bcb.gov.br/estabilidadefinanceira/participantespi). Updated automatically every Monday via GitHub Actions.

## Composition with `@thiagoprazeres/parse-e2eid`

```ts
import { parseE2EId } from '@thiagoprazeres/parse-e2eid';
import { getInstitution } from '@thiagoprazeres/ispb-participants';

const { ispb, initiatedAt, suffix } = parseE2EId(e2eId);
const institution = getInstitution(ispb);
```

## License

[Apache 2.0](../../LICENSE)
