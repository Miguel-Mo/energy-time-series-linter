import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { analyze, serializeReport } from '../src/analyze';
import { detect, parseCsv, parseNumber } from '../src/csv';
import { parseTime } from '../src/time';
import { EXAMPLES } from '../src/examples';
import { RULES } from '../src/rules';
import { MAX_BYTES, type Config } from '../src/types';

const config: Config = { timestampColumn: 0, valueColumn: 1, unit: 'kW', measurement: 'power-instant', timezone: '', decimal: '.', delimiter: ',', intervalMinutes: null, intervalPosition: 'start', highValue: null, constantHours: 24, jumpFactor: 10 };
const run = (text: string, changes: Partial<Config> = {}) => {
  const csv = parseCsv(text);
  return analyze(csv, { ...config, delimiter: csv.delimiter, ...changes }, { name: 'fixture.csv', bytes: Buffer.byteLength(text), sha256: createHash('sha256').update(text).digest('hex') });
};
const example = (id: string, c: Partial<Config> = {}) => run(EXAMPLES[id].text, c);
const codes = (text: string, c: Partial<Config> = {}) => run(text, c).findings.map(f => f.code);
const series = (rows: string[]) => 'timestamp,power_kW\n' + rows.join('\n');

describe('CSV structure and number conventions', () => {
  it('reports an empty file and header-only files', () => {
    expect(codes('')).toContain('CSV_EMPTY'); expect(codes('timestamp,power_kW\n')).toContain('CSV_EMPTY');
  });
  it('can report a structurally unusable single-column file', () => {
    expect(codes('timestamp\n2024-01-01T00:00Z')).toContain('CSV_REQUIRED_COLUMNS');
  });
  it('detects all supported delimiters', () => {
    for (const delimiter of [',', ';', '\t', '|']) expect(parseCsv(`time${delimiter}value\n2024-01-01T00:00Z${delimiter}2\n`).delimiter).toBe(delimiter);
  });
  it('handles decimal comma without treating it as a column', () => {
    const data = parseCsv(EXAMPLES['decimal-comma'].text);
    expect(detect(data).decimal).toBe(','); expect(example('decimal-comma', { decimal: ',' }).energy.totalKWh).toBe(.75);
  });
  it('keeps a quoted comma and embedded newline within one record', () => {
    const data = parseCsv('time,value,note\n2024-01-01T00:00Z,2,"hello,\nworld"\n');
    expect(data.rows).toHaveLength(1); expect(data.rows[0][2]).toBe('hello,\nworld');
  });
  it('keeps quoted fields spanning chunk boundaries and identifies malformed later records', () => {
    const long = 'x'.repeat(270000);
    const data = parseCsv(`time,value,note\n2024-01-01T00:00Z,2,"${long}\nend"\n2024-01-01T00:15Z,2,ok\n`);
    expect(data.rows).toHaveLength(2); expect(data.rows[0][2]).toBe(long + '\nend');
    const broken = parseCsv(`time,value,note\n2024-01-01T00:00Z,2,"${long}"\n2024-01-01T00:15Z,2,"broken`);
    expect(broken.parseErrors[0].row).toBe(3);
  });
  it('preserves blank interior records and BOM is accepted', () => {
    const result = run('\uFEFFtimestamp,value\n2024-01-01T00:00Z,2\n\n2024-01-01T00:30Z,2\n');
    expect(result.observed.rows).toBe(3); expect(result.findings.some(f => f.code === 'TS_MISSING')).toBe(true);
  });
  it('reports malformed quoting, inconsistent width, empty and duplicate headers', () => {
    expect(codes('time,value\n"2024-01-01,2')).toContain('CSV_PARSE');
    expect(codes('time,value\n2024-01-01T00:00Z,2,extra')).toContain('CSV_COLUMN_COUNT');
    expect(codes(',value\n2024-01-01T00:00Z,2')).toContain('CSV_HEADER_EMPTY');
    expect(codes('value,value\n2024-01-01T00:00Z,2')).toContain('CSV_HEADER_DUPLICATE');
  });
  it.each(['NaN', 'Infinity', '-Infinity', '1e999'])('rejects nonfinite %s', value => expect(parseNumber(value, '.').issue).toBe('VALUE_NONFINITE'));
  it.each(['1,234.5', '2 kW', '=SUM(1)', '<script>', '0x10', '1 000'])('does not coerce %s', value => expect(parseNumber(value, '.').issue).toBe('VALUE_INVALID'));
  it('reports mixed decimal conventions and missing values', () => {
    expect(parseNumber('', '.').issue).toBe('VALUE_MISSING');
    expect(parseNumber('1,5', '.').issue).toBe('VALUE_INVALID');
    expect(detect(parseCsv('time;value\n2024-01-01T00:00Z;1,5\n2024-01-01T00:15Z;1.5')).decimal).toBeNull();
  });
  it('does not infer mean versus instantaneous power or an energy interval from a unit', () => {
    expect(detect(parseCsv(EXAMPLES['correct-15min'].text)).measurement).toBeNull();
    expect(detect(parseCsv(EXAMPLES['counter-reset'].text)).measurement).toBe('counter');
  });
});

describe('timestamps, offset semantics and DST', () => {
  it('maps Z and an equivalent explicit offset to the same instant', () => {
    expect(parseTime('2024-01-01T01:00:00+01:00', '').ms).toBe(parseTime('2024-01-01T00:00:00Z', '').ms);
  });
  it('requires a selected zone for local dates, not the system zone', () => {
    expect(parseTime('2024-01-01T01:00:00', '').issue).toBe('TS_ZONE_REQUIRED');
    expect(parseTime('2024-01-01T01:00:00', 'Europe/Madrid').ms).toBe(parseTime('2024-01-01T00:00:00Z', '').ms);
  });
  it.each(['2023-02-29T12:00:00Z', '2024-04-31T12:00:00Z', '2024-01-01T25:00:00Z', '2024-13-01T00:00:00Z'])('rejects impossible calendar date %s', value => expect(parseTime(value, '').issue).toBe('TS_INVALID'));
  it('does not silently normalize leap seconds or unknown offset -00:00', () => {
    expect(parseTime('2016-12-31T23:59:60Z', '').issue).toBe('TS_UNSUPPORTED');
    expect(parseTime('2024-01-01T00:00:00-00:00', '').issue).toBe('TS_UNSUPPORTED');
  });
  it('preserves unambiguous Madrid spring and autumn intervals', () => {
    for (const id of ['dst-spring', 'dst-autumn']) {
      const result = example(id, { timezone: 'Europe/Madrid' });
      expect(result.inferences.frequencySeconds).toBe(900);
      expect(result.inferences.completenessPercent).toBe(100);
      expect(result.energy.totalKWh).toBe(1.5);
      expect(result.findings.some(f => ['TS_GAP', 'TS_DUPLICATE_TIMESTAMP', 'TS_OUT_OF_ORDER', 'TS_OFFSET_CHANGE'].includes(f.code))).toBe(false);
    }
  });
  it('does not manufacture a gap over spring with local timestamps', () => {
    const text = EXAMPLES['dst-spring'].text.replace(/\+0[12]:00/g, '');
    const result = run(text, { timezone: 'Europe/Madrid' });
    expect(result.inferences.completenessPercent).toBe(100); expect(result.energy.totalKWh).toBe(1.5);
  });
  it.each(['2024-03-31T02:30:00', '2024-10-27T02:30:00'])('rejects ambiguous or nonexistent local hour %s without moving it', value => {
    expect(parseTime(value, 'Europe/Madrid').issue).toBe('TS_LOCAL_AMBIGUOUS');
    expect(run(series([`${value},2`]), { timezone: 'Europe/Madrid' }).energy.totalKWh).toBeNull();
  });
  it('accepts actual 23-hour and 25-hour days, without assuming 24 hours', () => {
    for (const [start, samples] of [['2024-03-30T23:00:00Z', 93], ['2024-10-26T22:00:00Z', 101]] as const) {
      const text = series(Array.from({ length: samples }, (_, i) => `${new Date(Date.parse(start) + i * 900000).toISOString()},1`));
      const r = run(text); expect(r.energy.totalKWh).toBe((samples - 1) / 4);
    }
  });
  it('warns about mixed formats, mixed timezone presence, and unexplained offsets', () => {
    const result = codes(series(['2024-01-01T00:00:00Z,1', '2024-01-01 00:15:00,1', '2024-01-01T01:30:00+01:00,1']), { timezone: 'UTC' });
    expect(result).toEqual(expect.arrayContaining(['TS_MIXED_FORMAT', 'TS_MIXED_ZONE', 'TS_OFFSET_CHANGE', 'TS_ZONE_MISMATCH']));
  });
  it('rejects invalid configuration explicitly', () => {
    expect(() => example('correct-15min', { timezone: 'Mars/Invalid' })).toThrow(/Zona/);
    expect(() => example('correct-15min', { valueColumn: 0 })).toThrow(/distintas/);
    expect(() => example('correct-15min', { intervalMinutes: -1 })).toThrow(/duración/);
  });
});

describe('intervals and findings', () => {
  it('identifies duplicate instants and both source record numbers', () => {
    const f = example('duplicate').findings.find(f => f.code === 'TS_DUPLICATE_TIMESTAMP')!;
    expect(f.samples[0].rows).toEqual([3, 4]); expect(f.samples[0].cells).toHaveLength(2);
  });
  it('identifies equivalent instants written differently', () => {
    expect(codes(series(['2024-01-01T00:00:00Z,1', '2024-01-01T01:00:00+01:00,1']))).toContain('TS_DUPLICATE_TIMESTAMP');
  });
  it('detects a gap, estimates completeness and does not integrate through it', () => {
    const r = example('gap'); expect(r.findings.some(f => f.code === 'TS_GAP')).toBe(true);
    expect(r.inferences.expectedRecords).toBe(5); expect(r.inferences.completenessPercent).toBe(80); expect(r.energy.totalKWh).toBeNull();
  });
  it('does not calculate power energy from unordered rows', () => {
    const r = example('unordered'); expect(r.findings.some(f => f.code === 'TS_OUT_OF_ORDER')).toBe(true); expect(r.energy.totalKWh).toBeNull();
  });
  it('does not invent a predominant frequency for ties or one pair', () => {
    const r = run(series(['2024-01-01T00:00Z,1', '2024-01-01T00:15Z,1', '2024-01-01T00:45Z,1']));
    expect(r.inferences.frequencySeconds).toBeNull(); expect(r.inferences.completenessPercent).toBeNull();
    expect(r.findings.some(f => f.code === 'TS_IRREGULAR')).toBe(true);
    expect(run(series(['2024-01-01T00:00Z,1', '2024-01-01T00:15Z,1'])).energy.totalKWh).toBeNull();
  });
  it('detects declared overlap and skips the rule when duration is unknown', () => {
    const r = example('correct-15min', { measurement: 'interval-energy', unit: 'kWh', intervalMinutes: 30 });
    expect(r.findings.some(f => f.code === 'TS_OVERLAP')).toBe(true); expect(r.energy.totalKWh).toBeNull();
    expect(example('correct-15min').rulesNotExecuted.some(r => r.code === 'TS_OVERLAP')).toBe(true);
  });
  it('does not double-count duplicated records as complete', () => {
    expect(example('duplicate').inferences.completenessPercent).toBe(100);
    expect(example('duplicate').inferences.expectedRecords).toBe(3);
  });
  it('does not show complete data when the timestamps cannot be resolved', () => {
    const r = run(series(['2024-01-01T00:00Z,1', '2024-01-01T00:15Z,1', '2024-01-01T00:30,1']));
    expect(r.inferences.completenessPercent).toBeNull();
  });
});

describe('energy semantics and value heuristics', () => {
  it('integrates 2 kW over one hour, without extrapolating a final interval', () => expect(example('correct-15min').energy.totalKWh).toBe(2));
  it('allows explicit duration with two power samples', () => expect(run(series(['2024-01-01T00:00Z,2', '2024-01-01T00:15Z,2']), { intervalMinutes: 15 }).energy.totalKWh).toBe(.5));
  it('computes mean power using every declared interval', () => {
    expect(example('correct-15min', { measurement: 'power-mean', intervalMinutes: 15 }).energy.totalKWh).toBe(2.5);
    expect(example('correct-15min', { measurement: 'power-mean' }).energy.totalKWh).toBeNull();
  });
  it('sums interval energy and tracks covered time without filling gaps', () => {
    const r = example('gap', { measurement: 'interval-energy', unit: 'Wh', intervalMinutes: 15 });
    expect(r.energy.totalKWh).toBe(.008); expect(r.temporal.coveredSeconds).toBe(3600);
  });
  it('rejects power/energy unit mismatches', () => {
    expect(example('correct-15min', { unit: 'kWh' }).findings.some(f => f.code === 'ENERGY_UNIT')).toBe(true);
    expect(example('correct-15min', { unit: 'kWh' }).energy.totalKWh).toBeNull();
  });
  it('allows negative export values and computes signed energy', () => {
    const r = example('export'); expect(r.counts.error).toBe(0); expect(r.energy.totalKWh).toBe(-1);
    expect(r.findings.find(f => f.code === 'VALUE_NEGATIVE')?.severity).toBe('info');
  });
  it('does not invent reset consumption', () => {
    const r = example('counter-reset', { measurement: 'counter', unit: 'kWh' });
    expect(r.energy.totalKWh).toBeNull(); expect(r.energy.observedSubtotalKWh).toBe(4);
    expect(r.findings.find(f => f.code === 'COUNTER_DECREASE')?.severity).toBe('warning');
  });
  it('calculates cumulative differences even over a sampling gap', () => {
    const r = run(series(['2024-01-01T00:00Z,100', '2024-01-01T01:00Z,105']), { measurement: 'counter', unit: 'kWh' });
    expect(r.energy.totalKWh).toBe(5);
  });
  it('warns of possible scale change and withholds a misleading total', () => {
    const r = example('unit-shift'); expect(r.findings.some(f => f.code === 'VALUE_UNIT_SHIFT')).toBe(true); expect(r.energy.totalKWh).toBeNull();
  });
  it('makes high values configurable and constant runs duration-based', () => {
    const r = example('correct-15min', { highValue: 1, constantHours: .5 });
    expect(r.findings.find(f => f.code === 'VALUE_HIGH')?.count).toBe(5);
    expect(r.findings.find(f => f.code === 'VALUE_CONSTANT')?.samples[0].rows).toEqual([2, 6]);
  });
  it('does not measure a constant run through a missing value or a gap', () => {
    const r = example('gap', { constantHours: .5 }); expect(r.findings.some(f => f.code === 'VALUE_CONSTANT')).toBe(false);
  });
});

describe('limits and reproducibility', () => {
  it('produces deterministic JSON with all rules accounted for and SHA-256', () => {
    const a = example('correct-15min'), b = example('correct-15min');
    expect(serializeReport(a)).toBe(serializeReport(b)); expect(JSON.parse(serializeReport(a))).toEqual(a);
    expect(a.file.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect([...a.rulesExecuted, ...a.rulesNotExecuted.map(r => r.code)].sort()).toEqual(Object.keys(RULES).sort());
    expect(a.reportVersion).toBe('1.0.0');
  });
  it('keeps source data unchanged', () => {
    const data = parseCsv(EXAMPLES.unordered.text), before = JSON.stringify(data);
    analyze(data, config, { name: 'x', bytes: 0, sha256: '' }); expect(JSON.stringify(data)).toBe(before);
  });
  it('caps samples but counts every occurrence', () => {
    const r = run(series(Array.from({ length: 1000 }, () => '2024-01-01T00:00Z,1')));
    const f = r.findings.find(f => f.code === 'TS_DUPLICATE_TIMESTAMP')!;
    expect(f.count).toBe(999); expect(f.samples).toHaveLength(50); expect(f.samplesTruncated).toBe(true);
  });
  it('rejects excessive bytes, rows and columns', () => {
    expect(() => parseCsv('a'.repeat(MAX_BYTES + 1))).toThrow(/10 MiB/);
    expect(() => parseCsv('a,b\n' + 'a,1\n'.repeat(100001))).toThrow(/100.000/);
    expect(() => parseCsv(Array(101).fill('a').join(','))).toThrow(/columnas/);
  });
  it('analyzes 100,000 valid records within the file limit', () => {
    const text = series(Array.from({ length: 100000 }, (_, i) => `${new Date(Date.UTC(2024, 0, 1) + i * 900000).toISOString()},2`));
    expect(Buffer.byteLength(text)).toBeLessThan(MAX_BYTES);
    const r = run(text); expect(r.observed.rows).toBe(100000); expect(r.counts.error).toBe(0); expect(r.inferences.completenessPercent).toBe(100);
    expect(r.energy.totalKWh).toBe(49999.5);
  }, 30000);
  it('maintains package and report app versions together', () => {
    expect(example('correct-15min').appVersion).toBe(JSON.parse(readFileSync('package.json', 'utf8')).version);
  });
});
