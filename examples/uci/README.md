# UCI: fecha y hora separadas

Extracto público real de 1440 registros del 17 de diciembre de 2006, conservando las nueve columnas, los separadores `;`, los números y los saltos de línea originales. Se cambia únicamente la extensión de `.txt` a `.csv` y se selecciona un día. No se rellenan valores.

Fuente: [Individual Household Electric Power Consumption](https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption). Atribución: Hebrail, G. & Berard, A. (2006), UCI Machine Learning Repository, [DOI 10.24432/C58K54](https://doi.org/10.24432/C58K54). Datos bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), no bajo la licencia MIT del código.

En la app 0.5.0 elige **Real · UCI · Fecha y hora separadas**. También puedes cargar [el CSV](household-2006-12-17.csv) y configurar:

| Campo | Valor |
| --- | --- |
| Fecha | Date, primera columna |
| Formato | Día/mes/año |
| Hora separada | Time, segunda columna |
| Valores | Global_active_power, tercera columna |
| Tipo y unidad | Potencia media por intervalo, kW |
| Separador / decimal | Punto y coma / punto |
| Duración / cadencia | 1 minuto / 1 minuto |
| Zona propuesta | Europe/Paris, hipótesis geográfica explícita |
| Posición propuesta | Inicio, hipótesis de prueba |

La fuente identifica potencia media por minuto y la ubicación Sceaux (Francia), pero no declara zona horaria ni si la etiqueta temporal corresponde al inicio o final del intervalo. Las propuestas se muestran como hipótesis en la interfaz. No hay transición DST en el día seleccionado. El total de medias × 1/60 h es independiente de la hipótesis inicio/fin; la cobertura temporal sí depende de ella.

Resultado de referencia: **56,5076666667 kWh**, 1440 valores presentes. La referencia se calcula con Decimal de Python directamente desde los valores publicados, separadamente del motor TypeScript. No acredita precisión física de los sensores.

Reproducir: `python scripts/prepare-uci-data.py`, con Python 3 y biblioteca estándar. Descarga unos 20 MB la primera vez y conserva el ZIP original en `data-cache/` (fuera de Git). [manifest.json](manifest.json) contiene URL, hashes del ZIP y extracto, rango de líneas, atribución e hipótesis. El archivo completo supera los límites de la aplicación; este extracto ocupa unos 95 kB.
