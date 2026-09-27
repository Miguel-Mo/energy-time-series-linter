import AnalyzerWorker from './worker?worker&inline';
import { EXAMPLES } from './examples';
import { serializeReport } from './analyze';
import { APP_VERSION, MAX_BYTES, type Config, type Detection, type Report, type Finding } from './types';
import './style.css';
import { initializeForm, syncGuidance, setLocalColumns, collectConfig, checkForm, clearErrors } from './configuration';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <a class="skip-link" href="#main">Saltar al contenido</a>
  <header class="topbar"><a class="brand" href="#"><span class="brand-mark" aria-hidden="true">∿</span> Energy tools <span class="brand-divider">/</span> <span class="brand-sub">Time-Series Linter</span></a><span class="local-tag"><span aria-hidden="true">●</span> LOCAL & PRIVADO</span></header>
  <main id="main" tabindex="-1">
    <section class="intro"><p class="eyebrow">DATOS ENERGÉTICOS · CÓDIGO ABIERTO</p><h1>Conoce tus datos.<br><span>Antes de importarlos.</span></h1><p class="lede">Revisa fechas, intervalos y valores de tu CSV. Entiende qué necesita atención antes de importarlo en otra herramienta.</p><p class="privacy"><span aria-hidden="true">◈</span> Your file is processed locally and is not uploaded.</p></section>
    <nav class="steps" aria-label="Pasos del análisis"><span id="step1" class="active"><b>01</b> Cargar CSV</span><span id="step2"><b>02</b> Revisar configuración</span><span id="step3"><b>03</b> Explorar informe</span></nav>
    <section class="panel upload-panel" aria-labelledby="upload-title"><div><p class="eyebrow">01 / ARCHIVO</p><h2 id="upload-title">Una serie. Una revisión clara.</h2><p>Un CSV con una columna temporal y una medición energética.</p><p class="muted">UTF-8 · Hasta 10 MiB · 100.000 registros · 100 columnas</p></div><div class="upload-actions"><label class="file-button" for="file">↑ &nbsp; Seleccionar CSV</label><input id="file" type="file" accept=".csv,text/csv" aria-label="Seleccionar CSV"/><div class="demo-row"><select id="demo" aria-label="Archivo de ejemplo"></select><button id="load-demo" class="quiet">Probar ejemplo</button></div></div></section>
    <div class="status-line"><p id="status" role="status" aria-live="polite">Preparando el analizador local…</p><button id="cancel" class="quiet" hidden>Cancelar</button></div>
    <section id="setup" hidden aria-labelledby="setup-title"><div class="section-heading"><div><p class="eyebrow">02 / CONFIGURACIÓN</p><h2 id="setup-title">Pon los datos en contexto.</h2></div><span id="file-badge" class="file-badge"></span></div>
      <div class="workspace"><div class="panel preview-panel"><div class="panel-title"><h3>Vista previa</h3><span>Primeros 8 registros</span></div><div id="preview" class="table-wrap"></div><p class="table-note">Se conserva el orden original. Los números de fila son registros CSV, incluida la cabecera.</p><div class="principle"><span aria-hidden="true">↳</span><p>Tu archivo permanece intacto.<br><span>No rellenamos huecos ni corregimos datos.</span></p></div></div>
      <form id="config" class="panel config-panel" novalidate><h3>Revisa las opciones sugeridas</h3><p class="muted small">La cabecera puede sugerir la unidad. El significado de la medición debes confirmarlo tú.</p><div id="form-errors" class="error-summary" tabindex="-1" hidden></div><div class="form-grid">
        <label>Columna de fecha y hora<select id="timestamp" required></select></label><label>Columna de valores<select id="value" required></select></label>
        <label>Tipo de medición<select id="measurement" required><option value="">Selecciona el tipo…</option><option value="power-instant">Potencia instantánea</option><option value="power-mean">Potencia media por intervalo</option><option value="interval-energy">Energía por intervalo</option><option value="counter">Contador acumulado</option></select></label>
        <label>Unidad<select id="unit" aria-label="Unidad" required><option value="">Selecciona…</option><option>W</option><option>kW</option><option>MW</option><option>Wh</option><option>kWh</option><option>MWh</option></select></label>
        <p id="measurement-help" class="wide guidance" aria-live="polite"></p>
        <label>Separador CSV<select id="delimiter"><option value=",">Coma (,)</option><option value=";">Punto y coma (;)</option><option value="tab">Tabulador</option><option value="|">Barra vertical (|)</option></select></label>
        <label>Separador decimal<select id="decimal" required><option value="">Confirma…</option><option value=".">Punto (1.5)</option><option value=",">Coma (1,5)</option></select></label>
        <label class="wide">Zona horaria del equipo <input id="timezone" list="zones" placeholder="Europe/Madrid" autocomplete="off"/><datalist id="zones"><option value="Europe/Madrid"><option value="UTC"><option value="Europe/London"><option value="America/Mexico_City"><option value="America/Bogota"><option value="America/Santiago"></datalist><span id="timezone-help" class="hint"></span></label>
        <label>Duración de cada medición (min)<input id="interval" type="number" min="0.000001" max="525600" step="any" placeholder="Por ejemplo, 15"/><span class="hint">Cuánto tiempo abarca cada media de potencia o energía. No es la frecuencia de muestreo.</span></label>
        <label>Timestamp del intervalo<select id="position"><option value="start">Inicio del intervalo</option><option value="end">Fin del intervalo</option></select><span class="hint">Solo aplica a mediciones por intervalo.</span></label>
        <label class="wide">Cadencia esperada (min)<input id="cadence" type="number" min="0.000001" max="525600" step="any" placeholder="Inferir del archivo"/><span class="hint">Tiempo esperado entre timestamps consecutivos. Opcional; déjalo vacío si no lo conoces.</span></label>
      </div><details id="expected-period"><summary>Periodo esperado · opcional</summary><p class="small">Detecta también ausencias en los extremos. Indica el primer y último timestamp esperados, ambos incluidos; no los límites externos de los intervalos. Esta opción no recorta el archivo ni cambia la energía calculada.</p><div class="form-grid"><label class="wide">Primer timestamp esperado<input id="expected-start" type="text" placeholder="2024-01-01T00:00:00Z"/><span class="hint">Fecha ISO con offset, o fecha local con la zona del equipo seleccionada.</span></label><label class="wide">Último timestamp esperado<input id="expected-end" type="text" placeholder="2024-01-01T23:45:00Z"/><span class="hint">Ambos límites deben pertenecer a la misma rejilla de cadencia.</span></label></div></details>
      <details><summary>Umbrales de advertencia</summary><div class="form-grid advanced"><label>Magnitud máxima (unidad elegida)<input id="high" type="number" min="0.000001" step="any" placeholder="Desactivado"/></label><label>Valor constante durante (h)<input id="constant" type="number" min="0.000001" step="any" value="24" required/></label><label>Salto relativo (factor)<input id="jump" type="number" min="1.000001" step="any" value="10" required/></label></div></details>
      <label class="confirmation"><input id="confirm" type="checkbox" required/><span>He revisado las columnas, la unidad y la interpretación temporal.</span></label><button id="analyze" type="submit" class="primary">Analizar archivo <span aria-hidden="true">→</span></button></form></div>
    </section>
    <section id="results" hidden aria-labelledby="results-title"><div class="section-heading"><div><p class="eyebrow">03 / INFORME</p><h2 id="results-title" tabindex="-1">Una visión de tu serie.</h2></div><button id="download" class="primary">↓ &nbsp; Descargar JSON</button></div>
      <div id="summary" class="summary-grid"></div><p id="completeness-explanation" class="guidance"></p><div class="panel energy-panel"><div><p class="eyebrow">ENERGÍA</p><h3 id="energy-total"></h3><p id="energy-explanation"></p></div><span class="estimate-tag">CÁLCULO EXPLICADO</span></div>
      <div class="panel findings-panel"><div class="panel-title findings-heading"><div><h3>Hallazgos</h3><p class="muted small">Selecciona uno para ver la causa y los registros afectados.</p></div><label class="filter-label">Severidad<select id="severity"><option value="all">Todas</option><option value="error">Errores</option><option value="warning">Advertencias</option><option value="info">Información</option></select></label></div><div id="findings"></div><div id="detail" hidden></div></div>
      <details class="panel audit"><summary>Reglas ejecutadas y límites del informe</summary><p id="audit"></p><p>Hasta 50 ejemplos por regla; los recuentos incluyen todos los hallazgos. Las celdas de muestra se recortan a 160 caracteres. No se exporta CSV ni se ejecuta el contenido de sus celdas.</p></details>
    </section>
    <footer><span>Energy Time-Series Linter <b>v${APP_VERSION}</b></span><span>Herramienta independiente. Este informe no es una certificación.</span><span>Sin cuentas. Sin almacenamiento. Sin subidas.</span></footer>
  </main>`;
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const input = (id: string) => el<HTMLInputElement>(id);
const select = (id: string) => el<HTMLSelectElement>(id);
const status = (message: string) => { el('status').textContent = message; };
let worker: Worker;
let report: Report | null = null;
let headers: string[] = [];
let busy = false;
let watchdog: ReturnType<typeof setTimeout> | undefined;
const scrollBehavior = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' as const : 'smooth' as const;
const labels = { error: 'Error', warning: 'Advertencia', info: 'Información' };
const measurementLabels = { 'power-instant': 'Potencia instantánea', 'power-mean': 'Potencia media', 'interval-energy': 'Energía por intervalo', counter: 'Contador acumulado' };
function setBusy(value: boolean) {
  busy = value; el('cancel').hidden = !value;
  el('config').setAttribute('aria-busy', String(value));
  input('file').disabled = value;
  el<HTMLButtonElement>('load-demo').disabled = value;
  el<HTMLButtonElement>('analyze').disabled = value;
  el('config').querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach(e => { e.disabled = value; });
  if (watchdog) clearTimeout(watchdog);
  if (value) watchdog = setTimeout(() => cancel('El análisis excedió 60 segundos. Reduce el archivo o revisa su estructura.'), 60_000);
}
function clearReport() { report = null; el('results').hidden = true; el('step3').classList.remove('active'); }
function startWorker(silent = false) {
  worker = new AnalyzerWorker();
  worker.onmessage = ({ data }) => {
    if (data.type === 'ready') { if (!busy && !silent) status('Listo. El analizador funciona sin conexión una vez cargada esta página.'); return; }
    setBusy(false);
    if (data.type === 'error') { status(data.message); return; }
    if (data.type === 'loaded') {
      clearReport(); headers = data.headers;
      el('setup').hidden = false; el('step2').classList.add('active');
      el('file-badge').textContent = `${data.file.name} · ${data.rows.toLocaleString('es')} registros`;
      const detection = data.detection as Detection;
      for (const id of ['timestamp', 'value']) {
        select(id).replaceChildren(...headers.map((h, i) => new Option(`${i + 1}. ${h.slice(0, 80) || '(sin nombre)'}`, String(i))));
        if (!headers.length) select(id).append(new Option('(archivo sin columnas)', id === 'timestamp' ? '0' : '1'));
        else if (headers.length === 1 && id === 'value') select(id).append(new Option('(falta columna de valores)', '1'));
      }
      select('timestamp').value = String(detection.timestampColumn); select('value').value = String(detection.valueColumn);
      select('unit').value = detection.unit ?? ''; select('measurement').value = detection.measurement ?? '';
      select('decimal').value = detection.decimal ?? ''; select('delimiter').value = detection.delimiter === '\t' ? 'tab' : detection.delimiter;
      input('confirm').checked = false;
      clearErrors(); setLocalColumns(data.localColumns);
      el('preview').replaceChildren(makeTable(headers, data.preview.map((cells: string[], i: number) => ({ row: i + 2, cells }))));
      status(`Archivo leído localmente. ${data.rows} registros. Revisa y confirma la configuración.`);
    } else if (data.type === 'report') {
      report = data.report; renderReport(report!); status('Análisis terminado. El archivo original no se ha modificado.');
      el('results-title').focus({ preventScroll: true }); el('results').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    }
  };
  worker.onerror = () => { setBusy(false); clearReport(); status('El analizador no pudo continuar. Vuelve a cargar el archivo.'); el('setup').hidden = true; worker.terminate(); };
}
function cancel(message = 'Análisis cancelado. Puedes cargar otro archivo.') {
  worker.terminate(); setBusy(false); clearReport(); el('setup').hidden = true; input('file').value = ''; startWorker(true); status(message);
}
function load(file: File) {
  if (busy) return;
  clearReport(); el('setup').hidden = true;
  if (file.size > MAX_BYTES) { status('El límite del MVP es 10 MiB. Selecciona un archivo más pequeño.'); return; }
  // A fresh inline worker also discards all previous file data without storage or a network request.
  worker.terminate(); startWorker(true);
  input('timezone').value = ''; input('interval').value = ''; input('high').value = ''; select('position').value = 'start';
  for (const id of ['cadence', 'expected-start', 'expected-end']) input(id).value = '';
  clearErrors();
  setBusy(true); status('Leyendo CSV y calculando su hash SHA-256 local…'); worker.postMessage({ type: 'load', file });
}
function makeTable(names: string[], rows: { row: number; cells: string[] }[]) {
  const table = document.createElement('table'); const head = table.createTHead().insertRow();
  for (const name of ['Fila', ...names]) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = name.slice(0, 160); head.append(th); }
  const body = table.createTBody();
  rows.forEach(row => { const tr = body.insertRow(); [String(row.row), ...row.cells].forEach(value => { const td = tr.insertCell(); td.textContent = value.slice(0, 160); }); });
  return table;
}
const number = (n: number | null, suffix = '') => n === null ? 'No determinable' : `${new Intl.NumberFormat('es', { maximumFractionDigits: 4 }).format(n)}${suffix}`;
function renderReport(r: Report) {
  el('results').hidden = false; el('step3').classList.add('active');
  const cards = [
    ['Registros', number(r.observed.rows), `${r.temporal.uniqueTimestamps} instantes únicos`],
    ['Frecuencia predominante', number(r.inferences.frequencySeconds === null ? null : r.inferences.frequencySeconds / 60, ' min'), 'Inferida de los timestamps'],
    ['Completitud temporal', number(r.inferences.temporalCompletenessPercent, ' %'), `${r.inferences.presentRecords} instantes presentes / ${number(r.inferences.expectedRecords)} esperados`],
    ['Valores interpretables', number(r.quality.validValuePercent, ' %'), `${r.values.valid} números válidos / ${r.observed.rows} registros; no acredita precisión física`],
    ['Registros duplicados', number(r.quality.duplicateRecords), 'Repeticiones adicionales de un instante; no aumentan la completitud'],
    ['Hallazgos', `${r.counts.error} errores · ${r.counts.warning} advertencias`, `${r.counts.info} informaciones · Recuentos por regla, pueden coincidir`],
    ['Periodo observado (UTC)', r.temporal.first?.replace('T', ' ').replace('.000Z', ' UTC') ?? 'No determinable', `Hasta ${r.temporal.last?.replace('T', ' ').replace('.000Z', ' UTC') ?? 'no determinable'}`],
    ['Medición', `${measurementLabels[r.configuration.measurement]} · ${r.configuration.unit}`, r.temporal.timezone],
    ['Duración', number(r.temporal.elapsedSeconds === null ? null : r.temporal.elapsedSeconds / 3600, ' h'), `Cobertura: ${number(r.temporal.coveredSeconds === null ? null : r.temporal.coveredSeconds / 3600, ' h')}`],
  ];
  el('summary').replaceChildren(...cards.map(([title, value, note]) => {
    const card = document.createElement('article'); card.className = 'metric';
    const label = document.createElement('p'); label.textContent = title;
    const strong = document.createElement('strong'); strong.textContent = value;
    const small = document.createElement('span'); small.textContent = note; card.append(label, strong, small); return card;
  }));
  const inf = r.inferences;
  el('completeness-explanation').textContent = `${inf.periodBasis === 'configured' ? 'Periodo esperado elegido' : 'Periodo observado entre el primer y último timestamp'}: ${inf.periodStart ?? 'no determinable'} → ${inf.periodEnd ?? 'no determinable'}. Cadencia de referencia: ${number(inf.referenceSeconds === null ? null : inf.referenceSeconds / 60, ' min')}. ${inf.reason ?? `Instantes con valor utilizable: ${inf.usableRecords} / ${inf.expectedRecords} (${number(inf.usableCompletenessPercent, ' %')}).`} ${inf.periodBasis === 'observed' ? 'No se evalúan ausencias anteriores o posteriores al archivo.' : `Ausencias en los extremos: ${number(inf.missingBoundaryRecords)}. Registros fuera del periodo: ${r.quality.outsidePeriodRecords}.`} Completitud temporal y calidad de los datos son medidas distintas.`;
  el('energy-total').textContent = r.energy.totalKWh === null ? 'No determinable' : `${number(r.energy.totalKWh)} kWh${r.configuration.measurement === 'power-instant' ? ' · aproximada' : ' · registros disponibles'}`;
  el('energy-explanation').textContent = `${r.energy.reason ? r.energy.reason + ' ' : ''}${r.energy.method}${r.energy.observedSubtotalKWh !== null && r.energy.totalKWh === null ? ` Subtotal de tramos no negativos: ${number(r.energy.observedSubtotalKWh)} kWh; no es un total.` : ''}${r.configuration.measurement === 'interval-energy' || r.configuration.measurement === 'power-mean' ? ' Los huecos no se rellenan ni se incluyen en el total de registros disponibles.' : ''}`;
  if (r.configuration.expectedStart) el('energy-explanation').textContent += ' El periodo esperado solo evalúa completitud: la energía sigue refiriéndose a los registros del archivo.';
  el('audit').textContent = `${r.rulesExecuted.length} reglas ejecutadas. No ejecutadas: ${r.rulesNotExecuted.map(x => `${x.code}: ${x.reason}`).join(' · ') || 'ninguna'}. SHA-256: ${r.file.sha256}`;
  renderFindings();
}
function renderFindings() {
  if (!report) return;
  el('detail').hidden = true;
  const findings = report.findings.filter(f => select('severity').value === 'all' || f.severity === select('severity').value);
  el('findings').replaceChildren(...findings.map(f => {
    const button = document.createElement('button'); button.className = 'finding';
    const badge = document.createElement('span'); badge.className = `badge ${f.severity}`; badge.textContent = labels[f.severity];
    const body = document.createElement('span'); const title = document.createElement('strong'); title.textContent = f.description;
    const code = document.createElement('code'); code.textContent = f.code; body.append(title, code);
    const count = document.createElement('span'); count.className = 'finding-count'; count.textContent = `${f.count} ↗`;
    button.setAttribute('aria-controls', 'detail'); button.setAttribute('aria-expanded', 'false');
    button.append(badge, body, count); button.onclick = () => { document.querySelectorAll('.finding').forEach(b => b.setAttribute('aria-expanded', 'false')); button.setAttribute('aria-expanded', 'true'); showDetail(f); }; return button;
  }));
  if (!findings.length) { const p = document.createElement('p'); p.className = 'empty-state'; p.textContent = 'No hay hallazgos con esta severidad.'; el('findings').append(p); }
}
function showDetail(f: Finding) {
  const detail = el('detail'); detail.hidden = false; detail.replaceChildren();
  detail.tabIndex = -1; detail.setAttribute('role', 'region'); detail.setAttribute('aria-label', `Detalle: ${f.code}`);
  const title = document.createElement('h3'); title.textContent = f.code; const p = document.createElement('p'); p.textContent = `${f.description} ${f.suggestion}`;
  const technical = document.createElement('p'); technical.className = 'muted small'; technical.textContent = f.technical;
  detail.append(title, p, technical);
  for (const sample of f.samples) {
    const found = document.createElement('p'); found.className = 'sample-caption'; found.textContent = `Encontrado: ${sample.found}${sample.rows.length ? ` · Registros ${sample.rows.join(', ')}` : ' · Archivo completo'}`;
    detail.append(found);
    if (sample.rows.length) { const wrap = document.createElement('div'); wrap.className = 'table-wrap'; wrap.append(makeTable(headers, sample.rows.map((row, i) => ({ row, cells: sample.cells[i] })))); detail.append(wrap); }
  }
  if (f.samplesTruncated) { const p = document.createElement('p'); p.textContent = 'Se muestran los primeros 50 ejemplos; el recuento incluye todos.'; detail.append(p); }
  detail.focus({ preventScroll: true }); detail.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' });
}
select('demo').replaceChildren(...Object.entries(EXAMPLES).map(([id, e]) => new Option(e.title, id)));
input('file').onchange = () => { const file = input('file').files?.[0]; if (file) load(file); input('file').value = ''; };
el('load-demo').onclick = () => { const id = select('demo').value; load(new File([EXAMPLES[id].text], `${id}.csv`, { type: 'text/csv' })); };
el('cancel').onclick = () => cancel();
el('config').addEventListener('input', () => { clearReport(); input('confirm').checked = false; clearErrors(); syncGuidance(); });
// Checkbox input must retain the user's choice; other edits revoke confirmation.
input('confirm').addEventListener('input', event => event.stopPropagation());
select('delimiter').onchange = () => { clearReport(); setBusy(true); status('Actualizando la vista previa…'); worker.postMessage({ type: 'delimiter', delimiter: select('delimiter').value === 'tab' ? '\t' : select('delimiter').value }); };
el('config').onsubmit = event => {
  event.preventDefault(); if (busy || !checkForm()) return;
  const config = collectConfig();
  setBusy(true); clearReport(); status('Analizando en un proceso local. Puedes cancelar sin bloquear la página…'); worker.postMessage({ type: 'analyze', config });
};
select('severity').onchange = renderFindings;
el('download').onclick = () => {
  if (!report) return;
  const url = URL.createObjectURL(new Blob([serializeReport(report)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'energy-time-series-report.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
initializeForm(); startWorker();
