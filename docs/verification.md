# Verificación del MVP

Verificación local: 27 de septiembre de 2026, Windows, Node.js 24.15.0, npm 11.13.0. Esta es evidencia de pruebas internas, no una revisión externa ni certificación.

- `npm install`: correcto; dependencias fijadas y lockfile incluido.
- `npm run docs:check`: catálogo de reglas, diez CSV y licencias de dependencias sincronizados.
- `npm test`: **59 pruebas correctas**, incluidos 100.000 registros, campos entrecomillados que cruzan bloques, errores estructurales, decimales, tiempos locales/offsets, DST, huecos, duplicados, desorden, reinicios y cálculos.
- `npm run build`: correcto, TypeScript y compilación estática de producción.
- `npm run test:e2e`: **8 pruebas correctas** sobre la compilación de producción: cuatro flujos en escritorio Chromium y cuatro en emulación Pixel 7.
- Después de la carga inicial, con red desconectada: carga de CSV, análisis, descarga y hash verificados, **cero solicitudes HTTP/HTTPS/WS/WSS**. Las URLs `blob:` de descarga son recursos de memoria locales.
- Contenido HTML malicioso mostrado como texto; archivos vacíos, sobredimensionados y no UTF-8 tratados sin bloqueo; cancelación de un análisis grande y carga posterior sin red comprobadas.
- Revisión visual de capturas en escritorio y móvil: flujo, resumen, filtro, detalle de registros y descarga; sin desbordamiento horizontal de la página. Las tablas anchas tienen scroll propio.

Capturas: [escritorio](screenshots/desktop-report.png), [móvil](screenshots/mobile-report.png). El ejemplo mostrado contiene un timestamp duplicado: el informe identifica ambos registros y no calcula un total.

La ejecución de GitHub Actions y el despliegue real de Pages requieren subir el repositorio y habilitar Pages. No se han ejecutado remotamente. La prueba móvil es emulación en Chromium, no un dispositivo físico ni Safari/Firefox. Las reglas horarias regionales provienen de Intl, como se detalla en [scope.md](scope.md).
