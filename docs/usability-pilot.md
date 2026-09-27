# Piloto opcional — protocolo histórico

El propietario ha confirmado que no habrá participantes. H1 se reformula como [evaluación interna sin participantes](h1-internal-evaluation.md); este protocolo se conserva como recurso opcional, sin bloquear los hitos. Los requisitos de cierre al final de este documento se refieren exclusivamente al piloto humano original.

**Estado: preparado; sin participantes reclutados, sin sesiones realizadas y sin resultados de usuarios.** El propietario no dispone de participantes ni archivos propios. Ya hay [cuatro extractos públicos de datos reales](../examples/real/README.md), con licencia, procedencia y configuración, para practicar y preparar las sesiones. Las pruebas automatizadas no se contabilizan como sesiones.

## Objetivo y participantes

Observar si personas que trabajan con datos energéticos pueden configurar, interpretar y compartir un informe sin ayuda. Primera ronda: 4–8 personas; buscar al menos representación de instalación/monitorización, investigación/desarrollo y comunidades energéticas. Es una investigación cualitativa; sus porcentajes no estimarán el comportamiento de toda la población.

No hay invitaciones automáticas ni recogida de datos en la aplicación. La persona responsable organizará sesiones cuando disponga de participantes. Usar códigos P01–P08 en las notas; no nombres, correos ni identificadores de contadores.

## Preparación de la sesión (30–40 minutos)

1. Explicar: «Estamos probando la herramienta, no tus conocimientos. Puedes detener la sesión cuando quieras». Solicitar consentimiento para tomar notas. Grabación solo si se acuerda expresamente; no es necesaria.
2. Registrar versión de la app, navegador, tipo de dispositivo y experiencia aproximada del participante. No registrar su instalación física ni identificadores personales.
3. Usar primero los CSV sintéticos de `examples/`. Los archivos reales son opcionales y se preparan antes, con autorización y revisión de privacidad; nadie está obligado a compartirlos. No recopilar consumos domésticos identificables, nombres, direcciones, CUPS o números de serie.
4. Abrir la aplicación ya cargada. Si se evalúa la promesa local, desconectar la red durante una tarea.
5. Pedir que piense en voz alta. Leer el objetivo de cada tarea, sin indicar botones o campos. Si se atasca, anotar el bloqueo antes de ayudar.

## Tareas para el participante

| Tarea | Material / contexto que se entrega | Pregunta de cierre |
| --- | --- | --- |
| T1. Revisar una serie de potencia | `correct-15min.csv`. Explicar que cada valor es una lectura instantánea, expresada en kW. | ¿Cuánta energía se estima y entre qué momentos? ¿Es una medida exacta? |
| T2. Investigar un problema | `duplicate.csv`, potencia instantánea. | ¿Qué revisarías en el origen? ¿Cómo localizas los registros? ¿Qué significa el porcentaje temporal? |
| T3. Comprobar una exportación incompleta | `correct-15min.csv`. Se esperaban timestamps cada 15 min, desde 2023-12-31T23:45Z hasta 2024-01-01T01:15Z, ambos incluidos. | ¿Faltan datos al principio o al final? ¿Cambió la energía disponible? |
| T4. Elegir el significado energético | Mismo CSV, pero ahora se informa que cada valor es potencia media de un intervalo de 10 min y se registra cada 15 min. | ¿Qué diferencia hay entre duración y cadencia? |
| T5. Revisar el cambio horario | `dst-autumn.csv`, zona del equipo Europe/Madrid. | ¿La hora que retrocede implica que el archivo esté desordenado? |
| T6. Guardar y explicar un informe | Usar uno de los informes anteriores. | ¿Qué datos puede incluir el JSON? ¿Qué revisarías antes de compartirlo? |

Elegir 4 tareas por sesión para limitar fatiga; alternar T4 y T5 entre participantes. Incluir a alguien que prefiera teclado y, si está disponible, una persona usuaria de lector de pantalla. No simular su participación.

## Hoja de respuestas para moderación

- T1: 2 kWh aproximados entre 00:00 y 01:00 UTC; no extrapola después de la última muestra.
- T2: registros 3 y 4 del CSV representan el mismo instante. Tres instantes esperados están presentes, pero hay un duplicado adicional y la energía no se determina. 100 % de presencia temporal no demuestra calidad.
- T3: 7 posiciones esperadas, 5 presentes, 2 ausentes en los extremos; 71,4286 % temporal. La energía estimada del archivo sigue siendo 2 kWh; el periodo esperado no recorta ni rellena datos.
- T4: duración = 10 min, cadencia = 15 min; energía de cinco medias de 2 kW = 1,6667 kWh. Los 5 minutos no cubiertos entre medias no se inventan.
- T5: offsets +02:00 y +01:00 distinguen instantes; la serie conserva el orden y la cadencia reales de 15 min.
- T6: JSON incluye nombre, hash, configuración y muestras de celdas; el participante debe entender que descarga y posterior envío son decisiones distintas.

## Qué registrar

Copiar `docs/usability-session-template.md` para cada sesión fuera del repositorio público. Registrar: completada sin ayuda / con ayuda / no completada; tiempo aproximado; errores de interpretación; petición de ayuda; cita breve sin información privada; gravedad y propuesta. Los tiempos y metas son medidas del piloto, no telemetría.

Para caracterizar CSV reales, anotar solo estructura: cabecera, separador, decimal, codificación, columnas de fecha/hora, formatos, unidad declarada y significado del intervalo. Fabricar después un equivalente sintético con la misma estructura para pruebas de regresión. No subir archivos reales al repositorio.

## Cierre de H1

Requiere completar la ronda real, sintetizar obstáculos, priorizar por frecuencia/impacto y repetir las tareas afectadas tras los cambios. Objetivo de producto propuesto: que las tareas esenciales se completen sin ayuda y no aparezcan interpretaciones graves (p. ej., equiparar 100 % de timestamps con datos correctos). No se declarará H1 completo por tener este documento ni por superar pruebas de software.

Referencias metodológicas: [GOV.UK: planificar investigación](https://www.gov.uk/service-manual/user-research/plan-user-research-for-your-service), [pruebas moderadas](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing). Los ejemplos son sintéticos y no evidencia de uso real.
