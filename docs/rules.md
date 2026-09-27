# Reglas del MVP

Generado a partir de `src/rules.ts`; actualiza con `npm run docs:generate`.

Cada regla agrega incidencias con muestras y referencias a registros CSV (cabecera = 1). No cambia datos. `error`: interpretación impedida; `warning`: ambigüedad o sospecha; `info`: característica o límite. Las hipótesis no se elevan a errores definitivos. Los umbrales y cálculos detallados están en [scope.md](scope.md).

## TS_EXPECTED_BOUNDARY_GAP

- Severidad: **warning**.
- Resultado: Faltan timestamps al inicio o al final del periodo esperado.
- Lógica: Rejilla inclusiva de timestamps con cadencia explícita o inferida; no se imputan registros.
- Revisión sugerida: Comprueba el periodo elegido y la exportación del origen.

## TS_OUTSIDE_EXPECTED_PERIOD

- Severidad: **warning**.
- Resultado: Hay registros fuera del periodo esperado.
- Lógica: Se excluyen de la completitud del periodo, pero no se eliminan ni se excluyen del análisis energético.
- Revisión sugerida: Revisa los límites elegidos. La energía sigue refiriéndose a los datos del archivo.

## CSV_EMPTY

- Severidad: **error**.
- Resultado: El archivo no contiene registros.
- Lógica: Un archivo vacío o solo con cabecera no es una serie.
- Revisión sugerida: Añade un encabezado y al menos un registro.

## CSV_REQUIRED_COLUMNS

- Severidad: **error**.
- Resultado: Faltan columnas para fecha y valor.
- Lógica: Este MVP necesita dos columnas distintas; una para tiempo y otra para una medición.
- Revisión sugerida: Revisa el separador o proporciona al menos dos columnas.

## CSV_PARSE

- Severidad: **error**.
- Resultado: La sintaxis CSV no se puede interpretar de forma fiable.
- Lógica: Papa Parse comunica errores de sintaxis; no se corrigen los datos.
- Revisión sugerida: Revisa comillas, delimitador y codificación UTF-8.

## CSV_COLUMN_COUNT

- Severidad: **error**.
- Resultado: La fila tiene un número distinto de columnas.
- Lógica: Se compara cada registro con la longitud de la cabecera.
- Revisión sugerida: Revisa el separador y las comillas del registro.

## CSV_HEADER_EMPTY

- Severidad: **error**.
- Resultado: Hay encabezados vacíos.
- Lógica: Un encabezado vacío tras quitar espacios impide identificar el campo.
- Revisión sugerida: Asigna nombres a todas las columnas.

## CSV_HEADER_DUPLICATE

- Severidad: **error**.
- Resultado: Hay encabezados duplicados.
- Lógica: Comparación sensible a mayúsculas tras quitar espacios.
- Revisión sugerida: Usa nombres de columna diferentes.

## CSV_DELIMITER

- Severidad: **info**.
- Resultado: Separador utilizado para leer el archivo.
- Lógica: Se admiten coma, punto y coma, tabulador y barra vertical.
- Revisión sugerida: Confirma que la vista previa tiene las columnas esperadas.

## CSV_DECIMAL

- Severidad: **info**.
- Resultado: Convención decimal elegida.
- Lógica: La elección explícita del usuario se aplica a toda la columna.
- Revisión sugerida: Confirma punto o coma; no se admiten separadores de miles.

## VALUE_MISSING

- Severidad: **error**.
- Resultado: Falta un valor numérico.
- Lógica: Campo ausente o vacío tras quitar espacios.
- Revisión sugerida: Comprueba el registro en el sistema de origen.

## VALUE_INVALID

- Severidad: **error**.
- Resultado: El valor no es un número con la convención elegida.
- Lógica: Número con signo opcional, decimal elegido y exponente opcional; sin unidades incrustadas.
- Revisión sugerida: Revisa decimales, texto y separadores de miles.

## VALUE_NONFINITE

- Severidad: **error**.
- Resultado: El valor no es finito.
- Lógica: Se excluyen los valores no finitos y el desbordamiento numérico.
- Revisión sugerida: Revisa NaN, Infinity o magnitudes fuera de rango.

## VALUE_NEGATIVE

- Severidad: **info**.
- Resultado: Hay valores negativos; pueden representar exportación.
- Lógica: No se presupone una convención universal de consumo y producción.
- Revisión sugerida: Comprueba la convención de signo del equipo.

## VALUE_JUMP

- Severidad: **warning**.
- Resultado: Cambio relativo grande entre valores consecutivos.
- Lógica: Se compara max(abs(a),abs(b))/min(abs(a),abs(b)) con jumpFactor, excluyendo ceros.
- Revisión sugerida: Comprueba si responde a una maniobra o cambio real.

## VALUE_CONSTANT

- Severidad: **warning**.
- Resultado: El valor permanece constante durante un periodo prolongado.
- Lógica: Valores exactamente iguales en filas consecutivas válidas durante constantHours; requiere tiempos crecientes sin huecos.
- Revisión sugerida: Comprueba si es funcionamiento estable o un sensor detenido.

## VALUE_UNIT_SHIFT

- Severidad: **warning**.
- Resultado: Posible cambio de escala de 1.000 veces.
- Lógica: Cociente de magnitudes entre 800 y 1200, en cualquier sentido. Heurística, no conversión.
- Revisión sugerida: Comprueba las unidades en el origen; también puede ser un cambio real.

## VALUE_HIGH

- Severidad: **warning**.
- Resultado: Se supera el umbral de magnitud configurado.
- Lógica: abs(valor) > highValue en la unidad seleccionada. Desactivado por defecto.
- Revisión sugerida: Revisa el límite elegido para este equipo y esta unidad.

## COUNTER_DECREASE

- Severidad: **warning**.
- Resultado: El contador acumulado retrocede o se reinicia.
- Lógica: Una diferencia negativa bloquea el total; no se asume un valor de reinicio.
- Revisión sugerida: Revisa reinicios, rollover o si el contador admite balance neto.

## TS_MISSING

- Severidad: **error**.
- Resultado: Falta la fecha y hora.
- Lógica: Campo ausente o vacío.
- Revisión sugerida: Consulta el timestamp original.

## TS_INVALID

- Severidad: **error**.
- Resultado: Fecha imposible o no interpretable.
- Lógica: Validación estricta de calendario; no se normalizan fechas imposibles.
- Revisión sugerida: Usa AAAA-MM-DDTHH:mm:ss con Z, offset o zona seleccionada.

## TS_UNSUPPORTED

- Severidad: **warning**.
- Resultado: Formato temporal fuera del perfil del MVP.
- Lógica: No se interpretan fechas regionales, semana ISO, segundos intercalares ni -00:00; no significa que sean inválidos según ISO 8601.
- Revisión sugerida: Expresa la fecha con año de cuatro dígitos, mes, día y hora; precisión máxima de milisegundos.

## TS_ZONE_REQUIRED

- Severidad: **warning**.
- Resultado: Una fecha local necesita zona horaria.
- Lógica: No se usa implícitamente la zona del navegador.
- Revisión sugerida: Selecciona la zona IANA del sistema de origen.

## TS_LOCAL_AMBIGUOUS

- Severidad: **warning**.
- Resultado: La hora local se repite o no existe por un cambio horario.
- Lógica: Temporal disambiguation=reject; no se desplazan horas ni se elige una de las dos repeticiones.
- Revisión sugerida: Proporciona timestamps con offsets explícitos del origen.

## TS_MIXED_FORMAT

- Severidad: **warning**.
- Resultado: Se utilizan distintos formatos de fecha.
- Lógica: Se distinguen T/espacio, precisión y presencia o ausencia de offset.
- Revisión sugerida: Comprueba que todas las filas tienen la misma interpretación.

## TS_MIXED_ZONE

- Severidad: **warning**.
- Resultado: Se mezclan fechas con y sin offset.
- Lógica: Los offsets explícitos se conservan; la zona solo interpreta fechas locales.
- Revisión sugerida: Verifica la zona elegida para las fechas locales.

## TS_OFFSET_CHANGE

- Severidad: **warning**.
- Resultado: Los offsets cambian y no se han explicado por la zona seleccionada.
- Lógica: Con múltiples offsets, todos deben coincidir con las reglas de la zona en sus respectivos instantes. Una coincidencia no demuestra por sí sola la causa del cambio.
- Revisión sugerida: Selecciona una zona IANA y comprueba el origen de los offsets.

## TS_ZONE_MISMATCH

- Severidad: **warning**.
- Resultado: Un offset no coincide con la zona seleccionada.
- Lógica: Se compara el offset explícito con el offset IANA de ese instante; no se sobrescribe.
- Revisión sugerida: Comprueba la zona y el offset del archivo.

## TS_DUPLICATE_TIMESTAMP

- Severidad: **error**.
- Resultado: Hay timestamps que representan el mismo instante.
- Lógica: Comparación del instante UTC, aunque la representación escrita sea diferente.
- Revisión sugerida: Revisa los registros repetidos en el origen.

## TS_OUT_OF_ORDER

- Severidad: **warning**.
- Resultado: Los registros no están en orden temporal.
- Lógica: Se compara con el timestamp válido previo; no se reordena el archivo ni se integra potencia desordenada.
- Revisión sugerida: Revisa el orden del archivo original.

## TS_FREQUENCY

- Severidad: **info**.
- Resultado: Resumen de frecuencia temporal.
- Lógica: Moda única de diferencias positivas entre instantes únicos ordenados, con soporte > 50%; una sola diferencia no basta. La cadencia elegida tiene prioridad para evaluar separaciones; la duración solo describe cada medición.
- Revisión sugerida: Confirma la cadencia esperada si la conoces.

## TS_GAP

- Severidad: **warning**.
- Resultado: Posible hueco respecto a la cadencia de referencia.
- Lógica: Diferencia > referencia × 1.01. Es una inferencia; se opera en UTC para respetar DST.
- Revisión sugerida: Comprueba si faltan registros o si el muestreo es variable.

## TS_IRREGULAR

- Severidad: **warning**.
- Resultado: La separación temporal no coincide con la referencia.
- Lógica: Diferencia distinta de la referencia con tolerancia del 1%; si no hay moda, se advierte la irregularidad global.
- Revisión sugerida: Comprueba si la frecuencia es variable.

## TS_OVERLAP

- Severidad: **warning**.
- Resultado: Los intervalos declarados se solapan.
- Lógica: Solo energía por intervalo o potencia media con duración explícita; delta < duración. Se considera el intervalo [inicio, fin).
- Revisión sugerida: Revisa duración y significado del timestamp.

## ENERGY_UNIT

- Severidad: **error**.
- Resultado: La unidad no corresponde al tipo de medición.
- Lógica: No se intercambian magnitudes de potencia y energía.
- Revisión sugerida: Usa W/kW/MW para potencia y Wh/kWh/MWh para energía.

## ENERGY_UNDETERMINED

- Severidad: **info**.
- Resultado: La energía total no es determinable con esta configuración.
- Lógica: No se calcula un total ante ambigüedades, errores o intervalos insuficientes.
- Revisión sugerida: Revisa las condiciones del cálculo indicadas en el resumen.

## ENERGY_ESTIMATE

- Severidad: **warning**.
- Resultado: La energía de potencia instantánea es una aproximación.
- Lógica: Integración trapezoidal exclusivamente entre primera y última muestra; sin extrapolación.
- Revisión sugerida: Valora si la interpolación lineal representa el comportamiento entre muestras.
