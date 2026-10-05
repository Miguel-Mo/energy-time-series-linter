# Contribuir

Mantén el alcance: un CSV, una medición, procesamiento local, sin cuentas, telemetría ni cambios silenciosos de interpretación. Explica el problema con un ejemplo mínimo y la conducta esperada antes de ampliar formatos o reglas.

Usa Node.js 24 y `npm ci`. Ejecuta `npm run docs:check`, `npm test`, `npm run build`, `npx playwright install chromium firefox webkit`, `npm run test:e2e` y `npm run test:parity`. En Linux, instala los navegadores con `--with-deps`. Los casos de navegador reservan el puerto 43871.

Para cambios de reglas, conserva códigos estables y documenta límites. Cambios de semántica del JSON requieren evaluar su versión. Nunca alteres bytes de los extractos reales sin actualizar procedencia, hashes y referencia independiente. Código MIT; datos CoSSMic/OPSD y UCI CC BY 4.0, con atribución separada.

Incluye pruebas del comportamiento que cambia y resultados de validación, sin presentar pruebas internas como certificación. Describe cualquier limitación de navegador que no hayas comprobado. Consulta [SUPPORT.md](SUPPORT.md) para comunicar errores sin datos sensibles.
