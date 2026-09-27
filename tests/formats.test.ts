import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseTime } from '../src/time';
import { parseCsv, detect } from '../src/csv';
import { analyze } from '../src/analyze';
import type { Config } from '../src/types';
const manifest = JSON.parse(readFileSync('examples/real/manifest.json', 'utf8'));
it.each(['+0100', '+0200', '-0530', '+0545', '+0000'])('compact offset %s equals its colon form', offset => {
  const a = parseTime('2024-01-01T12:30:00' + offset, '');
  const b = parseTime('2024-01-01T12:30:00' + offset.slice(0, 3) + ':' + offset.slice(3), '');
  expect(a.ms).not.toBeNull(); expect(a).toEqual(b);
});
it.each(['+2400', '+0160'])('rejects impossible offset %s', offset => expect(parseTime('2024-01-01T12:30' + offset, '').issue).toBe('TS_INVALID'));
it('keeps unknown zero offsets unsupported', () => expect(parseTime('2024-01-01T12:30-0000', '').issue).toBe('TS_UNSUPPORTED'));
it('does not require a timezone for compact offsets', () => expect(detect(parseCsv('timestamp,power_kW\n2024-01-01T12:30+0100,2')).hasLocalTimestamps).toBe(false));
for (const fixture of manifest.cases) it(`UTC and published local-offset columns agree: ${fixture.file}`, () => {
  const raw = readFileSync('examples/real/' + fixture.file, 'utf8');
  const data = parseCsv(raw);
  for (const row of data.rows) expect(parseTime(row[2], 'Europe/Berlin').ms).toBe(parseTime(row[0], '').ms);
  const file = { name: fixture.file, bytes: fixture.bytes, sha256: fixture.sha256 };
  const a = analyze(data, manifest.configuration as Config, file);
  const b = analyze(data, { ...manifest.configuration, timestampColumn: 2, timezone: 'Europe/Berlin' }, file);
  expect(b.energy).toEqual(a.energy); expect(b.inferences).toEqual(a.inferences);
  expect(b.findings.some(f => ['TS_UNSUPPORTED', 'TS_ZONE_REQUIRED', 'TS_ZONE_MISMATCH'].includes(f.code))).toBe(false);
  expect(data.rows[0][2]).toMatch(/[+-]\d{4}$/);
});
