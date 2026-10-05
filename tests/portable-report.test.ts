import { expect, test } from 'vitest';
import { analyze } from '../src/analyze';
import { parseCsv } from '../src/csv';
import { portableReport } from '../src/portable-report';
import type { Config } from '../src/types';
const config: Config = { timestampColumn: 0, valueColumn: 1, unit: 'kW', measurement: 'power-instant', timezone: '', decimal: '.', delimiter: ',', intervalMinutes: null, cadenceMinutes: null, expectedStart: null, expectedEnd: null, intervalPosition: 'start', highValue: null, constantHours: 24, jumpFactor: 10 };
const report = () => analyze(parseCsv('timestamp,power_kW\n2024-01-01T00:00Z,0\n2024-01-01T00:15Z,0'), config, { name: 'test.csv', bytes: 76, sha256: 'abc' });
test('portable report preserves zero, explains null, and leaves the source report unchanged', () => {
  const r = report(); r.energy.totalKWh = 0;
  const before = JSON.stringify(r), html = portableReport(r);
  expect(html).toContain('Energía total (kWh)</th><td>0</td>');
  expect(html).toContain('No disponible');
  expect(html).toContain('Reglas no ejecutadas');
  expect(html).toContain('aproximación');
  expect(JSON.stringify(r)).toBe(before); expect(portableReport(r)).toBe(html);
  r.energy.totalKWh = null; r.energy.observedSubtotalKWh = 3;
  expect(portableReport(r)).toContain('Energía total (kWh)</th><td>No determinable</td>');
  expect(portableReport(r)).toContain('Subtotal observado (kWh; no sustituye el total)</th><td>3</td>');
});
test('all untrusted report fields are escaped; truncated samples retain full finding count', () => {
  const r = report(), hostile = '</title><script>alert(1)</script><img src="https://example.com/x">';
  r.file.name = hostile; r.observed.headers[0] = hostile;
  r.findings = [{ code: 'TEST', severity: 'error', count: 500, description: hostile, suggestion: hostile, technical: hostile, samplesTruncated: true, samples: [{ rows: [2], found: hostile, cells: [[hostile]] }] }];
  r.rulesNotExecuted = [{ code: 'SKIP', reason: hostile }];
  const html = portableReport(r);
  expect(html).not.toContain('<script>'); expect(html).not.toContain('<img');
  expect(html).toContain('&lt;script&gt;'); expect(html).toContain('500 incidencias');
  expect(html).toContain('Muestras truncadas'); expect(html).toContain("default-src 'none'");
});
