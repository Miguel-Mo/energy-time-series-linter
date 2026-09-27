# Verificación de la entrega 0.3.0

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
