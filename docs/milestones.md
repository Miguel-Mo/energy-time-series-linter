# Hitos de usabilidad — entrega actual 0.3.1

La entrega 0.2.0 abordó H1, H2, H3 y H5; 0.3.0 añadió H4. En 0.3.1, ante la decisión del propietario de no disponer de participantes, H1 se reformula y se cierra mediante evaluación interna documentada. La validación con usuarios no se ha realizado y deja de ser requisito bloqueante; la publicación sigue pendiente.

| Hito | Entrega | Estado / validación pendiente |
| --- | --- | --- |
| H1. Evaluación interna con datos reales (alcance reformulado) | [Recorrido documentado](h1-internal-evaluation.md), cuatro ejemplos guiados incorporados, comprobaciones reproducibles y mejoras derivadas | Cerrado para el alcance interno por decisión de no disponer de participantes. No es validación con usuarios; el piloto humano deja de ser un requisito bloqueante. |
| H2. Configuración guiada | Ayuda por tipo, duración/cadencia separadas, campos pertinentes, unidades compatibles, errores enlazados antes de analizar | Implementado; cubierto por pruebas de navegador. |
| H3. Interpretación del resumen | Presencia temporal, valores interpretables y duplicados separados; periodo esperado explícito; causas de energía no determinable | Implementado; casos deterministas y pruebas de interfaz. |
| H4. Navegación de hallazgos | Búsqueda por regla/descripción, filtro por fila en muestras, páginas de cinco ejemplos, vuelta con foco y limpieza de filtros | Implementado en 0.3.0. Se conserva el límite de 50 muestras por regla; la búsqueda por fila no cubre registros fuera de esas muestras. Pruebas de teclado, exportación, móvil y batería real. |
| H5. Accesibilidad | Texto y contraste, controles táctiles, enlace de salto, foco y teclado, errores asociados, movimiento reducido, auditoría axe | Mejoras implementadas; la evaluación manual con lectores de pantalla y usuarios sigue pendiente. No es una declaración de conformidad WCAG. |
| H6. Formatos reales | Ampliar compatibilidad usando exportaciones documentadas, sin conversiones silenciosas | Pendiente. Base disponible: cuatro CSV CoSSMic; todavía no representa variedad de proveedores. |
| H7. Guía temporal | Ayuda contextual para offsets, horas locales y cambios de horario | Ayuda básica disponible; profundización pendiente. |
| H8. Reproducibilidad y navegadores | Ampliar pruebas fuera de Chromium y documentar diferencias temporales | Pendiente; móvil actual es emulación Chromium. |
| H9. Portabilidad del informe | Facilitar compartir e interpretar el informe fuera de la aplicación | JSON versionado disponible; ampliación pendiente. |
| H10. Beta pública | Preparar publicación, documentación y canal de incidencias | Pendiente; sin despliegue público. |

El informe pasó a 2.0.0 con el cambio de semántica de configuración y completitud en la app 0.2.0. La app 0.3.0 conserva ese esquema: los filtros y la paginación solo afectan a la presentación. La privacidad, el archivo original y el procesamiento local se conservan.
