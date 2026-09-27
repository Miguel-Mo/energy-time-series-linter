import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { analyze } from '../src/analyze';
import { parseCsv } from '../src/csv';
import type { Config } from '../src/types';

const root = new URL('../examples/real/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));
describe('Published CoSSMic counter data (CC BY 4.0)', () => {
  for (const fixture of manifest.cases) {
    it(fixture.file, () => {
      const bytes = readFileSync(new URL(fixture.file, root));
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      expect(sha256).toBe(fixture.sha256);
      const report = analyze(parseCsv(bytes.toString('utf8')), manifest.configuration as Config, { name: fixture.file, bytes: bytes.length, sha256 });
      expect(report.observed.rows).toBe(fixture.rows);
      expect(report.values.missing).toBe(fixture.missingValues);
      expect(report.temporal.uniqueTimestamps).toBe(fixture.rows);
      expect(report.inferences.temporalCompletenessPercent).toBe(100);
      expect(report.inferences.usableCompletenessPercent).toBeCloseTo(100 * (fixture.rows - fixture.missingValues) / fixture.rows);
      expect(report.quality.duplicateRecords).toBe(0);
    });
  }
});
