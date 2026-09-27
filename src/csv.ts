import Papa from 'papaparse';
import { MAX_BYTES, MAX_COLUMNS, MAX_ROWS, type CsvData, type Detection, type Unit } from './types';

export function parseCsv(text: string, delimiter = ''): CsvData {
  if (new TextEncoder().encode(text).byteLength > MAX_BYTES) throw new Error('El límite del MVP es 10 MiB.');
  const records: string[][] = [];
  const parseErrors: CsvData['parseErrors'] = [];
  const clean = text.replace(/^\uFEFF/, '');
  // Ignore blank records only during delimiter inference; retain them during validation.
  let chosen = delimiter || Papa.parse(clean.slice(0, 256 * 1024), { preview: 100, skipEmptyLines: true, delimitersToGuess: [',', ';', '\t', '|'] }).meta.delimiter;
  let limitError = '';
  // Papa supports chunked string input; its type declarations expose chunk only for async input.
  const options: Papa.ParseConfig<string[]> & { chunkSize: number; chunk: (result: Papa.ParseResult<string[]>, parser: Papa.Parser) => void } = {
    delimiter: chosen, delimitersToGuess: [',', ';', '\t', '|'], skipEmptyLines: false,
    chunkSize: 256 * 1024,
    chunk(result, parser) {
      chosen = result.meta.delimiter;
      const offset = records.length;
      for (const e of result.errors) {
        if (e.code !== 'UndetectableDelimiter') parseErrors.push({ row: offset + (e.row ?? 0) + 1, message: e.message });
      }
      for (const row of result.data) {
        if (row.length > MAX_COLUMNS || records.length > MAX_ROWS + 1) {
          limitError = 'Límite del MVP: 100.000 registros y 100 columnas.'; parser.abort(); break;
        }
        records.push(row);
      }
    },
  };
  Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), options);
  if (limitError) throw new Error(limitError);
  // A final line terminator is not an additional CSV record. Interior blank records remain visible.
  if (records.at(-1)?.length === 1 && records.at(-1)?.[0] === '' && /[\r\n]$/.test(text)) records.pop();
  if (!text.trim()) return { headers: [], rows: [], delimiter: chosen || ',', parseErrors, delimiterInferred: !delimiter };
  const headers = records.shift() ?? [];
  if (records.length > MAX_ROWS) throw new Error('Límite del MVP: 100.000 registros.');
  return { headers, rows: records, delimiter: chosen || ',', parseErrors, delimiterInferred: !delimiter };
}

export function detect(data: CsvData): Detection {
  const sample = data.rows.slice(0, 100);
  const byHeader = data.headers.findIndex(h => /timestamp|fecha|datetime|^time$|date/i.test(h));
  const timestampColumn = byHeader >= 0 ? byHeader : Math.max(0, data.headers.findIndex((_, i) => sample.some(r => /^\d{4}-\d\d-\d\d[T ]/.test(r[i] ?? ''))));
  const namedValue = data.headers.findIndex((h, i) => i !== timestampColumn && /power|energy|potencia|energ[ií]a|value|valor|counter|kwh|kw/i.test(h));
  const valueColumn = namedValue >= 0 ? namedValue : timestampColumn === 0 ? 1 : 0;
  const header = data.headers[valueColumn] ?? '';
  const unit = header.match(/(?:^|[^a-zA-Z])(MWh|kWh|Wh|MW|kW|W)(?:$|[^a-zA-Z])/)?.[1] as Unit | undefined;
  const vals = sample.map(r => r[valueColumn] ?? '');
  const comma = vals.some(v => /^[-+]?\d*,\d+(?:e[-+]?\d+)?$/i.test(v));
  const dot = vals.some(v => /^[-+]?\d*\.\d+(?:e[-+]?\d+)?$/i.test(v));
  return { timestampColumn, valueColumn, unit: unit ?? null, measurement: /counter|acumulad/i.test(header) ? 'counter' : null,
    decimal: comma && dot ? null : comma ? ',' : '.', delimiter: data.delimiter,
    hasLocalTimestamps: sample.some(r => !/(Z|[+-]\d{2}:\d{2})$/i.test(r[timestampColumn] ?? '')) };
}

export function parseNumber(raw: string, decimal: '.' | ','): { value: number | null; issue?: 'VALUE_MISSING' | 'VALUE_INVALID' | 'VALUE_NONFINITE' } {
  const v = raw.trim();
  if (!v) return { value: null, issue: 'VALUE_MISSING' };
  if (/^[+-]?(Infinity|NaN)$/i.test(v)) return { value: null, issue: 'VALUE_NONFINITE' };
  const dec = decimal === '.' ? '\\.' : ',';
  if (!new RegExp(`^[+-]?(?:\\d+(?:${dec}\\d*)?|${dec}\\d+)(?:[eE][+-]?\\d+)?$`).test(v)) return { value: null, issue: 'VALUE_INVALID' };
  const value = Number(v.replace(',', '.'));
  return Number.isFinite(value) ? { value } : { value: null, issue: 'VALUE_NONFINITE' };
}
