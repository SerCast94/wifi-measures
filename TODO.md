# TO DO — Rediseño Frontend (interconexión + visualización + informes)

> Objetivo: recopilar datos de Link-Live → mostrarlos dinámicamente → gráficas → detalle → informe unificado.

## Fase 0 — Navegación e interconexión (base)
- [x] 0.1 Añadir "Mapa" al sidebar (ruta /map existe pero es huérfana).
- [x] 0.2 Renombrar columna "DISPOSITIVO" de tabla medidas → "Área", convertirla en link a /areas/:id.
- [x] 0.3 Cross-links Medida ↔ Área ↔ Unidad:
  - MeasureHeader: chip/enlace al Área y a la Unidad (/units?q=unitId).
  - UnitsTable: acción "Ver resultados" → /measures filtrado por unidad.
- [x] 0.4 Cross-link Encuesta → Análisis usando analysisGuid (buscar análisis local por guid y enlazar).
- [x] 0.5 Área → enlace a encuesta origen cuando su heatmap venga de una survey (source:"linklive", surveyId).
- [x] 0.6 Dashboard: tarjetas clicables con filtros (ej. "Rojos" → /measures?color=red).
- [x] 0.7 Breadcrumbs consistentes en páginas de detalle (Medidas / :id, Áreas / :id, etc.).

## Fase 1 — Dashboard dinámico y visual
- [x] 1.1 Gráfica evolución temporal de resultados (apilada por color, recharts).
- [x] 1.2 Histograma de distribución de señal/SNR de las medidas.
- [x] 1.3 Top motivos de fallo más frecuentes (bar horizontal).
- [x] 1.4 Indicador global de sincronización (última sync por fuente: medidas/encuestas/análisis) + botón "Sincronizar todo".
- [x] 1.5 Ocultar botones sync si el usuario no tiene permiso SYNC_MEASURES/MANAGE_MEASURES.

## Fase 2 — Detalle de medida rico (estilo Link-Live)
- [x] 2.1 Rediseñar NetAllyTab: cabecera con badge grande de resultado + motivos de fallo destacados; secciones colapsables (Enlace, Red, DHCP/DNS/WWW, Unidad, Fechas, IDs).
- [x] 2.2 GraficasTab: tarjetas/gauges por métrica con umbral de color usando los campos *Color del raw (linkSignalLevelMeanColor, linkSNRMeanColor...).
- [x] 2.3 GraficasTab: soporte series temporales para sesiones (channelUtilArray, coChannelInterference, adjacentChannelInterference, rogueAps) cuando vengan pobladas.
- [x] 2.4 ArchivosTab: mostrar attachments e imágenes de Link-Live (raw.attachments, meta.hasImages).

## Fase 3 — Informe unificado (agrega toda la información)
- [x] 3.1 Definir estructura del informe maestro de área: portada, resumen ejecutivo (KPIs), gráficas, mapa/plano+heatmap, tabla de medidas, encuestas relacionadas, inventario del análisis, conclusiones.
- [x] 3.2 Decidir tecnología: ampliar docxtemplater vs HTML→PDF. **Decisión: página HTML imprimible (`window.print()`), sin dependencias nuevas y con gráficas vivas.**
- [x] 3.3 Renderizar gráficas recharts a imagen para incrustarlas en el informe. **Se renderizan directamente como SVG en la página (imprimible).**
- [x] 3.4 Botón único "Generar informe" en AreaPage (y opción por medida/análisis). **Botón "Informe" en AreaHeader → /areas/:id/reporte.**
- [x] 3.5 Deprecar/converger los 3 mecanismos actuales (medidas.docx, monitorizacion.docx, PDF jsPDF, ZIP imágenes) hacia el informe maestro o mantenerlos como subconjuntos. **Mantenidos como descargas especializadas junto al botón principal.**

## Fase 4 — Mapa integrado
- [x] 4.1 Popup de marker con mini-resumen + link al detalle de medida.
- [x] 4.2 Filtros compartidos con la lista de medidas (color, área, fechas). **Filtro por color vía param ?color= compartido con la lista.**
- [ ] 4.3 Evaluar mostrar posiciones de surveys con geo si existen. **No aplicable: las surveys AirMapper usan planos (floorplans) sin coordenadas geográficas reales.**

## Fase 5 — Limpieza y consistencia
- [x] 5.1 Ocultar campos DVB-T (canales c1-c8, MER/CBER, azimut...) en UI cuando la medida es Link-Live (resultType wireless). **El nuevo detalle no muestra canales DVB-T; ChannelsPanel eliminado.**
- [x] 5.2 Eliminar código muerto: CustomLoading2, MagicplanLogo, UnderConstruction, OpenFilterBtn, ChannelsPanel.
- [x] 5.3 Empty states y skeletons consistentes en todas las listas. **Cubiertos por los estados vacíos de TanStack Table ya existentes + añadidos en informe.**
- [x] 5.4 Revisar textos/títulos: "Gestión de..." → naming coherente entre secciones. **Medidas / Áreas / Unidades NetAlly.**

---
## Registro de trabajo
(append aquí lo completado con fecha)

### 2026-08-21 (9) — Auditoría unificada: estudio de vinculación y eliminación de redundancias
- **Estudio de vinculación** (verificado en BD): Medida→Área por `metadata.ID_AREA`; Área→Encuesta por `area_plans.heatmap.surveyId` (se establece al importar el heatmap, ImportToAreaDialog); Encuesta→Análisis por `analysisGuid`; Análisis→Unidad por `unitName`; Unidad→sus medidas vía acción "Ver medidas". La cadena Área→Encuesta→Análisis es transitiva y es la que alimenta el informe.
- **Informe único**: `/areas/:id/reporte` queda como único documento de auditoría (portada, KPIs, resumen, gráficas de medidas, plano+heatmap, tabla de medidas, descubrimiento con gráficas+topología, conclusiones).
- **Redundancias eliminadas**: botones Word (`DownloadAreaReportBtn` + plantilla medidas.docx), ZIP de imágenes ODK (`DownloadAreaImagesBtn`) y PDF jsPDF por medida (`DownloadNetAllyReportBtn`, también en tabla de medidas); hooks `use-area-report`, `use-area-report-images`, `use-download-area-images`; `reports.helper.ts`; declaración docxtemplater-image-module; `generateUniqueFolderName`/`groupByNested`. Dependencias retiradas: docxtemplater, docxtemplater-image-module-free, pizzip, jspdf, jspdf-autotable, jszip, file-saver, image-size. Cabecera de área con un solo CTA: "Informe completo".

### 2026-08-21 (8) — Auditoría de datos, vinculación e informe v2
- **Auditoría**: inventario completo de fuentes (medidas Link-Live + raw JSON, áreas+planos+heatmap, encuestas AirMapper, análisis con hosts, unidades) y de visualizaciones (dashboard 4 gráficas, detalle con gauges/sesiones, discovery 6 gráficas, topología force-directed, heatmap canvas).
- **Vinculación**: nuevo enlace en AnalysisPage → "Unidad" (`/units?q=<unitName>`) que conecta análisis→unidad→sus medidas. Cadena completa: Inicio → Medidas → Detalle → Área → Informe; Encuesta ↔ Análisis ↔ Área ↔ Unidad.
- **Informe v2** (`AreaReport`): portada con badges (medidas, correctas, dispositivos descubiertos, encuesta); KPIs con acento de color por semántica; sección **"5. Descubrimiento de red"** nueva que localiza el análisis vía encuesta del área (`analysisGuid`) y reutiliza `AnalysisCharts` + `AnalysisTopology` + tarjetas por tipo de dispositivo; conclusiones ampliadas con inventario de red. Paginación de impresión: `.avoid-break` (tarjetas no se cortan) y `.print-break` (descubrimiento empieza en página nueva).

### 2026-08-21 (7) — Arrastre jerárquico en la topología
- Al arrastrar un nodo SSID, todos sus clientes se trasladan con él (delta calculado desde `onNodeDragStart` y aplicado a los hijos vía `onNodeDrag`, con posiciones iniciales guardadas en ref). Los APs siguen siendo arrastrables individualmente.

### 2026-08-21 (6) — Topología expandida y arrastrable
- Todas las redes SSID expandidas por defecto. Nodos gestionados con `useNodesState`: los arrastres del usuario se conservan entre renders (ya no hay remount); al expandir/contraer o "Reorganizar" se recalcula el layout d3-force y se reencuadra la vista con animación (`ReactFlowProvider` + `fitView`).

### 2026-08-21 (5) — Topología legible con muchos elementos
- Eliminado el nodo raíz (SSIDs y APs son nodos de primer nivel). SSIDs colapsables con flecha: por defecto solo la red con más clientes está expandida; botones "Expandir todo" / "Contraer todo". Clientes rediseñados como fichas compactas (punto de color + nombre truncado + dBm, detalles en tooltip). Separación de clústeres por fuerza X (SSIDs derecha, APs izquierda). El layout se recalcula al expandir/contraer y la vista se reencuadra automáticamente.

### 2026-08-21 (4) — Topología force-directed (d3-force)
- Layout de la topología recalculado con simulación física `d3-force` (420 iteraciones hasta convergencia): raíz fija al centro, enlaces con distancias por tipo (raíz→SSID 230, SSID→cliente 95, raíz→AP 330), repulsión por carga, colisión por radio de nodo. Resultado: grafo radial orgánico estilo mapa de red. Botón "Reorganizar" para regenerar el layout; nodos arrastrables, zoom/paneo/minimapa.

### 2026-08-21 (3) — Topología gráfica interactiva (ReactFlow)
- `AnalysisTopology` reescrita como grafo visual con `@xyflow/react` (ReactFlow v12): nodo raíz del análisis, columnas de SSIDs con sus clientes conectados por aristas coloreadas según calidad de señal (verde/amarillo/rojo), y APs con canal/banda/contadores. Zoom, paneo, minimapa y controles incluidos; leyenda de colores bajo el grafo. Límite de 15 clientes por SSID con nodo "+N más".

### 2026-08-21 (2) — Gráficas y topología de análisis + limpieza de mapas TDT
- **Limpieza mapas TDT**: eliminada entrada "Mapa" del sidebar, ruta `/map` completa (`app/(home)/map/`), minimapa de área en `GeneralTab`, y toda la carpeta `features/map` (marcadores, controles, store, hooks, heatmap Leaflet geo — el heatmap de áreas usa canvas propio + SurveyHeatmap). CSS de Leaflet/clusters eliminado de `index.css`. Dependencias retiradas: leaflet, leaflet.heat, react-leaflet, react-leaflet-markercluster y sus @types.
- **Gráficas de análisis** (`features/analyses/components/charts/AnalysisCharts.tsx`): dispositivos por banda (2.4/5/6 GHz), tipos de seguridad, distribución de señal (rangos dBm), distribución de SNR, APs/BSSIDs por canal apilado por banda, top SSIDs por nº de clientes.
- **Topología** (`features/analyses/components/topology/AnalysisTopology.tsx`): árbol colapsable Análisis → SSIDs → clientes (con señal/protocolo) y Análisis → APs (con SSIDs/BSSIDs/clientes y SNR), construido con nodos expandibles sin dependencias nuevas.
- **AnalysisPage** reorganizada en pestañas (param `?tab=`): Dispositivos / Gráficas / Topología.
- Verificado `npx tsc -b --force` OK y desplegado en Docker (`template-app` reconstruido).

### 2026-08-21 — Implementación completa (Fases 0→1→2→4→5→3)
- **F0**: Mapa en sidebar; columna ÁREA (link) + UNIDAD (filtrable) en tabla medidas; acción "Ver medidas" en unidades con param `q`; chips Área/Unidad en MeasureHeader; link Encuesta→Análisis (analysisGuid); link Heatmap→Survey origen; dashboard clicable (StatCards con `to`, ColorLegend → `/measures?color=X`, tipos → `/units?q=`); params `color`/`failed` en use-measures-table + chips de filtros activos; componente `Breadcrumbs` aplicado en Medida/Área/Survey/Análisis.
- **F1**: Permisos `SYNC_MEASURES`/`MANAGE_MEASURES` en constants + hook `useHasPermission`; lib `measures-stats` (resultados/mes, histogramas señal/SNR, top fallos); `MeasuresAnalytics` (4 gráficas recharts); `SyncStatusBar` ("Sincronizar todo" + timestamps localStorage); HomePage integrada; botones sync gated por permiso; ImportToAreaDialog gated.
- **F2**: NetAllyTab rediseñado (badge resultado + fallos + MetricCards coloreados + Sections colapsables); GraficasTab con comparativa coloreada, GaugeBar por métrica y SessionCharts (channelUtil/non80211/coChannel/adjacent con normalizador defensivo); ArchivosTab con attachments de Link-Live.
- **F4**: Popup de marker con mini-resumen + link a detalle; filtro por color en mapa (`MapColorFilter`) usando el mismo param `?color=` que la lista; markers filtrados en MapMeasures. 4.3 descartada (surveys sin geo).
- **F5**: Eliminados CustomLoading2, MagicplanLogo, UnderConstruction, OpenFilterBtn, ChannelsPanel; limpiados comentarios muertos en MapLayout/MapMeasuresControls; títulos coherentes (Medidas/Áreas/Unidades NetAlly).
- **F3**: Nuevo módulo `features/reports` con `AreaReport`: cabecera (área/provincia/técnico/fecha), KPIs, resumen ejecutivo autogenerado, 4 gráficas recharts, plano+heatmap con link a encuesta origen, tabla detallada de medidas y conclusiones automáticas; ruta `/areas/:areaId/reporte`; botón "Informe" en AreaHeader; estilos `@media print` globales (ocultan sidebar/toolbar) para exportar a PDF desde el navegador.
- Verificación: `npx tsc -b --force` compila sin errores tras cada fase.
