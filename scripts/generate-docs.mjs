import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { RULES } from '../src/rules.ts';
import { EXAMPLES } from '../src/examples.ts';
const check = process.argv.includes('--check');
async function output(file, content) {
  content = content.replace(/\r\n/g, '\n').trimEnd() + '\n';
  if (check) { if (await readFile(file, 'utf8') !== content) throw new Error(`${file} no está actualizado. Ejecuta npm run docs:generate.`); }
  else await writeFile(file, content);
}
await mkdir('docs', { recursive: true }); await mkdir('examples', { recursive: true });
let rules = '# Reglas del MVP\n\nGenerado a partir de `src/rules.ts`; actualiza con `npm run docs:generate`.\n\nCada regla agrega incidencias con muestras y referencias a registros CSV (cabecera = 1). No cambia datos. `error`: interpretación impedida; `warning`: ambigüedad o sospecha; `info`: característica o límite. Las hipótesis no se elevan a errores definitivos. Los umbrales y cálculos detallados están en [scope.md](scope.md).\n\n';
for (const [code, r] of Object.entries(RULES)) rules += `## ${code}\n\n- Severidad: **${r.severity}**.\n- Resultado: ${r.description}\n- Lógica: ${r.technical}\n- Revisión sugerida: ${r.suggestion}\n\n`;
await output('docs/rules.md', rules);
let examples = '# Ejemplos CSV\n\nTodos usan potencia instantánea en kW salvo `counter-reset.csv` (contador en kWh). Para los dos ejemplos DST selecciona `Europe/Madrid` para contrastar offsets. Para `decimal-comma.csv`, selecciona decimal coma. La interfaz solicita revisión y confirmación incluso con ejemplos.\n\n';
for (const [id, e] of Object.entries(EXAMPLES)) { await output(`examples/${id}.csv`, e.text); examples += `- [${e.title}](${id}.csv)\n`; }
await output('examples/README.md', examples);
console.log(check ? 'Catálogo y ejemplos sincronizados.' : 'Catálogo y ejemplos generados.');
let notices = '# Third-party runtime notices\n\nRuntime dependencies bundled with the application. Original license texts follow.\n\n';
for (const name of ['papaparse', '@js-temporal/polyfill', 'jsbi']) {
  const pkg = JSON.parse(await readFile(`node_modules/${name}/package.json`, 'utf8'));
  notices += `## ${name} ${pkg.version}\n\n${await readFile(`node_modules/${name}/LICENSE`, 'utf8')}\n\n`;
}
await mkdir('public', { recursive: true });
await output('THIRD_PARTY_NOTICES.md', notices);
await output('public/THIRD_PARTY_NOTICES.txt', notices);
await output('public/LICENSE.txt', await readFile('LICENSE', 'utf8'));
await output('public/SUPPORT.txt', await readFile('SUPPORT.md', 'utf8'));
await output('public/BETA.txt', await readFile('docs/beta-release.md', 'utf8'));
let dataNotices = 'Datos de ejemplo incorporados en la aplicación\n\nCC BY 4.0; no están bajo la licencia MIT del código. Los enlaces relativos de las notas siguientes se refieren al repositorio fuente. Se conservan atribución, cambios e hipótesis del publicador.\n\n';
for (const source of ['real', 'uci']) dataNotices += `${await readFile(`examples/${source}/README.md`, 'utf8')}\n\nMetadatos y hashes:\n${await readFile(`examples/${source}/manifest.json`, 'utf8')}\n\n`;
await output('public/DATA_NOTICES.txt', dataNotices);
