import { parseNumber } from './csv';
import { RULES, type RuleCode } from './rules';
import { parseTime, parseRowTime, validZone } from './time';
import { APP_VERSION, type Config, type CsvData, type Finding, type Report } from './types';

export function validateConfig(c: Config, data: CsvData) {
  if (!['iso', 'dmy', 'mdy'].includes(c.dateFormat ?? 'iso')) throw new Error('Selecciona un formato de fecha.');
  if (c.timeColumn != null && (!Number.isInteger(c.timeColumn) || c.timeColumn < 0 || c.timeColumn >= data.headers.length || [c.timestampColumn, c.valueColumn].includes(c.timeColumn))) throw new Error('La columna de hora debe existir y ser distinta de fecha y valor.');
  for (const index of [c.timestampColumn, c.valueColumn]) {
    if (!Number.isInteger(index) || index < 0 || index >= Math.max(2, data.headers.length)) throw new Error('Selecciona columnas existentes.');
  }
  if (c.timestampColumn === c.valueColumn) throw new Error('Fecha y valor necesitan columnas distintas.');
  if (!['power-instant', 'power-mean', 'interval-energy', 'counter'].includes(c.measurement)) throw new Error('Selecciona el tipo de medición.');
  if (!['W', 'kW', 'MW', 'Wh', 'kWh', 'MWh'].includes(c.unit)) throw new Error('Selecciona la unidad.');
  if (!['.', ','].includes(c.decimal) || ![',', ';', '\t', '|'].includes(c.delimiter) || c.delimiter !== data.delimiter) throw new Error('Revisa las convenciones del CSV.');
  if (!['start', 'end'].includes(c.intervalPosition)) throw new Error('Selecciona inicio o fin de intervalo.');
  if (c.timezone && !validZone(c.timezone)) throw new Error('Zona horaria desconocida. Usa un identificador IANA, como Europe/Madrid.');
  if (c.intervalMinutes !== null && (!Number.isFinite(c.intervalMinutes) || c.intervalMinutes <= 0 || c.intervalMinutes > 525600)) throw new Error('La duración debe estar entre 0 y 525.600 minutos.');
  if (c.cadenceMinutes !== null && (!Number.isFinite(c.cadenceMinutes) || c.cadenceMinutes <= 0 || c.cadenceMinutes > 525600)) throw new Error('La cadencia debe estar entre 0 y 525.600 minutos.');
  if (!!c.expectedStart !== !!c.expectedEnd) throw new Error('Indica inicio y fin del periodo esperado.');
  if (c.expectedStart && c.expectedEnd) {
    const start = parseTime(c.expectedStart, c.timezone).ms, end = parseTime(c.expectedEnd, c.timezone).ms;
    if (start === null || end === null || end < start) throw new Error('El periodo esperado necesita fechas inequívocas y un fin igual o posterior al inicio.');
  }
  if (c.highValue !== null && (!Number.isFinite(c.highValue) || c.highValue <= 0)) throw new Error('El umbral debe ser positivo y finito.');
  if (!Number.isFinite(c.constantHours) || c.constantHours <= 0 || !Number.isFinite(c.jumpFactor) || c.jumpFactor <= 1) throw new Error('Revisa los umbrales de constantes y saltos.');
}

export function analyze(data: CsvData, c: Config, file: Report['file']): Report {
  validateConfig(c, data);
  const map = new Map<RuleCode, Finding>();
  const skipped = new Map<RuleCode, string>();
  const add = (code: RuleCode, rows: number[], found: unknown) => {
    let finding = map.get(code);
    if (!finding) { finding = { code, ...RULES[code], count: 0, samples: [], samplesTruncated: false }; map.set(code, finding); }
    finding.count++;
    if (finding.samples.length < 50) finding.samples.push({ rows, found: String(found).slice(0, 240), cells: rows.map(row => (row === 1 ? data.headers : data.rows[row - 2] ?? []).map(v => v.slice(0, 160))) });
    else finding.samplesTruncated = true;
  };
  const skip = (codes: RuleCode[], reason: string) => codes.forEach(code => skipped.set(code, reason));
  if (!data.rows.length) add('CSV_EMPTY', [], '0 registros');
  if (data.headers.length < 2) add('CSV_REQUIRED_COLUMNS', [1], data.headers.length);
  data.parseErrors.forEach(e => add('CSV_PARSE', [e.row], e.message));
  const names = new Set<string>();
  data.headers.forEach((h, i) => {
    if (!h.trim()) add('CSV_HEADER_EMPTY', [1], `columna ${i + 1}`);
    else if (names.has(h.trim())) add('CSV_HEADER_DUPLICATE', [1], h);
    names.add(h.trim());
  });
  add('CSV_DELIMITER', [1], data.delimiter === '\t' ? 'tabulador' : data.delimiter);
  add('CSV_DECIMAL', [], c.decimal);
  const power = c.measurement.startsWith('power');
  const interval = c.measurement === 'power-mean' || c.measurement === 'interval-energy';
  const unitOk = power ? ['W', 'kW', 'MW'].includes(c.unit) : ['Wh', 'kWh', 'MWh'].includes(c.unit);
  if (!unitOk) add('ENERGY_UNIT', [], `${c.measurement} / ${c.unit}`);
  const times = data.rows.map((row, i) => {
    if (row.length !== data.headers.length) add('CSV_COLUMN_COUNT', [i + 2], `${row.length} / ${data.headers.length}`);
    const parsed = parseRowTime(row, c);
    if (parsed.issue) add(parsed.issue, [i + 2], row[c.timestampColumn] ?? '');
    if (parsed.mismatch) add('TS_ZONE_MISMATCH', [i + 2], row[c.timestampColumn]);
    return parsed;
  });
  const values = data.rows.map((row, i) => {
    const parsed = parseNumber(row[c.valueColumn] ?? '', c.decimal);
    if (parsed.issue) add(parsed.issue, [i + 2], row[c.valueColumn] ?? '');
    if (parsed.value !== null && parsed.value < 0) add('VALUE_NEGATIVE', [i + 2], parsed.value);
    if (parsed.value !== null && c.highValue !== null && Math.abs(parsed.value) > c.highValue) add('VALUE_HIGH', [i + 2], parsed.value);
    return parsed.value;
  });
  if (c.highValue === null) skip(['VALUE_HIGH'], 'No se ha configurado un límite de magnitud.');
  const formats = [...new Set(times.map(t => t.format).filter(Boolean))].sort();
  if (formats.length > 1) add('TS_MIXED_FORMAT', [], formats.join('; '));
  const recognized = times.filter(t => t.format);
  if (recognized.some(t => t.local) && recognized.some(t => !t.local)) add('TS_MIXED_ZONE', [], 'fechas locales y con offset');
  const offsets = [...new Set(times.map(t => t.offset).filter((o): o is string => o !== null))].sort();
  if (offsets.length > 1 && (!c.timezone || times.some(t => t.mismatch))) add('TS_OFFSET_CHANGE', [], offsets.join(', '));
  if (!c.timezone) skip(['TS_ZONE_MISMATCH'], 'No se ha seleccionado una zona IANA para contrastar offsets.');
  const seen = new Map<number, number>();
  let previous: { ms: number; row: number } | null = null;
  times.forEach((t, i) => {
    if (t.ms === null) return;
    if (seen.has(t.ms)) add('TS_DUPLICATE_TIMESTAMP', [seen.get(t.ms)!, i + 2], data.rows[i][c.timestampColumn]);
    else seen.set(t.ms, i + 2);
    if (previous && t.ms < previous.ms) add('TS_OUT_OF_ORDER', [previous.row, i + 2], data.rows[i][c.timestampColumn]);
    previous = { ms: t.ms, row: i + 2 };
  });
  const sorted = [...seen.keys()].sort((a, b) => a - b);
  const deltas = sorted.slice(1).map((t, i) => t - sorted[i]);
  const frequencies = new Map<number, number>();
  deltas.forEach(d => frequencies.set(d, (frequencies.get(d) ?? 0) + 1));
  const ranked = [...frequencies].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const support = ranked.length ? ranked[0][1] / deltas.length : null;
  const mode = deltas.length >= 2 && support !== null && support > 0.5 ? ranked[0][0] : null;
  const reference = c.cadenceMinutes !== null ? c.cadenceMinutes * 60000 : mode;
  add('TS_FREQUENCY', [], mode === null ? 'no determinable' : `${mode / 1000} s; soporte ${(support! * 100).toFixed(1)}%`);
  if (reference !== null) {
    deltas.forEach((d, i) => {
      const rows = [seen.get(sorted[i])!, seen.get(sorted[i + 1])!];
      if (d > reference * 1.01) add('TS_GAP', rows, `${d / 1000} s; referencia ${reference / 1000} s`);
      if (Math.abs(d - reference) > reference * 0.01) add('TS_IRREGULAR', rows, `${d / 1000} s`);
    });
  } else {
    skip(['TS_GAP'], 'No hay cadencia elegida ni frecuencia predominante fiable.');
    if (frequencies.size > 1) add('TS_IRREGULAR', [], `${frequencies.size} separaciones distintas; sin moda predominante`);
  }
  if (interval && c.intervalMinutes !== null) {
    // Use adjacent sorted records including duplicates so zero-distance intervals are reported too.
    const intervals = times.map((t, i) => ({ ms: t.ms, row: i + 2 })).filter((t): t is { ms: number; row: number } => t.ms !== null).sort((a, b) => a.ms - b.ms || a.row - b.row);
    for (let i = 1; i < intervals.length; i++) if (intervals[i].ms - intervals[i - 1].ms < c.intervalMinutes * 60000) add('TS_OVERLAP', [intervals[i - 1].row, intervals[i].row], `duración ${c.intervalMinutes} min`);
  } else skip(['TS_OVERLAP'], 'Se requiere energía por intervalo o potencia media y duración explícita.');

  let constantStart = 0;
  const finishConstant = (end: number) => {
    const startMs = times[constantStart]?.ms; const endMs = times[end]?.ms;
    if (end > constantStart && startMs != null && endMs != null && endMs - startMs >= c.constantHours * 3600000) add('VALUE_CONSTANT', [constantStart + 2, end + 2], `${values[end]} durante ${(endMs - startMs) / 3600000} h`);
  };
  for (let i = 1; i < values.length; i++) {
    const a = values[i - 1], b = values[i];
    const ta = times[i - 1].ms, tb = times[i].ms;
    const contiguous = ta !== null && tb !== null && tb > ta && reference !== null && Math.abs(tb - ta - reference) <= reference * 0.01;
    if (a !== null && b !== null) {
      if (a !== 0 && b !== 0) {
        const ratio = Math.max(Math.abs(a), Math.abs(b)) / Math.min(Math.abs(a), Math.abs(b));
        if (ratio >= c.jumpFactor) add('VALUE_JUMP', [i + 1, i + 2], `${a} → ${b}`);
        if (ratio >= 800 && ratio <= 1200) add('VALUE_UNIT_SHIFT', [i + 1, i + 2], `${a} → ${b}`);
      }
      if (c.measurement === 'counter' && b < a && ta !== null && tb !== null && tb > ta) add('COUNTER_DECREASE', [i + 1, i + 2], `${a} → ${b}`);
    }
    if (a === null || b !== a || !contiguous) { finishConstant(i - 1); constantStart = i; }
  }
  finishConstant(values.length - 1);
  if (reference === null) skip(['VALUE_CONSTANT'], 'No hay cadencia de referencia para medir una secuencia continua.');
  if (c.measurement !== 'counter') skip(['COUNTER_DECREASE'], 'La medición no es un contador acumulado.');

  const valid = values.filter((v): v is number => v !== null);
  const first = sorted[0] ?? null, last = sorted.at(-1) ?? null;
  const elapsed = first !== null && last !== null ? (last - first) / 1000 : null;
  // Expected bounds refer to timestamps, inclusively. They never crop or rewrite the source series.
  const periodStart = c.expectedStart ? parseTime(c.expectedStart, c.timezone).ms : first;
  const periodEnd = c.expectedEnd ? parseTime(c.expectedEnd, c.timezone).ms : last;
  const onGrid = (t: number) => reference !== null && periodStart !== null && Math.abs((t - periodStart) / reference - Math.round((t - periodStart) / reference)) < 1e-6;
  const inside = (t: number) => periodStart !== null && periodEnd !== null && t >= periodStart && t <= periodEnd;
  const present = sorted.filter(inside);
  const grid = periodEnd !== null && onGrid(periodEnd) && times.every(t => t.ms !== null) && present.every(onGrid);
  const count = grid ? Math.round((periodEnd! - periodStart!) / reference!) + 1 : null;
  const expected = count !== null && Number.isSafeInteger(count) && count > 0 ? count : null;
  const complete = new Set(times.filter((t, i) => t.ms !== null && inside(t.ms) && values[i] !== null && data.rows[i].length === data.headers.length).map(t => t.ms)).size;
  const outside = times.filter(t => t.ms !== null && !inside(t.ms)).length;
  const boundaryMissing = expected === null ? null : present.length === 0 ? expected : Math.round((present[0] - periodStart!) / reference!) + Math.round((periodEnd! - present.at(-1)!) / reference!);
  if (c.expectedStart) {
    if (boundaryMissing) add('TS_EXPECTED_BOUNDARY_GAP', [], `${boundaryMissing} posiciones ausentes en los extremos del periodo elegido`);
    if (outside) add('TS_OUTSIDE_EXPECTED_PERIOD', [], `${outside} registros fuera del periodo elegido; se conservan en el análisis energético`);
    if (expected === null) skip(['TS_EXPECTED_BOUNDARY_GAP'], 'No se puede determinar una rejilla temporal para el periodo elegido.');
  } else skip(['TS_EXPECTED_BOUNDARY_GAP', 'TS_OUTSIDE_EXPECTED_PERIOD'], 'No se ha elegido un periodo esperado.');
  const completenessReason = expected !== null ? null : reference === null ? 'Falta una cadencia de referencia fiable.' : times.some(t => t.ms === null) ? 'Hay fechas sin resolver.' : 'El periodo o los registros no forman una rejilla temporal exacta y representable.';
  const scale = c.unit.startsWith('M') ? 1000 : c.unit.startsWith('k') ? 1 : 0.001;
  let reason: string | null = null;
  let total: number | null = null, subtotal: number | null = null;
  let method = '';
  const hasErrors = [...map.values()].some(f => f.severity === 'error');
  if (hasErrors || !data.rows.length || times.some(t => t.ms === null) || valid.length !== data.rows.length) reason = `No se calcula energía: ${[...map.values()].filter(f => f.severity === 'error' || ['TS_ZONE_REQUIRED', 'TS_LOCAL_AMBIGUOUS', 'TS_UNSUPPORTED'].includes(f.code)).map(f => f.description).join(' ')}`;
  else if (map.has('TS_OUT_OF_ORDER')) reason = 'Los registros están fuera de orden.';
  else if (map.has('TS_ZONE_MISMATCH')) reason = 'El offset y la zona seleccionada no coinciden.';
  else if (map.has('VALUE_UNIT_SHIFT')) reason = 'Revisa el posible cambio de unidad antes de interpretar un total.';
  if (c.measurement === 'power-instant') {
    method = 'Integral trapezoidal: Σ ((Pᵢ + Pᵢ₊₁) / 2) × Δt en horas, convertida a kWh. Solo entre primera y última muestra.';
    if (!reason && (times.length < 2 || reference === null || map.has('TS_GAP') || map.has('TS_IRREGULAR'))) reason = 'Se necesitan al menos dos muestras, una cadencia de referencia y una serie regular sin huecos.';
    if (!reason) {
      total = 0;
      for (let i = 1; i < values.length; i++) total += (values[i - 1]! / 2 + values[i]! / 2) * scale * ((times[i].ms! - times[i - 1].ms!) / 3600000);
      add('ENERGY_ESTIMATE', [2, data.rows.length + 1], `${total} kWh`);
    }
  } else if (interval) {
    method = c.measurement === 'power-mean' ? 'Σ potencia media × duración explícita en horas; conversión a kWh. Incluye todos los intervalos declarados.' : 'Σ energía de los intervalos declarados, convertida a kWh.';
    if (!reason && c.intervalMinutes === null) reason = 'Declara la duración de los intervalos para comprobar solapamientos y cobertura.';
    if (!reason && map.has('TS_OVERLAP')) reason = 'Los intervalos declarados se solapan.';
    if (!reason) total = valid.reduce((s, v) => s + v * scale * (power ? c.intervalMinutes! / 60 : 1), 0);
  } else {
    method = 'Σ diferencias consecutivas del contador, convertidas a kWh; un retroceso impide determinar el total. El subtotal suma solo diferencias no negativas.';
    if (!reason && times.length < 2) reason = 'Un contador necesita al menos dos lecturas.';
    if (!reason) {
      subtotal = 0;
      for (let i = 1; i < values.length; i++) subtotal += Math.max(0, values[i]! - values[i - 1]!) * scale;
      if (map.has('COUNTER_DECREASE')) reason = 'Hay un retroceso o reinicio; la energía del tramo afectado es desconocida.';
      else total = subtotal;
    }
  }
  if (total !== null && !Number.isFinite(total)) { total = null; reason = 'El cálculo excede el rango numérico finito.'; }
  if (subtotal !== null && !Number.isFinite(subtotal)) subtotal = null;
  if (reason) add('ENERGY_UNDETERMINED', [], reason);
  if (c.measurement !== 'power-instant' || total === null) skip(['ENERGY_ESTIMATE'], 'No se ha integrado potencia instantánea.');
  let covered: number | null = null;
  if (interval && c.intervalMinutes !== null && times.every(t => t.ms !== null) && sorted.length) {
    const duration = c.intervalMinutes * 60;
    covered = duration + deltas.reduce((s, d) => s + Math.min(duration, d / 1000), 0);
  } else if (c.measurement === 'counter' && times.every(t => t.ms !== null)) covered = elapsed;
  else if (c.measurement === 'power-instant' && !map.has('TS_GAP') && !map.has('TS_IRREGULAR') && times.every(t => t.ms !== null) && reference !== null) covered = elapsed;
  const findings = [...map.values()].sort((a, b) => a.code.localeCompare(b.code, 'en'));
  return {
    reportVersion: '2.0.0', appVersion: APP_VERSION, file, configuration: { ...c },
    observed: { delimiter: data.delimiter, headers: data.headers, rows: data.rows.length, offsets, formats },
    inferences: { frequencySeconds: mode === null ? null : mode / 1000, frequencySupport: support, referenceSeconds: reference === null ? null : reference / 1000, expectedRecords: expected, temporalCompletenessPercent: expected ? Math.min(100, 100 * present.length / expected) : null, usableCompletenessPercent: expected ? Math.min(100, 100 * complete / expected) : null, periodBasis: c.expectedStart ? 'configured' : 'observed', periodStart: periodStart === null ? null : new Date(periodStart).toISOString(), periodEnd: periodEnd === null ? null : new Date(periodEnd).toISOString(), presentRecords: present.length, usableRecords: complete, missingBoundaryRecords: boundaryMissing, reason: completenessReason },
    quality: { validValuePercent: values.length ? valid.length * 100 / values.length : null, duplicateRecords: times.filter(t => t.ms !== null).length - sorted.length, outsidePeriodRecords: outside },
    temporal: { first: first === null ? null : new Date(first).toISOString(), last: last === null ? null : new Date(last).toISOString(), elapsedSeconds: elapsed, coveredSeconds: covered, validTimestamps: times.filter(t => t.ms !== null).length, uniqueTimestamps: sorted.length, timezone: c.timezone || 'Offsets explícitos del archivo' },
    values: { valid: valid.length, missing: values.length - valid.length, min: valid.length ? valid.reduce((a, b) => Math.min(a, b)) : null, max: valid.length ? valid.reduce((a, b) => Math.max(a, b)) : null, mean: valid.length ? valid.reduce((s, v) => s + v / valid.length, 0) : null, negative: valid.filter(v => v < 0).length },
    energy: { totalKWh: total, observedSubtotalKWh: subtotal, method, reason }, findings,
    counts: { error: findings.filter(f => f.severity === 'error').reduce((s, f) => s + f.count, 0), warning: findings.filter(f => f.severity === 'warning').reduce((s, f) => s + f.count, 0), info: findings.filter(f => f.severity === 'info').reduce((s, f) => s + f.count, 0) },
    rulesExecuted: (Object.keys(RULES) as RuleCode[]).filter(code => !skipped.has(code)), rulesNotExecuted: [...skipped].map(([code, reason]) => ({ code, reason })),
  };
}

export function serializeReport(report: Report) { return JSON.stringify(report, null, 2) + '\n'; }
