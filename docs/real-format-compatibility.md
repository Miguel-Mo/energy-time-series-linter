# H6: compatibilidad verificada, entrega 0.4.0

Problema reproducible en 0.3.1: elegir `cet_cest_timestamp` en los CSV reales CoSSMic daba formato fuera del perfil y el formulario pedía zona como si no existiese offset. La fuente publica valores como `2016-03-27T03:00:00+0200`.

Fuente primaria: [OPSD 2020-04-15, metadatos](https://data.open-power-system-data.org/household_data/2020-04-15/datapackage.json), junto a los archivos y hashes de `examples/real/manifest.json`. Se inspeccionan los valores publicados, no se presupone que la documentación de formato cubra todos sus detalles.

Se admite ahora `±HHmm` además de `±HH:mm`. La conversión a representación con dos puntos solo ocurre al interpretar el instante y mostrar el conjunto de offsets del informe. El CSV, el hash y las celdas de muestra no cambian; no se convierte la unidad ni se rellenan huecos. Los formatos compacto y con dos puntos pertenecen a la misma categoría de formato del informe; alternarlos no genera por sí solo TS_MIXED_FORMAT.

Validación: todas las filas de cuatro archivos públicos coinciden con su columna UTC. Se comparan resultados de energía y completitud. El flujo de navegador repite análisis y exportación con ambas columnas en el archivo solar, incluyendo el cambio de hora de marzo. Se prueban offsets positivos, negativos, fracciones horarias, límites inválidos y cero desconocido. La región Europe/Berlin explica los cambios estacionales; si no se indica región, se conserva la advertencia de cambio de offset.

Alcance: esta primera entrega resuelve un formato real confirmado. No representa diversidad de proveedores. Fechas regionales ambiguas, columnas separadas de fecha/hora, preámbulos y otras codificaciones requieren trabajo posterior y no se aceptan por conjetura. H6 permanece parcialmente completado hasta ampliar ese corpus.
