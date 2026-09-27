// Reproducible public software-test fixtures. No generated measurements or repairs.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import Papa from 'papaparse';

const base = 'https://data.open-power-system-data.org/household_data/2020-04-15/';
const output = new URL('../examples/real/', import.meta.url);
const cache = new URL('../data-cache/', import.meta.url);
await mkdir(output, { recursive: true });
await mkdir(cache, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function source(local, remote) {
  const path = new URL(local, cache);
  try { return await readFile(path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const response = await fetch(remote);
  if (!response.ok) throw new Error(`${remote}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path, bytes);
  return bytes;
}
const raw = await source('opsd-60min.csv', base + 'household_data_60min_singleindex.csv');
const metadata = await source('datapackage.json', base + 'datapackage.json');
const parsed = Papa.parse(raw.toString('utf8'), { header: true, skipEmptyLines: true });
if (parsed.errors.length) throw new Error(JSON.stringify(parsed.errors));
const cases = [
  ['consumo-industrial', 'DE_KN_industrial1_grid_import', '2016-03-01', '2016-04-01'],
  ['solar-industrial', 'DE_KN_industrial1_pv_1', '2016-03-01', '2016-04-01'],
  ['bateria-inicio-registro', 'DE_KN_industrial2_storage_charge', '2016-04-24', '2016-05-02'],
  ['consumo-escuela', 'DE_KN_public1_grid_import', '2016-06-01', '2016-07-01'],
];
const manifest = {
  source: base, download: base + 'household_data_60min_singleindex.csv',
  sourceSha256: hash(raw), sourceBytes: raw.length, metadataSha256: hash(metadata),
  license: 'CC-BY-4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  attribution: 'Open Power System Data. 2020. Data Package Household Data. Version 2020-04-15. Primary data: CoSSMic.',
  transformation: 'Select rows by UTC range [start, end) and columns only. Preserve numeric strings, empty values, timestamps and the complete upstream interpolated marker. No interpolation or unit conversion added.',
  caveat: 'Real measurements processed by the publisher, including upstream gap filling. Contadores acumulados: NO sumar como energia por intervalo. The linter does not interpret the interpolated column.',
  configuration: { timestampColumn: 0, valueColumn: 1, unit: 'kWh', measurement: 'counter', timezone: '', decimal: '.', delimiter: ',', intervalMinutes: null, intervalPosition: 'start', cadenceMinutes: 60, expectedStart: null, expectedEnd: null, highValue: null, constantHours: 24, jumpFactor: 10 },
  cases: [],
};
for (const [id, column, start, end] of cases) {
  const selected = parsed.data.map((row, index) => ({ row, sourceLine: index + 2 })).filter(({ row }) => row.utc_timestamp >= start && row.utc_timestamp < end);
  if (!selected.length) throw new Error(`Empty selection: ${id}`);
  const fields = ['utc_timestamp', column, 'cet_cest_timestamp', 'interpolated'];
  const text = Papa.unparse({ fields, data: selected.map(({ row }) => fields.map(field => row[field])) }, { newline: '\n' }) + '\n';
  await writeFile(new URL(id + '.csv', output), text);
  manifest.cases.push({ file: id + '.csv', column, startInclusive: start, endExclusive: end, rows: selected.length, firstSourceLine: selected[0].sourceLine, lastSourceLine: selected.at(-1).sourceLine, missingValues: selected.filter(({ row }) => row[column] === '').length, upstreamMarkedRows: selected.filter(({ row }) => row.interpolated.includes(column)).length, sha256: hash(text), bytes: Buffer.byteLength(text) });
}
await writeFile(new URL('manifest.json', output), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest.cases, null, 2));
