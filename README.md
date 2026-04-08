# ispb-banks — Pix Tools Monorepo

[![license](https://img.shields.io/github/license/thiagoprazeres/ispb-banks)](./LICENSE)

A pnpm monorepo with focused, zero-dependency TypeScript libraries for the Brazilian **Pix** ecosystem. All data and specs sourced from official BACEN publications.

## Packages

### [`@thiagoprazeres/ispb-participants`](./packages/ispb-participants)

[![npm](https://img.shields.io/npm/v/@thiagoprazeres/ispb-participants)](https://www.npmjs.com/package/@thiagoprazeres/ispb-participants)

ISPB → institution mapping for **all 900+ Brazilian Pix/SPI participants** — updated automatically from the official BACEN dataset every week.

```ts
import { getInstitution, searchInstitutions } from '@thiagoprazeres/ispb-participants';

getInstitution('60746948');
// { ispb: '60746948', name: 'Banco Bradesco S.A.', ... }

searchInstitutions('nubank');
// [{ ispb: '18236120', name: 'Nu Pagamentos S.A.', ... }]
```

---

### [`@thiagoprazeres/parse-e2eid`](./packages/parse-e2eid)

[![npm](https://img.shields.io/npm/v/@thiagoprazeres/parse-e2eid)](https://www.npmjs.com/package/@thiagoprazeres/parse-e2eid)

Parse and validate Brazilian Pix **endToEndId** — semantic date validation included, zero deps.

```ts
import { parseE2EId, isValidE2EId } from '@thiagoprazeres/parse-e2eid';

parseE2EId('E6074694820230615143012345678901');
// { ispb: '60746948', initiatedAt: Date('2023-06-15T14:30:00Z'), suffix: '12345678901' }

isValidE2EId('E6074694820230231143012345678901'); // → false (Feb 31 doesn't exist)
```

---

### [`@thiagoprazeres/pix-static-brcode`](./packages/pix-static-brcode)

[![npm](https://img.shields.io/npm/v/@thiagoprazeres/pix-static-brcode)](https://www.npmjs.com/package/@thiagoprazeres/pix-static-brcode)

Generate, parse and validate Brazilian Pix **static BR Code** (EMV QRCPS-MPM) — CRC-16 validation included, zero deps.

```ts
import { generateStaticBrCode, parseStaticBrCode, isValidBrCode } from '@thiagoprazeres/pix-static-brcode';

const payload = generateStaticBrCode({ pixKey: '11999998888', receiverName: 'JOAO DA SILVA', receiverCity: 'SAO PAULO', referenceLabel: 'REF001' });
parseStaticBrCode(payload); // → { pixKey, receiverName, receiverCity, referenceLabel }
isValidBrCode(payload);     // → true
```

---

## Composition example

```ts
import { parseE2EId } from '@thiagoprazeres/parse-e2eid';
import { getInstitution } from '@thiagoprazeres/ispb-participants';

const { ispb, initiatedAt } = parseE2EId(endToEndId);
const institution = getInstitution(ispb);
console.log(`Pago por ${institution?.name} em ${initiatedAt.toISOString()}`);
```

---

## References

- [Manual do BR Code (BACEN)](https://www.bcb.gov.br/content/estabilidadefinanceira/ativosdosite/Manual%20do%20BR%20Code.pdf)
- [Manual de Padrões para Iniciação do Pix (BACEN)](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf)
- [BACEN SPI participant list](https://www.bcb.gov.br/estabilidadefinanceira/participantespi)

## License

[Apache 2.0](./LICENSE)
