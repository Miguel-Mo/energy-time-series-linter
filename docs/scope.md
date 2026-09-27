# Alcance del MVP

## Qué se valida

La estructura de un CSV UTF-8 con cabecera, una columna temporal y una numérica; instantes, orden, duplicados y continuidad; unidades de potencia/energía coherentes con el tipo elegido; advertencias simples sobre valores, reinicios y cambios de escala. Cada regla está en [rules.md](rules.md). El usuario debe revisar las opciones detectadas antes del análisis. Las columnas se eligen por índice para evitar ambigüedad por nombres duplicados.

Límites: 10 MiB, 100.000 registros de datos, 100 columnas, 60 segundos por operación en la interfaz. Se aceptan archivos vacíos para informar el error, no para calcular. Un salto de línea final no crea un registro adicional; las líneas vacías interiores sí se inspeccionan. Las referencias de fila son números de **registro CSV**, cabecera = 1; un campo entrecomillado con saltos de línea sigue siendo un solo registro.

## Perfil temporal

Se admite `AAAA-MM-DDTHH:mm[:ss[.SSS]]` con `Z`, `±HH:mm` o sin offset; se acepta espacio en lugar de T y t/z en minúscula. Fracción decimal de 1 a 3 cifras y solo con segundos. El calendario se comprueba estrictamente: no se convierte el 31 de abril en mayo. Precisión interna: milisegundos.

Fechas regionales, años expandidos, semana/ordinal ISO, submilisegundos, `24:00`, segundos intercalares y offset desconocido `-00:00` no se interpretan automáticamente. Un formato fuera de perfil produce advertencia; una fecha imposible dentro del perfil o texto sin fecha interpretable produce error. El programa no es un validador universal de ISO 8601.

Las fechas locales requieren zona explícita IANA. Una hora inexistente o repetida queda sin resolver y bloquea energía y completitud. Se recomienda volver al origen para obtener su offset real. No se elige automáticamente un lado del cambio de hora. Para offsets explícitos, la zona elegida solo contrasta si coinciden con la región. Múltiples offsets sin zona explicativa generan advertencia, no prueba de datos incorrectos. Una coincidencia IANA explica la compatibilidad, no demuestra que el cambio se debiera a DST.

Las diferencias se calculan entre instantes UTC; los días civiles no se fuerzan a 24 horas. La frecuencia inferida usa una copia ordenada de instantes únicos: **el archivo y el orden de sus valores nunca se modifican**. La energía de una serie desordenada se deja sin determinar.

## Estadísticas y energía

- Periodo observado: mínimo y máximo timestamp interpretable en UTC; puede ser parcial si hay fechas sin resolver. Duración transcurrida = último menos primero.
- Frecuencia: moda única de deltas positivos con soporte > 50% y al menos dos deltas. Un par aislado no basta para inferirla. Una cadencia elegida por el usuario tiene prioridad para advertencias, sin reemplazar el campo de frecuencia inferida.
- Registros esperados: `(fin - inicio) / referencia + 1`, para límites inclusivos de timestamps observados o elegidos. Requiere todos los timestamps resueltos, límites y puntos interiores en la rejilla exacta (tolerancia 1e-6 de intervalo) y un recuento entero representable. Los puntos fuera del periodo no entran en su porcentaje.
- Completitud temporal: instantes únicos presentes / timestamps esperados, sin contar duplicados de nuevo y con independencia de la validez numérica. Se informa además la fracción de instantes con al menos un valor numérico válido y anchura correcta. Una cifra de 100 % no demuestra calidad: duplicados y valores interpretables aparecen separados. Sin rejilla fiable: `null` / «No determinable».
- Periodo esperado opcional: permite detectar timestamps ausentes antes y después de los presentes. Los límites son inclusivos y se interpretan con offsets explícitos o la zona elegida; no se desambiguan fechas locales. Esta configuración no recorta los datos ni cambia el cálculo energético. Las filas exteriores se cuentan aparte.
- Valores interpretables: números finitos válidos / registros, no una medida física ni una media temporal. Duplicados: número de lecturas adicionales de instantes ya presentes.
- Cobertura: unión de intervalos declarados para medias/energía; tiempo entre extremos para contador; entre muestras para potencia instantánea solo con una cadencia regular y fechas resueltas. No es el periodo civil facturado ni asegura que los valores sean válidos.
- Potencia instantánea: `Σ (Pᵢ/2 + Pᵢ₊₁/2) × (tᵢ₊₁ - tᵢ) / 3.600.000` con P en kW. Requiere al menos dos puntos, referencia y ausencia de huecos/irregularidad. Es aproximación lineal advertida, sin extrapolar última muestra.
- Potencia media: `Σ Pᵢ × duraciónMin / 60`, en kWh. Se incluye cada intervalo explícito.
- Energía por intervalo: suma de todos los valores convertidos a kWh. No se completan huecos.
- Contador: suma de diferencias. Ante retroceso no se publica total; el subtotal de diferencias no negativas se identifica claramente como incompleto. No interpreta rollover ni contadores bidireccionales.
- Errores, fechas sin resolver, valores inválidos, desorden, incompatibilidad con zona elegida o posible salto de escala de 1000 impiden presentar un total. Un salto de escala es solo una heurística: la inhibición del total no demuestra cambio de unidad.

Para medias y energía, la posición inicio/fin fija intervalos `[t, t+d)` o `[t-d, t)`. La detección de solapamiento y la duración de su unión coinciden en ambos casos cuando todos tienen igual duración; no se inventa una duración variable por fila. Los extremos observados se refieren a timestamps, no a los límites externos de esos intervalos.

## Qué no se valida

No se verifica precisión metrológica, calibración, corrección física, facturación, fraude, autenticidad, cumplimiento normativo ni certificación. No se detectan todos los fallos; una serie sin errores no demuestra que sea correcta. Los umbrales de saltos y constantes son básicos y configurables, no modelos de anomalías.

No incluye reparaciones, interpolación de huecos, imputación, IA, gráficas avanzadas, varios archivos/medidores, Excel/Parquet, tensión, corriente, reactiva, factor de potencia, precios, emisiones, APIs de equipos, autenticación, base de datos ni procesamiento de servidor. No hay exportación CSV: el informe JSON no ejecuta fórmulas.

## Reproducibilidad

Sin reloj de ejecución, IDs aleatorios ni opciones implícitas de zona. El mismo archivo (bytes), configuración, versión y entorno de zonas producen el mismo JSON. **Intl utiliza la base de zonas del navegador/SO**; cambios de tzdata entre entornos pueden cambiar interpretaciones locales históricas o futuras. El MVP no fija una copia independiente de tzdata. Las entradas con offsets explícitos y sin contraste de zona son independientes de esa base. Las versiones de bibliotecas están bloqueadas con el lockfile. No se promete igualdad de resultados para entornos con reglas regionales distintas.
