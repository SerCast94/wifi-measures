# TO DO — Herramienta de auditorías Wi-Fi (workflow completo)

> Objetivo: evolucionar la app de visor de datos Link-Live a herramienta completa
> de auditoría: planificación → checklist → sincronización → evaluación →
> incidencias/recomendaciones → informe PDF profesional.

## Estado general (actualizado)

- ✅ Modelo Prisma `Audit*` + migraciones aplicadas (sin reset de BD).
- ✅ Backend `features/audits`: CRUD, estados, checklist, sync por auditoría,
  motor de evaluación (PASS/WARNING/FAIL/UNKNOWN honesto), incidencias AUTO+MANUALES,
  recomendaciones categorizadas, conclusiones con borrador, calidad de datos,
  informe reproducible versionado.
- ✅ Frontend `/audits`: listado (crear/eliminar), nueva auditoría con perfil,
  dashboard KPIs, configuración de plantas/capturas, checklist por secciones,
  evaluación detallada, incidencias, informe imprimible.
- ✅ Tests: 41 unitarios del motor; E2E de flujo completo contra API desplegada.
- ✅ Docker build + despliegue verificados.

## Ronda 2 — Solicitado por el usuario

- [x] 1. Dashboard de inicio con métricas globales de auditorías.
      Nuevo endpoint `GET /audits/stats` + tarjeta «Estado de las auditorías»
      en el home (totales por estado, % conforme/no conforme, incidencias
      abiertas, últimas 5 auditorías).
- [x] 2. Menú lateral sin numeración (Medidas / Áreas / Mapas de calor / Análisis).
- [x] 3. Auto-completado del checklist ampliado. Ahora se marcan solos:
      plano cargado (survey con imagen), AirMapper realizado (surveys vinculadas),
      ping LAN (vía gateway), datos sincronizados (última sync), informe generado
      (versiones registradas), incidencias documentadas, recomendaciones
      introducidas, además de los anteriores (equipo, RF por análisis, métricas
      de medidas). Quedan manuales solo los que requieren criterio humano
      (objetivo, credenciales, iPerf, roaming, validaciones de cierre).
- [x] 4. Verificado el vínculo de análisis a auditorías: se vinculan desde
      Configuración → «Análisis de espectro»; alimentan descubrimiento
      (APs/SSIDs/clientes del dashboard), autocompletan la sección RF del
      checklist y las tablas del entorno radioeléctrico del informe.
- [x] 5. Incidencia manual completa: título, gravedad (Crítica/Alta/Media/Baja),
      ubicación, descripción y recomendación.
- [x] 6. Informe mucho más detallado:
      - Gráficas embebidas (recharts): tarta de resultados por criterio y
        barras de señal por canal.
      - Tablas de entorno radioeléctrico: SSIDs (seguridad/banda/señal) y
        APs (MAC/canal/banda/señal) con semáforo de señal.
      - Mapa de calor visual por encuesta: plano base64 + puntos coloreados
        según umbrales RSSI/SNR del perfil.
      - Resumen de seguridad por tipo en la sección radio.

## Mejoras adicionales aplicadas en esta ronda

- [x] Eliminar auditoría desde el listado con confirmación (borrado en cascada).
- [x] Asignar planta a cada captura vinculada (medida/encuesta/análisis) desde
      Configuración — nueva ruta `PATCH /audits/:id/members/:type/:memberId`.
- [x] Aviso de calidad de datos en el resumen de la auditoría (problemas
      detectados antes de generar informe).
- [x] Filtro de candidatos por fecha de CAPTURA (fechaHora/surveyStartTime/
      startTime) en lugar de fecha de sincronización.
- [x] Corregido bug de listado paginado (`{items,total}`) detectado por E2E.
- [x] Secciones del checklist con nombres correctos (Reconocimiento RF).

## Ronda 3 — Implementada (antes "Pendiente")

- [x] Edición de datos generales de la auditoría: formulario compartido
      `AuditForm` + página `/audits/:id/editar` y acceso «Editar datos» en la cabecera.
- [x] Filtros avanzados al crear/editar: sección «Filtros de capturas» con
      areaKeys (lista) y ssidFilter en ambos formularios.
- [x] Modo campo del checklist: botones táctiles a ancho completo en móvil,
      notas rápidas por ítem con guardado inmediato.
- [x] Fotos en incidencias: captura/adjunto con redimensionado en cliente
      (máx. 1280 px, JPEG 80 %), almacenado como data URL en `photo`;
      visible en tarjeta e informe.
- [x] Comparativa entre auditorías: endpoint `GET /audits/comparativa` +
      página `/audits/comparativa` con gráfica apilada y tabla (% conforme,
      resultado global). Acceso «Comparar» en el listado.
- [x] Errores de sincronización visibles: `stats.totals.syncErrors` (últimos
      7 días) con aviso en el overview del home.

## Ronda 4 — Implementada

- [x] BUG corregido: borrar/desvincular análisis y encuestas en Configuración
      (la ruta DELETE despachaba siempre a medidas; ahora según tipo).
- [x] PDF real del informe: `GET /audits/:id/informe.pdf` con headless
      Chromium (puppeteer-core + chromium del sistema). Numeración física
      «Página X de Y», portada, KPIs, heatmaps embebidos, tablas de radio,
      incidencias con fotos, recomendaciones, conclusiones y anexo de calidad.
      Fallback 501 con mensaje si no hay motor PDF en el entorno.
- [x] Plantillas de checklist personalizables por perfil: columna
      `audit_profiles.checklist_extras` + `PUT /audits/profiles/:id`
      (formato `[{section, key?, title, required?}]`). Se instancian al crear
      la auditoría y se re-instancian en cada evaluación. UI de administración pendiente.
- [x] Paginación server-side de candidatos (`page`/`size`, máx. 200) +
      botón «Mostrar más» en Configuración.
- [x] Playwright E2E frontend: config + spec humo (login → /audits → nueva)
      en verde contra el despliegue docker; script `npm run e2e` en apps/web.

## Ronda 5 — Implementada y desplegada

1. [x] **Archivos en sidebar (grupo Auditoría Wi-Fi)** — reescribir `/files` para
   usar la fuente correcta: `useUnits()` (API Link-Live `listUploadedFiles`,
   la misma de la pestaña «Archivos» de Medidas), aplanando todas las
   unidades; reutilizar `UnitFiles`/`UploadedFile`. Eliminar el endpoint
   `GET /files/attachments` basado en `raw.attachments` (fuente errónea) o
   dejarlo si resulta útil para anexos; mover item del grupo «Gestión» a
   «Auditoría Wi-Fi».
2. [x] **Eliminar Áreas (frontend)** — borrar vistas `/areas`, `/areas/:id`
   (tabs General/Heatmap), item del sidebar y enlaces huérfanos: columna
   DISPOSITIVO de medidas (quitar Link a `/areas/:id`, dejar texto),
   `ImportToAreaDialog` en surveys si queda huérfano. NO tocar backend de
   area-plans (lo usa la sincronización de surveys). Verificar que nada
   referencie `/areas`.
3. [x] **Informe = Análisis completo** — incrustar en el informe, por cada
   análisis vinculado, los componentes reales de análisis: `AnalysisCharts`
   (todas las gráficas: utilización, interferencias, canales…) y
   `AnalysisTopology` (topología), reutilizando los hooks existentes
   (`use-analysis`). Ajustar estilos print (SVG/canvas imprimibles).
   Mantener además tablas SSIDs/APs y seguridad ya presentes.
4. [x] **ZIP de imágenes** — ampliar `downloadImagesZip` para incluir también
   las nuevas gráficas/topología (canvas/SVG) generadas en el informe.
5. [x] **Evaluación — automatización pendiente** (documentado, sin código):
   ver desglose punto a punto en la conversación; acciones concretas:
   - GATEWAY/DHCP/DNS/HTTP: ya automático (arrays + failureReasons).
   - RENDIMIENTO (iperf) y ROAMING: sin fuente en AirCheck G3 → requieren
     prueba manual o integración futura (iPerf server / walk-test).
   - `conn.ping_lan` usa GATEWAY como proxy → separar si se añade prueba ping.
   - NOISE sin umbral: queda informativo (correcto).
6. [x] **Verificación final** — tsc/eslint/build web, tsc/jest API (41),
   Playwright humo, E2E API; solo entonces `docker compose build/up`.

## Ronda 6 — Implementada y desplegada

[x] 1. **Anexos en Configuración (mover desde Informe)**
   - Mover el bloque «Anexos de la auditoría (Link-Live)» (selector + quitar +
     previsualización) a la pestaña **Configuración**, como tarjeta propia
     junto a las capturas.
   - El **Informe** deja de gestionar anexos: solo los **muestra** (lista de
     documentos e imágenes) al final de la página, antes de Conclusiones.
   - El PDF mantiene la sección de anexos ya existente.

[x] 2. **Checklist: barra de progreso fija (sticky)**
   - Hacer la tarjeta de progreso `sticky top-0 z-10` dentro de la página
     `/audits/:id/tests` para que siga visible al hacer scroll.
   - Versión compacta al hacer scroll (opcional): solo barra + «X/Y aplicables»
     para no ocupar demasiado.
   - Verificar que las invalidaciones al marcar Completada/No aplica siguen
     refrescándola en tiempo real.

[x] 3. **Informe: anexos solo lectura al final**
   - Quitar el bloque interactivo de anexos del informe (selector/quitar).
   - Añadir sección «Anexos» al final del documento: documentos (enlaces) e
     imágenes (previsualización), con `data-anexo` para el ZIP.
   - Reubicar la sección para que quede tras Recomendaciones y antes de
     Conclusiones (orden final del documento).

[x] 4. **Informe: arreglar tablas de análisis y solape de topología**
   - Tablas de APs / BSSIDs / SSIDs / Clientes / Canales / Probing / Bluetooth:
     - Cabeceras: `whitespace-nowrap`, anchuras mínimas por columna y
       contenedor con scroll horizontal solo en la tabla (no en página).
     - Mostrar **todos los registros** (quitar los `slice(0, 20/40/60)`); si el
       número es muy alto, paginar en cliente con «Mostrar más».
   - Topología: evitar el solape con «Entorno radioeléctrico detectado» —
     contenedor con altura fija + `overflow-hidden`, medir el contenedor de
     ReactFlow y forzar re-render/resize al montar; revisar el `h-[420px]` y
     el `break-inside-avoid` en impresión.
   - Revisar también el ancho de las gráficas (`AnalysisCharts`) dentro del
     informe para que no desborden.

[x] 5. **Verificación** — tsc/eslint/build web, jest API, Playwright humo y
   despliegue Docker al completar todo.

## Pendiente (próximas iteraciones propuestas)

- [ ] UI de administración de perfiles (thresholds y checklistExtras con formulario).
- [ ] Cobertura adicional de tests de servicios (sync, reportes) y pipeline CI.
- [ ] Notificaciones push/email del resumen diario de sincronizaciones (requiere SMTP).