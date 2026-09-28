import { Temporal } from '@js-temporal/polyfill';
import type { RuleCode } from './rules';
import type { Config } from './types';
export function parseRowTime(row: string[], config: Config): ParsedTime {
  const date = (row[config.timestampColumn] ?? '').trim();
  const time = config.timeColumn == null ? null : (row[config.timeColumn] ?? '').trim();
  if (!date || time === '') return { ms: null, offset: null, local: true, format: '', mismatch: false, issue: 'TS_MISSING' };
  let text = time === null ? date : `${date}T${time}`;
  const format = config.dateFormat ?? 'iso';
  if (format !== 'iso') {
    const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})([Tt ].+)$/);
    if (!match) return { ms: null, offset: null, local: true, format, mismatch: false, issue: 'TS_UNSUPPORTED' };
    const day = format === 'dmy' ? match[1] : match[2];
    const month = format === 'dmy' ? match[2] : match[1];
    text = `${match[3]}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${match[4]}`;
  }
  const parsed = parseTime(text, config.timezone);
  return { ...parsed, format: `${format === 'iso' ? '' : format + ' / '}${parsed.format}` };
}
export interface ParsedTime { ms: number | null; offset: string | null; local: boolean; format: string; mismatch: boolean; issue?: RuleCode }
export function validZone(zone: string): boolean {
  try { Temporal.Instant.from('2024-01-01T00:00:00Z').toZonedDateTimeISO(zone); return true; } catch { return false; }
}
export function parseTime(raw: string, zone: string): ParsedTime {
  const v = raw.trim();
  const match = v.match(/^(\d{4}-\d{2}-\d{2})([Tt ])(\d{2}:\d{2})(:\d{2})?(\.\d{1,3})?([Zz]|[+-]\d{2}:?\d{2})?$/);
  const base: ParsedTime = { ms: null, offset: null, local: !match?.[6], format: '', mismatch: false };
  if (!v) return { ...base, issue: 'TS_MISSING' };
  if (!match) return { ...base, issue: /\d/.test(v) ? 'TS_UNSUPPORTED' : 'TS_INVALID' };
  if ((match[5] && !match[4]) || match[4] === ':60' || ['-00:00', '-0000'].includes(match[6])) return { ...base, issue: 'TS_UNSUPPORTED' };
  base.format = `${match[2].toUpperCase() === 'T' ? 'T' : 'space'} / ${match[5] ? 'fraction' : match[4] ? 'seconds' : 'minutes'} / ${match[6] ? 'offset' : 'local'}`;
  const plain = `${match[1]}T${match[3]}${match[4] ?? ':00'}${match[5] ?? ''}`;
  try { Temporal.PlainDateTime.from(plain, { overflow: 'reject' }); } catch { return { ...base, issue: 'TS_INVALID' }; }
  if (!match[6]) {
    if (!zone) return { ...base, issue: 'TS_ZONE_REQUIRED' };
    try {
      const zdt = Temporal.PlainDateTime.from(plain).toZonedDateTime(zone, { disambiguation: 'reject' });
      return { ...base, ms: zdt.epochMilliseconds, offset: zdt.offset };
    } catch { return { ...base, issue: 'TS_LOCAL_AMBIGUOUS' }; }
  }
  try {
    const explicit = match[6].replace(/^([+-]\d{2})(\d{2})$/, '$1:$2').toUpperCase();
    const instant = Temporal.Instant.from(plain + explicit);
    const offset = explicit === 'Z' ? '+00:00' : explicit;
    return { ...base, ms: instant.epochMilliseconds, offset, mismatch: !!zone && instant.toZonedDateTimeISO(zone).offset !== offset };
  } catch { return { ...base, issue: 'TS_INVALID' }; }
}
