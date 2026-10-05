# Verificación de la candidata beta 0.9.0

H10, preparación local, 5 de octubre de 2026, Windows: **95 pruebas unitarias y 80 pruebas de navegador correctas**, suite íntegra en 3,5 minutos y paridad JSON correcta. Build y catálogo correctos. El aviso de tamaño permanece: 965,44 kB de JS, 183,25 kB gzip.

Se verificaron desde la interfaz las cinco rutas de guía, soporte y licencias en Chromium escritorio/móvil emulado, Firefox y WebKit. `release:check` comprobó los ocho archivos distribuidos y generó el manifiesto SHA-256. El ZIP contiene esos ocho archivos más el manifiesto; comprobación CRC y todos los hashes internos correctos. No incluye cachés, CSV de usuario ni resultados de pruebas. Las plantillas de Issues están preparadas, pero su funcionamiento remoto no se ha probado.

La publicación sigue pendiente: no hay remoto, CI Linux observado ni URL pública verificada. Por ello H10 no se declara cerrado como beta pública. [Procedimiento y condiciones de publicación](beta-release.md).

## Base anterior: entrega 0.8.0

H9, 5 de octubre de 2026, Windows: **95 pruebas unitarias y 76 pruebas de navegador correctas**, suite completa en 3,5 minutos, sin reintentos. Build TypeScript/Vite y catálogo correctos; paridad exacta del JSON de los casos H8 confirmada. Mismos motores registrados en H8. Paquete JS de 964,68 kB (182,97 kB gzip), con aviso de tamaño de Vite.

El nuevo informe HTML se descargó y abrió por `file:` sin red en Chromium escritorio/móvil emulado, Firefox y WebKit. Se verificaron hallazgos completos tras filtrar la interfaz, contenido hostil inerte, cero recursos remotos, axe, estilo de impresión, reflow a 320 px e invalidación al editar la configuración. Captura de impresión inspeccionada. Las pruebas unitarias verifican además cero frente a null, subtotal separado del total, escape de campos, recuentos con muestras truncadas y ausencia de mutaciones del informe original. [Uso y límites de H9](portable-report.md): no valida toda paginación de PDF, impresoras ni dispositivos físicos.

## Base anterior: entrega 0.7.0

H8, 5 de octubre de 2026, Windows: **93 pruebas unitarias y 72 pruebas de navegador correctas**. Ejecución completa de Playwright con un proceso, sin reintentos: 3,5 minutos, salida 0. Build TypeScript/Vite y catálogo correctos. Permanece el aviso de tamaño del paquete con los ejemplos locales (958,20 kB de JS; 180,25 kB gzip).

`npm run test:parity` confirmó igualdad exacta de los informes JSON de dos series (sintética de 15 minutos y solar CoSSMic), con America/Los_Angeles y Asia/Tokyo como zonas del navegador. Motores registrados: Chromium 153.0.8010.12, Firefox 155.0 y WebKit 26.6. Cuatro proyectos con 18 casos cada uno: escritorio Chromium, emulación Pixel 7, Firefox y WebKit. Los contextos de paridad aíslan la zona y no aplican emulación móvil.

Se comprobó el enlace de salto corregido, teclado, axe, importación de datos reales, cancelación, hallazgos y exportación. En WebKit Windows se bloquean HTTP(S) y WebSocket porque su emulación offline falla incluso con archivos en memoria; Chromium y Firefox también activan `setOffline(true)`. No equivale a validar Safari en un dispositivo físico. Las intermitencias de Chromium observadas en ejecuciones anteriores y el alcance de esta evidencia se conservan en [método y límites de H8](browser-reproducibility.md). CI remoto y publicación siguen pendientes.

## Base anterior: entrega 0.6.0

H7, 28 de septiembre de 2026: **93 pruebas unitarias y 34 pruebas de navegador correctas**, build y catálogo correctos. Ejecución final: `npx playwright test --workers=2`, cierre limpio en 56,2 s. Una ejecución anterior con seis procesos completó las comprobaciones pero quedó abierta al terminar y se interrumpió; no se utiliza como evidencia de cierre. Guía abierta desde hallazgos temporales, foco, conservación de datos/resultados y axe comprobados en escritorio y móvil. La detección de zona comprueba columnas temporales mixtas, regionales y separadas. Capturas inspeccionadas en [guía H7](temporal-guidance.md).

## Base anterior: entrega 0.5.0

H6, corpus inicial completado: **93 pruebas unitarias y 30 pruebas de navegador correctas**. Build TypeScript/Vite y catálogo correctos. El segundo conjunto público, UCI, comprueba fechas regionales elegidas explícitamente y hora separada: 1440 medias por minuto y 56,5076666667 kWh contrastados con Decimal de Python. En escritorio y móvil se verificaron importación sin conexión, corrección de columnas incompatibles, exportación de las decisiones y restablecimiento al cargar otro ejemplo. Se mantienen rechazos de calendario imposible y horas locales ambiguas/inexistentes. Las hipótesis de zona y posición del intervalo aparecen en la interfaz y la documentación.

El CSV UCI conserva sus bytes y saltos de línea publicados; Git tiene desactivada su normalización textual para conservar el hash tras clonar. El paquete incluye cinco ejemplos reales sin conexión: aproximadamente 956 kB de JS, 179 kB gzip; Vite mantiene su aviso de tamaño. Evidencia interna, sin validación con participantes ni dispositivos físicos.

## Base anterior: entrega 0.4.0

H6, primera entrega: **85 pruebas unitarias y 28 pruebas de navegador correctas**, build TypeScript/Vite correcto. Todas las filas de cuatro extractos públicos se verifican entre UTC y la columna europea con offset compacto. En escritorio y móvil se repite el flujo solar con ambas columnas, sin zona obligatoria, conservando hash y obteniendo idénticas métricas de energía y completitud. [Alcance de formatos](real-format-compatibility.md). Persiste el aviso de tamaño del paquete que incluye ejemplos locales.

## Base anterior: entrega 0.3.1

H1 interno reformulado: **72 pruebas unitarias y 26 casos de navegador verificados** en total. La ejecución completa pasó 24 de 26 inicialmente tras la corrección de la vista previa; los dos restantes fallaron por usar la tecla End en lugar de ArrowRight para comprobar scroll horizontal. Corregida esa acción de prueba, se repitieron los ocho recorridos H1. Los resultados definitivos y las limitaciones están documentados en [H1 interno](h1-internal-evaluation.md). Build y catálogo correctos; el build avisa de JS superior a 500 kB al incluir los ejemplos sin conexión (856 kB, 159 kB gzip).

Los nuevos recorridos cubren los cuatro ejemplos reales en escritorio y móvil, sin conexión, confirmación obligatoria, descarga con hash del extracto, recuentos y limpieza de sugerencias al cargar otro archivo. La auditoría axe detectó originalmente una vista previa ancha sin acceso por teclado: corregida como región nombrada y enfocable, con comprobación de desplazamiento y repetición de axe. Esta evidencia corresponde a revisión interna asistida por IA, no a sesiones humanas.

## Base anterior: entrega 0.3.0

Capturas revisadas de H1 0.3.1: [ejemplo real en escritorio](screenshots/desktop-real-guidance.png), [ejemplo real en móvil](screenshots/mobile-real-guidance.png).

Actualización H4, 27 de septiembre de 2026: **72 pruebas unitarias y 18 pruebas de navegador correctas** (nueve en escritorio y nueve en emulación móvil Chromium). Build TypeScript/Vite y `docs:check` correctos. Nuevas comprobaciones: páginas inicial/final, navegación por teclado y devolución del foco, filtros combinados y limpieza, aviso de muestras truncadas, exportación con recuento íntegro aunque no haya coincidencias, axe en detalle filtrado y reflow a 320 px. Batería CoSSMic real analizada por el worker: 39 valores ausentes, 153 de 192 valores utilizables (79,6875 %). Revisión visual de detalle en escritorio y móvil sin desbordamiento de página; tablas con desplazamiento propio.

Capturas H4: [escritorio](screenshots/desktop-findings.png), [móvil](screenshots/mobile-findings.png). Evidencia interna; no sustituye H1 ni revisión manual de accesibilidad.

## Base anterior: entrega 0.2.0

Verificación local: 27 de septiembre de 2026, Windows, Node.js 24.15.0, npm 11.13.0. Esta es evidencia de pruebas internas, no una revisión externa ni certificación.

- `npm install`: correcto; dependencias fijadas y lockfile incluido.
- `npm run docs:check`: catálogo de reglas, diez CSV y licencias de dependencias sincronizados.
- `npm test`: **68 pruebas correctas**, incluidos 100.000 registros, campos entrecomillados que cruzan bloques, errores estructurales, decimales, tiempos locales/offsets, DST, huecos, duplicados, desorden, reinicios, cálculos, duración/cadencia independientes y periodos esperados.
- `npm run build`: correcto, TypeScript y compilación estática de producción.
- `npm run test:e2e`: **14 pruebas correctas** sobre la compilación de producción: siete flujos en escritorio Chromium y siete en emulación Pixel 7.
- Configuración guiada y mensajes enlazados: unidad/tipo, duración obligatoria para intervalos, zona para fechas locales y periodo esperado, con invalidación de resultados anteriores al editar.
- Flujo por teclado desde enlace de salto, resumen de errores, campo correspondiente, confirmación y análisis; foco en el resultado. Reflow de página sin desbordamiento horizontal a 320 CSS px.
- axe sobre estados de errores de configuración y resultados: cero infracciones detectadas en los conjuntos `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` ejecutados. Esto no cubre toda WCAG ni sustituye una revisión manual con lectores de pantalla o usuarios.
- Después de la carga inicial, con red desconectada: carga de CSV, análisis, descarga y hash verificados, **cero solicitudes HTTP/HTTPS/WS/WSS**. Las URLs `blob:` de descarga son recursos de memoria locales.
- Contenido HTML malicioso mostrado como texto; archivos vacíos, sobredimensionados y no UTF-8 tratados sin bloqueo; cancelación de un análisis grande y carga posterior sin red comprobadas.
- Revisión visual de capturas en escritorio y móvil: flujo, resumen, filtro, detalle de registros y descarga; sin desbordamiento horizontal de la página. Las tablas anchas tienen scroll propio.

Capturas: [escritorio](screenshots/desktop-report.png), [móvil](screenshots/mobile-report.png). El ejemplo mostrado contiene un timestamp duplicado: el informe identifica ambos registros y no calcula un total.

Nuevo periodo esperado: [escritorio](screenshots/desktop-guided.png), [móvil](screenshots/mobile-guided.png). Cinco instantes presentes sobre siete esperados se separan de la validez numérica; la duración de cada media (10 min) se distingue de la cadencia (15 min).

Configuración guiada revisada visualmente: [escritorio](screenshots/desktop-configuration.png), [móvil](screenshots/mobile-configuration.png).

H1 se entrega como [piloto preparado](usability-pilot.md), sin participantes ni resultados fabricados. La validación manual con lector de pantalla sigue pendiente. El informe JSON pasa a 2.0.0; se documenta su migración en [report-format.md](report-format.md).

La ejecución de GitHub Actions y el despliegue real de Pages requieren subir el repositorio y habilitar Pages. No se han ejecutado remotamente. La prueba móvil es emulación en Chromium, no un dispositivo físico ni Safari/Firefox. Las reglas horarias regionales provienen de Intl, como se detalla en [scope.md](scope.md).
