# ispb-banks

[![npm](https://img.shields.io/npm/v/ispb-banks)](https://www.npmjs.com/package/ispb-banks)
[![license](https://img.shields.io/npm/l/ispb-banks)](./LICENSE)

Convenience meta-package that re-exports the three focused Pix libraries for Brazil in a single install.

```bash
npm install ispb-banks
```

```ts
import {
  getInstitution,        // from @thiagoprazeres/ispb-participants
  parseE2EId,            // from @thiagoprazeres/parse-e2eid
  generateStaticBrCode,  // from @thiagoprazeres/pix-static-brcode
} from 'ispb-banks';
```

## What's included

| Export | Source package | Purpose |
|--------|---------------|---------|
| `getInstitution`, `hasIspb`, `searchInstitutions`, `INSTITUTIONS`, `getMetadata` | [`@thiagoprazeres/ispb-participants`](https://github.com/thiagoprazeres/ispb-participants) | ISPB → institution mapping (900+ SPI participants) |
| `parseE2EId`, `isValidE2EId` | [`@thiagoprazeres/parse-e2eid`](https://github.com/thiagoprazeres/parse-e2eid) | Pix endToEndId parser with semantic date validation |
| `generateStaticBrCode`, `parseStaticBrCode`, `isValidBrCode`, `validateCrc16`, `projectReceiverName`, `projectCity`, `buildBrCodeRef` | [`@thiagoprazeres/pix-static-brcode`](https://github.com/thiagoprazeres/pix-static-brcode) | Static BR Code (EMV QRCPS-MPM) generation, parsing and CRC-16 validation |

## Usage

```ts
import {
  getInstitution,
  parseE2EId,
  generateStaticBrCode,
  projectReceiverName,
  projectCity,
  buildBrCodeRef,
} from 'ispb-banks';

// ISPB lookup
getInstitution('60746948');
// { ispb: '60746948', name: 'Banco Bradesco S.A.', ... }

// Parse endToEndId
parseE2EId('E6074694820230615143012345678901');
// { ispb: '60746948', initiatedAt: Date('2023-06-15T14:30:00Z'), suffix: '...' }

// Generate BR Code
const payload = generateStaticBrCode({
  pixKey: '11999998888',
  receiverName: projectReceiverName('João da Silva'),
  receiverCity: projectCity('São Paulo'),
  referenceLabel: buildBrCodeRef(crypto.randomUUID()),
  amount: 99.90,
});
```

## Individual packages

If you only need one of the three libraries, install the focused package directly to avoid pulling unused code:

- [`@thiagoprazeres/ispb-participants`](https://github.com/thiagoprazeres/ispb-participants) — ISPB catalog only
- [`@thiagoprazeres/parse-e2eid`](https://github.com/thiagoprazeres/parse-e2eid) — endToEndId parser only
- [`@thiagoprazeres/pix-static-brcode`](https://github.com/thiagoprazeres/pix-static-brcode) — BR Code generator only

## License

[Apache 2.0](./LICENSE)
