/**
 * Fetches the official BACEN SPI participant list and generates src/data.ts.
 * Usage: npm run generate
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseCsv } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../src/data.ts');

const BACEN_CSV_URL =
  'https://www.bcb.gov.br/content/estabilidadefinanceira/spi/ParticipantesSPI.csv';

const GITHUB_README_URL =
  'https://raw.githubusercontent.com/pitz/participantes-do-pix/main/README.md';

function pad(ispb: string): string {
  return ispb.trim().padStart(8, '0');
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

interface Row {
  ispb: string;
  name: string;
  shortName: string;
  cnpj?: string;
  spiParticipationType?: string;
  pixParticipationType?: string;
}

async function fetchBacenCsv(): Promise<Row[] | null> {
  console.log('  Fetching BACEN CSV:', BACEN_CSV_URL);
  try {
    const res = await fetch(BACEN_CSV_URL, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      console.log(`  BACEN CSV returned ${res.status} — trying fallback...`);
      return null;
    }
    const text = await res.text();

    // Detect delimiter
    const firstLine = text.slice(0, text.indexOf('\n'));
    const sep = firstLine.includes(';') ? ';' : ',';

    // Parse with RFC 4180-compliant csv-parse
    const records: Record<string, string>[] = parseCsv(text, {
      delimiter: sep,
      columns: (header: string[]) => header.map(h => h.trim().toLowerCase().replace(/\s+/g, ' ')),
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    if (records.length === 0) return null;
    console.log('  CSV headers:', Object.keys(records[0]!).join(' | '));

    const col = (row: Record<string, string>, names: string[]): string | undefined => {
      const key = Object.keys(row).find(k => names.some(n => k === n || k.startsWith(n)));
      return key ? row[key] || undefined : undefined;
    };

    const rows: Row[] = [];
    for (const record of records) {
      const ispb = col(record, ['ispb']);
      const name = col(record, ['nome', 'name']);
      if (!ispb || !name) continue;
      const shortName = col(record, ['nome reduzido', 'nomereduzido', 'short name']) ?? name;
      rows.push({
        ispb: pad(ispb),
        name,
        shortName,
        cnpj: col(record, ['cnpj']),
        spiParticipationType: col(record, ['modalidade', 'tipo participante spi', 'tipo de participante']),
        pixParticipationType: col(record, ['tipo participante pix', 'modalidade pix']),
      });
    }

    if (rows.length < 100) {
      console.log(`  Only ${rows.length} rows parsed — trying fallback...`);
      return null;
    }

    console.log(`  ✓ BACEN CSV: ${rows.length} participants`);
    return rows;
  } catch (err) {
    console.log('  Error fetching BACEN CSV:', (err as Error).message);
    return null;
  }
}

async function fetchGithubReadme(): Promise<Row[]> {
  console.log('  Fetching GitHub README:', GITHUB_README_URL);
  const res = await fetch(GITHUB_README_URL, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();
  const rows: Row[] = [];
  const regex = /\[ispb:\s*"([^"]+)",\s*cnpj:\s*"([^"]*)",\s*name:\s*"([^"]+)"\]/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    rows.push({
      ispb: pad(m[1]!),
      name: m[3]!.trim(),
      shortName: m[3]!.trim(),
      cnpj: m[2] || undefined,
    });
  }

  if (rows.length < 100) throw new Error(`Only ${rows.length} entries — unexpected format`);
  console.log(`  ✓ GitHub README: ${rows.length} participants`);
  return rows;
}

async function main(): Promise<void> {
  console.log('\n🏦 Generating src/data.ts...');

  const raw = (await fetchBacenCsv()) ?? (await fetchGithubReadme());
  // Deduplicate by ISPB (last occurrence wins)
  const deduped = new Map<string, Row>();
  for (const r of raw) deduped.set(r.ispb, r);
  const rows = [...deduped.values()].sort((a, b) => a.ispb.localeCompare(b.ispb));

  const date = new Date().toISOString().slice(0, 10);

  const institutionEntries = rows
    .map(r => {
      const fields: string[] = [
        `ispb: '${esc(r.ispb)}'`,
        `name: '${esc(r.name)}'`,
        `shortName: '${esc(r.shortName)}'`,
      ];
      if (r.cnpj) fields.push(`cnpj: '${esc(r.cnpj)}'`);
      if (r.spiParticipationType) fields.push(`spiParticipationType: '${esc(r.spiParticipationType)}'`);
      if (r.pixParticipationType) fields.push(`pixParticipationType: '${esc(r.pixParticipationType)}'`);
      return `  '${r.ispb}': { ${fields.join(', ')} },`;
    })
    .join('\n');

  const output = [
    `// AUTO-GENERATED — do not edit manually`,
    `// Source: BACEN SPI (ParticipantesSPI.csv) — ${date}`,
    `// To regenerate: npm run generate`,
    ``,
    `export interface Institution {`,
    `  ispb: string;`,
    `  name: string;`,
    `  shortName: string;`,
    `  cnpj?: string;`,
    `  spiParticipationType?: string;`,
    `  pixParticipationType?: string;`,
    `}`,
    ``,
    `export const METADATA = {`,
    `  source: 'BACEN SPI (ParticipantesSPI.csv)',`,
    `  sourceUrl: '${BACEN_CSV_URL}',`,
    `  sourceDate: '${date}',`,
    `  recordCount: ${rows.length},`,
    `} as const;`,
    ``,
    `export const INSTITUTIONS: Record<string, Institution> = {`,
    institutionEntries,
    `};`,
    ``,
  ].join('\n');

  writeFileSync(DATA_PATH, output, 'utf-8');
  console.log(`  ✓ Written: src/data.ts (${rows.length} participants, ${date})\n`);
}

main().catch(err => {
  console.error('\n❌ Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
