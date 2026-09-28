import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseRowTime } from '../src/time';
import { parseCsv } from '../src/csv';
import { analyze } from '../src/analyze';
import type { Config } from '../src/types';
const config: Config = { timestampColumn: 0, timeColumn: 1, dateFormat: 'dmy', valueColumn: 2, measurement: 'power-mean', unit: 'kW', timezone: 'Europe/Paris', decimal: '.', delimiter: ';', intervalMinutes: 1, intervalPosition: 'start', cadenceMinutes: 1, expectedStart: null, expectedEnd: null, highValue: null, constantHours: 24, jumpFactor: 10 };
it('agrees with an independently computed Decimal energy sum on UCI data', () => {
  const bytes = readFileSync('examples/uci/household-2006-12-17.csv');
  const manifest = JSON.parse(readFileSync('examples/uci/manifest.json', 'utf8'));
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.sha256);
  const result = analyze(parseCsv(bytes.toString()), config, { name: manifest.file, bytes: bytes.length, sha256: manifest.sha256 });
  expect(result.energy.totalKWh).toBeCloseTo(Number(manifest.expectedEnergyKWh), 8);
  expect(result.inferences.temporalCompletenessPercent).toBe(100); expect(result.values.valid).toBe(1440);
  expect(result.temporal.first).toBe('2006-12-16T23:00:00.000Z');
});
it('does not guess ambiguous regional dates', () => {
  const row = ['03/04/2024', '12:00:00', '2'];
  expect(parseRowTime(row, { ...config, dateFormat: 'iso' }).ms).toBeNull();
  expect(parseRowTime(row, config).ms).not.toBe(parseRowTime(row, { ...config, dateFormat: 'mdy' }).ms);
});
it.each([['31/04/2024', '12:00:00', 'TS_INVALID'], ['27/10/2024', '02:30:00', 'TS_LOCAL_AMBIGUOUS'], ['31/03/2024', '02:30:00', 'TS_LOCAL_AMBIGUOUS'], ['17/12/2006', '', 'TS_MISSING']])('preserves strict validation %s %s', (date, time, code) => expect(parseRowTime([date, time], config).issue).toBe(code));
it('supports combined regional dates only under an explicit format', () => expect(parseRowTime(['17/12/2006 00:00:00'], { ...config, timeColumn: null }).ms).toBe(parseRowTime(['17/12/2006', '00:00:00'], config).ms));
it('rejects overlapping columns in the engine', () => expect(() => analyze(parseCsv('Date;Time;value\n17/12/2006;00:00:00;2'), { ...config, timeColumn: 2 }, { name: 'bad.csv', bytes: 0, sha256: '' })).toThrow('columna de hora'));
