import type { Report } from './types';

const escape = (value: unknown): string => String(value ?? 'No disponible').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const labels = { error: 'Error', warning: 'Aviso', info: 'Información' };
const measurements = { 'power-instant': 'Potencia instantánea (energía aproximada)', 'power-mean': 'Potencia media por intervalo', 'interval-energy': 'Energía por intervalo', counter: 'Contador acumulado' };
const table = (rows: [string, unknown][]) => `<table><tbody>${rows.map(([key, value]) => `<tr><th scope="row">${escape(key)}</th><td>${escape(value)}</td></tr>`).join('')}</tbody></table>`;

/** Static, self-contained presentation. Every report-derived value is escaped as text. */
export function portableReport(report: Report): string {
  const r = report, c = r.configuration, i = r.inferences;
  const column = (index: number) => `${index + 1}: ${r.observed.headers[index] ?? '(sin cabecera)'}`;
  const percent = (value: number | null) => value === null ? 'No determinable' : `${value} %`;
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Informe energético — ${escape(r.file.name)}</title>
<style>body{font:16px/1.55 system-ui,sans-serif;color:#183d36;background:#fff;max-width:960px;margin:auto;padding:24px}h1{line-height:1.2}h2{margin-top:2em;border-bottom:1px solid #bcc9bf}table{border-collapse:collapse;width:100%;margin:1em 0}th,td{text-align:left;vertical-align:top;border:1px solid #bcc9bf;padding:9px;overflow-wrap:anywhere}th{width:35%}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f2f5ef;padding:12px}article{border-left:4px solid #52785b;padding-left:16px;margin:24px 0}p,li,h1,h3{overflow-wrap:anywhere}.notice{background:#f2f5ef;padding:16px}@media print{body{max-width:none;padding:0;font-size:10pt}h2,h3{break-after:avoid}tr{break-inside:avoid}pre{background:none}}</style></head>
<body><main><h1>Informe de serie energética</h1><p>Energy Time-Series Linter · aplicación ${escape(r.appVersion)} · formato JSON ${escape(r.reportVersion)}</p>
<p class="notice">Informe local de ayuda, no certificación. No corrige el archivo original. Puede contener nombres, cabeceras y muestras sensibles: revísalo antes de compartir. El hash identifica bytes; no anonimiza ni acredita su origen.</p>
<p>Este archivo se abre sin conexión. Para imprimir o guardar como PDF, usa Imprimir en el navegador. Conserva el JSON para procesamiento automático y el CSV original para reproducir el análisis.</p>
<h2>Archivo y resumen</h2>${table([
  ['Archivo', r.file.name], ['SHA-256 del CSV original', r.file.sha256], ['Tamaño (bytes)', r.file.bytes], ['Registros de datos', r.observed.rows],
  ['Incidencias', `${r.counts.error} errores · ${r.counts.warning} avisos · ${r.counts.info} informaciones`],
  ['Primer timestamp (UTC)', r.temporal.first], ['Último timestamp (UTC)', r.temporal.last],
  ['Periodo de completitud', `${i.periodBasis === 'configured' ? 'Configurado' : 'Observado'}: ${i.periodStart ?? 'No disponible'} — ${i.periodEnd ?? 'No disponible'}`],
  ['Instantes presentes / esperados', `${i.presentRecords} / ${i.expectedRecords ?? 'No determinable'}`], ['Completitud temporal', percent(i.temporalCompletenessPercent)],
  ['Instantes utilizables', i.usableRecords], ['Completitud utilizable', percent(i.usableCompletenessPercent)], ['Motivo de completitud no determinable', i.reason ?? 'No aplica'],
  ['Valores interpretables', percent(r.quality.validValuePercent)], ['Repeticiones adicionales de timestamps', r.quality.duplicateRecords],
  ['Energía total (kWh)', r.energy.totalKWh ?? 'No determinable'], ['Subtotal observado (kWh; no sustituye el total)', r.energy.observedSubtotalKWh], ['Método energético', r.energy.method], ['Motivo energético', r.energy.reason ?? 'No aplica'],
])}<p>Los recuentos de incidencias no son filas únicas. La presencia temporal no garantiza valores válidos ni ausencia de duplicados. Los límites describen timestamps, no necesariamente los extremos de los intervalos. Un total de intervalos representa los registros disponibles; la potencia instantánea produce una aproximación.</p>
<h2>Configuración elegida</h2>${table([
  ['Fecha y hora (columna desde 1)', column(c.timestampColumn)], ['Hora separada', c.timeColumn == null ? 'No' : column(c.timeColumn)], ['Medición (columna desde 1)', column(c.valueColumn)],
  ['Tipo', measurements[c.measurement]], ['Unidad', c.unit], ['Orden de fecha', c.dateFormat ?? 'iso'], ['Zona IANA', c.timezone || 'Solo offsets explícitos'],
  ['Separador CSV', c.delimiter === '\t' ? 'Tabulador' : c.delimiter], ['Separador decimal', c.decimal], ['Duración de medición (min)', c.intervalMinutes], ['Posición del intervalo', c.intervalPosition === 'start' ? 'Inicio' : 'Fin'],
  ['Cadencia elegida (min)', c.cadenceMinutes ?? 'Inferida'], ['Cadencia de referencia (s)', i.referenceSeconds], ['Primer timestamp esperado', c.expectedStart], ['Último timestamp esperado', c.expectedEnd],
  ['Umbral alto', c.highValue], ['Horas constantes', c.constantHours], ['Factor de salto', c.jumpFactor],
])}
<h2>Hallazgos completos</h2><p>Los filtros de la aplicación no afectan a esta exportación. Hasta 50 muestras por regla. Las filas son registros CSV contando la cabecera como 1; no siempre coinciden con líneas de texto.</p>
${r.findings.length ? r.findings.map(f => `<article><h3>${escape(f.code)} · ${escape(labels[f.severity])} · ${escape(f.count)} incidencias</h3><p>${escape(f.description)}</p><p><strong>Qué hacer:</strong> ${escape(f.suggestion)}</p><p>${escape(f.technical)}</p><p>${f.samplesTruncated ? 'Muestras truncadas: no se muestran todas las incidencias.' : 'Muestras guardadas:'}</p>${f.samples.map(s => `<section><h4>Registros ${escape(s.rows.join(', '))}</h4><p>${escape(s.found)}</p><pre>${escape(JSON.stringify(s.cells, null, 2))}</pre></section>`).join('')}</article>`).join('') : '<p>Sin hallazgos en las reglas ejecutadas. No garantiza que los datos sean correctos.</p>'}
<h2>Cobertura y límites</h2><h3>Reglas ejecutadas</h3><p>${escape(r.rulesExecuted.join(', '))}</p><h3>Reglas no ejecutadas</h3>${r.rulesNotExecuted.length ? table(r.rulesNotExecuted.map(rule => [rule.code, rule.reason])) : '<p>Ninguna.</p>'}
<p>La interpretación depende de la configuración confirmada y de las reglas Intl/IANA del entorno. Este documento no contiene el CSV completo ni permite reconstruirlo. No es una prueba de conformidad con un estándar energético. La aplicación no importa este HTML. Los valores no disponibles se distinguen de cero.</p>
</main></body></html>\n`;
}
