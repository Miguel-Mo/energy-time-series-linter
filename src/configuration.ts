import type { Config, Measurement } from './types';
import { parseTime, validZone } from './time';

const get = (id: string) => document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
export const isInterval = (type: string) => type === 'power-mean' || type === 'interval-energy';
const explanations: Record<Measurement, string> = {
  'power-instant': 'Una lectura de potencia en un instante: por ejemplo, 2 kW a las 10:00. La energía se aproxima entre muestras; no se añade un intervalo al final.',
  'power-mean': 'La potencia media durante un intervalo: por ejemplo, 2 kW de media durante 15 minutos equivalen a 0,5 kWh. Debes conocer su duración.',
  'interval-energy': 'La energía de cada intervalo: por ejemplo, 0,5 kWh entre las 10:00 y las 10:15. Debes conocer su duración para comprobar solapamientos.',
  counter: 'Una lectura acumulada: por ejemplo, el contador pasa de 120 a 121 kWh. Se calcula la diferencia de 1 kWh; un reinicio deja el total sin determinar.',
};
let localColumns: number[] = [];
export function setLocalColumns(columns: number[]) { localColumns = columns; syncGuidance(); }
export function syncGuidance() {
  const type = get('measurement').value;
  document.getElementById('measurement-help')!.textContent = explanations[type as Measurement] ?? 'Selecciona qué representa cada número. La unidad por sí sola no distingue una lectura instantánea de una media.';
  for (const id of ['interval', 'position']) {
    get(id).closest('label')!.hidden = !isInterval(type);
  }
  get('interval').required = isInterval(type);
  const local = localColumns.includes(Number(get('timestamp').value));
  get('timezone').required = local;
  document.getElementById('timezone-help')!.textContent = local
    ? 'El archivo contiene fechas locales en esta columna: indica la zona del equipo. No usamos la zona del navegador.'
    : 'Opcional para contrastar offsets con una región. Los offsets escritos se conservan.';
  for (const option of (get('unit') as HTMLSelectElement).options) {
    option.disabled = !!type && !!option.value && (type.startsWith('power') ? option.value.endsWith('h') : !option.value.endsWith('h'));
  }
}
export function collectConfig(): Config {
  const optional = (id: string) => get(id).value === '' ? null : Number(get(id).value);
  const type = get('measurement').value as Measurement;
  return {
    timestampColumn: Number(get('timestamp').value), valueColumn: Number(get('value').value),
    unit: get('unit').value as Config['unit'], measurement: type, timezone: get('timezone').value.trim(),
    decimal: get('decimal').value as Config['decimal'], delimiter: get('delimiter').value === 'tab' ? '\t' : get('delimiter').value,
    intervalMinutes: isInterval(type) ? optional('interval') : null,
    intervalPosition: isInterval(type) ? get('position').value as Config['intervalPosition'] : 'start',
    cadenceMinutes: optional('cadence'), expectedStart: get('expected-start').value.trim() || null, expectedEnd: get('expected-end').value.trim() || null,
    highValue: optional('high'), constantHours: Number(get('constant').value), jumpFactor: Number(get('jump').value),
  };
}
export function clearErrors() {
  document.querySelectorAll('.field-error').forEach(e => e.remove());
  document.querySelectorAll('[aria-invalid]').forEach(e => { e.removeAttribute('aria-invalid'); e.setAttribute('aria-describedby', (e.getAttribute('aria-describedby') ?? '').split(' ').filter(v => !v.endsWith('-error')).join(' ')); });
  document.getElementById('form-errors')!.hidden = true;
}
export function checkForm(): boolean {
  clearErrors();
  const c = collectConfig(); const errors: Record<string, string> = {};
  if (!c.measurement) errors.measurement = 'Selecciona qué representa la medición.';
  if (!c.unit) errors.unit = 'Selecciona la unidad del archivo.';
  else if (c.measurement && (c.measurement.startsWith('power') ? c.unit.endsWith('h') : !c.unit.endsWith('h'))) errors.unit = 'Esta unidad no corresponde al tipo de medición elegido.';
  if (c.timestampColumn === c.valueColumn) errors.value = 'Elige una columna distinta de la fecha y hora.';
  if (!c.decimal) errors.decimal = 'Confirma el separador decimal del archivo.';
  if (get('timezone').required && !c.timezone) errors.timezone = 'Estas fechas necesitan la zona del equipo, por ejemplo Europe/Madrid.';
  else if (c.timezone && !validZone(c.timezone)) errors.timezone = 'No reconocemos esa zona. Usa un identificador como Europe/Madrid o UTC.';
  if (isInterval(c.measurement) && c.intervalMinutes === null) errors.interval = 'Indica cuántos minutos abarca cada medición.';
  for (const id of ['interval', 'cadence', 'high', 'constant', 'jump']) {
    if (id === 'interval' && !isInterval(c.measurement)) continue;
    const field = get(id) as HTMLInputElement;
    const v = Number(field.value);
    if (!errors[id] && (field.validity.badInput || (!field.value && field.required) || (field.value && (!Number.isFinite(v) || v <= (id === 'jump' ? 1 : 0) || (['interval', 'cadence'].includes(id) && v > 525600))))) errors[id] = id === 'jump' ? 'Usa un factor mayor que 1.' : 'Usa un número positivo dentro del límite indicado.';
  }
  if (c.expectedStart || c.expectedEnd) {
    for (const [id, value] of [['expected-start', c.expectedStart], ['expected-end', c.expectedEnd]]) {
      if (!value) errors[id!] = 'Completa ambos límites del periodo esperado.';
      else if (errors.timezone || parseTime(value, c.timezone).ms === null) errors[id!] = 'Usa una fecha inequívoca con offset, o una fecha local con zona. Ejemplo: 2024-01-01T00:00:00Z.';
    }
    if (!errors['expected-start'] && !errors['expected-end'] && parseTime(c.expectedStart!, c.timezone).ms! > parseTime(c.expectedEnd!, c.timezone).ms!) errors['expected-end'] = 'El fin debe ser igual o posterior al inicio.';
  }
  if (!(get('confirm') as HTMLInputElement).checked) errors.confirm = 'Confirma que has revisado la configuración.';
  if (!Object.keys(errors).length) return true;
  const summary = document.getElementById('form-errors')!; summary.replaceChildren(); summary.hidden = false;
  const heading = document.createElement('h3'); heading.textContent = 'Revisa la configuración'; summary.append(heading);
  const list = document.createElement('ul'); summary.append(list);
  for (const [id, message] of Object.entries(errors)) {
    const field = get(id); field.setAttribute('aria-invalid', 'true');
    const error = document.createElement('span'); error.id = `${id}-error`; error.className = 'field-error'; error.textContent = message;
    field.closest('label')!.append(error);
    field.setAttribute('aria-describedby', `${field.getAttribute('aria-describedby') ?? ''} ${error.id}`.trim());
    const item = document.createElement('li'); const link = document.createElement('a'); link.href = `#${id}`; link.textContent = message;
    link.onclick = event => { event.preventDefault(); field.closest('details')?.setAttribute('open', ''); field.focus(); };
    item.append(link); list.append(item);
  }
  summary.focus();
  return false;
}

export function initializeForm() {
  // Keep label names short and associate help separately, including for screen readers.
  document.querySelectorAll<HTMLLabelElement>('#config label').forEach(label => {
    const field = label.querySelector<HTMLInputElement | HTMLSelectElement>('input,select');
    if (!field) return;
    if (field.id !== 'confirm') field.setAttribute('aria-label', [...label.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join(' ').trim());
    const hint = label.querySelector<HTMLElement>('.hint');
    if (hint) { hint.id ||= `${field.id}-help`; field.setAttribute('aria-describedby', hint.id); }
  });
  get('measurement').setAttribute('aria-describedby', 'measurement-help');
  syncGuidance();
}
