export const APP_VERSION = '0.1.0';
export const MAX_BYTES = 10 * 1024 * 1024;
export const MAX_ROWS = 100_000;
export const MAX_COLUMNS = 100;
export type Severity = 'error' | 'warning' | 'info';
export type Measurement = 'power-instant' | 'power-mean' | 'interval-energy' | 'counter';
export type Unit = 'W' | 'kW' | 'MW' | 'Wh' | 'kWh' | 'MWh';
export interface Config {
  timestampColumn: number; valueColumn: number; unit: Unit; measurement: Measurement;
  timezone: string; decimal: '.' | ','; delimiter: string;
  intervalMinutes: number | null; intervalPosition: 'start' | 'end';
  highValue: number | null; constantHours: number; jumpFactor: number;
}
export interface CsvData {
  headers: string[]; rows: string[][]; delimiter: string;
  parseErrors: { row: number; message: string }[]; delimiterInferred: boolean;
}
export interface Detection {
  timestampColumn: number; valueColumn: number; unit: Unit | null;
  measurement: Measurement | null; decimal: '.' | ',' | null;
  hasLocalTimestamps: boolean; delimiter: string;
}
export interface Finding {
  code: string; severity: Severity; description: string; suggestion: string; technical: string;
  count: number; samples: { rows: number[]; found: string; cells: string[][] }[];
  samplesTruncated: boolean;
}
export interface Report {
  reportVersion: '1.0.0'; appVersion: string;
  file: { name: string; sha256: string; bytes: number };
  configuration: Config; observed: { delimiter: string; headers: string[]; rows: number; offsets: string[]; formats: string[] };
  inferences: { frequencySeconds: number | null; frequencySupport: number | null; expectedRecords: number | null; completenessPercent: number | null };
  temporal: { first: string | null; last: string | null; elapsedSeconds: number | null; coveredSeconds: number | null; validTimestamps: number; uniqueTimestamps: number; timezone: string };
  values: { valid: number; missing: number; min: number | null; max: number | null; mean: number | null; negative: number };
  energy: { totalKWh: number | null; observedSubtotalKWh: number | null; method: string; reason: string | null };
  findings: Finding[]; counts: Record<Severity, number>;
  rulesExecuted: string[]; rulesNotExecuted: { code: string; reason: string }[];
}
