# H1 — Evaluación interna sin participantes

Fecha: 27 de septiembre de 2026. Aplicación: 0.3.1. Evaluador: asistente de desarrollo mediante inspección de código/interfaz y ejecución automatizada. No hubo participantes, evaluadores humanos independientes ni sesiones simuladas que se contabilicen como usuarios.

## Decisión de alcance

El propietario ha indicado que no dispondrá de participantes y ha pedido una alternativa para avanzar. Se sustituye el requisito del hito H1 por **inspección interna de tareas y evidencia reproducible con datos públicos**. El piloto original se conserva como material opcional histórico, sin bloquear la continuación. Cerrar este alcance no demuestra que las personas comprendan la herramienta o completen las tareas sin ayuda.

## Método y fuentes consultadas

Adaptación individual asistida por IA del recorrido cognitivo: para cada tarea se examina si la interfaz comunica el objetivo, permite localizar la acción, explica qué hace y muestra el resultado. No es el taller con equipo de revisores descrito por la fuente. Las conclusiones sobre comprensión son hipótesis de diseño; se separan de los resultados verificables del software.

- [NN/g: recorrido cognitivo](https://www.nngroup.com/articles/cognitive-walkthroughs/): revisión estructurada de tareas sin usuarios. Se adopta su marco de preguntas para inspeccionar los flujos.
- [NN/g: evaluación heurística](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/): las inspecciones ayudan a descubrir problemas, pero no sustituyen la investigación con usuarios.
- [W3C WAI: comprobaciones iniciales](https://www.w3.org/WAI/test-evaluate/preliminary/): revisión parcial de accesibilidad, sin conclusión de conformidad completa.
- [GOV.UK: pruebas moderadas](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing): observan personas realizando tareas; no se atribuye ese método a esta entrega.
- [OPSD / CoSSMic](https://data.open-power-system-data.org/household_data/2020-04-15/): datos públicos medidos, procesados por el publicador, licencia CC BY 4.0. Cuatro señales del mismo conjunto; no son cuatro proveedores independientes.

## Criterios de cierre del alcance interno

1. Cargar los cuatro ejemplos reales sin descargar archivos ni consultar manuales externos, incluso tras desconectar la red después de abrir la app.
2. Mostrar procedencia, procesamiento previo y significado de la medición; exigir confirmación de la configuración sugerida y no aplicarla a archivos desconocidos.
3. Verificar filas, valores ausentes, completitud y hash contra el manifiesto del extracto. El hash prueba identidad del archivo, no precisión física.
4. Poder localizar muestras, navegar y descargar un informe íntegro con explicación previa de su contenido.
5. Mantener pruebas de recuperación de errores, teclado, reflow y comprobaciones automatizadas de accesibilidad en los estados cubiertos.
6. Registrar problemas corregidos y límites que no pueden resolverse sin evidencia adicional. No inventar tiempos de usuario, porcentajes de éxito, SUS ni satisfacción.

## Recorrido por tareas

Las cuatro columnas centrales registran observaciones de la interfaz, no respuestas de participantes.

| Tarea | Objetivo comunicado | Acción localizable | Significado explicado | Resultado observable / evidencia |
| --- | --- | --- | --- | --- |
| Probar sin archivo propio | «Probar ejemplo» y nombres de consumo/solar/batería/escuela | Selector con grupo de datos reales | Nota específica tras cargar | 4 casos × escritorio/móvil; archivo leído y número de filas |
| Elegir una medición | Revisar configuración | Campos de columna, tipo, unidad y cadencia | Sugerencias documentadas para ejemplos conocidos; confirmación sin marcar | Envío sin confirmar produce error; tras confirmar se analiza |
| Detectar falta de valores | Nota de batería propone comparar fechas y valores | Resumen y hallazgo VALUE_MISSING | Presencia temporal separada de valores utilizables | 192 timestamps, 39 vacíos, 153 valores utilizables; 100 % temporal frente a 79,6875 % utilizable |
| Investigar filas | Hallazgos con regla y recuento | Búsqueda por regla/fila y páginas | Aviso explícito de primeras 50 muestras | Test de 60 incidencias, límite 50, navegación hasta última página y vuelta del foco |
| Corregir configuración | Resumen «Revisa la configuración» | Enlaces a campos | Mensaje concreto y ayudas según tipo | Tests de unidad, duración, zona y periodo esperado; resultados previos se invalidan |
| Descargar y compartir | Botón «Descargar JSON» | Junto al encabezado del informe | Nota de nombre/hash/configuración/muestras y descarga local | Exportaciones con hashes originales y recuentos íntegros; no se envían archivos |
| Cambiar a un archivo propio | Seleccionar CSV | Control persistente de carga | Ya no se muestra la nota de ejemplo real | Prueba de nuevo archivo: sin tipo preseleccionado, sin cadencia heredada, sin confirmación |

## Problemas encontrados y tratamiento

Prioridad interna por consecuencia prevista, sin frecuencias observadas en usuarios.

| ID | Observación en 0.3.0 | Impacto previsto | Cambio en 0.3.1 |
| --- | --- | --- | --- |
| H1-01 | Datos reales solo disponibles fuera del flujo, y semántica en README | Barrera para empezar sin CSV y riesgo de sumar un contador | Cuatro ejemplos incorporados localmente; nota de tarea y configuración sugerida de origen conocido |
| H1-02 | La descarga no explicaba su contenido junto al botón | Posible envío posterior de muestras sin advertirlo | Nota visible y asociada al botón para lectores de pantalla; sin confirmación adicional |
| H1-03 | Promesa de privacidad en inglés en una interfaz española | Comprensión inconsistente | Texto en español sobre procesamiento en el dispositivo |
| H1-04 | axe detectó que la vista previa ancha de datos reales no recibía foco | Tabla desplazable inaccesible con teclado | Región de vista previa nombrada y enfocable; prueba de desplazamiento por teclado y repetición de axe |

H1-01 también aumenta el paquete JS de aproximadamente 413 a 856 kB sin comprimir (gzip aproximado: 125 a 159 kB, según build local). Se acepta en esta entrega para que los ejemplos funcionen sin solicitudes después de la carga inicial. No se ha medido rendimiento en dispositivos físicos lentos.

## Resultado y límites

**Cerrado para el alcance interno reformulado**, con evidencia de las pruebas descritas en [verificación](verification.md). No se detectaron fallos en los casos automatizados finales. La inspección visual cubre capturas de escritorio y emulación móvil; no demuestra facilidad de aprendizaje humana.

Se mantiene explícitamente sin verificar: comprensión espontánea, descubribilidad en uso real, satisfacción, tiempo de tarea, lector de pantalla manual, dispositivos físicos y diversidad de proveedores. Los datos OPSD contienen interpolación previa: 100 % utilizable no equivale a 100 % medido sin rellenos. No se ha certificado la exactitud física de los datos ni auditado independientemente todas las fórmulas.

## Reproducir y probar personalmente

`npm test`, `npm run build`, `npm run test:e2e` y `npm run docs:check` desde la raíz del repositorio. Los ocho recorridos reales están en `tests/e2e/h1.spec.ts`; las otras pruebas cubren errores y navegación. Las capturas se escriben en `test-results/` y el manifiesto está en `examples/real/manifest.json`.

En la app: selecciona **Real · Batería con valores ausentes** → **Probar ejemplo** → lee la explicación y confirma → **Analizar archivo**. Compara 100 % temporal con 79,6875 % utilizable, abre VALUE_MISSING y recorre las muestras. Descarga el JSON y comprueba 39 valores ausentes. Esta es una práctica personal disponible, no una sesión que se dé por realizada.
