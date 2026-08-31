/**
 * Plantilla del informe PDF de auditorías LoRa. Reutiliza el motor de
 * generación de PDF (headless Chromium) del módulo de auditorías Wi-Fi.
 */

import { renderPdf } from "@features/audits/application/report-pdf";
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
      return `<div class="vb" style="height:${height.toFixed(0)}%;background:${item.color}"><em>${item.value!.toFixed(1)}</em><span>${esc(item.label)}</span></div>`;
    })
    .join("")}</div>`;
}

function horizontalBars(
  items: Array<{ label: string; pct: number; color: string }>
): string {
  if (items.length === 0) return '<p class="muted">Sin datos.</p>';
  return `<div class="plchart">${items
    .map((item) => {
      const width = Math.max(2, Math.min(100, item.pct || 0));
      return `<div class="plrow">
        <div class="plhead"><span class="pllabel">${esc(item.label)}</span><span class="plval">${Number(item.pct || 0).toFixed(1)}%</span></div>
        <div class="pltrack"><div style="width:${width.toFixed(1)}%;background:${item.color}"></div></div>
      </div>`;
    })
    .join("")}</div>`;
}

// ---------- Sección de análisis ----------

function analysisHtml(
  blocks: Array<Record<string, any>>,
  noiseEntries: Array<Record<string, any>>
): string {
  const { evaluations, coherence } = analyzeLora(blocks, noiseEntries);
  const summary = summarizeAnalysis(evaluations);
  const total = summary.total;

  const charts: string[] = [];

  // RSSI por bloque
  if (blocks.length > 0) {
    charts.push(`<h3>RSSI por bloque (dBm)</h3>
      ${vbars(
        blocks.map((b) => ({
          label: b.role ?? `Bloque ${String((blocks as any[]).indexOf(b) + 1)}`,
          value: b.rssi ?? null,
          color:
            b.rssi == null
              ? "#9ca3af"
              : b.rssi >= -70
                ? "#16a34a"
                : b.rssi >= -85
                  ? "#d97706"
                  : "#dc2626",
        })),
        { min: -120, max: -40 }
      )}`);
  }

  // SNR por bloque
  if (blocks.length > 0) {
    charts.push(`<h3>SNR por bloque (dB)</h3>
      ${vbars(
        blocks.map((b) => ({
          label: b.role ?? `Bloque ${String((blocks as any[]).indexOf(b) + 1)}`,
          value: b.snr ?? null,
          color:
            b.snr == null
              ? "#9ca3af"
              : b.snr >= 10
                ? "#16a34a"
                : b.snr >= -5
                  ? "#d97706"
                  : "#dc2626",
        })),
        { min: -20, max: 20 }
      )}`);
  }

  // Margen radio por bloque
  if (blocks.length > 0) {
    charts.push(`<h3>Margen radio (RSSI − ruido, dB)</h3>
      ${summarizeMarginChart(blocks, noiseEntries)}`);
  }

  // Pérdida de paquetes por bloque
  if (blocks.length > 0) {
    charts.push(`<h3>Pérdida de paquetes por bloque (%)</h3>
      ${horizontalBars(
        blocks.map((b, index) => ({
          label: b.role ?? `Bloque ${index + 1}`,
          pct: b.packetLossPct ?? 0,
          color:
            b.packetLossPct == null
              ? "#9ca3af"
              : b.packetLossPct <= 5
                ? "#16a34a"
                : b.packetLossPct <= 20
                  ? "#d97706"
                  : "#dc2626",
        }))
      )}
      <p class="muted">Verde ≤ 5% · ámbar 5–20% · rojo &gt; 20%.</p>`);
  }

  // Ruido por frecuencia
  if (noiseEntries.length > 0) {
    charts.push(`<h3>Ruido por frecuencia (dBm)</h3>
      ${vbars(
        noiseEntries.map((e) => ({
          label:
            e.frequency != null ? `${Number(e.frequency).toFixed(0)} MHz` : "?",
          value: e.currentScan ?? null,
          color: "#6366f1",
        })),
        { min: -130, max: -60 }
      )}
      <p class="muted">Nivel de ruido del scan actual en cada banda.</p>`);
  }

  const evaluationsByCategory = categoryRows(evaluations);

  return `<section class="break"><h2>Análisis del enlace</h2>
    <div class="kpis">
      <div class="kpi"><b>${total}</b>criterios</div>
      <div class="kpi"><b style="color:#16a34a">${summary.byStatus.PASS}</b>conformes</div>
      <div class="kpi"><b style="color:#d97706">${summary.byStatus.WARNING}</b>límite</div>
      <div class="kpi"><b style="color:#dc2626">${summary.byStatus.FAIL}</b>no conformes</div>
    </div>

    <h3>Resultado global: ${esc(globalLabel(summary.globalResult))}</h3>
    ${summary.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}

    <h3>Evaluación por criterio</h3>
    <table>
      <thead><tr><th>Bloque / banda</th><th>Métrica</th><th>Valor</th><th>Resultado</th><th>Detalle</th></tr></thead>
      <tbody>
        ${evaluationsByCategory
          .map(
            ([, labelCol, rows]) =>
              `<tr><td rowspan="${rows.length}" style="font-weight:bold;vertical-align:top">${esc(labelCol)}</td>${rows
                .map(
                  (e, i) =>
                    `${i > 0 ? "" : ""}<td>${esc(metricLabel(e.metric))}</td><td>${e.value != null ? `${esc(fmtNum(e.value))} ${esc(e.unit ?? "")}` : "—"}</td><td style="color:${statusColor(e.status)}">${esc(statusLabel(e.status))}${e.label ? ` · ${esc(e.label)}` : ""}</td><td>${esc(e.message)}</td>${i === rows.length - 1 ? "" : "</tr><tr>"}`
                )
                .join("")}</td></tr>`
          )
          .join("")}
      </tbody>
    </table>

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
  const items = blocks.map((b) => {
    const margin = b.rssi != null ? Number(b.rssi) - noiseFloor : null;
    return {
      label: b.role ?? "Bloque",
      value: margin,
      color:
        margin == null
          ? "#9ca3af"
          : margin >= 10
            ? "#16a34a"
            : margin >= 0
              ? "#d97706"
              : "#dc2626",
    };
  });
  return vbars(items, { min: -20, max: 30 });
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

function categoryRows(evaluations: EvaluatedMetric[]): Array<
  [
    string,
    string,
    Array<{
      metric: string;
      value: number | null;
      unit: string | null;
      status: EvalStatus;
      label: string | null;
      message: string;
    }>,
  ]
> {
  const order = ["RADIO", "PAQUETES", "RUIDO", "MARGEN", "COHERENCIA"];
  const labels: Record<string, string> = {
    RADIO: "Radio (RSSI / SNR)",
    PAQUETES: "Paquetes",
    RUIDO: "Ruido por banda",
    MARGEN: "Margen radio",
    COHERENCIA: "Coherencia",
  };
  const out: Array<
    [
      string,
      string,
      Array<{
        metric: string;
        value: number | null;
        unit: string | null;
        status: EvalStatus;
        label: string | null;
        message: string;
      }>,
    ]
  > = [];
  for (const category of order) {
    const rows = evaluations.filter((e) => e.category === category);
    if (rows.length === 0) continue;
    out.push([
      category,
      labels[category] ?? category,
      rows.map((e) => ({
        metric: e.metric,
        value: e.value,
        unit: e.unit,
        status: e.status,
        label: e.label,
        message: e.message,
      })),
    ]);
  }
  return out;
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
  .vbars { display:flex; align-items:flex-end; gap:10px; height:150px; margin:12px 0 6px; border-bottom:1px solid #d1d5db; }
  .vb { display:flex; flex-direction:column; justify-content:flex-end; width:44px; border-radius:4px 4px 0 0; text-align:center; position:relative; }
  .vb em { font-style:normal; font-size:9px; color:#111827; margin-bottom:3px; }
  .vb span { font-size:9px; color:#374151; margin-top:3px; }
  h3 { font-size:12.5px; margin:14px 0 6px; color:#111827; }
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

  ${(() => {
    const blocks = (data.measures ?? []).flatMap((m) =>
      Array.isArray(m.blocks) ? m.blocks : []
    );
    const noiseEntries = (data.noise ?? []).flatMap((n) =>
      Array.isArray(n.entries) ? n.entries : []
    );
    return analysisHtml(blocks, noiseEntries);
  })()}
</body></html>`;
}

export async function renderLoraPdf(data: LoraReportData): Promise<Buffer> {
  return renderPdf(renderLoraReportHtml(data));
}
