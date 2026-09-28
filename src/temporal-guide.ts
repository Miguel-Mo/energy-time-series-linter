export function installTemporalGuide() {
  const guide = document.createElement('details'); guide.id = 'temporal-guide';
  guide.innerHTML = `<summary>Cómo elegir zona horaria y resolver cambios de hora</summary>
    <div class="guidance">
    <p><strong>1. Mira cómo termina la fecha.</strong> Z significa UTC. +02:00 o +0200 indica una diferencia de dos horas respecto a UTC: ya identifica el instante. Sin ese final, necesitas conocer la zona del equipo.</p>
    <p><strong>2. Consulta el origen.</strong> Usa una zona como Europe/Madrid solo si corresponde a la configuración del equipo. La ubicación física no demuestra qué reloj utilizaba. No elegimos la zona del navegador.</p>
    <p><strong>3. Distingue offset y región.</strong> +01:00 es una diferencia fija; Europe/Madrid contiene reglas que cambian según la fecha. Con offset explícito, la región sirve para contrastarlo, no para sobrescribirlo. Un cambio de offset no prueba por sí solo un cambio de horario estacional.</p>
    <p><strong>4. Si la hora se repite o no existe, vuelve al origen.</strong> Pide una exportación en UTC o con el offset real de cada registro. No añadas Z ni un offset inventado: eso cambiaría el instante.</p>
    <p>Ejemplos históricos de Europe/Madrid: el 27/10/2024, 02:30 ocurre dos veces. 02:30+02:00 equivale a 00:30Z y 02:30+01:00 a 01:30Z: son instantes distintos. El 31/03/2024, 02:30 local no existe. La herramienta rechaza ambos casos locales ambiguos en vez de elegir por ti.</p>
    <p>Si aparecen fechas con y sin offset, comprueba ambas convenciones. La zona seleccionada interpreta las locales; los offsets escritos se conservan. Si falta fecha u hora, una zona no puede recuperarla.</p>
    <p>El resumen muestra el periodo en UTC. Los límites del periodo esperado se escriben en ISO, aunque el CSV use día/mes/año. Para un instante inequívoco: 2024-10-27T00:30:00Z.</p>
    </div>`;
  document.getElementById('config')!.querySelector('.confirmation')!.before(guide);
}

export function openTemporalGuide() {
  const guide = document.getElementById('temporal-guide') as HTMLDetailsElement;
  guide.open = true;
  guide.querySelector('summary')!.focus();
  guide.scrollIntoView({ block: 'center', behavior: 'auto' });
}
