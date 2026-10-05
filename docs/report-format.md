# Informe JSON 2.0.0

La app 0.8.0 añade [un informe HTML autónomo](portable-report.md) para lectura e impresión. El JSON y su versión de formato se conservan; el HTML es una presentación y no se reimporta.

Formato propio de salida de la aplicación, no estándar energético ni certificado. UTF-8, JSON con sangría de dos espacios y salto de línea final. `null` significa no determinable/no disponible; nunca cero implícito. Todos los números exportados son finitos. No incluye fecha de ejecución para conservar reproducibilidad.

| Campo | Contenido |
| --- | --- |
| `reportVersion` | `2.0.0`, versión semántica del formato. Cambios incompatibles incrementarán la versión mayor. |
| `appVersion` | Versión del algoritmo/interfaz que generó el informe. |
| `file` | `name`, `sha256` hexadecimal en minúscula calculado sobre bytes originales, `bytes`. No contiene el archivo completo. |
| `configuration` | Opciones **elegidas**: índices base cero `timestampColumn`, `valueColumn`; `measurement`, `unit`, `timezone`, `decimal`, `delimiter`, `intervalMinutes`, `intervalPosition`, `cadenceMinutes`, `expectedStart`, `expectedEnd`, `highValue`, `constantHours`, `jumpFactor`. |
| `observed` | Delimitador usado, cabeceras originales, recuento de registros, offsets normalizados a `±HH:mm` y firmas de formato observadas. Los offsets de fechas locales son resultado de su interpretación con la zona configurada. |
| `inferences` | `frequencySeconds`, `frequencySupport` (0..1), `referenceSeconds`, `expectedRecords`; `temporalCompletenessPercent` y `usableCompletenessPercent` (0..100); `periodBasis` (`observed` o `configured`), `periodStart`, `periodEnd` (UTC), `presentRecords`, `usableRecords`, `missingBoundaryRecords`, `reason`. Inferencias sujetas a la rejilla documentada. |
| `quality` | `validValuePercent`: números interpretables / filas, independiente de fechas; `duplicateRecords`: repeticiones adicionales de instantes resueltos; `outsidePeriodRecords`: filas con timestamp resuelto fuera del periodo elegido. |
| `temporal` | `first`, `last` en UTC ISO; `elapsedSeconds`, `coveredSeconds`; `validTimestamps`, `uniqueTimestamps`; `timezone`. Los límites se refieren a timestamps de las filas, no a los límites externos de intervalos. |
| `values` | `valid`, `missing` (todos los valores excluidos, vacíos o inválidos), `min`, `max`, `mean`, `negative`, en la unidad elegida. No representa estadística ponderada por tiempo. |
| `energy` | `totalKWh`, `observedSubtotalKWh`, `method` y `reason`. Un subtotal de contador con reinicio nunca es el total. El signo se conserva. El total de intervalos solo representa registros disponibles. |
| `findings` | Lista ordenada por código estable; ver abajo. |
| `counts` | Recuentos de incidencias por `error`, `warning`, `info`. Un registro puede activar varias reglas. No son números de filas únicas. |
| `rulesExecuted` | Códigos de reglas evaluadas, incluidas las que no produjeron incidencias. |
| `rulesNotExecuted` | `{code, reason}` para cada regla cuya condición de aplicación no se cumplió o que fue desactivada. Junto con las ejecutadas cubre el catálogo completo sin duplicados. |

Tipos de medición: `power-instant`, `power-mean`, `interval-energy`, `counter`. Unidades: `W`, `kW`, `MW`, `Wh`, `kWh`, `MWh`. `timezone: ""` significa usar solo los offsets presentes; nunca la zona por defecto del navegador. `intervalMinutes`, `cadenceMinutes` y `highValue` son positivos o `null`. La duración y la cadencia son independientes. `expectedStart` y `expectedEnd` son cadenas temporales inequívocas o ambos `null`; los extremos son timestamps esperados incluidos. `intervalPosition`: `start` o `end`. `constantHours` por defecto 24, `jumpFactor` por defecto 10. Los decimales son `.` o `,`; los delimitadores `,`, `;`, `\t` o `|`.

## Un hallazgo

Desde la versión 2.0.0, `temporalCompletenessPercent` mide presencia de timestamps y `usableCompletenessPercent` exige además al menos un valor numérico válido y anchura correcta en ese instante. Un duplicado puede contener datos contradictorios aunque ambos porcentajes sean 100 %: consulta siempre `quality.duplicateRecords` y los hallazgos. `presentRecords` y `usableRecords` cuentan instantes únicos en el periodo; `observed.rows` y `values.valid` cuentan filas de todo el archivo.

`missingBoundaryRecords` cuenta las posiciones de rejilla anteriores al primer instante presente y posteriores al último dentro del periodo, o todas si el periodo está vacío. No incluye huecos interiores. `reason` explica por qué no se puede calcular completitud. Una cadencia muy pequeña que produzca un número no representable de posiciones se deja como `null`.

### Migración desde 1.0.0

La aplicación no importa informes previos. Los consumidores externos deben comprobar `reportVersion`. Se elimina `inferences.completenessPercent`, cuyo concepto combinado se separa en dos métricas. Se añaden `quality` y metadatos del periodo. `configuration.intervalMinutes` pasa a significar solo duración de una media o energía por intervalo; `cadenceMinutes` es la separación esperada entre registros. No se copia automáticamente el antiguo valor a ambos campos: el usuario debe confirmar esas dos interpretaciones.

### Ejemplo de hallazgo

```json
{
  "code": "TS_DUPLICATE_TIMESTAMP",
  "severity": "error",
  "description": "Hay timestamps que representan el mismo instante.",
  "suggestion": "Revisa los registros repetidos en el origen.",
  "technical": "Comparación del instante UTC, aunque la representación escrita sea diferente.",
  "count": 1,
  "samples": [{
    "rows": [3, 4],
    "found": "2024-01-01T00:15:00Z",
    "cells": [["2024-01-01T00:15:00Z", "2"], ["2024-01-01T00:15:00Z", "3"]]
  }],
  "samplesTruncated": false
}
```

Cada código agrega incidencias. `count` es el recuento completo de incidencias de esa regla; `samples` contiene como máximo las primeras 50. `rows` contiene registros involucrados, base uno e incluyendo cabecera. Para constantes, los dos números marcan inicio y fin del rango; para comparaciones, los registros comparados. `rows: []` indica una característica del archivo completo. `cells` corresponde a esos registros y no incluye todas las filas intermedias de un rango. Las celdas se truncan a 160 caracteres y `found` a 240 para limitar memoria e interfaz; no se modifica el archivo original. `samplesTruncated` indica truncamiento del número de ejemplos, no de los textos.

Severidades: `error` impide una interpretación fiable de los campos afectados; `warning` indica ambigüedad o un dato sospechoso posiblemente legítimo; `info` describe una característica o una limitación. No hay un booleano de certificación ni un sello de calidad.

El informe no guarda los datos crudos completos. Para reproducirlo conserva el CSV original, configuración, versión de aplicación y entorno con las mismas reglas Intl/IANA. El nombre forma parte del informe; renombrar el archivo cambia `file.name`, aunque no su hash. El hash identifica bytes, no anonimiza las muestras ni autentica el origen. La disponibilidad de datos de zonas del navegador limita la reproducibilidad entre entornos; consulta [scope.md](scope.md).
# Extensión de configuración en app 0.5.0

El esquema 2.0.0 recibe dos campos opcionales: `configuration.dateFormat` (`iso`, `dmy`, `mdy`; ausente equivale a `iso`) y `configuration.timeColumn` (índice de columna basado en cero; ausente o null equivale a fecha y hora juntas). Los informes nuevos incluyen ambas decisiones. Los consumidores que reproduzcan cálculos deben entenderlas o rechazar configuraciones que no soporten; ignorarlas puede interpretar mal fechas regionales. `expectedStart` y `expectedEnd` siguen expresándose en ISO. El hash y las muestras corresponden al CSV original, no a una versión con columnas fusionadas.
