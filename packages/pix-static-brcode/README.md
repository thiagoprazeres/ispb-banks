# @thiagoprazeres/pix-static-brcode

[![npm](https://img.shields.io/npm/v/@thiagoprazeres/pix-static-brcode)](https://www.npmjs.com/package/@thiagoprazeres/pix-static-brcode)
[![license](https://img.shields.io/npm/l/@thiagoprazeres/pix-static-brcode)](../../LICENSE)

Generate, parse and validate Brazilian Pix **static BR Code** (EMV QRCPS-MPM) — zero runtime dependencies.

Implements the [Manual do BR Code](https://www.bcb.gov.br/content/estabilidadefinanceira/ativosdosite/Manual%20do%20BR%20Code.pdf) and [Manual de Padrões para Iniciação do Pix](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf) published by BACEN.

## Install

```bash
npm install @thiagoprazeres/pix-static-brcode
# or
pnpm add @thiagoprazeres/pix-static-brcode
```

## Usage

### Generate

```ts
import {
  generateStaticBrCode,
  projectReceiverName,
  projectCity,
  buildBrCodeRef,
} from '@thiagoprazeres/pix-static-brcode';

const payload = generateStaticBrCode({
  pixKey: '11999998888',
  receiverName: projectReceiverName('João da Silva'),  // → 'JOAO DA SILVA'
  receiverCity: projectCity('São Paulo'),               // → 'SAO PAULO'
  referenceLabel: buildBrCodeRef(crypto.randomUUID()),
  amount: 99.90,
  description: 'Pedido #1234',
});
// → '000201...<EMV payload>...6304XXXX'
```

### Parse

```ts
import { parseStaticBrCode } from '@thiagoprazeres/pix-static-brcode';

const parsed = parseStaticBrCode(payload);
// {
//   pixKey: '11999998888',
//   receiverName: 'JOAO DA SILVA',
//   receiverCity: 'SAO PAULO',
//   referenceLabel: '...',
//   amount: 99.90,
//   description: 'Pedido #1234'
// }
```

Throws `Error` if the payload is malformed or the **CRC-16 checksum is invalid**.

### Validate

```ts
import { validateCrc16, isValidBrCode } from '@thiagoprazeres/pix-static-brcode';

validateCrc16(payload);    // true / false — only checks checksum
isValidBrCode(payload);    // true / false — full validation, never throws
```

## API

### `generateStaticBrCode(params: BrCodeParams): string`

Generates a static Pix BR Code EMV payload with CRC-16/CCITT checksum.

```ts
interface BrCodeParams {
  pixKey: string;         // CPF, CNPJ, email, phone or EVP
  receiverName: string;   // already projected (no accents, uppercase, max 25)
  receiverCity: string;   // already projected (no accents, uppercase, max 15)
  referenceLabel: string; // max 25 alphanumeric chars
  amount?: number;        // omit for open-value charges
  description?: string;   // max 72 chars
}
```

### `parseStaticBrCode(payload: string): ParsedBrCode`

Parses a static BR Code payload. Validates CRC-16 before parsing. Throws on invalid input.

```ts
interface ParsedBrCode {
  pixKey: string;
  receiverName: string;
  receiverCity: string;
  referenceLabel?: string;
  amount?: number;
  description?: string;
}
```

### `validateCrc16(payload: string): boolean`

Returns `true` if the last 4 chars match the CRC-16/CCITT checksum of the rest. Never throws.

### `isValidBrCode(payload: string): boolean`

Full validation (format + CRC + required fields). Never throws.

### Projections

Normalize strings to the BR Code spec before generating:

```ts
projectReceiverName(name: string): string
// Remove accents, strip non-alphanumeric, uppercase, truncate to 25 chars

projectCity(city: string): string
// Remove accents, strip non-alphanumeric, uppercase, truncate to 15 chars

buildBrCodeRef(id: string): string
// Strip hyphens from UUID, uppercase, truncate to 25 chars
```

## EMV field map

| Tag | Field | Value |
|-----|-------|-------|
| `00` | Payload Format Indicator | `01` |
| `26` | Merchant Account Info | `br.gov.bcb.pix` + key + description |
| `52` | Merchant Category Code | `0000` |
| `53` | Transaction Currency | `986` (BRL) |
| `54` | Transaction Amount | omitted if open-value |
| `58` | Country Code | `BR` |
| `59` | Merchant Name | projected receiver name |
| `60` | Merchant City | projected city |
| `62/05` | Reference Label | charge reference |
| `63` | CRC-16/CCITT | 4-char hex checksum |

## References

- [Manual do BR Code (BACEN)](https://www.bcb.gov.br/content/estabilidadefinanceira/ativosdosite/Manual%20do%20BR%20Code.pdf)
- [Manual de Padrões para Iniciação do Pix (BACEN)](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf)
- [CRC-16 validation discussion — bacen/pix-api #189](https://github.com/bacen/pix-api/issues/189)

## License

[Apache 2.0](../../LICENSE)
