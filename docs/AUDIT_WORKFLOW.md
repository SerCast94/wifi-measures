# Arquitectura — Flujo de Auditoría Wi-Fi

> Rediseño de la aplicación: de visor de datos Link-Live a herramienta completa de
> auditorías Wi-Fi (planificación → ejecución → análisis → diagnóstico → informe PDF).

Flujo objetivo:

```
CREAR AUDITORÍA → CONFIGURAR → TRABAJO DE CAMPO (AirCheck G3) → LINK-LIVE
→ SINCRONIZAR (por auditoría) → CHECKLIST → ANÁLISIS AUTOMÁTICO
→ INCIDENCIAS → RECOMENDACIONES → REVISIÓN TÉCNICO → CONCLUSIONES → INFORME PDF
```

---

## 1. Estado actual (FASE 1 — análisis)

### Lo que ya existe y se reutiliza

| Capa | Existente | Reutilización |
|---|---|---|
| Sync Link-Live | `POST /measures/sync`, `/surveys/sync`, `/analyses/sync` (upsert por `idLinkLive`) | La sync global se mantiene; la auditoría añade su propia sync que orquesta las tres y registra el resultado |
| Datos | `Medida` (raw JSON completo), `LinkLiveSurvey(+Points)`, `LinkLiveAnalysis(+Hosts)`, `AreaPlan` | Son la **única fuente de verdad**; la auditoría solo los *referencia* |
| Heatmap canvas | `SurveyHeatmap` (IDW, leyenda, métricas signal/snr/...) | Base del visor de cobertura por planta |
| Gráficas | `AnalysisCharts`, `SessionCharts`/gauges `GraficasTab`, `MeasuresAnalytics` | Radio, rendimiento y resumen |
| Topología | `AnalysisTopology` (ReactFlow + d3-force) | Descubrimiento de red en análisis e informe |
| Informe imprimible | `AreaReport` + CSS `@media print` (`@page A4`, `.print-break`, `.avoid-break`) | Base técnica del nuevo informe; `window.print()` se mantiene |
| Infra | Guards de permisos, TanStack Query, zustand, rutas auto-registradas `*Route.tsx`, axios+CSRF | Se respetan los patrones |

### Deudas detectadas

- Umbrales/colores duplicados en 8+ ficheros frontend (NETALLY_COLORS ×7, rangos RSSI/SNR dispersos).
- Sin paginación ni filtrado server-side; `GET /measures` devuelve todos los raw.
- Raw Link-Live sin tipar (`unknown`); los valores numéricos pueden llegar como `"--"`.
- Áreas derivadas 100 % client-side de `metadata.ID_AREA`.
- Tests: 0 (solo scaffold e2e roto).
- `@xyflow/react`/`d3-force` usadas pero no declaradas en `apps/web/package.json`.

### Campos reales disponibles en `raw` (verificados contra BD)

- Enlace: `linkSignalLevelMean(+Color)`, `linkSNRMean(+Color)`, `linkNoiseLevelMean`,
  `linkPhyDataRate`, `linkPhyPctOfMaxDataRateMean(+Color)`, `linkRetryRateMean(+Color)` —
  **pueden ser `"--"`** (no medido).
- Sesión RF: `channelUtilArray`, `channelNon80211UtilArray`, `coChannelInterference`,
  `adjacentChannelInterference`, `rogueAps`.
- Conectividad: `dhcpConnect[]`, `dns[]`, `www[]`, `routerConnect[]`,
  `ipConfigFailureReasons[]`, `ipWifiManagement`.
- Fallos: `failureReasons[]`, `linkFailureReasons[]`, `apFailureReasons[]`, …
- Unidad: `unit_name/type/mac/serial/id/firmwareVersion`; fechas `created_at/uploaded_at`;
  IDs `_id/guid/autoTestGuid/organizationId`; `meta.isWireless/isEthernet/isSession`.

**Regla**: no existen campos iPerf/roaming en el payload actual. El motor debe tratarlos
como NO DISPONIBLE salvo que aparezcan datos reales.

---

## 2. Modelo de datos (Prisma)

Principios: la auditoría **no duplica** datos Link-Live; solo referencia y añade capa de
evaluación/gestión. Todo resultado automático guarda traza hasta su origen.

```
AuditProfile ──< Audit >──┬──< AuditFloor
                          ├──< AuditMeasure >── Medida        (N:M)
                          ├──< AuditSurvey  >── LinkLiveSurvey(N:M)
                          ├──< AuditAnalysis>── LinkLiveAnalysis (N:M)
                          ├──< AuditTest        (checklist)
                          ├──< AuditEvaluation  (resultados motor)
                          ├──< AuditIssue       (incidencias)
                          └──< AuditRecommendation
Audit ──1── AuditConclusion (borrador auto + final editable)
Audit ──< AuditReport   (versiones + config de secciones)
Audit ──< AuditSyncLog  (resultado de cada sincronización)
```

### Entidades nuevas

- **Audit**: cliente, proyecto, ubicación, dirección, edificio, técnico, fechas,
  estado (`BORRADOR|PLANIFICADA|EN_CURSO|PENDIENTE_DE_REVISION|COMPLETADA|
  INFORME_GENERADO|CERRADA`), descripción/objetivo/alcance/metodología/observaciones,
  filtros de captura (`areaKeys: ID_AREA[]`, `ssidFilter?`, rango de fechas),
  `profileId`, `lastSyncAt`.
- **AuditProfile**: plantilla de umbrales por tipo de auditoría (Oficina, Administración
  pública, Colegio, Hotel, Industria, Alta densidad, Voz/VoIP, Videoconferencia…).
  `thresholds Json` tipado en TS (`CoverageThresholds/RadioThresholds/PerformanceThresholds`),
  editable. Seed con perfil "General" = valores recomendados (-67/-72 dBm, SNR 25/20 dB,
  util <50/>70 %, co-channel ≤2/≥5).
- **AuditFloor**: plantas de la auditoría (nombre, orden). Las surveys importadas se
  asignan a una planta.
- **AuditMeasure / AuditSurvey / AuditAnalysis**: membresía N:M + metadatos propios
  (`floorId?`, `areaKey?`, etiqueta de punto P01…).
- **AuditTest**: checklist instanciado desde plantilla versionada en código
  (`checklist-template.ts`: PRE_AUDITORÍA, RECONOCIMIENTO_RF, COBERTURA, CONECTIVIDAD,
  RENDIMIENTO, MOVILIDAD, CIERRE). Estados: `PENDIENTE|COMPLETADA|NO_APLICABLE`.
  `required`, `sourceType/sourceIds` (evidencia), `resultStatus` derivado.
  Progreso = completadas/requeridas.
- **AuditEvaluation**: fila por métrica evaluada: `metric, value?, unit?, status
  PASS|WARNING|FAIL|UNKNOWN, threshold Json, message, category, sourceType, sourceId,
  floorId?, locationLabel?`. Regenerable (batch por `runAt`).
- **AuditIssue**: `origin AUTO|MANUAL`, `state SUGERIDA|ACEPTADA|MODIFICADA|DESCARTADA`,
  severidad `INFO..CRITICAL`, tipo, título/desc, ubicación/planta, métrica/valor/umbral,
  evidencia (JSON de referencias), foto, recomendación.
- **AuditRecommendation**: `origin AUTO|MANUAL`, categoría `INMEDIATA|OPTIMIZACION|
  INFRAESTRUCTURA`, texto, `basis Json` (trazabilidad a evaluaciones), aceptada.
- **AuditConclusion**: borrador autogenerado + texto final editado + resultado global
  `APROBADO|APROBADO_CON_OBSERVACIONES|NO_CONFORME|SIN_DATOS_SUFICIENTES`.
- **AuditReport**: versión, `config Json` (secciones incluidas), generadoPor/fecha.
  El informe es reproducible: siempre se regenera desde datos almacenados.
- **AuditSyncLog**: contadores (+medidas/+surveys/+análisis/duplicados/errores) y fechas.

Migración nueva siguiendo la convención del repo (carpeta manual +
`npx prisma migrate deploy/dev --schema=...`).

---

## 3. Backend — módulo `features/audits`

Misma estratificación hexagonal que el resto:

```
features/audits/
├── domain/
│   ├── entities/            # AuditEntity, tipos de evaluación, taxonomía de pruebas
│   │   ├── audit-status.ts, metric-taxonomy.ts, checklist-template.ts
│   │   └── evaluation.types.ts   # EvaluationResult {metric,value,unit,status,threshold,message}
│   └── config/tokens.ts
├── application/
│   ├── audits.service.ts             # CRUD + estados + progreso
│   ├── audit-members.service.ts      # alta/baja medidas/surveys/análisis + candidatos
│   ├── audit-sync.service.ts         # sincronización por auditoría + AuditSyncLog
│   ├── audit-evaluation.service.ts   # MOTOR: datos → PASS/WARNING/FAIL/UNKNOWN
│   ├── audit-recommendation.service.ts
│   ├── audit-issue.service.ts        # manuales + aceptar/descartar sugeridas
│   ├── audit-report.service.ts       # payload agregado para informe + versiones
│   └── audit-data-quality.service.ts # problemas de calidad de datos
└── presentation/http/
    └── audits.controller.ts (+ dtos/, presenters/)
```

Separación estricta: **datos originales (Link-Live) ≠ evaluación ≠ presentación**.

### Motor de evaluación (`AuditEvaluationService`)

- Entrada: entidades vinculadas a la auditoría + perfil de umbrales.
- Extractores por categoría de la taxonomía (RADIO/COBERTURA/CONECTIVIDAD/RENDIMIENTO/
  MOVILIDAD/DESCUBRIMIENTO); cada extractor devuelve `EvaluationResult[]`:
  `{metric, value|null, unit, status, threshold, message}`.
- `value "--" | null | array vacío ⇒ UNKNOWN` («No disponible / No realizada»). Nunca se
  infiere PASS/FAIL sin dato.
- Umbrales SOLO del perfil (no hardcode en componentes). Ejemplos base:
  - RSSI: ≥ −67 PASS · −68..−72 WARNING · < −72 FAIL
  - SNR: ≥ 25 PASS · 20–24 WARNING · < 20 FAIL
  - Utilización canal: < 50 % PASS · 50–70 % WARNING · > 70 % FAIL
  - Co-channel: ≤ 2 PASS · 3–4 WARNING · ≥ 5 FAIL
  - Rendimiento: download/upload mínimos, latencia máx., pérdida máx. (configurables;
    si no hay datos → UNKNOWN)
- Detección de incidencias y recomendaciones consumen las `AuditEvaluation` (reglas
  declarativas tabla-driven, trazables vía `basis`).

### Endpoints nuevos (`/api/v1/audits`)

| Método y ruta | Función |
|---|---|
| `GET /audits` | listado paginado + filtros (estado, cliente, texto) |
| `POST /audits` | crear (instancia checklist) |
| `GET /audits/:id` | detalle + KPIs dashboard + progreso |
| `PUT /audits/:id` | editar cabecera/perfil/filtros |
| `PATCH /audits/:id/status` | cambio de estado |
| `DELETE /audits/:id` | eliminar |
| `POST /audits/:id/sync` | sync scoped + log |
| `GET /audits/:id/members` · `POST/DELETE .../members` | gestión de medidas/surveys/análisis + candidatos |
| `GET/PUT /audits/:id/floors` | plantas |
| `PATCH /audits/:id/tests/:testId` | marcar checklist |
| `POST /audits/:id/evaluate` | ejecuta motor (evaluaciones + incidencias sugeridas + recomendaciones + conclusión borrador) |
| `GET /audits/:id/evaluations` | resultados actuales |
| `CRUD /audits/:id/issues` · `POST .../issues/detect` · `PATCH .../issues/:iid/state` | incidencias |
| `GET/POST/PATCH/DELETE /audits/:id/recommendations` | recomendaciones |
| `GET/PUT /audits/:id/conclusion` | conclusiones |
| `GET /audits/:id/report-data?sections=` | payload del informe |
| `GET/POST /audits/:id/reports` | versiones de informe generadas |
| `GET /audits/:id/data-quality` | calidad de datos |

Permisos: reutiliza `manage:measures` / `sync:measures`. Lecturas requieren sesión
(guard global existente). Credenciales Link-Live siguen solo en backend.

---

## 4. Frontend

Nueva feature `features/audits/` (api/, hooks/, types/, store/, components/) + páginas bajo
`app/(home)/audits/` con layout anidado compartido (`AuditShell` con sub-navegación).

| Ruta | Contenido |
|---|---|
| `/audits` | listado de auditorías (tabla, estados, progreso) + crear |
| `/audits/new` | formulario creación (cliente, ubicación, técnico, perfil, objetivos) |
| `/audits/:id` | **Dashboard**: cabecera (estado/progreso/acciones sync·informe·cerrar), KPIs PASS/WARNING/FAIL, principales problemas, estado de pruebas, checklist resumido |
| `/audits/:id/config` | configuración: metadatos, perfil/umbrales, plantas, miembros (medidas/surveys/análisis), candidatos |
| `/audits/:id/tests` | tabla completa de pruebas + filtros (tipo/estado/planta/SSID/AP/fecha) |
| `/audits/:id/coverage` | cobertura AirMapper por planta: heatmap (reutiliza SurveyHeatmap), selector métrica, leyenda con umbrales del perfil, estadísticas (% PASS/WARNING/FAIL; superficie «no disponible» si no hay escala del plano) |
| `/audits/:id/radio` | canales por banda, SSIDs, APs, ranking interferencias (reutiliza AnalysisCharts) |
| `/audits/:id/connectivity` | matriz visual Punto×(Asoc/DHCP/GW/DNS/Internet/HTTP) desde `dhcpConnect/dns/www/routerConnect` |
| `/audits/:id/performance` | throughput/latencia/pérdida si hay datos; si no «NO REALIZADA»; mejor/peor punto |
| `/audits/:id/roaming` | secuencia de APs si hay datos; nunca se infiere de «hay varios AP» |
| `/audits/:id/discovery` | APs/BSSIDs/SSIDs/clientes/seguridad + topología adaptada a informe |
| `/audits/:id/data-quality` | problemas de calidad (sin área, sin fecha, `"--"`, surveys sin plano…) |
| `/audits/:id/issues` | incidencias (auto sugeridas + manuales), flujo aceptar/editar/descartar |
| `/audits/:id/report` | informe configurable (checkboxes de secciones) + vista imprimible profesional |
| `/audits/:id/field` | **Modo campo**: checklist grande táctil, sincronizar, añadir incidencia, finalizar |

Sidebar: grupo «Auditorías» (listado) sobre el grupo actual «Datos Link-Live».

Componentes genéricos extraídos: `StatusBadge` (PASS/WARNING/FAIL/UNKNOWN/NO_REALIZADA),
`ThresholdLegend`, `KpiCard`, sección de informe reutilizable entre pantalla e informe.

### Informe PDF (decisión técnica)

- Se mantiene **HTML+CSS imprimible con `window.print()`** (ya funciona multipágina en este
  stack, cero dependencias nuevas, gráficas SVG vivas).
- Mejoras: portada propia, índice, saltos controlados, cabeceras/pies por página mediante
  elementos `position: fixed` (se repiten en todas las páginas impresas en Chromium/Firefox),
  numeración estática de sección (no dinámica de página) y exportación de heatmaps a PNG a
  mayor resolución para el PDF.
- Alternativa futura documentada (no instalada): render servidor con Puppeteer o paged.js
  para numeración real de páginas; se activará solo si el cliente exige numeración exacta.

---

## 5. Calidad

- Tests Jest backend: motor de evaluación (PASS/WARNING/FAIL/UNKNOWN por métrica, datos
  incompletos), detección de incidencias, generación de conclusiones, data-quality,
  payload de informe (auditoría vacía/completa/con fallos/sin roaming/multi-planta).
- TypeScript estricto; `tsc -b` tras cada fase; build Docker verificado al final.
- Rendimiento: endpoints de lectura devuelven proyecciones sin `raw` completo salvo
  detalle; agregaciones en backend; memoización de gráficas.

## 6. Plan de fases (implementación)

1. ✅ Análisis (este documento §1)
2. Modelo Prisma + migración
3. Backend audits: CRUD, estados, checklist, sync por auditoría, miembros
4. Motor de evaluación + perfiles + incidencias + recomendaciones + conclusiones
5. Frontend: lista/nueva/dashboard/config/checklist/modo campo
6. Páginas de análisis (tests/coverage/radio/connectivity/performance/roaming/discovery/data-quality)
7. Incidencias UI
8. Informe v2 + PDF
9. Tests + verificación build/Docker

## 7. Estado de implementación

Completado y verificado con smoke test E2E real (login → crear auditoría →
miembros → evaluate → dashboard → informe):

- **FASE 1-2**: modelo `Audit*` en Prisma + migración manual aplicada
  (`20260824000000_add_audit_model`), sin reset de BD.
- **FASE 3-4 (backend)**: módulo `apps/api/src/features/audits/` completo:
  CRUD + estados + checklist sembrado desde plantilla v1 + miembros/candidatos
  (filtro por tipo) + sync por auditoría con log + motor de evaluación
  (RSSI/SNR/ruido/utilización/interferencias/rogue/cobertura/conectividad;
  RENDIMIENTO y MOVILIDAD quedan UNKNOWN si no hay datos) + incidencias AUTO
  con dedupe por `evidence.key` + recomendaciones categorizadas + conclusión
  con borrador automático + calidad de datos + payload de informe versionado.
  Módulos measures/surveys/analyses exportan ahora sus servicios de sync.
- **FASE 5-6 (frontend)**: `features/audits/` (tipos, api, hooks) + rutas
  `/audits`, `/audits/new`, `/audits/:id` (dashboard KPIs), `/config`
  (plantas y vinculación de capturas), `/tests` (checklist), `/detalles`
  (evaluación completa agrupada por categoría con umbrales aplicados),
  `/incidencias`, `/informe` (vista imprimible + conclusiones editables +
  registro de versión e impresión/PDF). Sidebar con entrada «Auditorías».
  Los visores interactivos (heatmaps/gráficas) se reutilizan por enlace desde
  las páginas existentes de surveys/analyses: no se duplican.
- **FASE 8 (tests)**: Jest configurado con `moduleNameMapper` para los alias
  del proyecto. 41 tests unitarios del motor (`evaluation-lib.spec.ts`,
  `audit-evaluation.service.spec.ts`) cubren: parseo de métricas AirCheck
  (incluido "--"), umbrales PASS/WARNING/FAIL/UNKNOWN, interpretación de
  arrays de conectividad, fallos confirmados por `ipConfigFailureReasons`,
  cobertura (mínimo + tasa de puntos fuera de objetivo), merge de perfiles
  sobre umbrales por defecto y política de honestidad de datos.
- **E2E**: `apps/api/test/audits.e2e-spec.ts` ejecuta el flujo completo contra
  una API en marcha (`APP_URL`, por defecto el despliegue docker en :3001) y
  se salta sola si no hay servidor; incluye limpieza de la auditoría creada.
  El boilerplate `app.e2e-spec.ts` se sustituyó por un health-check real
  (token CSRF) y `test/setup-env.ts` carga el `.env` raíz con fallback a
  localhost para DATABASE_URL. Config corregida: `jest-e2e.json` con mapeo de
  alias. Bug detectado por E2E y corregido: el listado paginado devuelve
  `{ items, total }`; el frontend ahora lee `.items`.
- **Docker**: imagen construida y desplegada en el contenedor local
  (`docker compose build/up template-app`); entrypoint aplica migraciones con
  `migrate deploy` (la nueva es no-op si ya está aplicada).

Notas de entorno para desarrollo local en host:
- Redis no publica puerto; usar túnel temporal (p.ej. socat) o ejecutar la API
  dentro de la red docker para el flujo de sesión.
- `$env:DATABASE_URL` debe apuntar a `localhost:5432` al ejecutar prisma/nest
  fuera de contenedores.
- No editar ficheros UTF-8 con `Get-Content`/`Set-Content` de Windows
  PowerShell 5.1 (corrompe acentos); usar herramientas que respeten UTF-8.
