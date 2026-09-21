/**
 * Plantilla del informe PDF de auditorías LoRa. Reutiliza el motor de
 * generación de PDF (headless Chromium) del módulo de auditorías Wi-Fi.
 */

import { renderPdf } from "@features/audits/application/report-pdf";
import { createRequire } from "node:module";
import {
  analyzeLora,
  summarizeAnalysis,
  LORA_BAREMO,
  type EvalStatus,
  type EvaluatedMetric,
  type LoraRecommendation,
} from "./lora-analysis-lib";
import {
  LORA_LEVEL_COLOR,
  LORA_LEVEL_LABEL,
  LORA_LEVELS,
  NOISE_SCALE,
  RSSI_LEVEL_BUCKETS,
  SIGNAL_SCALE,
  SNR_LEVEL_BUCKETS,
  SNR_SCALE,
  noiseGradientColor,
  isNoCoverageSample,
  rssiLevel,
  snrLevel,
  levelOf,
  worseOf,
  SNR_FLOOR_BY_SF,
  type LoraBucket,
  type LoraQualityLevel,
} from "./lora-baremo";

const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const fmtDate = (value: any): string =>
  value ? new Date(value).toLocaleDateString("es-ES") : "—";

const fmtDateRange = (start?: string | null, end?: string | null): string => {
  const s = fmtDate(start);
  const e = fmtDate(end);
  if (s === "—" && e === "—") return "—";
  if (s === "—") return `Hasta ${e}`;
  if (e === "—") return `Desde ${s}`;
  return `${s} – ${e}`;
};

const fmtNum = (value: any, digits = 1): string =>
  value === null ||
  value === undefined ||
  value === "" ||
  Number.isNaN(Number(value))
    ? "—"
    : Number(value).toLocaleString("es-ES", {
        maximumFractionDigits: digits,
      });

const sampleRoleText = (sample: Record<string, any>, index: number): string => {
  if (sample.txCnt != null && String(sample.txCnt).trim() !== "") {
    return `Muestra ${sample.txCnt}`;
  }
  if (sample.time && String(sample.time).trim() !== "") {
    return `Muestra ${String(sample.time)}`;
  }
  return `Muestra ${index + 1}`;
};

type TableCell = string | number | { __raw: string };

/** Marca una celda de tabla como HTML pre-renderizado (evita escaparlo). */
const raw = (html: string): TableCell => ({ __raw: html });

function table(headers: string[], rows: Array<Array<TableCell>>): string {
  if (rows.length === 0) return '<p class="muted">Sin datos.</p>';
  const renderCell = (cell: TableCell): string =>
    `<td>${typeof cell === "object" && cell !== null ? cell.__raw : esc(String(cell))}</td>`;
  return `<table><thead><tr>${headers
    .map((header) => `<th>${esc(header)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map(renderCell).join("")}</tr>`)
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

const RSSI_RANGES: BucketRange[] = RSSI_LEVEL_BUCKETS;

const SNR_RANGES: BucketRange[] = SNR_LEVEL_BUCKETS;

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
  { label: "≤ -115", min: -Infinity, max: -115, color: "#dc2626" },
  { label: "-115…-105", min: -115, max: -105, color: "#ef4444" },
  { label: "-105…-95", min: -105, max: -95, color: "#f97316" },
  { label: "-95…-90", min: -95, max: -90, color: "#eab308" },
  { label: "-90…-80", min: -90, max: -80, color: "#a3e635" },
  { label: "> -80", min: -80, max: Infinity, color: "#22c55e" },
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
  if (x < -0.00001 || x > 1.00001 || y < -0.00001 || y > 1.00001) return null;
  return { x: x * 100, y: y * 100 };
}

function planHeatmapsHtml(
  measures: Array<Record<string, any>>,
  noise: Array<Record<string, any>>,
  floorPlan: any,
  heatmapRadius?: number | null,
  antenna?: { lat: number; lon: number } | null
): string {
  const image = floorPlan?.image;
  if (!image) return "";
  const geo = normalizeGeoCalibration(floorPlan?.geoCalibration);
  if (!geo)
    return '<section class="break"><h2 id="sec-cobertura"><span class="secnum">4</span> Cobertura sobre el plano</h2><p class="muted">El plano base no está georreferenciado; no se puede dibujar el mapa de calor.</p></section>';

  const W0 = Math.max(200, Math.round(Number(floorPlan?.width) || 800));
  const H0 = Math.max(150, Math.round(Number(floorPlan?.height) || 600));
  const scale = Math.min(1, 900 / W0);
  const gridW = Math.max(200, Math.round(W0 * scale));
  const gridH = Math.max(150, Math.round(H0 * scale));
  const maxR =
    Math.max(gridW, gridH) *
    (Number.isFinite(Number(heatmapRadius)) && Number(heatmapRadius) > 0
      ? Number(heatmapRadius)
      : 0.16);
  const cell = Math.max(6, Math.floor(Math.max(gridW, gridH) / 200));
  const fontPx = Math.max(14, Math.round(Math.max(gridW, gridH) / 90));

  type Pt = {
    x: number; // 0..100 (proyección)
    y: number;
    value: number | null; // null => sin cobertura
    level: LoraQualityLevel;
  };

  const measurePoints = (metric: "rssi" | "snr"): Pt[] => {
    const bestByCoord = new Map<string, Pt>();
    for (const m of measures) {
      for (const s of Array.isArray(m.samples) ? m.samples : []) {
        if (s.latitude == null || s.longitude == null) continue;
        const nLat = Number(s.latitude);
        const nLon = Number(s.longitude);
        if (!Number.isFinite(nLat) || !Number.isFinite(nLon)) continue;
        const xy = projectToImageXY(nLat, nLon, geo);
        if (!xy) continue;
        const raw = s[metric];
        const num =
          raw != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
        const noCov = isNoCoverageSample({
          rssi: s.rssi,
          snr: s.snr,
          signal: s.signal,
          packetLossPct: s.packetLossPct,
        });
        const level: LoraQualityLevel = noCov
          ? "SIN_COBERTURA"
          : num != null
            ? metric === "rssi"
              ? rssiLevel(num)
              : snrLevel(num)
            : "SIN_COBERTURA";
        const coordKey = `${xy.x},${xy.y}`;
        const current = bestByCoord.get(coordKey);
        if (
          !current ||
          (num ?? -Infinity) > (current.value ?? -Infinity)
        ) {
          bestByCoord.set(coordKey, {
            x: xy.x,
            y: xy.y,
            value: num,
            level,
          });
        }
      }
    }
    return Array.from(bestByCoord.values());
  };

  const noiseLevelPoints: Pt[] = [];
  for (const n of noise) {
    if (n.latitude == null || n.longitude == null) continue;
    const xy = projectToImageXY(Number(n.latitude), Number(n.longitude), geo);
    if (!xy) continue;
    const vals = (Array.isArray(n.entries) ? n.entries : [])
      .map((e: any) => e?.currentScan)
      .filter((v: unknown) => v != null && Number.isFinite(Number(v)))
      .map((v: unknown) => Number(v));
    noiseLevelPoints.push({
      x: xy.x,
      y: xy.y,
      value: vals.length > 0 ? Math.max(...vals) : null,
      level: "ACEPTABLE",
    });
  }

  // Marcador de la antena (posición manual del gateway/emisor).
  const antennaMark = (): string => {
    if (!antenna) return "";
    const nLat = Number(antenna.lat);
    const nLon = Number(antenna.lon);
    if (!Number.isFinite(nLat) || !Number.isFinite(nLon)) return "";
    const xy = projectToImageXY(nLat, nLon, geo);
    if (!xy) return "";
    const x = (Math.max(0, Math.min(100, xy.x)) / 100) * gridW;
    const y = (Math.max(0, Math.min(100, xy.y)) / 100) * gridH;
    const cx = x.toFixed(1);
    const cy = y.toFixed(1);
    return `<circle cx="${cx}" cy="${cy}" r="12" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="3 3"/><circle cx="${cx}" cy="${cy}" r="11" fill="rgba(255,255,255,0.55)" stroke="none"/><path d="M ${(x - 5).toFixed(1)} ${(y + 12.5).toFixed(1)} L ${cx} ${(y + 8).toFixed(1)} M ${(x + 5).toFixed(1)} ${(y + 12.5).toFixed(1)} L ${cx} ${(y + 8).toFixed(1)}" stroke="#0f172a" stroke-width="2.2" fill="none" stroke-linecap="round"/><rect x="${(x - 1.3).toFixed(1)}" y="${(y + 1.5).toFixed(1)}" width="2.6" height="11" rx="1.3" fill="#0f172a"/><rect x="${(x - 4.2).toFixed(1)}" y="${(y - 8.5).toFixed(1)}" width="8.4" height="12" rx="2" fill="#0f172a"/><circle cx="${cx}" cy="${(y - 2.2).toFixed(1)}" r="1.9" fill="#22c55e"/><path d="M ${(x + 5.2).toFixed(1)} ${(y - 4).toFixed(1)} A 4 4 0 0 1 ${(x + 5.2).toFixed(1)} ${(y + 4).toFixed(1)}" stroke="#334155" stroke-width="1.7" fill="none" stroke-linecap="round"/><path d="M ${(x + 7.4).toFixed(1)} ${(y - 6.5).toFixed(1)} A 6.5 6.5 0 0 1 ${(x + 7.4).toFixed(1)} ${(y + 6.5).toFixed(1)}" stroke="#64748b" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
  };

  // Render SVG con niveles discretos (baremo LoRa) sobre el plano.
  const levelGrid = (
    points: Pt[],
    colorOf: (pt: Pt) => string,
    noiseMarks = false
  ): string => {
    const valued = points.filter((p) => p.value != null);
    let rects = "";
    if (valued.length > 0) {
      for (let gy = 0; gy < gridH; gy += cell) {
        for (let gx = 0; gx < gridW; gx += cell) {
          let md = Infinity;
          let best: Pt | null = null;
          for (const p of valued) {
            const px = (Math.max(0, Math.min(100, p.x)) / 100) * gridW;
            const py = (Math.max(0, Math.min(100, p.y)) / 100) * gridH;
            const dx = gx - px;
            const dy = gy - py;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < md) {
              md = d;
              best = p;
            }
          }
          if (!best || md > maxR) continue;
          const opacity = Math.max(0.14, Math.min(0.9, 1 - md / maxR));
          rects += `<rect x="${gx}" y="${gy}" width="${cell}" height="${cell}" fill="${colorOf(best)}" opacity="${opacity.toFixed(2)}"/>`;
        }
      }
    }
    let marks = "";
    for (const p of points) {
      const x = (Math.max(0, Math.min(100, p.x)) / 100) * gridW;
      const y = (Math.max(0, Math.min(100, p.y)) / 100) * gridH;
      const cx = x.toFixed(1);
      const cy = y.toFixed(1);
      if (p.value == null || p.level === "SIN_COBERTURA") {
        marks += `<g><circle cx="${cx}" cy="${cy}" r="8" fill="${LORA_LEVEL_COLOR.SIN_COBERTURA}" stroke="#fff" stroke-width="2"/><path d="M ${(x - 4.5).toFixed(1)} ${(y - 4.5).toFixed(1)} L ${(x + 4.5).toFixed(1)} ${(y + 4.5).toFixed(1)} M ${(x + 4.5).toFixed(1)} ${(y - 4.5).toFixed(1)} L ${(x - 4.5).toFixed(1)} ${(y + 4.5).toFixed(1)}" stroke="#fff" stroke-width="2.2"/></g>`;
      } else {
        const fill = noiseMarks ? colorOf(p) : "rgba(255,255,255,0.88)";
        marks += `<g><circle cx="${cx}" cy="${cy}" r="7" fill="${fill}" stroke="#111827" stroke-width="2"/><text x="${(x + 10).toFixed(1)}" y="${cy}" font-size="${fontPx}" font-weight="bold" fill="#111827" dominant-baseline="central" paint-order="stroke" stroke="rgba(255,255,255,0.9)" stroke-width="4">${p.value.toFixed(0)}</text></g>`;
      }
    }
    if (rects === "" && marks === "" && antennaMark() === "") return "";
    return `<svg class="heat-overlay" viewBox="0 0 ${gridW} ${gridH}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${rects}${marks}${antennaMark()}</svg>`;
  };

  // Leyenda segmentada con los niveles del baremo.
  const legendHtml = (
    title: string,
    unit: string,
    buckets: LoraBucket[],
    scaleMin: number,
    scaleMax: number,
    ticks: number[]
  ): string => {
    const span = (v: number) =>
      Math.max(
        0,
        Math.min(100, ((v - scaleMin) / (scaleMax - scaleMin)) * 100)
      );
    const segs = buckets
      .map((b) => {
        const lo = span(b.min === -Infinity ? scaleMin : b.min);
        const hi = span(b.max === Infinity ? scaleMax : b.max);
        if (hi <= lo) return "";
        return `<span style="left:${lo.toFixed(1)}%;width:${(hi - lo).toFixed(1)}%;background:${b.color}"></span>`;
      })
      .join("");
    const ticksHtml = ticks
      .map(
        (t) =>
          `<span class="hl-tick" style="left:${span(t).toFixed(1)}%">${t}</span>`
      )
      .join("");
    return `<div class="heat-legend">
      <p class="hl-title">${esc(title)} (${esc(unit)}) · baremo despliegue LoRa</p>
      <div class="hl-bar-wrap">
        <span class="hl-edge">${scaleMin}</span>
        <div class="hl-bar"><div class="hl-grad heat-seg">${segs}</div>${ticksHtml}</div>
        <span class="hl-edge">${scaleMax}</span>
      </div>
      <div class="hl-labels">
        ${buckets
          .map(
            (b) =>
              `<span class="hl-lbl"><i style="background:${b.color}"></i>${esc(LORA_LEVEL_LABEL[b.level])}</span>`
          )
          .join("")}
        <span class="hl-lbl"><i style="background:#991b1b"></i>Sin cobertura</span>
      </div>
    </div>`;
  };

  // Leyenda continua para el ruido (escala fija verde→amarillo→rojo).
  const noiseLegendHtml = (title: string): string => {
    const span = (v: number) =>
      ((v - NOISE_SCALE.min) / (NOISE_SCALE.max - NOISE_SCALE.min)) * 100;
    return `<div class="heat-legend">
      <p class="hl-title">${esc(title)} (dBm) · escala fija</p>
      <div class="hl-bar-wrap">
        <span class="hl-edge">${NOISE_SCALE.min}</span>
        <div class="hl-bar"><div class="hl-grad" style="background:linear-gradient(90deg, #dc2626 0%, #eab308 ${span(-100).toFixed(1)}%, #22c55e 100%)"></div><span class="hl-tick" style="left:${span(-100).toFixed(1)}%">−100</span></div>
        <span class="hl-edge">${NOISE_SCALE.max}</span>
      </div>
      <p class="muted" style="margin:12px 0 0">Ruido de fondo (dBm). Rojo = más ruido, verde = menos ruido.</p>
    </div>`;
  };

  const maps: string[] = [];
  const signalPoints = measurePoints("rssi");
  if (signalPoints.length > 0) {
    maps.push(`<h3>Mapa de nivel de señal (RSSI, dBm)</h3>
      <div class="heat-box" style="padding-bottom:${((gridH / gridW) * 100).toFixed(2)}%">
        <img src="${esc(image)}" alt="Plano"/>
        ${levelGrid(signalPoints, (pt) => LORA_LEVEL_COLOR[pt.level])}
      </div>
      ${legendHtml("Nivel de señal RSSI", "dBm", RSSI_LEVEL_BUCKETS, SIGNAL_SCALE.min, SIGNAL_SCALE.max, [-115, -100, -85, -70])}
      <p class="muted">Puntos en rojo marcados con aspa: muestras sin señal (Abnormal) o pérdida 100&nbsp;%.</p>`);
  }
  const snrPoints = measurePoints("snr");
  if (snrPoints.length > 0) {
    maps.push(`<h3>Mapa de SNR (dB)</h3>
      <div class="heat-box" style="padding-bottom:${((gridH / gridW) * 100).toFixed(2)}%">
        <img src="${esc(image)}" alt="Plano"/>
        ${levelGrid(snrPoints, (pt) => LORA_LEVEL_COLOR[pt.level])}
      </div>
      ${legendHtml("Relación señal-ruido", "dB", SNR_LEVEL_BUCKETS, SNR_SCALE.min, SNR_SCALE.max, [-5, 0, 5, 10])}
      <p class="muted">Puntos en rojo marcados con aspa: muestras sin señal (Abnormal) o pérdida 100&nbsp;%.</p>`);
  }
  const noisePoints = noiseLevelPoints.filter((p) => p.value != null);
  if (noisePoints.length > 0) {
    maps.push(`<h3>Mapa de ruido (dBm)</h3>
      <div class="heat-box" style="padding-bottom:${((gridH / gridW) * 100).toFixed(2)}%">
        <img src="${esc(image)}" alt="Plano"/>
        ${levelGrid(noisePoints, (pt) => noiseGradientColor(pt.value!), true)}
      </div>
      ${noiseLegendHtml("Nivel de ruido")}`);
  }
  if (maps.length === 0 && antennaMark() === "") return "";
  if (maps.length === 0) {
    maps.push(`<h3>Posición de la antena</h3>
      <div class="heat-box" style="padding-bottom:${((gridH / gridW) * 100).toFixed(2)}%">
        <img src="${esc(image)}" alt="Plano"/>
        ${levelGrid([], () => LORA_LEVEL_COLOR.EXCELENTE)}
      </div>`);
  }

  const antennaNote = antenna
    ? '<p class="muted">El marcador de antena (mástil con panel sectorial y ondas) indica la posición del gateway/emisor.</p>'
    : "";

  return `<section class="break"><h2 id="sec-cobertura"><span class="secnum">4</span> Cobertura sobre el plano</h2>
    <p class="muted">Plano base: ${esc(floorPlan.name ?? "—")}</p>
    ${maps.join("")}${antennaNote}</section>`;
}

// ---------- Sección de análisis ----------

const COHERENCE_CASE_ORDER = ["A", "B", "C", "D", "E", "F"];

function coherenceHtml(coherence: Array<Record<string, any>>): string {
  const byCase = new Map<string, Array<Record<string, any>>>();
  for (const item of coherence) {
    const key = item.case === "—" ? "—" : String(item.case);
    if (!byCase.has(key)) byCase.set(key, []);
    byCase.get(key)!.push(item);
  }
  const rank = (key: string): number => {
    if (key === "—") return 99;
    const idx = COHERENCE_CASE_ORDER.indexOf(key);
    return idx === -1 ? 50 : idx;
  };
  const keys = [...byCase.keys()].sort((a, b) => rank(a) - rank(b));
  if (keys.length === 0) return '<p class="muted">Sin coherencia evaluada.</p>';
  return keys
    .map((key) => {
      const items = byCase.get(key)!;
      const caseLabel = key === "—" ? "Sin caso" : `Caso ${esc(key)}`;
      const title = esc(String(items[0].title ?? "—"));
      const rows = items
        .map((item) => {
          const blockInfo = [item.sourceLabel, item.elementRole]
            .filter(Boolean)
            .join(" · ");
          return `<tr>
            <td>${esc(blockInfo) || "—"}</td>
            <td style="color:${statusColor(item.status)}">${esc(statusLabel(item.status))}</td>
            <td>${esc(item.message)}</td>
            <td>${esc(item.recommendation)}</td>
          </tr>`;
        })
        .join("");
      return `<h4>${caseLabel} — ${title} <span class="muted" style="font-weight:normal;font-size:10px">(${items.length} muestra${items.length === 1 ? "" : "s"})</span></h4>
        <table>
          <thead><tr><th>Muestra</th><th>Estado</th><th>Observación</th><th>Recomendación</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    })
    .join("");
}

/** Leyenda del baremo de niveles LoRa (peor métrica de cada muestra). */
function levelsLegendHtml(): string {
  return `<div class="levels">${LORA_LEVELS.map(
    (lvl) =>
      `<div class="levels-item"><span class="swatch" style="background:${lvl.color}"></span>${esc(lvl.label)}</div>`
  ).join("")}</div>
  <p class="muted">Nivel por muestra = peor métrica entre RSSI, SNR, pérdida de paquetes y margen.</p>`;
}

/** Distribuciones (RSSI, SNR, margen, pérdida y ruido) como tallas de gráfica. */
function analysisChartsHtml(
  blocks: Array<Record<string, any>>,
  noiseEntries: Array<Record<string, any>>
): string {
  const charts: string[] = [];

  // RSSI por bloque
  if (blocks.length > 0) {
    const counts = aggregate(
      blocks.map((b) => b.rssi),
      RSSI_RANGES
    );
    charts.push(`<h3>Distribución RSSI (dBm)</h3>
      ${vbars(counts, { min: 0, max: Math.max(...counts.map((c) => c.value), 1) })}
      <p class="muted">${blocks.length} muestras · baremo LoRa: &gt; −70 excelente · −85 buena · −100 aceptable · −115 débil · &lt; −115 crítica.</p>`);
  }

  // SNR por bloque
  if (blocks.length > 0) {
    const counts = aggregate(
      blocks.map((b) => b.snr),
      SNR_RANGES
    );
    charts.push(`<h3>Distribución SNR (dB)</h3>
      ${vbars(counts, { min: 0, max: Math.max(...counts.map((c) => c.value), 1) })}
      <p class="muted">${blocks.length} muestras · baremo LoRa: ≥ 10 excelente · 5 buena · 0 aceptable · −5 débil · &lt; −5 crítica.</p>`);
  }

  // Margen radio por bloque
  if (blocks.length > 0) {
    charts.push(`<h3>Distribución del margen radio (dB)</h3>
      ${summarizeMarginChart(blocks, noiseEntries)}`);
  }

  // Pérdida de paquetes por muestreo
  if (blocks.length > 0) {
    const counts = aggregate(
      blocks.map((b) => b.packetLossPct),
      LOSS_RANGES
    );
    charts.push(`<h3>Distribución de pérdida de paquetes</h3>
      ${countBars(counts)}
      <p class="muted">${blocks.length} muestras · verde ≤ 5% · ámbar 5–20% · rojo &gt; 20%.</p>`);
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

  return (
    charts.map((c) => `<div class="chartcell">${c}</div>`).join("") ||
    '<p class="muted">Sin datos para gráficas.</p>'
  );
}

const REC_CATEGORY_LABEL: Record<string, string> = {
  COBERTURA: "Cobertura",
  RADIO: "Señal",
  ENTREGA: "Entrega",
  OPERATIVO: "Operativo",
};

const REC_SEVERITY_COLOR: Record<string, string> = {
  alta: "#dc2626",
  media: "#d97706",
  baja: "#2563eb",
  info: "#16a34a",
};

function recommendationsIntroHtml(items: LoraRecommendation[]): string {
  if (items.length === 0) return "";
  const urgentes = items.filter((i) => i.severity === "alta").length;
  const basis =
    urgentes > 0
      ? `${urgentes} de ${items.length} exige${urgentes === 1 ? "" : "n"} atención antes de la puesta en servicio`
      : "sin incumplimientos graves; son acciones de margen y refuerzo";
  return `<p class="rec-summary">Se proponen ${items.length} ${items.length === 1 ? "acción" : "acciones"}: ${basis}.</p>`;
}

function recommendationCardsHtml(items: LoraRecommendation[]): string {
  if (items.length === 0) {
    return '<p class="muted">No se necesitan recomendaciones.</p>';
  }
  return items
    .map(({ severity, category, title, detail }) => {
      const color = REC_SEVERITY_COLOR[severity] ?? "#2563eb";
      return `<div class="rec" style="border-left-color:${color}">
      <div class="rec-head">
        <span style="width:9px;height:9px;border-radius:50%;background:${color};display:inline-block;"></span>
        <span class="rec-title">${esc(title)}</span>
        <span class="rec-chip" style="background:${color}">${esc(REC_CATEGORY_LABEL[category] ?? category)}</span>
      </div>
      <div class="rec-body">${esc(detail)}</div>
    </div>`;
    })
    .join("");
}

/**
 * Construye las secciones del análisis en el orden del documento:
 * [0] Vista general, [1] Gráficas, [2] Detalle, [3] Coherencia, [4] Recomendaciones.
 */
function buildAnalysisParts(
  blocks: Array<Record<string, any>>,
  noiseEntries: Array<Record<string, any>>,
  measures: Array<Record<string, any>>,
  noiseRecords: Array<Record<string, any>>,
  evaluations: EvaluatedMetric[],
  coherence: Array<Record<string, any>>,
  summary: ReturnType<typeof summarizeAnalysis>,
  manualResult?: string | null
): string[] {
  const total = summary.total;

  const overview = `<section class="break"><h2 id="sec-vista-general"><span class="secnum">3</span> Vista general</h2>
    <div class="kpis">
      <div class="kpi"><b>${total}</b>criterios</div>
      <div class="kpi"><b style="color:#16a34a">${summary.byStatus.PASS}</b>conformes</div>
      <div class="kpi"><b style="color:#d97706">${summary.byStatus.WARNING}</b>límite</div>
      <div class="kpi"><b style="color:#dc2626">${summary.byStatus.FAIL}</b>no conformes</div>
    </div>

    <h3>Resultado global: ${esc(globalLabel(manualResult ?? summary.globalResult))}</h3>
    ${
      manualResult
        ? `<p class="muted">Ajustado a mano por el auditor: <b>${esc(globalLabel(manualResult))}</b></p>`
        : ""
    }
    ${summary.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}

    <h3>Resumen por categoría</h3>
    ${categorySummaryHtml(evaluations)}

    ${blocks.length > 0 ? `<h3>Resumen por medida</h3>${measureSummaryTable(blocks)}` : ""}

    <h3>Baremo de niveles</h3>
    ${levelsLegendHtml()}
  </section>`;

  const charts = `<section class="break"><h2 id="sec-graficas"><span class="secnum">5</span> Gráficas del enlace</h2>
    <div class="chartgrid">${analysisChartsHtml(blocks, noiseEntries)}</div>
  </section>`;

  const detail = `<h3 id="sec-analisis-detalle">8.1 Detalle por medida y ruido</h3>
    ${elementDetailHtml(evaluations, measures, noiseRecords)}`;

  const coherencePart = `<h3 id="sec-analisis-coherencia">8.2 Coherencia cruzada</h3>
    <p class="muted">Confronta las métricas de cada muestra (RSSI, SNR, pérdidas y margen) para detectar contradicciones entre la señal y la entrega de paquetes.</p>
    ${coherenceHtml(coherence)}`;

  const recommendations = `<section class="break"><h2 id="sec-recomendaciones"><span class="secnum">9</span> Recomendaciones</h2>
    ${recommendationsIntroHtml(summary.recommendations)}
    ${recommendationCardsHtml(summary.recommendations)}
  </section>`;

  return [overview, charts, detail, coherencePart, recommendations];
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
    <p class="muted">${blocks.length} muestras · margen = RSSI − piso de ruido (${fmtNum(noiseFloor, 1)} dBm). Verde ≥ 10 dB · ámbar 0…10 · rojo &lt; 0.</p>`;
}

const globalLabel = (result: string): string =>
  ({
    APROBADO: "Aprobado",
    APROBADO_CON_OBSERVACIONES: "Aprobado con observaciones",
    NO_CONFORME: "No conforme",
    SIN_DATOS_SUFICIENTES: "Sin datos suficientes",
    CONFORME: "Conforme",
    CONFORME_CON_ANOTACIONES: "Conforme con anotaciones",
  })[result] ?? result;

const metricLabel = (metric: string): string =>
  ({
    COBERTURA: "Cobertura",
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
  const order = [
    "COBERTURA",
    "RADIO",
    "PAQUETES",
    "RUIDO",
    "MARGEN",
    "COHERENCIA",
  ];
  const labels: Record<string, string> = {
    COBERTURA: "Cobertura",
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
    parts.push(
      `<h4>${sourceLabel}${m.location ? ` · ${esc(String(m.location))}` : ""}</h4>${meta ? `<p class="muted">${meta}</p>` : ""}${evalDetailTable(evals)}`
    );
  });
  noiseRecords.forEach((n, index) => {
    const sourceLabel = `Ruido ${index + 1}`;
    const evals = bySource(sourceLabel);
    if (evals.length === 0) return;
    parts.push(
      `<h4>${sourceLabel}${n.location ? ` · ${esc(String(n.location))}` : ""}</h4>${evalDetailTable(evals)}`
    );
  });
  if (parts.length === 0) return '<p class="muted">Sin evaluaciones.</p>';
  return parts.join("");
}

// Resumen agregado por medida: una fila por medida con los promedios, en vez
// de leer decenas de filas por muestra.
function measureSummaryTable(blocks: Array<Record<string, any>>): string {
  const byMeasure = new Map<string, Array<Record<string, any>>>();
  for (const b of blocks) {
    const key = String(b.sourceLabel ?? "—");
    if (!byMeasure.has(key)) byMeasure.set(key, []);
    byMeasure.get(key)!.push(b);
  }
  const ordered = [...byMeasure.entries()].sort(([a], [b]) => {
    const an = Number(String(a).match(/^Medida\s+(\d+)/)?.[1] ?? 999);
    const bn = Number(String(b).match(/^Medida\s+(\d+)/)?.[1] ?? 999);
    return an - bn;
  });

  const nums = (bs: Array<Record<string, any>>, field: string): number[] =>
    bs
      .map((b) => b[field])
      .filter((v) => v != null && !Number.isNaN(Number(v)))
      .map(Number);
  const min = (values: number[]): number | null =>
    values.length ? Math.min(...values) : null;
  const avg = (values: number[]): number | null =>
    values.length
      ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) /
        10
      : null;
  const cell = (values: number[]): string => {
    const lo = min(values);
    const hi = avg(values);
    return lo == null
      ? "—"
      : hi == null || hi === lo
        ? `${fmtNum(lo)}`
        : `${fmtNum(lo)} → ${fmtNum(hi)}`;
  };

  const rows = ordered
    .map(([label, bs]) => {
      const size = bs.length;
      const enlace = bs.filter((b) => b.rssi != null || b.snr != null).length;
      const rssi = nums(bs, "rssi");
      const snr = nums(bs, "snr");
      const loss = nums(bs, "packetLossPct");
      const uplink = nums(bs, "totalPackets");
      const confirm = nums(bs, "successfulPackets");
      const sumU = uplink.reduce((s, v) => s + v, 0);
      const sumC = confirm.reduce((s, v) => s + v, 0);
      const acuses = sumU > 0 ? Math.round((sumC / sumU) * 1000) / 10 : null;
      const paqMuestra = uplink.length
        ? Math.round((sumU / uplink.length) * 10) / 10
        : null;

      let worstLv: LoraQualityLevel | null = null;
      for (const b of bs) {
        const lv = levelOf({
          rssi: b.rssi == null ? null : Number(b.rssi),
          snr: b.snr == null ? null : Number(b.snr),
          packetLossPct:
            b.packetLossPct == null ? null : Number(b.packetLossPct),
        });
        worstLv = worstLv === null ? lv : worseOf(worstLv, lv);
      }
      const lvColor = worstLv ? LORA_LEVEL_COLOR[worstLv] : "#9ca3af";
      const lvLabel = worstLv ? LORA_LEVEL_LABEL[worstLv] : "—";

      return `<tr>
        <td style="font-weight:bold">${esc(label)}</td>
        <td>${size}</td>
        <td>${enlace}/${size}</td>
        <td>${cell(rssi)}</td>
        <td>${cell(snr)}</td>
        <td>${avg(loss) == null ? "—" : `${fmtNum(avg(loss))}%`}</td>
        <td>${acuses == null ? "—" : `${fmtNum(acuses)}%`}</td>
        <td>${paqMuestra == null ? "—" : fmtNum(paqMuestra)}</td>
        <td><span style="color:${lvColor};font-weight:bold">${esc(lvLabel)}</span></td>
      </tr>`;
    })
    .join("");

  return `<table>
    <thead><tr><th>Medida</th><th>Muestras</th><th>Con enlace</th><th>RSSI mín→med (dBm)</th><th>SNR mín→med (dB)</th><th>Pérdida media</th><th>Acuses</th><th>Pkts/muestra</th><th>Nivel</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ---------- Apartado "Baremo aplicado" ----------

function baremoSection(): string {
  const NC = (n: number): string => fmtNum(n);
  const floors = (nums: number[]): string[] => [
    ...nums.map((n) => `≥ ${NC(n)}`),
    `< ${NC(nums[nums.length - 1])}`,
  ];

  const signalTable = table(
    ["Métrica", "Excelente", "Buena", "Aceptable", "Débil", "Crítica"],
    [
      ["RSSI (dBm)", ...floors([-70, -85, -100, -115])],
      ["SNR (dB)", ...floors([10, 5, 0, -5])],
      ["Margen LoRa (dB)", ...floors([10, 5, 0, -5])],
    ]
  );

  const sfKeys = ["SF7", "SF8", "SF9", "SF10", "SF11", "SF12"];
  const sfFloorTable = table(
    ["SF", ...sfKeys],
    [["Piso SNR (dB)", ...sfKeys.map((k) => NC(SNR_FLOOR_BY_SF[k]))]]
  );

  const packetTable = table(
    [
      "Nivel",
      "Excelente",
      "Muy buena",
      "Buena",
      "Aceptable",
      "Débil",
      "Crítica",
    ],
    [
      [
        "Pérdida de paquetes (%)",
        `≤ ${NC(LORA_BAREMO.packetLoss.excelentePct)}%`,
        `≤ ${NC(LORA_BAREMO.packetLoss.muyBuenaPct)}%`,
        `≤ ${NC(LORA_BAREMO.packetLoss.buenaPct)}%`,
        `≤ ${NC(LORA_BAREMO.packetLoss.aceptablePct)}%`,
        `≤ ${NC(LORA_BAREMO.packetLoss.debilPct)}%`,
        `> ${NC(LORA_BAREMO.packetLoss.debilPct)}%`,
      ],
    ]
  );

  const en = LORA_BAREMO.noise.excelente,
    bn = LORA_BAREMO.noise.buena,
    an = LORA_BAREMO.noise.aceptable,
    dn = LORA_BAREMO.noise.debil;
  const noiseTable = table(
    ["Métrica", "Excelente", "Buena", "Aceptable", "Débil", "Crítica"],
    [
      [
        "Elevación del scan (dB)",
        `≤ ${NC(en)}`,
        `≤ ${NC(bn)}`,
        `≤ ${NC(an)}`,
        `≤ ${NC(dn)}`,
        `> ${NC(dn)}`,
      ],
    ]
  );

  const checksTable = table(
    ["Comprobación", "Conforme", "En el límite", "No conforme"],
    [
      [
        "Tasa de confirmación (ACK)",
        `≥ ${NC(LORA_BAREMO.ackRate.buena)}%`,
        `${NC(LORA_BAREMO.ackRate.aceptable)}–${NC(LORA_BAREMO.ackRate.buena)}%`,
        `< ${NC(LORA_BAREMO.ackRate.aceptable)}%`,
      ],
      [
        "Coherencia |RSSI − RSSI senoidal|",
        `≤ ${NC(LORA_BAREMO.rssis.consistente)} dB`,
        `≤ ${NC(LORA_BAREMO.rssis.sospechosa)} dB`,
        `> ${NC(LORA_BAREMO.rssis.sospechosa)} dB`,
      ],
      [
        "Potencia de transmisión",
        `≥ ${NC(LORA_BAREMO.txPower.adecuada)} dBm`,
        "0–10 dBm",
        "≤ 0 dBm",
      ],
    ]
  );

  const statusTable = table(
    ["Estado", "Niveles"],
    [
      ["Conforme (PASS)", "Excelente · Buena (Muy buena en pérdida)"],
      ["En el límite (WARNING)", "Aceptable"],
      ["No conforme (FAIL)", "Débil · Crítica"],
      ["Sin dato (UNKNOWN)", "Métrica sin valor capturado"],
    ]
  );

  const chips = `<div class="levels">${LORA_LEVELS.map(
    (lvl) =>
      `<div class="levels-item"><span class="swatch" style="background:${lvl.color}"></span>${esc(lvl.label)}</div>`
  ).join("")}</div>`;

  const pC = LORA_BAREMO.packetConfidence;
  return `<section class="break"><h2 id="sec-baremo"><span class="secnum">2</span> Baremo aplicado</h2>
    <p class="muted">Umbrales utilizados para clasificar cada muestra y cada criterio de este informe. El nivel de una muestra es el peor entre RSSI, SNR, pérdida de paquetes y margen; si la señal es Abnormal, faltan RSSI/SNR o la pérdida es del 100 %, la muestra se clasifica como «Sin cobertura».</p>

    <h3>Escala de niveles</h3>
    ${chips}

    <h3>Señal: RSSI, SNR y margen</h3>
    <p class="muted">El margen LoRa real es margen = SNR − piso teórico del SF usado, porque LoRa demodula por debajo del ruido.</p>
    ${signalTable}
    ${sfFloorTable}
    <p class="muted">Ejemplo: SF10 con SNR −10 dB → margen −10 − (−15) = 5 dB ⇒ Buena.</p>

    <h3>Paquetes</h3>
    ${packetTable}
    <p class="muted">LoRa tolera más pérdidas que Wi-Fi; los umbrales se ajustan a la operación real.</p>

    <h3>Ruido</h3>
    ${noiseTable}
    <p class="muted">Elevación del scan actual respecto a la media ponderada de cada banda del espectro SGM.</p>

    <h3>Calidad de datos</h3>
    ${checksTable}
    <p class="muted">Confianza de la muestra según paquetes totales: &lt; ${NC(pC.low)} baja · ${NC(pC.low)}–${NC(pC.preliminary)} preliminar · ≥ ${NC(pC.preliminary)} alta.</p>

    <h3>De nivel a estado</h3>
    ${statusTable}
  </section>`;
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
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
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
  antenna?: { lat: number; lon: number } | null;
}

// ---------- Índice ----------

type TocEntry = {
  id: string;
  number: string;
  label: string;
  level: 0 | 1;
  conditional?: boolean;
};

const TOC_ENTRIES: TocEntry[] = [
  { id: "sec-datos", number: "1", label: "Datos generales", level: 0 },
  { id: "sec-baremo", number: "2", label: "Baremo aplicado", level: 0 },
  { id: "sec-vista-general", number: "3", label: "Vista general", level: 0 },
  {
    id: "sec-cobertura",
    number: "4",
    label: "Cobertura sobre el plano",
    level: 0,
    conditional: true,
  },
  { id: "sec-graficas", number: "5", label: "Gráficas del enlace", level: 0 },
  { id: "sec-medidas", number: "6", label: "Medidas LoRa", level: 0 },
  { id: "sec-ruido", number: "7", label: "Ruido", level: 0 },
  { id: "sec-analisis", number: "8", label: "Análisis del enlace", level: 0 },
  {
    id: "sec-analisis-detalle",
    number: "8.1",
    label: "Detalle por medida y ruido",
    level: 1,
  },
  {
    id: "sec-analisis-coherencia",
    number: "8.2",
    label: "Coherencia cruzada",
    level: 1,
  },
  {
    id: "sec-recomendaciones",
    number: "9",
    label: "Recomendaciones",
    level: 0,
  },
];

const nodeRequire = createRequire(__filename);

function buildTocTable(
  pageMap: Record<string, number>,
  showCoverageSection: boolean
): string {
  const rows = TOC_ENTRIES.filter((e) => !e.conditional || showCoverageSection)
    .map((e) => {
      const page = pageMap[e.id] ?? "–";
      const cls = e.level === 0 ? "toc-l1" : "toc-l2";
      return `<tr class="${cls}"><td><a href="#${e.id}"><span class="n">${e.number}</span>${e.label}</a></td><td class="toc-dots"></td><td class="toc-page">${page}</td></tr>`;
    })
    .join("");
  return `<div class="toc">
    <h2>Índice</h2>
    <table><tbody>${rows}</tbody></table>
  </div>`;
}

export function renderLoraReportHtml(
  data: LoraReportData,
  pageMap: Record<string, number> = {}
): string {
  const header = data.header ?? {};
  const showCoverageSection = Boolean(data.floorPlan?.image);

  const heatmapsHtml = planHeatmapsHtml(
    data.measures ?? [],
    data.noise ?? [],
    data.floorPlan,
    data.heatmapRadius,
    data.antenna
  );

  const blocks = (data.measures ?? []).flatMap((m, index) =>
    (Array.isArray(m.samples) ? m.samples : []).map((s, sampleIndex) => ({
      role: sampleRoleText(s, sampleIndex),
      totalPackets: s.uplinkPacket == null ? null : Number(s.uplinkPacket),
      successfulPackets:
        s.confirmPacket == null ? null : Number(s.confirmPacket),
      rssi: s.rssi ?? null,
      rssis: s.rssis ?? null,
      snr: s.snr ?? null,
      packetLossPct: s.packetLossPct ?? null,
      txPower: s.txPower ?? null,
      longitude: s.longitude ?? null,
      latitude: s.latitude ?? null,
      location: s.location ?? null,
      sourceLabel: `Medida ${index + 1}`,
    }))
  );
  const noiseEntries = (data.noise ?? []).flatMap((n, index) =>
    (Array.isArray(n.entries) ? n.entries : []).map((e) => ({
      ...e,
      sourceLabel: `Ruido ${index + 1}`,
    }))
  );
  const { evaluations, coherence } = analyzeLora(blocks, noiseEntries);
  const summary = summarizeAnalysis(evaluations, blocks);
  const [
    overviewHtml,
    chartsHtml,
    detailHtml,
    coherencePart,
    recommendationsHtml,
  ] = buildAnalysisParts(
    blocks,
    noiseEntries,
    data.measures ?? [],
    data.noise ?? [],
    evaluations,
    coherence,
    summary,
    data.header?.result ?? null
  );

  const coverSamples = (data.measures ?? []).flatMap((m) =>
    Array.isArray(m.samples) ? m.samples : []
  );
  const coverMeasures = (data.measures ?? []).length;

  const qualityCell = (s: Record<string, any>): TableCell => {
    const lv = levelOf({
      rssi:
        s.rssi == null || Number.isNaN(Number(s.rssi)) ? null : Number(s.rssi),
      snr: s.snr == null || Number.isNaN(Number(s.snr)) ? null : Number(s.snr),
      signal: s.signal ?? null,
      sf: s.sf ?? null,
      packetLossPct:
        s.packetLossPct == null || Number.isNaN(Number(s.packetLossPct))
          ? null
          : Number(s.packetLossPct),
    });
    const color = LORA_LEVEL_COLOR[lv];
    return raw(
      `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:${color};color:#fff;font-size:9px;font-weight:600;line-height:1.45;white-space:nowrap;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.25)"><span style="width:5px;height:5px;border-radius:99px;background:#fff;display:inline-block"></span>${esc(LORA_LEVEL_LABEL[lv])}</span>`
    );
  };

  const measureHtml = (measure: Record<string, any>) => {
    if (!measure) return '<p class="muted">Sin datos.</p>';
    const samples = Array.isArray(measure.samples) ? measure.samples : [];
    if (samples.length === 0) return '<p class="muted">Sin datos.</p>';
    return table(
      [
        "Nº",
        "Hora",
        "RSSI (dBm)",
        "RSSIS (dBm)",
        "SNR (dB)",
        "Señal",
        "Calidad",
        "UL pkt.",
        "Confirm.",
        "Pérdida (%)",
        "Longitud",
        "Latitud",
        "Ubicación",
        "SF",
        "TX",
      ],
      samples.map((s) => [
        s.txCnt ?? "—",
        s.time ?? "—",
        fmtNum(s.rssi),
        fmtNum(s.rssis),
        fmtNum(s.snr),
        s.signal ?? "—",
        qualityCell(s),
        fmtNum(s.uplinkPacket, 0),
        fmtNum(s.confirmPacket, 0),
        fmtNum(s.packetLossPct),
        fmtNum(s.longitude, 6),
        fmtNum(s.latitude, 6),
        s.location ?? "—",
        s.sf ?? "—",
        s.txPower ?? "—",
      ])
    );
  };

  const measuresHtml =
    (data.measures ?? [])
      .map((measure) => {
        const samplesCount = Array.isArray(measure.samples)
          ? measure.samples.length
          : 0;
        const general = [
          measure.source
            ? `<div><b>Origen:</b> ${esc(measure.source)}</div>`
            : "",
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
        return `<div class="card">${general}${samplesCount > 0 ? `<p class="muted" style="margin:4px 0 0">${samplesCount} ${samplesCount === 1 ? "muestra" : "muestras"}</p>` : ""}${measureHtml(measure)}</div>`;
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
  .secnum { display:inline-block; background:#111827; color:#fff; border-radius:5px; font-size:11px; font-weight:700; padding:2px 9px; margin-right:9px; }
  .plchart { display:flex; flex-direction:column; gap:8px; margin:8px 0 4px; }
  .plrow { display:grid; grid-template-columns:minmax(54px, 70px) 1fr; gap:8px; align-items:center; }
  .plhead { display:flex; flex-direction:column; line-height:1.1; }
  .pllabel { font-size:9px; color:#374151; }
  .plval { font-size:11px; font-weight:bold; color:#111827; }
  .pltrack { height:18px; background:#f3f4f6; border-radius:4px; overflow:hidden; }
  .pltrack > div { height:100%; border-radius:4px; }
  table { width:100%; border-collapse:collapse; margin:6px 0 10px; }
  th { background:#1f2937; color:#fff; text-align:left; }
  th, td { border:1px solid #d1d5db; padding:3px 6px; font-size:9.5px; }
  tbody tr:nth-child(even) { background:#f8fafc; }
  dl { display:grid; grid-template-columns: 140px 1fr; gap:2px 10px; margin:10px 0; }
  dt { font-weight:bold; }
  dd { margin:0; color:#374151; }
  .cover { page-break-after: always; text-align:center; padding-top:140px; }
  .cover h1 { font-size:34px; margin-bottom:8px; }
  .cover .sub { font-size:16px; color:#374151; margin-bottom:40px; }
  .cover .meta { display:inline-block; text-align:left; margin-top:30px; font-size:12px; }
  .cover .meta div { margin:4px 0; }
  .cover-kpis { display:flex; gap:12px; justify-content:center; margin-top:26px; flex-wrap:wrap; }
  .ckpi { border:1px solid #e5e7eb; border-radius:10px; padding:10px 16px; min-width:100px; background:#f9fafb; }
  .ckpi b { display:block; font-size:19px; color:#111827; }
  .ckpi span { font-size:8.5px; color:#6b7280; text-transform:uppercase; letter-spacing:.05em; }
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
  .levels { display:flex; flex-wrap:wrap; gap:6px 14px; margin:10px 0 2px; }
  .levels-item { display:inline-flex; align-items:center; gap:5px; font-size:10px; color:#374151; }
  .swatch { display:inline-block; width:11px; height:11px; border-radius:3px; border:1px solid rgba(0,0,0,.12); }
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
  .heat-seg { position:relative; }
  .heat-seg > span { position:absolute; top:0; height:100%; display:block; }
  .heat-seg > span + span { border-left:1px solid rgba(0,0,0,.08); }
  .hl-edge { font-size:9px; font-weight:600; color:#374151; white-space:nowrap; }
  .hl-tick { position:absolute; top:100%; transform:translateX(-50%); font-size:8px; color:#6b7280; margin-top:2px; white-space:nowrap; }
  .hl-tick::before { content:""; position:absolute; bottom:100%; left:50%; width:1px; height:4px; background:#9ca3af; margin-bottom:1px; }
  .hl-labels { display:flex; flex-wrap:wrap; gap:4px 14px; margin-top:14px; }
  .hl-lbl { display:inline-flex; align-items:center; gap:4px; font-size:9px; color:#374151; }
  .hl-lbl i { display:inline-block; width:12px; height:12px; border-radius:2px; border:1px solid rgba(0,0,0,.1); }
  .toc { page-break-after: always; padding-top:40px; }
  .toc h2 { font-size:22px; border:0; margin:0 0 18px; }
  .toc table { width:100%; border-collapse:collapse; margin:0; }
  .toc td { border:0 !important; padding:7px 2px; vertical-align:middle; }
  .toc tbody tr:nth-child(even) { background:transparent; }
  .toc a { text-decoration:none; }
  .toc-l1 a { font-size:12.5px; font-weight:700; color:#111827; }
  .toc-l2 td { padding-left:20px; }
  .toc-l2 a { font-size:11px; font-weight:400; color:#374151; }
  .toc .n { display:inline-block; min-width:26px; color:#2563eb; font-size:10px; font-weight:800; margin-right:4px; }
  .toc-l2 .n { color:#94a3b8; font-weight:600; }
  .toc-dots { min-width:30px; border-bottom:2px dotted #cbd5e1 !important; }
  .toc-page { text-align:right; min-width:24px; font-size:12px; font-weight:700; color:#111827; font-variant-numeric:tabular-nums; }
  .rec-summary { font-size:10.5px; color:#374151; margin:0 0 12px; }
  .rec { border:1px solid #e5e7eb; border-left:4px solid #2563eb; border-radius:8px; padding:10px 12px; margin:0 0 10px; page-break-inside:avoid; }
  .rec-head { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
  .rec-title { font-weight:700; font-size:12px; color:#111827; }
  .rec-chip { margin-left:auto; font-size:9px; font-weight:700; padding:2px 8px; border-radius:99px; color:#fff; }
  .rec-body { font-size:10.5px; color:#374151; }
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
      <div><b>Fecha:</b> ${
        header.startDate || header.endDate
          ? fmtDateRange(header.startDate, header.endDate)
          : fmtDate(header.auditDate)
      }</div>
    </div>
    <div class="cover-kpis">
      <div class="ckpi"><b>${coverMeasures}</b><span>Medidas</span></div>
      <div class="ckpi"><b>${coverSamples.length}</b><span>Muestras</span></div>
      <div class="ckpi"><b>${summary.total}</b><span>Criterios</span></div>
    </div>
    ${
      header.result
        ? `<div class="result">Resultado: ${esc(globalLabel(header.result))}</div>`
        : ""
    }
    <p style="margin-top:60px;font-size:10px;color:#6b7280">Generado el ${new Date().toLocaleString("es-ES")}</p>
  </div>

  ${buildTocTable(pageMap, showCoverageSection)}

  <section class="break"><h2 id="sec-datos"><span class="secnum">1</span> Datos generales</h2>
  <dl>
    <dt>Nombre</dt><dd>${esc(header.name) || "—"}</dd>
    <dt>Código</dt><dd>${esc(header.code) || "—"}</dd>
    <dt>Cliente</dt><dd>${esc(header.client) || "—"}</dd>
    <dt>Proyecto</dt><dd>${esc(header.project) || "—"}</dd>
    <dt>Ubicación</dt><dd>${esc(header.location) || "—"}</dd>
    <dt>Técnico</dt><dd>${esc(header.technician) || "—"}</dd>
    <dt>Fechas</dt><dd>${
      header.startDate || header.endDate
        ? fmtDateRange(header.startDate, header.endDate)
        : fmtDate(header.auditDate)
    }</dd>
    <dt>Fecha inicio</dt><dd>${fmtDate(header.startDate)}</dd>
    <dt>Fecha fin</dt><dd>${fmtDate(header.endDate)}</dd>
    <dt>Resultado</dt><dd>${header.result ? esc(globalLabel(header.result)) : "—"}</dd>
    <dt>Objetivo</dt><dd>${esc(header.objective) || "—"}</dd>
  </dl>
  ${
    header.description
      ? `<p style="margin-top:10px"><b>Descripción:</b> ${esc(header.description)}</p>`
      : ""
  }
  </section>

  ${baremoSection()}

  ${overviewHtml}

  ${heatmapsHtml}

  ${chartsHtml}

  <section class="break"><h2 id="sec-medidas"><span class="secnum">6</span> Medidas LoRa (${(data.measures ?? []).length})</h2>${measuresHtml}</section>

  <section class="break"><h2 id="sec-ruido"><span class="secnum">7</span> Ruido (${(data.noise ?? []).length})</h2>${noiseHtml}</section>

  <section class="break"><h2 id="sec-analisis"><span class="secnum">8</span> Análisis del enlace</h2>
  ${detailHtml}

  ${coherencePart}
  </section>

  ${recommendationsHtml}
</body></html>`;
}

export async function renderLoraPdf(data: LoraReportData): Promise<Buffer> {
  const options = { footerLabel: "Informe de auditoría LoRa" };
  // Doble render: 1ª pasada sin números (para localizar con pdfjs-dist la
  // página real de cada apartado) y 2ª pasada inyectando las páginas en el índice.
  const pass1 = await renderPdf(renderLoraReportHtml(data), options);
  const pageMap = await extractHeadingPages(pass1);
  return renderPdf(renderLoraReportHtml(data, pageMap), options);
}

// Cabeceras buscadas en el PDF para conocer la página de cada apartado.
const TOC_HEADING_PATTERNS: Record<string, RegExp> = {
  "sec-datos": /^(?:1\s+)?Datos generales$/,
  "sec-baremo": /^(?:2\s+)?Baremo aplicado$/,
  "sec-vista-general": /^(?:3\s+)?Vista general$/,
  "sec-cobertura": /^(?:4\s+)?Cobertura sobre el plano$/,
  "sec-graficas": /^(?:5\s+)?Gráficas del enlace$/,
  "sec-medidas": /^(?:6\s+)?Medidas LoRa \(\d+\)$/,
  "sec-ruido": /^(?:7\s+)?Ruido \(\d+\)$/,
  "sec-analisis": /^(?:8\s+)?Análisis del enlace$/,
  "sec-analisis-detalle": /^(?:8\.1\s+)?Detalle por medida y ruido$/,
  "sec-analisis-coherencia": /^(?:8\.2\s+)?Coherencia cruzada$/,
  "sec-recomendaciones": /^(?:9\s+)?Recomendaciones$/,
};

/** Recompone líneas de texto del PDF agrupando los fragmentos por su posición Y. */
function textLines(items: any[]): string[] {
  const rows = new Map<number, Array<{ str: string; x: number; w: number }>>();
  for (const it of items) {
    if (typeof it?.str !== "string" || !Array.isArray(it.transform)) continue;
    const y = Math.round(it.transform[5]);
    const list = rows.get(y) ?? [];
    list.push({ str: it.str, x: it.transform[4], w: Number(it.width ?? 0) });
    rows.set(y, list);
  }
  const lines: string[] = [];
  for (const list of rows.values()) {
    list.sort((a, b) => a.x - b.x);
    let line = "";
    let prevEnd = -Infinity;
    for (const t of list) {
      line += t.x > prevEnd + 1 && line !== "" ? " " + t.str : t.str;
      prevEnd = Math.max(prevEnd, t.x + t.w);
    }
    lines.push(line.replace(/\s+/g, " ").trim());
  }
  return lines;
}

/** Localiza, con pdfjs-dist, la página física donde cae cada apartado. */
async function extractHeadingPages(
  pdf: Buffer
): Promise<Record<string, number>> {
  const pdfjs = nodeRequire("pdfjs-dist/legacy/build/pdf.js");
  const map: Record<string, number> = {};
  const pending = new Set(Object.keys(TOC_HEADING_PATTERNS));
  const doc = await pdfjs.getDocument({ data: new Uint8Array(pdf) }).promise;
  try {
    // Las páginas 1 (portada) y 2 (índice) contienen las mismas etiquetas;
    // la búsqueda empieza en la página 3.
    for (let pageNo = 3; pageNo <= doc.numPages && pending.size > 0; pageNo++) {
      const page = await doc.getPage(pageNo);
      const content = await page.getTextContent();
      const lines = textLines(content.items);
      for (const id of Array.from(pending)) {
        if (lines.some((line) => TOC_HEADING_PATTERNS[id].test(line))) {
          map[id] = pageNo;
          pending.delete(id);
        }
      }
    }
  } finally {
    await doc.destroy();
  }
  return map;
}
