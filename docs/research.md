# Investigación breve y convenciones

Consulta de documentación primaria: 27 de septiembre de 2026. Este documento delimita las decisiones del MVP, no acredita novedad ni conformidad normativa.

## Herramientas abiertas relacionadas

| Herramienta | Solapamiento comprobado | Diferencia de enfoque del MVP |
| --- | --- | --- |
| [Frictionless Framework](https://framework.frictionlessdata.io/docs/guides/validating-data.html) | Validación tabular de archivos, esquemas y controles personalizados; CLI y biblioteca. | Aquí el usuario selecciona directamente el significado energético, zona y unidad en una web local pequeña. No sustituye un sistema general de esquemas. |
| [PVAnalytics](https://pvanalytics.readthedocs.io/en/stable/) | Biblioteca Python para control de calidad fotovoltaica, huecos, valores constantes, saltos y espaciado temporal. | Aquí se revisa un único CSV genérico de potencia o energía sin entorno Python ni modelos físicos fotovoltaicos. Las heurísticas del MVP son más básicas. |

Hay por tanto competencia y capacidades existentes. La propuesta es una interfaz accesible, privada y limitada que combina revisión temporal y semántica energética, con hallazgos explicados y un informe descargable. No se afirma ser la primera ni la única herramienta que lo hace. No se ha realizado una evaluación exhaustiva de todos los proyectos ni un benchmark de precisión contra estas bibliotecas.

## Convenciones utilizadas

- **Fechas:** [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339) ofrece un perfil público de ISO 8601 para instantes. El MVP admite un subconjunto documentado más fechas locales configuradas por el usuario; no implementa toda ISO 8601 ni todos los casos RFC 3339. Un timestamp es un instante, no define por sí solo la duración ni el significado de una medición.
- **Zonas horarias:** [IANA Time Zone Database](https://www.iana.org/time-zones) describe las reglas regionales. Un offset escrito es suficiente para ubicar un instante, pero no identifica una región. Se utiliza [Temporal polyfill](https://github.com/js-temporal/temporal-polyfill), que obtiene las reglas de zona de Intl del navegador. No se descarga tzdata durante el análisis. La desambiguación de fechas locales usa `reject`.
- **Unidades:** [SI Brochure del BIPM](https://www.bipm.org/en/publications/si-brochure): el watt es potencia (J/s); el joule es energía; la hora es una unidad no SI aceptada para uso con SI. Wh expresa watt por hora de duración multiplicados, no potencia. `1 Wh = 3600 J`; `1 kWh = 1000 Wh`; `1 MWh = 1000 kWh`. Los símbolos son sensibles a mayúsculas. El informe convierte energía a kWh sin atribuir signos universales a consumo y producción.
- **Mediciones por intervalos:** la documentación de [Green Button para desarrolladores](https://green-button.github.io/developers/) describe lecturas con metadatos de unidad, intervalo temporal y características de medición. Se toma como referencia de por qué esos datos necesitan contexto explícito. El MVP no importa ESPI, no valida Green Button ni presume que los CSV lo cumplan.
- **CSV:** [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180) documenta una convención habitual de CSV. Se utiliza [Papa Parse](https://www.papaparse.com/docs) para comillas, campos y lectura por bloques; el usuario confirma el delimitador. Se admiten también punto y coma, tabulador y barra vertical como convenciones de importación, sin afirmar que todos sean RFC 4180.

## Decisiones de interpretación

1. Solo una magnitud por archivo; las demás columnas se conservan en la vista y las muestras, pero no se analizan como contadores adicionales.
2. Potencia instantánea: aproximación trapezoidal entre extremos de las muestras disponibles, con cadencia verificable. Nunca se integra a través de huecos o desorden.
3. Potencia media: es necesario declarar duración y posición del timestamp; se multiplica cada media por su duración.
4. Energía por intervalo: es necesario declarar duración para descartar solapamientos; el total suma los intervalos disponibles y no representa energía ausente.
5. Contador: diferencias consecutivas, sin adivinar el reinicio o rollover. Los retrocesos son advertencias porque también puede haber contadores netos.
6. Huecos, irregularidades, saltos, constantes, escala y umbrales son advertencias basadas en hipótesis explícitas. Una hora local repetida no se resuelve con el orden del archivo.

No se introduce un estándar energético: el JSON es únicamente el formato de salida versionado de esta aplicación.
