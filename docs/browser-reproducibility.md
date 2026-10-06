# H8 — Navegadores y reproducibilidad

## Matriz y criterios

La entrega 0.7.0 ejecuta los mismos flujos en cuatro proyectos Playwright: Chromium escritorio, Chromium con emulación Pixel 7, Firefox y WebKit escritorio. Son motores automatizados en Windows, no pruebas en un móvil físico ni en Safari instalado sobre macOS/iOS. La ejecución completa del 5 de octubre de 2026 pasó 72 de 72 pruebas en 3,5 minutos, en serie, sin forzar clics ni reintentos. La comparación posterior de informes también pasó. Véase [verificación y versiones](verification.md).

Además del flujo de configuración, errores, teclado, accesibilidad automática, datos reales, cancelación y descarga, cada proyecto repite dos análisis con zonas del navegador America/Los_Angeles y Asia/Tokyo. Casos: potencia sintética correcta de 15 minutos y contador solar CoSSMic. Los timestamps de ambos son explícitos en UTC; no se impone una región de contraste. Se comparan los JSON completos como texto, incluidos hash, configuración, hallazgos y resultados, primero entre zonas dentro del motor y después entre los cuatro proyectos.

`npm run test:parity` requiere los cuatro artefactos y una ejecución de navegador aprobada; falla si falta un proyecto o difiere cualquier byte. Se guardan versiones de navegador y zonas usadas en `test-results/*/browser-version.json`, y reportes en `reproducibility.json`. No compara capturas visuales ni presume equivalencia universal.

Los proyectos Chromium usan el modo headless del navegador completo (channel: 'chromium'). Las ejecuciones iniciales sufrieron bloqueos intermitentes al esperar estabilidad de controles o capturas en Windows; ni desactivar GPU ni serializar bastaron para eliminarlos. Se conserva la ejecución serial, sin clics forzados ni reintentos automáticos. Se retiró la captura inicial de portada; permanecen las capturas de resultados y todas las aserciones funcionales. Una ejecución completa aprobada es evidencia de esa ejecución, no una garantía de ausencia de intermitencias.

La prueba de paridad crea contextos nuevos para aislar las zonas del navegador. En el proyecto mobile esos contextos comparan el mismo motor Chromium sin emulación de dispositivo; los otros 17 casos de ese proyecto sí emplean la emulación Pixel 7.

## Limitación encontrada en WebKit Windows

Con `context.setOffline(true)` en este entorno, WebKit falla al leer incluso `new File(['hello'], 'a.csv').text()` en una página vacía. También falla la creación de workers blob. Es una limitación observada en la emulación empleada; no basta para atribuir un fallo equivalente a Safari real desconectado.

Por eso `tests/e2e/network.ts` bloquea HTTP(S) y WebSocket después de la carga, manteniendo accesibles los recursos locales blob. Chromium y Firefox activan además `setOffline(true)`. Las comprobaciones de cero solicitudes y contenido procesado localmente permanecen activas. Esta evidencia demuestra funcionamiento con la red bloqueada por la prueba; en WebKit no demuestra el comportamiento bajo la emulación offline defectuosa ni bajo desconexión física de un dispositivo Apple. No se relaja la CSP ni se sustituye el worker por ejecución en el hilo de interfaz.

La prueba de teclado detectó también el comportamiento distinto del enlace de salto en WebKit. Se le asigna explícitamente tabindex=0, sin alterar el orden natural, para permitir enfocarlo con Tab.

## Reproducir

1. `npm ci`
2. `npx playwright install chromium firefox webkit` (en Linux, añadir `--with-deps`).
3. `npm run docs:check` y `npm test`.
4. `npm run build`, `npm run test:e2e` y, solo si pasa la suite, `npm run test:parity`.

CI y el workflow manual de Pages incluyen instalación de los tres motores y la comprobación de paridad. Sus ejecuciones remotas se verificaron al publicar 0.9.0; consulta docs/verification.md para los enlaces y la corrección de diseño estrecho encontrada en WebKit/Linux. Las versiones de Playwright y dependencias están fijadas en package-lock.json.

## Límites de la reproducibilidad

Se verifica igualdad para dos series con instantes explícitos y los motores/entorno probados. Fechas locales y contraste IANA dependen de Intl/tzdata del entorno: otras versiones del sistema o datos históricos/futuros pueden producir diferencias. No se incluyen reloj actual ni identificadores aleatorios en el informe. Mantén idénticos bytes, nombre, configuración, versión de app y entorno de zonas al reproducir un informe.
