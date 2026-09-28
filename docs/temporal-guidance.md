# H7 — Guía temporal

La app 0.6.0 incorpora «Cómo elegir zona horaria y resolver cambios de hora» en la configuración. Los hallazgos TS_ZONE_REQUIRED, TS_LOCAL_AMBIGUOUS, TS_MIXED_ZONE, TS_OFFSET_CHANGE y TS_ZONE_MISMATCH incluyen un botón que abre la guía y mueve el foco a su encabezado.

La guía distingue fechas locales, offsets explícitos y reglas de una región; recomienda verificar la configuración del equipo y pedir exportación UTC o con offsets reales. No usa la zona del navegador ni inventa un lado de una hora repetida. Los ejemplos se refieren a Europe/Madrid en 2024; no son reglas universales para todas las regiones.

Fuente conceptual: [Temporal: zonas horarias y ambigüedad](https://tc39.es/proposal-temporal/docs/timezone.html). La hora local puede no corresponder a un único instante alrededor de cambios de offset. El motor mantiene `disambiguation: reject`; abrir la explicación no modifica el análisis. La guía es una adaptación al flujo de esta aplicación, no una afirmación de conformidad con un estándar.

También se corrige la ayuda que exigía zona a cualquier formato regional o fecha/hora separada. Se inspeccionan todas las filas de la columna que contiene la hora: si hay valores locales, se solicita zona; si tienen offset, la zona es opcional para contraste. La prueba incluye una columna mixta cuyo primer registro tiene offset y el segundo no, evitando decidir solo por la primera fila.

Validación: navegación desde una hora ambigua al contenido, foco de teclado, conservación del total no determinable y configuración, uso sin conexión y comprobación axe con la guía abierta. Las pruebas del motor existentes cubren cambios horarios y calendario. Sigue pendiente la evaluación manual con lectores de pantalla y personas; no se declara conformidad completa.

Capturas inspeccionadas: [escritorio](screenshots/desktop-temporal-guide.png) y [móvil](screenshots/mobile-temporal-guide.png).
