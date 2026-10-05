# H10 — Preparación de la beta

Versión beta: **0.9.0**. Repositorio: https://github.com/Miguel-Mo/energy-time-series-linter. Incidencias: https://github.com/Miguel-Mo/energy-time-series-linter/issues. Sitio previsto: https://miguel-mo.github.io/energy-time-series-linter/. El resultado observado del despliegue se registra en docs/verification.md.

## Uso rápido

Abre la aplicación servida por HTTPS o localhost, elige un ejemplo, revisa su configuración y confirma antes de analizar. Como primer recorrido usa la serie sintética correcta de 15 minutos: potencia instantánea, kW; debe producir 2 kWh aproximados. Después prueba los ejemplos reales guiados; sus hipótesis se muestran antes de confirmar.

El CSV permanece en el dispositivo. La carga inicial requiere red; después puedes analizar y descargar mientras la página siga abierta. No se promete recargar sin conexión. El HTML descargado sí se abre como archivo local. Los informes incluyen muestras: revísalos antes de enviarlos.

Alcance: UTF-8, un archivo de hasta 10 MiB, 100.000 registros y 100 columnas; una medición. No se reparan datos ni se certifica conformidad. Hay revisión interna con datos reales, sin participantes. WebKit y móvil tienen las limitaciones de emulación descritas en H8; no equivalen a probar Safari o teléfonos físicos. No se ha validado toda WCAG.

## Distribución y comprobaciones

1. `npm ci`, `npm run docs:check`, `npm test` y `npm run build`.
2. `npx playwright install --with-deps chromium firefox webkit`, `npm run test:e2e` y `npm run test:parity`.
3. `npm run release:check` verifica que dist contiene app, licencia MIT, atribuciones de dependencias y datos, guía y plantilla de soporte. Produce un manifiesto SHA-256 en dist; el manifiesto identifica bytes, no es una firma ni un certificado.
4. Para un ZIP local: `python scripts/package-release.py`. Solo empaqueta dist tras verificar su manifiesto; requiere Python 3 estándar. No incluye archivos privados, caché de descargas, node_modules ni resultados de pruebas.

Sirve el contenido del ZIP por HTTPS o localhost (por ejemplo `python -m http.server 8000 --bind 127.0.0.1` en la carpeta extraída). No abras el index de la app por file:. Mantén juntos todos los archivos y avisos.

## Publicación y actualizaciones

El repositorio público usa Issues y Pages con GitHub Actions. Para actualizar, sube el código. Espera el CI Linux; ejecuta manualmente Deploy Pages y comprueba el sitio publicado bajo su ruta real, incluidos ejemplos, informe HTML y avisos. Crea la entrega como prerelease, con notas y el ZIP comprobado. No declares pública o aprobada una ejecución que no se haya observado.

Las plantillas de fallos y mejoras se preparan en `.github/ISSUE_TEMPLATE`, conforme a la [sintaxis oficial de GitHub](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms). [SUPPORT.md](../SUPPORT.md) ofrece una plantilla manual para preparar la incidencia. Los enlaces de ayuda locales no envían información.

## Reversión

Si falla la publicación, conserva el sitio anterior: el despliegue depende de todas las verificaciones. Si aparece un defecto después, vuelve a ejecutar Deploy Pages sobre una rama con el último commit verificado; no cambies etiquetas ya publicadas ni borres informes de fallos. Documenta la versión afectada, el alcance y la corrección.
