# Energy Time-Series Linter

Una pequeña herramienta open source para revisar un CSV energético antes de importarlo en otra plataforma. Aplicación estática, procesamiento local en el navegador, sin backend, cuentas, cookies, analítica ni almacenamiento automático.

**Your file is processed locally and is not uploaded.**

MVP experimental independiente. No certifica datos ni conformidad con estándares. La investigación inicial y las diferencias frente a herramientas existentes están en [docs/research.md](docs/research.md).

## Instalación y uso

Requisitos de desarrollo: Node.js 24 o posterior y npm. Navegador moderno con Web Workers, Web Crypto e Intl; servir por HTTPS o localhost.

```sh
npm install
npm test
npm run build
npm run preview
```

Abre la dirección local mostrada por Vite. `npm run dev` sirve para desarrollo; la política CSP bloquea su conexión HMR. Para verificar privacidad y desconexión utiliza siempre la compilación y `preview`. No abras `dist/index.html` mediante `file://`.

1. Selecciona un CSV UTF-8 o prueba uno de los diez ejemplos incluidos.
2. Revisa la vista previa y las columnas, separador, decimal, unidad y tipo de medición. Las sugerencias no equivalen a confirmación. Potencia instantánea y media no se pueden distinguir con una cabecera `kW`.
3. Para fechas sin offset, indica una zona IANA como `Europe/Madrid`. Para potencia media y energía por intervalo, declara la duración y si el timestamp marca inicio o fin. La cadencia entre timestamps se configura aparte de la duración de cada medición; opcionalmente, indica el primer y último timestamp esperados para evaluar ausencias en los extremos.
4. Confirma la configuración y pulsa **Analizar archivo**.
5. Filtra hallazgos y selecciona uno para inspeccionar sus registros. Descarga el informe JSON si lo necesitas.

El archivo original nunca se modifica. Los negativos pueden representar exportación. Ante horas locales repetidas o inexistentes se solicitan offsets del origen, sin resolverlas automáticamente. Los totales de intervalos suman únicamente los registros disponibles; no incluyen huecos.

## Límites y privacidad

- Un archivo, una medición, máximo **10 MiB, 100.000 registros y 100 columnas**.
- Procesamiento CSV en bloques de 256 KiB dentro de un Worker. Se mantiene una copia en memoria, no en disco. Cancelar termina el Worker; hay un límite de 60 segundos por operación en la interfaz.
- El Worker y los ejemplos están incluidos en el paquete inicial. Después de cargar la aplicación, seleccionar archivos, analizar y descargar JSON no requiere solicitudes de red. La CSP incluye `connect-src 'none'`.
- No se guarda el CSV en localStorage, sessionStorage, cookies, IndexedDB o un servidor. Cerrar la página descarta los datos; el navegador conserva sus propios recursos estáticos según su caché.
- La carga inicial necesita acceso al servidor estático. Es posible desconectar Internet y analizar mientras la página sigue abierta. No se promete recargar la página sin red ni se instala un service worker.
- El informe exportado **sí contiene el nombre, hash y muestras de celdas**. Su descarga es manual; revísalo antes de compartirlo.
- Se exporta solo JSON. No hay exportación CSV ni ejecución de fórmulas. Los contenidos del archivo se muestran como texto, nunca como HTML.

## Pruebas y revisión visual

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run docs:check
```

Vitest cubre CSV, números, límites, timestamps, DST de Madrid, intervalos, energía y reproducibilidad. Playwright prueba la compilación real en escritorio y móvil, desconecta la red, cuenta solicitudes, descarga JSON, verifica texto malicioso y ausencia de almacenamiento. Genera capturas en `test-results/`. El puerto 43871 se reserva para estas pruebas y no se reutiliza otro servidor existente.

## Publicación en GitHub Pages

El proyecto es independiente; no contiene credenciales ni un repositorio remoto preconfigurado. Para publicarlo, crea el repositorio de GitHub y sube estos archivos. En **Settings → Pages → Build and deployment**, selecciona **GitHub Actions**. Ejecuta manualmente el workflow **Deploy Pages** desde la rama que quieras publicar. Necesitas habilitar Pages en tu cuenta/repositorio.

La construcción usa `base: './'` y funciona tanto en dominio raíz como bajo `/nombre-del-repositorio/`. `dist/` es el artefacto publicable; ningún servidor de procesamiento es necesario. El workflow CI verifica cada push y pull request; el despliegue solo se activa manualmente y ejecuta las pruebas antes de publicar.

## Documentación

- [Alcance y límites](docs/scope.md)
- [Investigación y convenciones públicas](docs/research.md)
- [Reglas y fórmulas](docs/rules.md)
- [Formato versionado del informe](docs/report-format.md)
- [Ejemplos](examples/README.md)
- [Cuatro CSV de datos reales: consumo, solar y batería](examples/real/README.md)
- [Verificación y capturas](docs/verification.md)
- [Entrega de usabilidad 0.2.0](docs/milestones.md)
- [H1: evaluación interna sin participantes y guía de prueba](docs/h1-internal-evaluation.md)
- [Protocolo opcional de futuras sesiones](docs/usability-pilot.md)

Arquitectura: `csv.ts` interpreta CSV y números; `time.ts` interpreta instantes; `analyze.ts` ejecuta reglas puras; `worker.ts` mantiene datos y hash fuera del hilo de interfaz; `main.ts` presenta los resultados. `rules.ts` es el catálogo que genera `docs/rules.md`. Sin framework de interfaz. Las versiones exactas de dependencias están fijadas en `package.json` y `package-lock.json`.

Licencia [MIT](LICENSE). Las licencias de Papa Parse y Temporal son, respectivamente, MIT e ISC; siguen perteneciendo a sus autores. Consulta [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
