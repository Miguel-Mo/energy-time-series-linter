import { Temporal } from '@js-temporal/polyfill';
import type { RuleCode } from './rules';
export interface ParsedTime { ms: number | null; offset: string | null; local: boolean; format: string; mismatch: boolean; issue?: RuleCode }
export function validZone(zone: string): boolean {
  try { Temporal.Instant.from('2024-01-01T00:00:00Z').toZonedDateTimeISO(zone); return true; } catch { return false; }
}
export function parseTime(raw: string, zone: string): ParsedTime {
  const v = raw.trim();
  const match = v.match(/^(\d{4}-\d{2}-\d{2})([Tt ])(\d{2}:\d{2})(:\d{2})?(\.\d{1,3})?([Zz]|[+-]\d{2}:\d{2})?$/);
  const base: ParsedTime = { ms: null, offset: null, local: !match?.[6], format: '', mismatch: false };
  if (!v) return { ...base, issue: 'TS_MISSING' };
  if (!match) return { ...base, issue: /\d/.test(v) ? 'TS_UNSUPPORTED' : 'TS_INVALID' };
  if ((match[5] && !match[4]) || match[4] === ':60' || match[6] === '-00:00') return { ...base, issue: 'TS_UNSUPPORTED' };
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
    const instant = Temporal.Instant.from(plain + match[6].toUpperCase());
    const offset = match[6].toUpperCase() === 'Z' ? '+00:00' : match[6];
    return { ...base, ms: instant.epochMilliseconds, offset, mismatch: !!zone && instant.toZonedDateTimeISO(zone).offset !== offset };
  } catch { return { ...base, issue: 'TS_INVALID' }; }
}
