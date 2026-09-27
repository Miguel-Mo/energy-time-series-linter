# Datos reales para probar

Cuatro extractos de mediciones públicas de **CoSSMic / Open Power System Data**, versión 2020-04-15. Son datos históricos de instalaciones de Alemania, procesados por el publicador; no son series sintéticas. Todos están por debajo de 150 kB y se pueden cargar directamente en la herramienta.

## Abrir y configurar

1. Abre la aplicación y carga uno de los CSV de esta carpeta.
2. Fecha y hora: **utc_timestamp**. Valores: la columna que empieza por **DE_KN_** (la segunda).
3. Tipo: **Contador acumulado**. Unidad: **kWh**. Decimal: **punto**. Separador: **coma**.
4. Cadencia esperada: **60 minutos**. Deja la zona horaria y el periodo esperado vacíos: los timestamps principales ya contienen `Z` (UTC).
5. Analiza. No selecciones «Energía por intervalo»: sumar los valores acumulados produciría un resultado incorrecto.

| Archivo | Periodo UTC, extremo final excluido | Filas | Valores ausentes | Filas marcadas como interpoladas para esta señal |
| --- | --- | ---: | ---: | ---: |
| [consumo-industrial.csv](consumo-industrial.csv) | 1 marzo–1 abril 2016 | 744 | 0 | 362 |
| [solar-industrial.csv](solar-industrial.csv) | 1 marzo–1 abril 2016 | 744 | 0 | 256 |
| [bateria-inicio-registro.csv](bateria-inicio-registro.csv) | 24 abril–2 mayo 2016 | 192 | 39 | 0 |
| [consumo-escuela.csv](consumo-escuela.csv) | 1 junio–1 julio 2016 | 720 | 0 | 171 |

## Qué comprobar

- **Consumo industrial:** carga de un contador real con 744 timestamps horarios únicos. Completitud temporal y utilizable: 100 % dentro del periodo observado.
- **Solar:** contador con periodos sin incremento, incluidos periodos nocturnos. Una señal constante no implica automáticamente un sensor averiado. Los timestamps UTC atraviesan el cambio horario europeo de marzo sin duplicarse.
- **Batería:** conserva 39 valores vacíos al comienzo de la selección, antes de que empiece este registro. Completitud temporal: 100 %; utilizable: 79,6875 %. Sirve para comprobar que tener todas las fechas no equivale a tener todos los valores. No se han borrado datos artificialmente.
- **Escuela:** otro patrón de consumo y 720 registros horarios. Completitud temporal y utilizable: 100 % en el periodo observado.

Los valores utilizables no equivalen a mediciones originales verificadas: la herramienta no interpreta la columna `interpolated`. La fuente regularizó y rellenó huecos. Conservamos su marcador completo (también menciona otras señales del archivo fuente); solo las menciones a la columna elegida son relevantes. Un marcador vacío no certifica ausencia de procesamiento previo.

La columna auxiliar `cet_cest_timestamp` se conserva exactamente como se publicó, incluidos offsets `+0100`/`+0200`, admitidos desde la app 0.4.0. Puedes elegirla como fecha y hora sin indicar zona: debe producir los mismos instantes, energía y completitud que UTC. Para contrastar los cambios de offset con una región puedes indicar `Europe/Berlin`; no se sobrescribe el offset original. El contador horario de la fuente se remuestreó con `.last()`; su etiqueta corresponde al inicio de la ventana según los metadatos. No debe interpretarse como una medida instantánea tomada exactamente a ese segundo.

Estos casos amplían la prueba técnica; no sustituyen sesiones de usabilidad con personas ni validación independiente.

## Procedencia, licencia y reproducción

- [Publicación y descarga originales](https://data.open-power-system-data.org/household_data/2020-04-15/).
- [Metadatos y licencia de los datos](https://data.open-power-system-data.org/household_data/2020-04-15/datapackage.json): **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**. Los datos de esta carpeta no están bajo la licencia MIT del código.
- Atribución: Open Power System Data. 2020. Data Package Household Data. Version 2020-04-15. Datos primarios: CoSSMic. Véase la publicación enlazada.
- [Procesamiento publicado en GitHub](https://github.com/isc-konstanz/household_data/blob/2020-04-15/processing.ipynb).

Modificaciones realizadas aquí: seleccionar periodos y cuatro columnas; serializar como CSV UTF-8 con saltos LF. Sin cambiar números, timestamps, marcadores ni valores vacíos; sin interpolar, convertir unidades ni añadir anomalías.

Desde la raíz del repositorio: `node scripts/prepare-real-data.mjs`. Descarga aproximadamente 15 MB la primera vez; reutiliza después `data-cache/opsd-60min.csv` y los metadatos. La caché conserva el archivo publicado intacto, no el material bruto de los sensores, y está excluida de Git. [manifest.json](manifest.json) contiene hashes SHA-256, rangos de líneas del original, tamaños y configuración. `npx vitest run tests/real-data.test.ts` comprueba integridad y métricas con el motor real de la aplicación.
