# Changelog

## 0.4.0 — 2026-09-27

- H6, primera entrega: soporte de offsets compactos como +0100/+0200 en fechas del perfil admitido, tal como aparecen en CoSSMic.
- Detección coherente en el formulario y worker: esas fechas ya no exigen una zona inventada.
- Comparación de todas las filas de cuatro extractos reales entre UTC y hora europea: mismos instantes, completitud y energía. Bytes y hash originales conservados.
- Offsets imposibles rechazados; -0000 queda fuera del perfil como -00:00. Sin inferir formatos regionales ambiguos.

## 0.3.1 — 2026-09-27

- H1 reformulado por ausencia de participantes: recorrido interno documentado, sin atribuir resultados a usuarios.
- Cuatro ejemplos CoSSMic incluidos sin conexión, con tareas, procedencia y configuración sugerida que exige revisión y confirmación.
- Explicación del contenido del JSON junto a la descarga y mensaje de privacidad en español.
- Corrección detectada durante la revisión: vista previa ancha enfocable y desplazable con teclado.
- Ocho recorridos automatizados de datos reales (cuatro casos en escritorio y móvil), con exportación, hashes y ausencia de configuración heredada al cargar archivos desconocidos.

## 0.3.0 — 2026-09-27

- H4: búsqueda por regla o descripción, combinada con severidad y fila CSV dentro de las muestras guardadas.
- Detalles paginados en grupos de cinco ejemplos, recuento total separado de muestras y aviso explícito del límite de 50.
- Vuelta al hallazgo con foco de teclado, limpieza de filtros y controles adaptados a móvil.
- Los filtros no modifican el informe exportado; el esquema JSON sigue en 2.0.0.
- Cuatro extractos públicos CoSSMic (CC BY 4.0), procedencia, hashes y script de reproducción; prueba de batería real en navegador.

## 0.2.0 — 2026-09-27

- Ayuda según significado de la medición, campos pertinentes y unidades compatibles, sin conversiones silenciosas.
- Duración de medición y cadencia entre timestamps configuradas por separado.
- Errores antes del análisis, junto al campo y en un resumen con enlaces y foco de teclado.
- Presencia temporal, números interpretables y duplicados separados; periodo opcional inclusivo para detectar ausencias en los extremos.
- El periodo esperado no modifica ni recorta la energía de los registros del archivo.
- Texto más legible, contraste, controles táctiles, enlace de salto, estado de hallazgos y respeto de movimiento reducido.
- Informe JSON 2.0.0 con migración documentada; rompe deliberadamente la semántica combinada de completitud de 1.0.0.
- Piloto H1 preparado, sin sesiones de usuarios todavía; accesibilidad manual con lector de pantalla pendiente.

## 0.1.0 — 2026-09-27

MVP local: CSV, reglas temporales/energéticas, ejemplos, informe JSON, pruebas, documentación y workflows de GitHub Pages.
