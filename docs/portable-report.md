# H9 — Informe portátil

Desde 0.8.0, después de analizar, **Descargar informe HTML** guarda un documento autónomo UTF-8. Ábrelo directamente como archivo local en el navegador: no necesita la aplicación ni conexión. Para papel o PDF utiliza la función Imprimir del navegador; la app no genera un PDF directamente.

El informe presenta archivo y SHA-256, periodo y completitud, energía y motivos cuando no es determinable, configuración confirmada, todas las reglas con hallazgos y sus muestras guardadas, sugerencias y reglas no ejecutadas. Los filtros de pantalla no alteran la exportación. Se conserva el límite de 50 muestras por regla y el recorte de celdas a 160 caracteres del analizador; no contiene el CSV completo. Los recuentos no son filas únicas. Un subtotal no sustituye al total y cero se distingue de un valor no disponible.

**Descargar JSON** conserva el formato 2.0.0 para consumidores automáticos. El HTML es una presentación para personas, no otro esquema de intercambio ni un archivo que pueda reimportarse. Conserva el CSV original y el JSON si necesitas reproducir los cálculos. La versión de aplicación y las reglas Intl/IANA siguen siendo relevantes.

## Privacidad y seguridad

Ambas descargas son manuales y locales. Incluyen nombres, cabeceras y muestras: revísalas antes de enviarlas. El SHA-256 identifica bytes, no anonimiza, firma ni certifica el origen. No se añaden cuentas, almacenamiento, analítica ni servicios remotos.

El HTML no contiene JavaScript ni recursos externos. Escapa como texto todos los valores procedentes del informe y aplica una CSP que bloquea recursos, formularios y scripts, permitiendo únicamente su estilo incluido. Si modificas el archivo posteriormente, esas propiedades ya no están garantizadas.

## Verificación

Pruebas unitarias de distinción cero/null, subtotal, ausencia de mutaciones, salida determinista, escape de contenido hostil y truncamiento con recuento íntegro. Prueba de navegador en los cuatro proyectos de H8: descargar tras filtrar, abrir por `file:`, leer sin red, conservar hallazgos ocultos por el filtro, ausencia de elementos ejecutables y solicitudes remotas, axe, estilo de impresión y reflow a 320 px. También verifica que cambiar la configuración invalida la descarga anterior.

Se inspeccionó la captura del documento con estilo de impresión. La emulación de impresión no valida todos los controladores, tamaños de papel ni la paginación de cada visor PDF. No se ha realizado evaluación con participantes ni lectores de pantalla. Para WebKit Windows se mantiene el método de bloqueo de red explicado en [H8](browser-reproducibility.md).
