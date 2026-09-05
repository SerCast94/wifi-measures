/**
 * Plantilla del informe PDF de auditorías LoRa. Reutiliza el motor de
 * generación de PDF (headless Chromium) del módulo de auditorías Wi-Fi.
 */

import { heatmap, renderPdf } from "@features/audits/application/report-pdf";
import {
  analyzeLora,
  summarizeAnalysis,
  type EvalStatus,
  type EvaluatedMetric,
} from "./lora-analysis-lib";

const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const fmtDate = (value: any): string =>
  value ? new Date(value).toLocaleDateString("es-ES") : "—";

const fmtNum = (value: any, digits = 1): string =>
  value === null ||
  value === undefined ||
  value === "" ||
  Number.isNaN(Number(value))
    ? "—"
    : Number(value).toLocaleString("es-ES", {
        maximumFractionDigits: digits,
      });

function table(headers: string[], rows: Array<Array<string | number>>): string {
  if (rows.length === 0) return '<p class="muted">Sin datos.</p>';
  return `<table><thead><tr>${headers
    .map((header) => `<th>${esc(header)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map(
      (row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`
    )
    .join("")}</tbody></table>`;
}

const statusLabel = (status: EvalStatus | string): string =>
  ({
    PASS: "Conforme",
    WARNING: "En el límite",
    FAIL: "No conforme",
    UNKNOWN: "No disponible",
  })[status] ?? status;

const statusColor = (status: EvalStatus | string): string =>
  ({
    PASS: "#16a34a",
    WARNING: "#d97706",
    FAIL: "#dc2626",
    UNKNOWN: "#6b7280",
  })[status] ?? "#374151";

// Gráfico de barras verticales (estilo informe Wi-Fi).
function vbars(
  items: Array<{ label: string; value: number | null; color: string }>,
  domain: { min: number; max: number }
): string {
  const usable = items.filter((item) => item.value !== null);
  if (usable.length === 0)
    return '<p class="muted">Sin datos para gráfica.</p>';
  const span = Math.max(1, domain.max - domain.min);
  return `<div class="vbars">${usable
    .map((item) => {
      const ratio = (item.value! - domain.min) / span;
      const height = Math.max(4, Math.min(100, ratio * 100));
      const label = Number.isInteger(item.value!)
        ? String(item.value!)
        : item.value!.toFixed(1);
      return `<div class="vb" style="height:${height.toFixed(0)}%;background:${item.color}"><em>${label}</em><span>${esc(item.label)}</span></div>`;
    })
    .join("")}</div>`;
}

// Agrega N valores en grupos (histogramas) para mantener legibles las gráficas
// aunque haya cientos de bloques/frecuencias. Solo se devuelven grupos con datos.
interface BucketRange {
  label: string;
  min: number;
  max: number;
  color: string;
}

function aggregate(
  values: Array<number | null | undefined>,
  ranges: BucketRange[]
): Array<{ label: string; value: number; color: string }> {
  return ranges
    .map((range) => ({
      label: range.label,
      color: range.color,
      value: values.filter(
        (v) =>
          v != null &&
          Number.isFinite(Number(v)) &&
          Number(v) >= range.min &&
          Number(v) < range.max
      ).length,
    }))
    .filter((bucket) => bucket.value > 0);
}

function countBars(
  items: Array<{ label: string; value: number; color: string }>
): string {
  if (items.length === 0) return '<p class="muted">Sin datos.</p>';
  const max = Math.max(...items.map((item) => item.value), 1);
  return `<div class="plchart">${items
    .map((item) => {
      const width = Math.max(2, Math.min(100, (item.value / max) * 100));
      return `<div class="plrow">
        <div class="plhead"><span class="pllabel">${esc(item.label)}</span><span class="plval">${item.value}</span></div>
        <div class="pltrack"><div style="width:${width.toFixed(1)}%;background:${item.color}"></div></div>
      </div>`;
    })
    .join("")}</div>`;
}

const RSSI_RANGES: BucketRange[] = [
  { label: "≤ -95", min: -Infinity, max: -95, color: "#dc2626" },
  { label: "-95…-85", min: -95, max: -85, color: "#dc2626" },
  { label: "-85…-75", min: -85, max: -75, color: "#f97316" },
  { label: "-75…-70", min: -75, max: -70, color: "#d97706" },
  { label: "-70…-60", min: -70, max: -60, color: "#16a34a" },
  { label: "> -60", min: -60, max: Infinity, color: "#22c55e" },
];

const SNR_RANGES: BucketRange[] = [
  { label: "< 0", min: -Infinity, max: 0, color: "#dc2626" },
  { label: "0…5", min: 0, max: 5, color: "#d97706" },
  { label: "5…10", min: 5, max: 10, color: "#f97316" },
  { label: "10…15", min: 10, max: 15, color: "#16a34a" },
  { label: "15…20", min: 15, max: 20, color: "#16a34a" },
  { label: "≥ 20", min: 20, max: Infinity, color: "#22c55e" },
];

const MARGIN_RANGES: BucketRange[] = [
  { label: "≤ -10", min: -Infinity, max: -10, color: "#dc2626" },
  { label: "-10…0", min: -10, max: 0, color: "#dc2626" },
  { label: "0…5", min: 0, max: 5, color: "#d97706" },
  { label: "5…10", min: 5, max: 10, color: "#d97706" },
  { label: "10…20", min: 10, max: 20, color: "#16a34a" },
  { label: "≥ 20", min: 20, max: Infinity, color: "#22c55e" },
];

const LOSS_RANGES: BucketRange[] = [
  { label: "0%", min: 0, max: 0.001, color: "#16a34a" },
  { label: ">0 – 5%", min: 0.001, max: 5.001, color: "#16a34a" },
  { label: "5 – 20%", min: 5.001, max: 20.001, color: "#d97706" },
  { label: "> 20%", min: 20.001, max: Infinity, color: "#dc2626" },
];

const NOISE_RANGES: BucketRange[] = [
  { label: "≤ -115", min: -Infinity, max: -115, color: "#6366f1" },
  { label: "-115…-105", min: -115, max: -105, color: "#6366f1" },
  { label: "-105…-95", min: -105, max: -95, color: "#6366f1" },
  { label: "-95…-90", min: -95, max: -90, color: "#6366f1" },
  { label: "-90…-80", min: -90, max: -80, color: "#6366f1" },
  { label: "> -80", min: -80, max: Infinity, color: "#6366f1" },
];

// ---------- Mapa de calor sobre el plano georreferenciado ----------

interface GeoCorners {
  topLeftLat: number;
  topLeftLon: number;
  topRightLat: number;
  topRightLon: number;
  bottomRightLat: number;
  bottomRightLon: number;
  bottomLeftLat: number;
  bottomLeftLon: number;
}

// Normaliza la georreferenciación (mismas reglas que la web: si faltan las
// esquinas derivadas, se rellenan para un encuadre rectangular alineado al eje).
function normalizeGeoCalibration(geo: any): GeoCorners | null {
  if (!geo || typeof geo !== "object") return null;
  const topLeftLat = Number(geo.topLeftLat);
  const topLeftLon = Number(geo.topLeftLon);
  const bottomRightLat = Number(geo.bottomRightLat);
  const bottomRightLon = Number(geo.bottomRightLon);
  if (
    !Number.isFinite(topLeftLat) ||
    !Number.isFinite(topLeftLon) ||
    !Number.isFinite(bottomRightLat) ||
    !Number.isFinite(bottomRightLon)
  ) {
    return null;
  }
  return {
    topLeftLat,
    topLeftLon,
    topRightLat: Number(geo.topRightLat) || topLeftLat,
    topRightLon: Number(geo.topRightLon) || bottomRightLon,
    bottomRightLat,
    bottomRightLon,
    bottomLeftLat: Number(geo.bottomLeftLat) || bottomRightLat,
    bottomLeftLon: Number(geo.bottomLeftLon) || topLeftLon,
  };
}

// Proyección bilineal porcentaje de imagen -> lat/lon (como en la web).
function projectToLatLon(
  x: number,
  y: number,
  geo: GeoCorners
): { lat: number; lon: number } | null {
  const px = Math.max(0, Math.min(100, x)) / 100;
  const py = Math.max(0, Math.min(100, y)) / 100;
  const topLat = geo.topLeftLat + (geo.topRightLat - geo.topLeftLat) * px;
  const bottomLat =
    geo.bottomLeftLat + (geo.bottomRightLat - geo.bottomLeftLat) * px;
  const lat = topLat + (bottomLat - topLat) * py;
  const leftLon = geo.topLeftLon + (geo.bottomLeftLon - geo.topLeftLon) * py;
  const rightLon =
    geo.topRightLon + (geo.bottomRightLon - geo.topRightLon) * py;
  const lon = leftLon + (rightLon - leftLon) * px;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

// Proyección inversa lat/lon -> porcentaje de imagen.
// Si el encuadre es axis-aligned (mapas generados desde el mapa) la inversa es
// lineal y exacta; en otro caso se resuelve por iteración con convergencia
// reforzada (la ganancia fija de 8 por iteración divergía en rangos amplios).
function projectToImageXY(
  lat: number,
  lon: number,
  geo: GeoCorners
): { x: number; y: number } | null {
  const axisAligned =
    geo.topLeftLat === geo.topRightLat &&
    geo.bottomLeftLat === geo.bottomRightLat &&
    geo.topLeftLon === geo.bottomLeftLon &&
    geo.topRightLon === geo.bottomRightLon;

  if (axisAligned) {
    const lon0 = geo.topLeftLon;
    const lon1 = geo.topRightLon;
    const lat0 = geo.topLeftLat;
    const lat1 = geo.bottomLeftLat;
    if (lon1 === lon0 || lat1 === lat0) return null;
    const x = ((lon - lon0) / (lon1 - lon0)) * 100;
    const y = ((lat0 - lat) / (lat0 - lat1)) * 100;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (x < -0.001 || x > 100.001 || y < -0.001 || y > 100.001) return null;
    return { x, y };
  }

  let x = 0.5;
  let y = 0.5;
  for (let i = 0; i < 40; i++) {
    const p = projectToLatLon(x * 100, y * 100, geo);
    if (!p) return null;
    const dx = p.lon - lon;
    const dy = p.lat - lat;
    if (Math.abs(dx) < 1e-7 && Math.abs(dy) < 1e-7) break;
    x += dx * 4;
    y -= dy * 4;
  }
  if (x < -0.00001 || x > 1.00001 || y < -0.00001 || y > 1.00001)
    return null;
  return { x: x * 100, y: y * 100 };
}

function planHeatmapsHtml(
  measures: Array<Record<string, any>>,
  noise: Array<Record<string, any>>,
  floorPlan: any,
  heatmapRadius?: number | null
): string {
  const image = floorPlan?.image;
  if (!image) return "";
  const geo = normalizeGeoCalibration(floorPlan?.geoCalibration);
  if (!geo)
    return '<section class="break"><h2>Cobertura sobre el plano</h2><p class="muted">El plano base no está georreferenciado; no se puede dibujar el mapa de calor.</p></section>';

  type Pt = { x: number; y: number; value: number; metric: string };
  const collect = (
    sources: Array<Record<string, any>>,
    metric: string,
    pick: (item: Record<string, any>) => {
      lat?: number | null;
      lon?: number | null;
      value?: number | null;
    }
  ): Pt[] => {
    const pts: Pt[] = [];
    for (const item of sources) {
      const { lat, lon, value } = pick(item);
      if (lat == null || lon == null || value == null) continue;
      const nLat = Number(lat);
      const nLon = Number(lon);
      const nVal = Number(value);
      if (!Number.isFinite(nLat) || !Number.isFinite(nLon) || !Number.isFinite(nVal))
        continue;
      const xy = projectToImageXY(nLat, nLon, geo);
      if (!xy) continue;
      pts.push({ x: xy.x, y: xy.y, value: nVal, metric });
    }
    return pts;
  };

  const blockPoints = (metric: string, valueKey: "rssi" | "snr") =>
    measures.flatMap((m) =>
      collect(
        Array.isArray(m.blocks) ? m.blocks : [],
        metric,
        (b) => ({ lat: b.latitude, lon: b.longitude, value: b[valueKey] })
      )
    );

  const signalPoints = blockPoints("signal", "rssi");
  const snrPoints = blockPoints("snr", "snr");
  const noisePoints = collect(noise, "signal", (n) => {
    const entries = Array.isArray(n.entries) ? n.entries : [];
    const vals = entries
      .map((e: any) => Number(e?.currentScan))
      .filter((v: number) => Number.isFinite(v));
    return {
      lat: n.latitude,
      lon: n.longitude,
      value: vals.length > 0 ? Math.max(...vals) : null,
    };
  });

  const base = {
    image,
    maxRadius:
      Number.isFinite(Number(heatmapRadius)) && Number(heatmapRadius) > 0
        ? Number(heatmapRadius)
        : 0.16,
  };
  const maps: string[] = [];
  if (signalPoints.length > 0) {
    maps.push(`<h3>Mapa de nivel de señal (RSSI, dBm)</h3>${heatmap(
      { ...base, points: signalPoints, metricLabel: "Nivel de señal RSSI", unit: "dBm" },
      "signal"
    )}`);
  }
  if (snrPoints.length > 0) {
    maps.push(`<h3>Mapa de SNR (dB)</h3>${heatmap(
      { ...base, points: snrPoints, metricLabel: "SNR", unit: "dB" },
      "snr"
    )}`);
  }
  if (noisePoints.length > 0) {
    maps.push(`<h3>Mapa de ruido (dBm)</h3>${heatmap(
      { ...base, points: noisePoints, metricLabel: "Nivel de ruido", unit: "dBm" },
      "signal"
    )}`);
  }
  if (maps.length === 0) return "";

  return `<section class="break"><h2>Cobertura sobre el plano</h2>
    <p class="muted">Plano base: ${esc(floorPlan.name ?? "—")}</p>
    ${maps.join("")}</section>`;
}

// ---------- Sección de análisis ----------

function analysisHtml(
  blocks: Array<Record<string, any>>,
  noiseEntries: Array<Record<string, any>>,
  measures: Array<Record<string, any>>,
  noiseRecords: Array<Record<string, any>>
): string {
  const { evaluations, coherence } = analyzeLora(blocks, noiseEntries);
  const summary = summarizeAnalysis(evaluations);
  const total = summary.total;

  const charts: string[] = [];

  // RSSI por bloque
  if (blocks.length > 0) {
    const counts = aggregate(
      blocks.map((b) => b.rssi),
      RSSI_RANGES
    );
    charts.push(`<h3>Distribución RSSI (dBm)</h3>
      ${vbars(counts, { min: 0, max: Math.max(...counts.map((c) => c.value), 1) })}
      <p class="muted">${blocks.length} bloques · agregados por umbral. Verde ≥ −70 dBm · ámbar −85…−70 · rojo &lt; −85.</p>`);
  }

  // SNR por bloque
  if (blocks.length > 0) {
    const counts = aggregate(
      blocks.map((b) => b.snr),
      SNR_RANGES
    );
    charts.push(`<h3>Distribución SNR (dB)</h3>
      ${vbars(counts, { min: 0, max: Math.max(...counts.map((c) => c.value), 1) })}
      <p class="muted">${blocks.length} bloques · agregados por umbral. Verde ≥ 10 dB · ámbar −5…10 · rojo &lt; −5.</p>`);
  }

  // Margen radio por bloque
  if (blocks.length > 0) {
    charts.push(`<h3>Distribución del margen radio (dB)</h3>
      ${summarizeMarginChart(blocks, noiseEntries)}`);
  }

  // Pérdida de paquetes por bloque
  if (blocks.length > 0) {
    const counts = aggregate(
      blocks.map((b) => b.packetLossPct),
      LOSS_RANGES
    );
    charts.push(`<h3>Distribución de pérdida de paquetes</h3>
      ${countBars(counts)}
      <p class="muted">${blocks.length} bloques · verde ≤ 5% · ámbar 5–20% · rojo &gt; 20%.</p>`);
  }

  // Ruido por frecuencia
  if (noiseEntries.length > 0) {
    const counts = aggregate(
      noiseEntries.map((e) => e.currentScan),
      NOISE_RANGES
    );
    charts.push(`<h3>Distribución de ruido (dBm)</h3>
      ${vbars(counts, { min: 0, max: Math.max(...counts.map((c) => c.value), 1) })}
      <p class="muted">${noiseEntries.length} frecuencias del scan actual · agregadas por umbral.</p>`);
  }

  return `<section class="break"><h2>Análisis del enlace</h2>
    <div class="kpis">
      <div class="kpi"><b>${total}</b>criterios</div>
      <div class="kpi"><b style="color:#16a34a">${summary.byStatus.PASS}</b>conformes</div>
      <div class="kpi"><b style="color:#d97706">${summary.byStatus.WARNING}</b>límite</div>
      <div class="kpi"><b style="color:#dc2626">${summary.byStatus.FAIL}</b>no conformes</div>
    </div>

    <h3>Resultado global: ${esc(globalLabel(summary.globalResult))}</h3>
    ${summary.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}

    <h3>Resumen por categoría</h3>
    ${categorySummaryHtml(evaluations)}

    <h3>Detalle por medida y ruido</h3>
    ${elementDetailHtml(evaluations, measures, noiseRecords)}

    <h3>Coherencia cruzada</h3>
    ${coherence
      .map(
        (c) =>
          `<p><b>${esc(c.case === "—" ? "Sin caso" : `Caso ${c.case}`)} — ${esc(c.title)}</b>: <span style="color:${statusColor(c.status)}">${esc(statusLabel(c.status))}</span>. ${esc(c.message)} <i>Recomendación:</i> ${esc(c.recommendation)}</p>`
      )
      .join("")}

    <h3>Recomendaciones</h3>
    <ul>${summary.recommendations.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>

    <section class="break"><h3>Gráficas</h3>
      <div class="chartgrid">
        ${charts.map((c) => `<div class="chartcell">${c}</div>`).join("") || '<p class="muted">Sin datos para gráficas.</p>'}
      </div>
    </section>
  </section>`;
}

function summarizeMarginChart(
  blocks: Array<Record<string, any>>,
  noiseEntries: Array<Record<string, any>>
): string {
  let noiseFloor = -Infinity;
  let found = false;
  for (const e of noiseEntries) {
    if (e.currentScan != null && Number(e.currentScan) > noiseFloor) {
      noiseFloor = Number(e.currentScan);
      found = true;
    }
  }
  if (!found) {
    return '<p class="muted">Sin datos de ruido para calcular el margen.</p>';
  }
  const counts = aggregate(
    blocks.map((b) => (b.rssi != null ? Number(b.rssi) - noiseFloor : null)),
    MARGIN_RANGES
  );
  return `
    ${vbars(counts, { min: 0, max: Math.max(...counts.map((c) => c.value), 1) })}
    <p class="muted">${blocks.length} bloques · margen = RSSI − piso de ruido (${fmtNum(noiseFloor, 1)} dBm). Verde ≥ 10 dB · ámbar 0…10 · rojo &lt; 0.</p>`;
}

const globalLabel = (result: string): string =>
  ({
    APROBADO: "Aprobado",
    APROBADO_CON_OBSERVACIONES: "Aprobado con observaciones",
    NO_CONFORME: "No conforme",
    SIN_DATOS_SUFICIENTES: "Sin datos suficientes",
  })[result] ?? result;

const metricLabel = (metric: string): string =>
  ({
    RSSI: "RSSI",
    SNR: "SNR",
    PACKET_LOSS: "Pérdida de paquetes",
    MARGIN: "Margen radio",
    NOISE_DELTA: "Variación de ruido",
    COHERENCIA: "Coherencia cruzada",
  })[metric] ?? metric;

// Tabla resumen por categoría: cuántas condiciones caen en cada estado y los
// peores casos, para extraer conclusiones sin leer cientos de filas.
function categorySummaryHtml(evaluations: EvaluatedMetric[]): string {
  const order = ["RADIO", "PAQUETES", "RUIDO", "MARGEN", "COHERENCIA"];
  const labels: Record<string, string> = {
    RADIO: "Radio (RSSI / SNR)",
    PAQUETES: "Paquetes",
    RUIDO: "Ruido por banda",
    MARGEN: "Margen radio",
    COHERENCIA: "Coherencia",
  };
  const rows = order
    .map((category) => {
      const evals = evaluations.filter((e) => e.category === category);
      if (evals.length === 0) return "";
      const counts: Record<string, number> = {
        PASS: 0,
        WARNING: 0,
        FAIL: 0,
        UNKNOWN: 0,
      };
      for (const e of evals) counts[e.status] += 1;
      const fails = evals
        .filter((e) => e.status === "FAIL")
        .slice(0, 4)
        .map((e) => esc(e.message))
        .join("<br>");
      return `<tr>
        <td style="font-weight:bold">${esc(labels[category] ?? category)}</td>
        <td>${evals.length}</td>
        <td style="color:#16a34a">${counts.PASS}</td>
        <td style="color:#d97706">${counts.WARNING}</td>
        <td style="color:#dc2626">${counts.FAIL}</td>
        <td style="color:#9ca3af">${counts.UNKNOWN}</td>
        <td>${fails || "—"}</td>
      </tr>`;
    })
    .join("");
  if (!rows) return "";
  return `<table>
    <thead><tr><th>Categoría</th><th>Condiciones</th><th>Conforme</th><th>Límite</th><th>No conforme</th><th>Sin datos</th><th>Peores casos</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function evalDetailTable(evals: EvaluatedMetric[]): string {
  return `<table>
    <thead><tr><th>Métrica</th><th>Valor</th><th>Resultado</th><th>Detalle</th></tr></thead>
    <tbody>
      ${evals
        .map(
          (e) =>
            `<tr><td>${esc(metricLabel(e.metric))}</td><td>${e.value != null ? `${esc(fmtNum(e.value))} ${esc(e.unit ?? "")}` : "—"}</td><td style="color:${statusColor(e.status)}">${esc(statusLabel(e.status))}${e.label ? ` · ${esc(e.label)}` : ""}</td><td>${esc(e.message)}</td></tr>`
        )
        .join("")}
    </tbody>
  </table>`;
}

// Detalle del análisis agrupado por medida / ruido, para saber de qué dato
// proviene cada evaluación (Medida 1, Ruido 2, ...).
function elementDetailHtml(
  evaluations: EvaluatedMetric[],
  measures: Array<Record<string, any>>,
  noiseRecords: Array<Record<string, any>>
): string {
  const bySource = (label: string) =>
    evaluations.filter((e) => e.sourceLabel === label);
  const parts: string[] = [];
  measures.forEach((m, index) => {
    const sourceLabel = `Medida ${index + 1}`;
    const evals = bySource(sourceLabel);
    if (evals.length === 0) return;
    const meta = [
      m.time ? `Fecha/hora: ${esc(String(m.time))}` : "",
      m.spreadingFactor ? `SF: ${esc(String(m.spreadingFactor))}` : "",
      m.txPower ? `TX: ${esc(String(m.txPower))}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    parts.push(`<h4>${sourceLabel}${m.location ? ` · ${esc(String(m.location))}` : ""}</h4>${meta ? `<p class="muted">${meta}</p>` : ""}${evalDetailTable(evals)}`);
  });
  noiseRecords.forEach((n, index) => {
    const sourceLabel = `Ruido ${index + 1}`;
    const evals = bySource(sourceLabel);
    if (evals.length === 0) return;
    parts.push(`<h4>${sourceLabel}${n.location ? ` · ${esc(String(n.location))}` : ""}</h4>${evalDetailTable(evals)}`);
  });
  if (parts.length === 0) return '<p class="muted">Sin evaluaciones.</p>';
  return parts.join("");
}

export interface LoraReportData {
  header: {
    name?: string | null;
    code?: string | null;
    client?: string | null;
    project?: string | null;
    location?: string | null;
    technician?: string | null;
    auditDate?: string | null;
    objective?: string | null;
    result?: string | null;
    hasAnalysis?: boolean;
  };
  measures: Array<Record<string, any>>;
  noise: Array<Record<string, any>>;
  floorPlan?: {
    name?: string | null;
    image?: string | null;
    geoCalibration?: Record<string, unknown> | null;
  } | null;
  heatmapRadius?: number | null;
}

export function renderLoraReportHtml(data: LoraReportData): string {
  const header = data.header ?? {};

  const measureHtml = (measure: Record<string, any>) => {
    if (!measure) return '<p class="muted">Sin datos.</p>';
    const blocks = Array.isArray(measure.blocks) ? measure.blocks : [];
    if (blocks.length === 0) return '<p class="muted">Sin datos.</p>';
    return table(
      [
        "Rol",
        "Total paq.",
        "Paq. correctos",
        "RSSI (dBm)",
        "SNR (dB)",
        "Pérdida (%)",
        "Longitud",
        "Latitud",
        "Ubicación",
      ],
      blocks.map((b) => [
        b.role ?? "—",
        fmtNum(b.totalPackets, 0),
        fmtNum(b.successfulPackets, 0),
        fmtNum(b.rssi),
        fmtNum(b.snr),
        fmtNum(b.packetLossPct),
        fmtNum(b.longitude, 6),
        fmtNum(b.latitude, 6),
        b.location ?? "—",
      ])
    );
  };

  const measuresHtml =
    (data.measures ?? [])
      .map((measure) => {
        const general = [
          measure.time
            ? `<div><b>Fecha/hora:</b> ${esc(measure.time)}</div>`
            : "",
          measure.spreadingFactor
            ? `<div><b>Spreading Factor:</b> ${esc(measure.spreadingFactor)}</div>`
            : "",
          measure.txPower
            ? `<div><b>TX Power:</b> ${esc(measure.txPower)}</div>`
            : "",
          measure.location
            ? `<div><b>Ubicación:</b> ${esc(measure.location)}</div>`
            : "",
        ]
          .filter(Boolean)
          .join("");
        return `<div class="card">${general || ""}${measureHtml(measure)}</div>`;
      })
      .join("") || '<p class="muted">Sin datos.</p>';

  const noiseHtml =
    (data.noise ?? [])
      .map((entry) => {
        const entries = Array.isArray(entry.entries) ? entry.entries : [];
        const general = [
          entry.location
            ? `<div><b>Ubicación:</b> ${esc(entry.location)}</div>`
            : "",
          entry.longitude != null
            ? `<div><b>Longitud:</b> ${fmtNum(entry.longitude, 6)}</div>`
            : "",
          entry.latitude != null
            ? `<div><b>Latitud:</b> ${fmtNum(entry.latitude, 6)}</div>`
            : "",
        ]
          .filter(Boolean)
          .join("");
        const inner =
          entries.length === 0
            ? '<p class="muted">Sin datos.</p>'
            : table(
                ["Frecuencia", "Scan actual (dBm)", "Media ponderada (dBm)"],
                entries.map((e) => [
                  fmtNum(e.frequency),
                  fmtNum(e.currentScan),
                  fmtNum(e.weightedAverageScan),
                ])
              );
        return `<div class="card">${general}${inner}</div>`;
      })
      .join("") || '<p class="muted">Sin datos.</p>';

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/><style>
  @page { size: A4; margin: 16mm 12mm 18mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color:#111827; margin:0; }
  h1 { font-size: 22px; margin:0 0 4px; }
  h2 { font-size: 15px; border-bottom:1.5px solid #111827; padding-bottom:3px; margin:18px 0 8px; }
  section.break { page-break-before: always; }
  .card { border:1px solid #d1d5db; border-radius:6px; padding:8px; margin-bottom:10px; }
  .muted { color:#6b7280; }
  .plchart { display:flex; flex-direction:column; gap:8px; margin:8px 0 4px; }
  .plrow { display:grid; grid-template-columns:minmax(54px, 70px) 1fr; gap:8px; align-items:center; }
  .plhead { display:flex; flex-direction:column; line-height:1.1; }
  .pllabel { font-size:9px; color:#374151; }
  .plval { font-size:11px; font-weight:bold; color:#111827; }
  .pltrack { height:18px; background:#f3f4f6; border-radius:4px; overflow:hidden; }
  .pltrack > div { height:100%; border-radius:4px; }
  table { width:100%; border-collapse:collapse; margin:6px 0 10px; }
  th { background:#f3f4f6; text-align:left; }
  th, td { border:1px solid #d1d5db; padding:3px 6px; font-size:9.5px; }
  dl { display:grid; grid-template-columns: 140px 1fr; gap:2px 10px; margin:10px 0; }
  dt { font-weight:bold; }
  dd { margin:0; color:#374151; }
  .cover { page-break-after: always; text-align:center; padding-top:140px; }
  .cover h1 { font-size:34px; margin-bottom:8px; }
  .cover .sub { font-size:16px; color:#374151; margin-bottom:40px; }
  .cover .meta { display:inline-block; text-align:left; margin-top:30px; font-size:12px; }
  .cover .meta div { margin:4px 0; }
  .cover .result { margin-top:34px; font-size:16px; font-weight:bold; color:#111827; }
  .chartgrid { display:grid; grid-template-columns:1fr 1fr; gap:16px 22px; }
  .chartcell { min-width:0; }
  .kpis { display:flex; gap:14px; margin:12px 0; flex-wrap:wrap; }
  .kpi { border:1px solid #e5e7eb; border-radius:8px; padding:8px 14px; text-align:center; min-width:88px; }
  .kpi b { display:block; font-size:20px; }
  .bars { display:flex; height:26px; width:100%; border-radius:4px; overflow:hidden; margin:8px 0 4px; }
  .vbars { display:flex; align-items:flex-end; gap:8px; height:150px; margin:12px 0 6px; border-bottom:1px solid #d1d5db; }
  .vb { display:flex; flex-direction:column; justify-content:flex-end; width:38px; border-radius:4px 4px 0 0; text-align:center; position:relative; }
  .vb em { font-style:normal; font-size:9px; color:#111827; margin-bottom:3px; }
  .vb span { font-size:9px; color:#374151; margin-top:3px; }
  h3 { font-size:12.5px; margin:14px 0 6px; color:#111827; }
  .heatmap { max-width:100%; margin:8px 0; }
  .heatmap > img { max-width:100%; border:1px solid #d1d5db; border-radius:4px; }
  .heat-box { position:relative; width:100%; overflow:hidden; border-radius:4px; }
  .heat-box img { position:absolute; left:0; top:0; width:100%; height:100%; object-fit:fill; border:1px solid #d1d5db; border-radius:4px; }
  .heat-overlay { position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; }
  .heat-legend { display:block; border:1px solid #d1d5db; background:#f9fafb; padding:8px 12px; font-size:10px; margin-top:6px; border-radius:4px; }
  .hl-title { font-weight:bold; font-size:11px; margin:0 0 6px; color:#111827; }
  .hl-bar-wrap { display:flex; align-items:center; gap:6px; }
  .hl-bar { position:relative; flex:1; height:16px; border-radius:3px; overflow:visible; }
  .hl-grad { width:100%; height:100%; border-radius:3px; border:1px solid rgba(0,0,0,.1); }
  .hl-edge { font-size:9px; font-weight:600; color:#374151; white-space:nowrap; }
  .hl-tick { position:absolute; top:100%; transform:translateX(-50%); font-size:8px; color:#6b7280; margin-top:2px; white-space:nowrap; }
  .hl-tick::before { content:""; position:absolute; bottom:100%; left:50%; width:1px; height:4px; background:#9ca3af; margin-bottom:1px; }
  .hl-labels { display:flex; flex-wrap:wrap; gap:4px 14px; margin-top:14px; }
  .hl-lbl { display:inline-flex; align-items:center; gap:4px; font-size:9px; color:#374151; }
  .hl-lbl i { display:inline-block; width:12px; height:12px; border-radius:2px; border:1px solid rgba(0,0,0,.1); }
</style></head><body>
  <div class="cover">
    <h1>Informe de auditoría LoRa</h1>
    <p class="sub">${esc(header.name)}</p>
    <div class="meta">
      <div><b>Código:</b> ${esc(header.code) || "—"}</div>
      <div><b>Cliente:</b> ${esc(header.client) || "—"}</div>
      <div><b>Proyecto:</b> ${esc(header.project) || "—"}</div>
      <div><b>Ubicación:</b> ${esc(header.location) || "—"}</div>
      <div><b>Técnico:</b> ${esc(header.technician) || "—"}</div>
      <div><b>Fecha:</b> ${fmtDate(header.auditDate)}</div>
    </div>
    ${
      header.result
        ? `<div class="result">Resultado: ${esc(header.result.replace(/_/g, " "))}</div>`
        : ""
    }
    <p style="margin-top:60px;font-size:10px;color:#6b7280">Generado el ${new Date().toLocaleString("es-ES")}</p>
  </div>

  <h2 id="sec-datos">Datos generales</h2>
  <dl>
    <dt>Nombre</dt><dd>${esc(header.name) || "—"}</dd>
    <dt>Código</dt><dd>${esc(header.code) || "—"}</dd>
    <dt>Cliente</dt><dd>${esc(header.client) || "—"}</dd>
    <dt>Proyecto</dt><dd>${esc(header.project) || "—"}</dd>
    <dt>Ubicación</dt><dd>${esc(header.location) || "—"}</dd>
    <dt>Técnico</dt><dd>${esc(header.technician) || "—"}</dd>
    <dt>Fecha</dt><dd>${fmtDate(header.auditDate)}</dd>
    ${
      header.objective
        ? `<dt>Objetivo</dt><dd>${esc(header.objective)}</dd>`
        : ""
    }
  </dl>

  <section><h2>Medidas LoRa (${(data.measures ?? []).length})</h2>${measuresHtml}</section>

  <section class="break"><h2>Ruido (${(data.noise ?? []).length})</h2>${noiseHtml}</section>

  ${planHeatmapsHtml(data.measures ?? [], data.noise ?? [], data.floorPlan, data.heatmapRadius)}

  ${(() => {
    const blocks = (data.measures ?? []).flatMap((m, index) =>
      (Array.isArray(m.blocks) ? m.blocks : []).map((b) => ({
        ...b,
        sourceLabel: `Medida ${index + 1}`,
      }))
    );
    const noiseEntries = (data.noise ?? []).flatMap((n, index) =>
      (Array.isArray(n.entries) ? n.entries : []).map((e) => ({
        ...e,
        sourceLabel: `Ruido ${index + 1}`,
      }))
    );
    return analysisHtml(blocks, noiseEntries, data.measures ?? [], data.noise ?? []);
  })()}
</body></html>`;
}

export async function renderLoraPdf(
  data: LoraReportData
): Promise<Buffer> {
  return renderPdf(renderLoraReportHtml(data), {
    footerLabel: "Informe de auditoría LoRa",
  });
}
