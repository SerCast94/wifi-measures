/**
 * Generación de PDF real del informe mediante headless Chromium
 * (puppeteer-core + binario del sistema). Incluye numeración física de
 * páginas vía footerTemplate de Puppeteer.
 */

import { accessSync } from "node:fs";
import { createRequire } from "node:module";

const nodeRequire = createRequire(__filename);

const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const fmtDate = (value: any): string =>
  value ? new Date(value).toLocaleDateString("es-ES") : "—";

const signalHex = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value))
    return "#9ca3af";
  if (value >= -67) return "#16a34a";
  if (value >= -72) return "#d97706";
  return "#dc2626";
};

const statusLabel = (status: string): string =>
  ({
    PASS: "Conforme",
    WARNING: "En el límite",
    FAIL: "No conforme",
    UNKNOWN: "No disponible",
  })[status] ?? status;

const statusColor = (status: string): string =>
  ({
    PASS: "#16a34a",
    WARNING: "#d97706",
    FAIL: "#dc2626",
    UNKNOWN: "#6b7280",
  })[status] ?? "#374151";

export function heatmap(data: any, metricOverride?: string): string {
  if (!data?.image) return "";
  const srcRaw = String(data.image);
  const src = srcRaw.startsWith("data:")
    ? srcRaw
    : `data:image/png;base64,${srcRaw}`;
  const imgTag = `<img src="${src}" alt="plano"/>`;
  let points: any[] = (Array.isArray(data.points) ? data.points : []).filter(
    (p: any) => p.value != null && Number.isFinite(Number(p.value))
  );
  const preferred =
    metricOverride ??
    (points.some((p: any) => String(p.metric) === "snr") ? "snr" : "signal");
  points = points.filter((pt: any) => String(pt.metric) === preferred);
  if (points.length === 0) return `<div class="heatmap">${imgTag}</div>`;
  const vals = points.map((p: any) => Number(p.value));
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (max === min) {
    min -= 1;
    max += 1;
  }
  // Dimensiones reales de la imagen para calcular en espacio de píxeles (como la web)
  const buf = decodeBase64Image(src);
  const dim = buf ? pngJpegSize(buf) : null;
  const scale = dim ? Math.min(1, 900 / dim.w) : 1;
  const W = Math.max(200, Math.round((dim ? dim.w : 800) * scale));
  const H = Math.max(150, Math.round((dim ? dim.h : 600) * scale));
  const ratio = (dim ? dim.w : W) / (dim ? dim.h : H);
  const maxR = Math.max(W, H) * (Number.isFinite(Number(data.maxRadius)) ? Number(data.maxRadius) : 0.16);
  const cell = Math.max(6, Math.floor(Math.max(W, H) / 200));
  const MIN_A = 0.04;
  const MAX_A = 0.62;
  let rects = "";
  for (let gy = 0; gy < H; gy += cell) {
    for (let gx = 0; gx < W; gx += cell) {
      let ws = 0,
        vs = 0,
        md = Infinity;
      for (const p of points) {
        const px = (Number(p.x) / 100) * W;
        const py = (Number(p.y) / 100) * H;
        const dx = gx - px,
          dy = gy - py;
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2);
        if (d < md) md = d;
        const w = 1 / (d2 + 1);
        ws += w;
        vs += w * Number(p.value);
      }
      const alpha =
        Math.max(0, Math.min(1, 1 - md / maxR)) * (MAX_A - MIN_A) + MIN_A;
      if (md > maxR && alpha <= MIN_A) continue;
      const t = Math.max(0, Math.min(1, (vs / ws - min) / (max - min)));
      rects += `<rect x="${gx}" y="${gy}" width="${cell}" height="${cell}" fill="hsla(${(t * 120) | 0},90%,50%,${alpha.toFixed(3)})"/>`;
    }
  }
  const fontPx = Math.max(14, Math.round(Math.max(W, H) / 90));
  let marks = "";
  for (const p of points) {
    const x = (Math.max(0, Math.min(100, Number(p.x))) / 100) * W;
    const y = (Math.max(0, Math.min(100, Number(p.y))) / 100) * H;
    marks += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="rgba(255,255,255,.9)" stroke="#111827" stroke-width="2"/><text x="${(x + 10).toFixed(1)}" y="${y.toFixed(1)}" font-size="${fontPx}" font-weight="bold" fill="#111827" dominant-baseline="central" paint-order="stroke" stroke="rgba(255,255,255,.9)" stroke-width="4">${Number(p.value).toFixed(0)}</text>`;
  }
  const isSnr = preferred === "snr";
  const thresholds = isSnr
    ? [
        { val: 15, label: "15" },
        { val: 25, label: "25" },
        { val: 40, label: "40" },
      ]
    : [
        { val: -80, label: "−80" },
        { val: -72, label: "−72" },
        { val: -67, label: "−67" },
      ];
  const metricLabel = esc(
    data.metricLabel ?? (isSnr ? "SNR" : "Nivel de señal")
  );
  const unit = esc(data.unit ?? (isSnr ? "dB" : "dBm"));
  const rangeMin = min;
  const rangeMax = max;
  let gradStops = "";
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const hue = Math.round(t * 120);
    gradStops += `hsl(${hue},90%,50%) ${(t * 100).toFixed(1)}%${i < 20 ? "," : ""}`;
  }
  const ticks = thresholds
    .map((th) => {
      const pct =
        rangeMax === rangeMin
          ? 50
          : ((th.val - rangeMin) / (rangeMax - rangeMin)) * 100;
      if (pct < 0 || pct > 100) return "";
      return `<span class="hl-tick" style="left:${pct.toFixed(1)}%">${th.label}</span>`;
    })
    .join("");
  const legMin = min.toFixed(0);
  const legMax = max.toFixed(0);
  return `<div class="heatmap"><div class="heat-box" style="aspect-ratio:${ratio.toFixed(4)}">${imgTag}<svg class="heat-overlay" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><g>${rects}</g>${marks}</svg></div><div class="heat-legend"><p class="hl-title">${metricLabel} (${unit})</p><div class="hl-bar-wrap"><span class="hl-edge">${legMin}</span><div class="hl-bar"><div class="hl-grad" style="background:linear-gradient(90deg,${gradStops})"></div>${ticks}</div><span class="hl-edge">${legMax}</span></div><div class="hl-labels"><span class="hl-lbl"><i style="background:#dc2626"></i>Pobre</span><span class="hl-lbl"><i style="background:#eab308"></i>Aceptable</span><span class="hl-lbl"><i style="background:#16a34a"></i>Excelente</span></div></div></div>`;
}

function hbar(
  items: Array<{ label: string; value: number; color: string }>
): string {
  const total = items.reduce((acc, item) => acc + item.value, 0);
  if (total === 0) return "";
  const max = Math.max(...items.map((item) => item.value));
  return `<table class="hbars">${items
    .map(
      (item) =>
        `<tr><td class="hl">${esc(item.label)}</td><td class="hb"><div style="width:${((item.value / max) * 100).toFixed(1)}%;background:${item.color}"></div></td><td class="hv">${item.value}</td></tr>`
    )
    .join("")}</table>`;
}

function vbar(
  items: Array<{ label: string; value: number; color: string }>
): string {
  const max = Math.max(...items.map((item) => item.value));
  if (max <= 0) return "";
  return `<div class="vbars">${items
    .map(
      (item) =>
        `<div class="vb" style="height:${Math.max(3, (item.value / max) * 88)}%;background:${item.color};position:relative"><em>${item.value || ""}</em><span>${esc(item.label)}</span></div>`
    )
    .join("")}</div>`;
}

function bandColor(band: unknown): string {
  const b = String(band ?? "");
  return b.includes("2.4")
    ? "#f59e0b"
    : b.includes("5")
      ? "#3b82f6"
      : b.includes("6")
        ? "#8b5cf6"
        : "#94a3b8";
}

function clientDot(signal: any): string {
  if (signal == null) return "#9ca3af";
  const v = Number(signal);
  if (Number.isNaN(v)) return "#9ca3af";
  return v >= -60 ? "#22c55e" : v >= -70 ? "#eab308" : "#ef4444";
}

function topoHtml(detail: any): string {
  const hosts: any[] = detail.hosts ?? [];
  const ssidEntries = hosts
    .filter((h) => h.hostType === "ssid")
    .map((sh) => ({
      name: String(sh.name ?? "—"),
      security: sh.securityType,
      clients: hosts
        .filter((c) => c.hostType === "client" && c.ssid === sh.name)
        .sort((x, y) => (y.signal ?? -999) - (x.signal ?? -999))
        .slice(0, 20),
    }))
    .sort((a, b) => b.clients.length - a.clients.length)
    .slice(0, 15);
  const aps = hosts
    .filter((h) => h.hostType === "ap")
    .sort((a, b) => (b.signal ?? -999) - (a.signal ?? -999))
    .slice(0, 12);
  if (ssidEntries.length === 0 && aps.length === 0) return "";
  const apCol = aps.length
    ? `<div class="tp-col"><p class="tp-h">Puntos de acceso (${aps.length})</p>${aps
        .map(
          (ap) =>
            `<div class="tp-ap"><b>${esc(String(ap.name ?? ap.mac ?? "AP"))}</b><span style="color:${clientDot(ap.signal)};font-weight:bold">${ap.signal != null ? Number(ap.signal).toFixed(0) + " dBm" : "—"}</span><small>Ch ${esc(String(ap.channel ?? "—"))} · ${esc(String(ap.band ?? "—"))}</small></div>`
        )
        .join("")}</div>`
    : "";
  const ssidCol = ssidEntries.length
    ? `<div class="tp-col"><p class="tp-h">Redes SSID y clientes</p>${ssidEntries
        .map(
          (e) =>
            `<div class="tp-ssid"><b>${esc(e.name)}</b><small>${e.clients.length} clientes${e.security ? " · " + esc(String(e.security)) : ""}</small>${e.clients
              .map(
                (c) =>
                  `<div class="tp-cli"><i style="background:${clientDot(c.signal)}"></i>${esc(String(c.name ?? c.mac ?? "Cliente"))}<em>${c.signal != null ? Number(c.signal).toFixed(0) + " dBm" : ""}</em></div>`
              )
              .join("")}</div>`
        )
        .join("")}</div>`
    : "";
  return `<div class="tp-wrap">${apCol}${ssidCol}</div><p class="tp-leg">Leyenda: <i style="background:#22c55e"></i>≥ -60 dBm · <i style="background:#eab308"></i>-60…-70 dBm · <i style="background:#ef4444"></i>&lt; -70 dBm</p>`;
}

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return "";
  return `<table><thead><tr>${headers
    .map((header) => `<th>${esc(header)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

export function renderReportHtml(data: any): string {
  const header = data.header ?? {};
  const kpis = data.resumen?.kpis ?? {};
  const cobertura: any[] = data.cobertura ?? [];

  const conectividadRows: any[] = data.conectividad?.rows ?? [];

  const radioSsids: any[] = data.radio?.ssids ?? [];

  const radioAps: any[] = data.radio?.aps ?? [];
  const incidencias: any[] = data.incidencias ?? [];

  const recomendaciones: any[] = data.recomendaciones ?? [];

  const coberturaHtml = cobertura.length
    ? `<section><h2 id="sec-cobertura">Cobertura por encuesta</h2>${cobertura
        .map((surveyRow) => {
          const hasSignal = (surveyRow.points ?? []).some(
            (p: any) => String(p.metric) === "signal" && p.value != null
          );
          const hasSnr = (surveyRow.points ?? []).some(
            (p: any) => String(p.metric) === "snr" && p.value != null
          );
          return `<div class="card">
        <h3>${esc(surveyRow.name)}${surveyRow.floorName ? ` — ${esc(surveyRow.floorName)}` : ""}</h3>
        <p class="muted">${esc(surveyRow.pointCount)} puntos medidos</p>
        ${hasSignal ? `<h4 style="font-size:11px;margin:8px 0 2px">Mapa de nivel de señal (dBm)</h4>${heatmap(surveyRow, "signal")}` : ""}
        ${hasSnr ? `<h4 style="font-size:11px;margin:8px 0 2px">Mapa de SNR (dB)</h4>${heatmap(surveyRow, "snr")}` : ""}
        <ul>${(surveyRow.evaluations ?? [])
          .map(
            (item: any) =>
              `<li><strong>${esc(item.metric)}</strong>: ${
                item.value !== null && item.value !== undefined
                  ? `${esc(item.value)}${esc(item.unit ?? "")}`
                  : "sin dato"
              } — <span style="color:${statusColor(item.status)}">${statusLabel(item.status)}</span></li>`
          )
          .join("")}</ul></div>`;
        })
        .join("")}</section>`
    : "";

  const conectividadHtml = conectividadRows.length
    ? `<section><h2 id="sec-conectividad">Conectividad por punto</h2>${conectividadRows
        .map(
          (row) =>
            `<p><strong>${esc(row.point)}</strong></p><ul>${Object.entries(
              row.results ?? {}
            )
              .map(
                ([metric, result]: [string, any]) =>
                  `<li>${esc(metric)}: <span style="color:${statusColor(result.status)}">${esc(
                    result.status
                  )}</span></li>`
              )
              .join("")}</ul>`
        )
        .join("")}</section>`
    : "";

  const ssidsHtml = radioSsids.length
    ? `<h3>SSIDs (${radioSsids.length})</h3>${table(
        ["SSID", "Seguridad", "Banda", "Señal"],
        radioSsids
          .slice(0, 30)
          .map((ssid) => [
            esc(ssid.ssid ?? "—"),
            esc(ssid.securityType ?? "—"),
            esc(ssid.band ?? "—"),
            `<span style="color:${signalHex(ssid.signal == null ? NaN : Number(ssid.signal))}">${
              ssid.signal != null ? Number(ssid.signal).toFixed(0) : "—"
            }</span>`,
          ])
      )}`
    : "";
  const apsHtml = radioAps.length
    ? `<h3>Puntos de acceso (${radioAps.length}, primeros 40)</h3>${table(
        ["Nombre/SSID", "MAC", "Canal", "Banda", "Señal"],
        radioAps
          .slice(0, 40)
          .map((ap) => [
            esc(ap.name ?? ap.ssid ?? "—"),
            esc(ap.mac ?? "—"),
            esc(ap.channel ?? "—"),
            esc(ap.band ?? "—"),
            `<span style="color:${signalHex(ap.signal == null ? NaN : Number(ap.signal))}">${
              ap.signal != null ? Number(ap.signal).toFixed(0) : "—"
            }</span>`,
          ])
      )}`
    : "";
  const radioHtml =
    ssidsHtml || apsHtml
      ? `<section class="break"><h2 id="sec-entorno-radio">Entorno radioeléctrico detectado</h2>${ssidsHtml}${apsHtml}</section>`
      : "";

  const recomendacionesLabels: Record<string, string> = {
    INMEDIATA: "Acciones inmediatas",
    OPTIMIZACION: "Optimización",
    INFRAESTRUCTURA: "Infraestructura",
  };
  const recomendacionesHtml = recomendaciones.some(
    (group) => (group.items ?? []).length > 0
  )
    ? `<section class="break"><h2 id="sec-recomendaciones">Recomendaciones</h2>${recomendaciones
        .filter((group) => (group.items ?? []).length > 0)
        .map(
          (
            group
          ) => `<h3>${esc(recomendacionesLabels[group.category] ?? group.category)}</h3>
        <ul>${group.items.map((item: any) => `<li>${esc(item.text)}</li>`).join("")}</ul>`
        )
        .join("")}</section>`
    : "";

  // Agregados para las gráficas de dispositivos (mismos criterios que AnalysisCharts)
  const analisisDetalles: any[] = data.analisisDetalle ?? [];
  const allHosts: any[] = analisisDetalles.flatMap((d) => d.hosts ?? []);
  const byKey = (arr: any[], keyFn: (h: any) => string | null) => {
    const map = new Map<string, number>();
    for (const h of arr) {
      const k = keyFn(h);
      if (k) map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };
  const bucketize = (
    values: number[],
    buckets: Array<{ label: string; min: number; max: number }>
  ) =>
    buckets.map((b) => ({
      label: b.label,
      value: values.filter((v) => v >= b.min && v < b.max).length,
    }));
  const signalValues = allHosts
    .filter((h) => h.signal != null)
    .map((h) => Number(h.signal));
  const snrValues = allHosts
    .filter((h) => h.snr != null)
    .map((h) => Number(h.snr));
  const PIE_COLORS = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#14b8a6",
    "#ec4899",
    "#6b7280",
  ];
  const bandaHtml = hbar(
    byKey(allHosts, (h) => (h.band ? String(h.band) : null)).map(
      ([label, value]) => ({ label, value, color: bandColor(label) })
    )
  );
  const seguridadHtml = (() => {
    const rows = byKey(allHosts, (h) =>
      h.securityType ? String(h.securityType) : null
    ).slice(0, 8);
    if (rows.length === 0) return "";
    return hbar(
      rows.map(([label, value], i) => ({
        label,
        value,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }))
    );
  })();
  const senalHtml = vbar(
    bucketize(signalValues, [
      { label: "-30…-49", min: -50, max: -30 },
      { label: "-50…-59", min: -60, max: -50 },
      { label: "-60…-66", min: -67, max: -60 },
      { label: "-67…-74", min: -75, max: -67 },
      { label: "-75…-84", min: -85, max: -75 },
      { label: "≤-85", min: -999, max: -85 },
    ]).map((b) => ({ ...b, color: "#3b82f6" }))
  );
  const snrChartHtml = vbar(
    bucketize(snrValues, [
      { label: "<10", min: 0, max: 10 },
      { label: "10–19", min: 10, max: 20 },
      { label: "20–29", min: 20, max: 30 },
      { label: "30–39", min: 30, max: 40 },
      { label: "40+", min: 40, max: 999 },
    ]).map((b) => ({ ...b, color: "#8b5cf6" }))
  );
  const canalHtml = (() => {
    const map = new Map<string, Map<string, number>>();
    for (const h of allHosts) {
      if ((h.hostType !== "ap" && h.hostType !== "bssid") || !h.channel)
        continue;
      const ch = String(h.channel);
      const band = String(h.band ?? "Otra");
      if (!map.has(ch)) map.set(ch, new Map());
      const bands = map.get(ch)!;
      bands.set(band, (bands.get(band) ?? 0) + 1);
    }
    const channels = [...map.keys()].sort((a, b) => Number(a) - Number(b));
    if (channels.length === 0) return "";
    const bandsSet = [
      ...new Set(channels.flatMap((ch) => [...map.get(ch)!.keys()])),
    ];
    const rows = channels.map((ch) => {
      const total = [...map.get(ch)!.values()].reduce((a, b) => a + b, 0);
      let bar = "";
      for (const band of bandsSet) {
        const count = map.get(ch)!.get(band) ?? 0;
        if (count > 0)
          bar += `<div style="flex:${count};background:${bandColor(band)}"></div>`;
      }
      return `<tr><td class="hl">Ch ${esc(ch)}</td><td class="hb"><div style="display:flex;height:11px;border-radius:2px;overflow:hidden">${bar}</div></td><td class="hv">${total}</td></tr>`;
    });
    const legend = bandsSet
      .map(
        (band) =>
          `<span style="margin-right:10px"><i style="display:inline-block;width:9px;height:9px;background:${bandColor(band)};border-radius:2px;margin-right:3px"></i>${esc(band)}</span>`
      )
      .join("");
    return `<table class="hbars">${rows.join("")}</table><p style="font-size:9px;color:#6b7280">${legend}</p>`;
  })();
  const topSsidsHtml = (() => {
    const clientsBySsid = new Map<string, Set<string>>();
    for (const h of allHosts) {
      if (h.hostType === "client" && h.ssid && h.mac) {
        if (!clientsBySsid.has(String(h.ssid)))
          clientsBySsid.set(String(h.ssid), new Set());
        clientsBySsid.get(String(h.ssid))!.add(String(h.mac));
      }
    }
    const rows = [...clientsBySsid.entries()]
      .map(([ssid, set]) => ({ ssid, value: set.size }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    if (rows.length === 0) return "";
    return hbar(
      rows.map((r) => ({
        label: r.ssid.length > 26 ? `${r.ssid.slice(0, 25)}…` : r.ssid,
        value: r.value,
        color: "#22c55e",
      }))
    );
  })();

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/><style>
  @page { size: A4; margin: 16mm 12mm 18mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color:#111827; margin:0; }
  h1 { font-size: 22px; margin:0 0 4px; }
  h2 { font-size: 15px; border-bottom:1.5px solid #111827; padding-bottom:3px; margin:18px 0 8px; }
  h3 { font-size: 12px; margin:10px 0 4px; }
  section.break { page-break-before: always; }
  .card { border:1px solid #d1d5db; border-radius:6px; padding:8px; margin-bottom:10px; }
  .muted { color:#6b7280; }
  table { width:100%; border-collapse:collapse; margin:6px 0 10px; page-break-inside:auto; }
  th { background:#f3f4f6; text-align:left; }
  th, td { border:1px solid #d1d5db; padding:3px 6px; font-size:10px; }
  ul { margin:4px 0 8px 16px; padding:0; }
  li { margin:2px 0; }
  dl { display:grid; grid-template-columns: 140px 1fr; gap:2px 10px; margin:10px 0; }
  dt { font-weight:bold; }
  dd { margin:0; color:#374151; }
  .kpis { display:flex; gap:10px; flex-wrap:wrap; margin:8px 0; }
  .kpi { border:1px solid #d1d5db; border-radius:6px; padding:8px 12px; min-width:120px; }
  .kpi b { display:block; font-size:18px; }
  /* heatmap styles are defined below */
  .cover { page-break-after: always; text-align:center; padding-top:140px; }
  .cover h1 { font-size:34px; margin-bottom:8px; }
  .cover .sub { font-size:16px; color:#374151; margin-bottom:40px; }
  .cover .meta { display:inline-block; text-align:left; margin-top:30px; font-size:12px; }
  .cover .meta div { margin:4px 0; }
  .cover .result { display:block; width:fit-content; margin:40px auto 0; padding:8px 22px; border:2px solid #111827; border-radius:8px; font-size:14px; font-weight:bold; }
  .toc { page-break-after: always; }
  .toc h2 { margin-top:0; }
  .toc ol { font-size:12px; line-height:1.9; }
  .toc a { color:#2563eb; text-decoration:none; }
  .bars { display:flex; height:18px; border-radius:4px; overflow:hidden; margin:6px 0 2px; }
  .bars div { height:100%; }
  .vbars { display:flex; align-items:flex-end; gap:10px; height:160px; margin:10px 0; page-break-inside:avoid; }
  .vbars .vb { width:34px; background:#2563eb; border-radius:4px 4px 0 0; position:relative; }
  .vbars .vb span { position:absolute; bottom:-16px; left:50%; transform:translateX(-50%); font-size:9px; color:#374151; }
  .vbars .vb em { position:absolute; top:-15px; left:50%; transform:translateX(-50%); font-size:9px; font-style:normal; color:#111827; }
  .counts { display:flex; flex-wrap:wrap; gap:8px; margin:6px 0 10px; }
  .counts div { border:1px solid #d1d5db; border-radius:5px; padding:4px 10px; font-size:10px; }
  .counts b { font-size:13px; }
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
  .hbars { width:100%; max-width:100%; }
  .hbars td { border:none; padding:2px 5px; font-size:10px; }
  .hbars .hl { text-align:right; white-space:nowrap; }
  .hbars .hb { width:55%; }
  .hbars .hb div { height:14px; border-radius:3px; min-width:2px; }
  .hbars .hv { font-weight:bold; width:30px; }
  .topo { display:flex; gap:8px; align-items:flex-start; margin:6px 0; page-break-inside:avoid; }
  .topo svg { border:1px solid #e5e7eb; border-radius:5px; background:#fafafa; }
  .topo-l { list-style:none; margin:2px 0 0 !important; font-size:9px; line-height:1.7; }
  .anexo-grid { display:flex; flex-wrap:wrap; gap:14px; }
  .anexo-card { width:100%; margin:0 0 12px; page-break-inside:avoid; }
  .anexo-media { position:relative; }
  .anexo-card img { width:100%; max-height:340px; object-fit:contain; border:1px solid #d1d5db; border-radius:6px; background:#fff; display:block; }
  .anexo-card .anexo-file { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; width:100%; min-height:180px; border:1px dashed #9ca3af; border-radius:6px; background:#f9fafb; color:#6b7280; padding:16px; }
  .anexo-file-icon { display:flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:8px; background:#e5e7eb; color:#374151; font-size:13px; font-weight:bold; letter-spacing:.5px; border:1px solid #d1d5db; }
  .anexo-file span { font-size:10px; color:#6b7280; word-break:break-word; text-align:center; }
  .anexo-card figcaption { font-size:10px; color:#374151; margin-top:4px; word-break:break-word; }
  .tp-wrap { display:flex; gap:12px; }
  .tp-col { flex:1; min-width:210px; }
  .tp-h { font-weight:bold; font-size:11px; margin:2px 0 4px; }
  .tp-ap { border:1px solid #c4b5fd; background:#f5f3ff; border-radius:5px; padding:4px 6px; margin-bottom:5px; font-size:9.5px; display:flex; flex-wrap:wrap; gap:6px; align-items:baseline; }
  .tp-ap small { color:#6b7280; }
  .tp-ssid { border:1px solid #93c5fd; background:#eff6ff; border-radius:5px; padding:4px 6px; margin-bottom:6px; font-size:9.5px; }
  .tp-ssid small { color:#6b7280; display:block; }
  .tp-cli { display:flex; align-items:center; gap:4px; font-size:8.5px; border-top:1px dashed #dbeafe; padding:2px 0; }
  .tp-cli i { width:7px; height:7px; border-radius:50%; display:inline-block; flex-shrink:0; }
  .tp-cli em { margin-left:auto; font-style:normal; color:#6b7280; }
  .tp-leg { font-size:8.5px; color:#6b7280; margin-top:4px; }
  .tp-leg i { display:inline-block; width:8px; height:8px; border-radius:50%; margin:0 2px; }
  .charts-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .chart-card { border:1px solid #d1d5db; border-radius:6px; padding:10px 12px; page-break-inside:avoid; }
  .chart-card h3 { font-size:11px; margin:0 0 6px; color:#374151; }
</style></head><body>
<div class="cover">
  <h1>Informe de auditoría Wi-Fi</h1>
  <p class="sub">${esc(header.name)}</p>
  <div class="meta">
    <div><b>Código:</b> ${esc(header.code) || "—"}</div>
    <div><b>Cliente:</b> ${esc(header.client) || "—"}</div>
    <div><b>Ubicación:</b> ${esc(header.location) || "—"}</div>
    <div><b>Técnico:</b> ${esc(header.technician) || "—"}</div>
    <div><b>Fecha:</b> ${fmtDate(header.auditDate)}</div>
  </div>
  <div class="result">Resultado: ${esc(data.resumen?.globalResult?.replace(/_/g, " ") ?? "Pendiente")}</div>
  <p style="margin-top:60px;font-size:10px;color:#6b7280">Generado el ${new Date().toLocaleString("es-ES")}</p>
</div>

<div class="toc">
  <h2>Índice</h2>
  <ol>
    <li><a href="#sec-resumen">Resumen ejecutivo</a></li>
    <li><a href="#sec-graficas-analisis">Gráficas del análisis</a></li>
    <li><a href="#sec-cobertura">Cobertura por encuesta</a></li>
    <li><a href="#sec-conectividad">Conectividad por punto</a></li>
    <li><a href="#sec-rendimiento">Rendimiento y movilidad</a></li>
    <li><a href="#sec-analisis">Análisis vinculados</a></li>
    <li><a href="#sec-graficas-dispositivos">Gráficas de dispositivos</a></li>
    <li><a href="#sec-entorno-radio">Entorno radioeléctrico detectado</a></li>
    <li><a href="#sec-evaluacion">Evaluación de criterios</a></li>
    <li><a href="#sec-incidencias">Incidencias</a></li>
    <li><a href="#sec-recomendaciones">Recomendaciones</a></li>
    <li><a href="#sec-anexos">Anexos</a></li>
    <li><a href="#sec-conclusiones">Conclusiones</a></li>
  </ol>
</div>

<h2 id="sec-resumen">1. Resumen ejecutivo</h2>
<dl>
  <dt>Cliente</dt><dd>${esc(header.client) || "—"}</dd>
  <dt>Proyecto</dt><dd>${esc(header.project) || "—"}</dd>
  <dt>Perfil de criterios</dt><dd>${esc(header.profileName) || "—"}</dd>
  <dt>Técnico</dt><dd>${esc(header.technician) || "—"}</dd>
  <dt>Resultado global</dt><dd><b>${esc(data.resumen?.globalResult?.replace(/_/g, " ") ?? "Pendiente")}</b></dd>
</dl>

<section><h2 id="sec-resumen-kpi">Resumen ejecutivo</h2>
<div class="kpis">
  <div class="kpi"><b>${esc(kpis.evaluationsTotal ?? 0)}</b>criterios evaluados</div>
  <div class="kpi"><b style="color:#16a34a">${esc(kpis.pctPass ?? 0)}%</b>conformes</div>
  <div class="kpi"><b style="color:#dc2626">${esc(kpis.pctFail ?? 0)}%</b>no conformes</div>
  <div class="kpi"><b>${esc(incidencias.length)}</b>incidencias activas</div>
</div>
<p class="muted">Capturas: ${esc(kpis.measures ?? 0)} medidas · ${esc(kpis.surveys ?? 0)} encuestas · ${
    kpis.analyses ?? 0
  } análisis. Descubrimiento: ${esc(kpis.aps ?? 0)} APs, ${esc(kpis.ssids ?? 0)} SSIDs.</p>
</section>

${coberturaHtml}

<section class="break"><h2 id="sec-graficas-analisis">2. Gráficas del análisis</h2>
${(() => {
  const total = Number(kpis.evaluationsTotal ?? 0);
  const parts: string[] = [];
  if (total > 0) {
    const items = [
      { label: "Conforme", value: Number(kpis.pass ?? 0), color: "#16a34a" },
      { label: "Límite", value: Number(kpis.warning ?? 0), color: "#d97706" },
      { label: "No conforme", value: Number(kpis.fail ?? 0), color: "#dc2626" },
      {
        label: "Sin datos",
        value: Number(kpis.unknown ?? 0),
        color: "#9ca3af",
      },
    ].filter((item) => item.value > 0);
    parts.push(
      `<h3>Resultado de criterios (${total})</h3>
        <div class="bars">${items
          .map(
            (item) =>
              `<div style="width:${((item.value / total) * 100).toFixed(1)}%;background:${item.color}"></div>`
          )
          .join("")}</div>
        <p class="muted">${items
          .map(
            (item) =>
              `${item.label}: ${item.value} (${Math.round((item.value / total) * 100)}%)`
          )
          .join(" · ")}</p>`
    );
  }

  const channels: any[] = (data.radio?.channels ?? []).slice(0, 14);
  if (channels.length > 0) {
    parts.push(
      `<h3>Señal por canal (dBm)</h3>
        <p class="muted">Mejor señal recibida observada en cada canal (redes detectadas), 14 canales con mejor nivel. Valores más próximos a 0 = mejor señal. Color: verde ≥ −67 dBm, ámbar −72…−67 dBm, rojo &lt; −72 dBm.</p>
        <div class="vbars">${channels
          .map((channel) => {
            const signal = Number(channel.signal ?? -100);
            const height = Math.max(
              4,
              Math.min(100, ((signal + 100) / 70) * 100)
            );
            return `<div class="vb" style="height:${height.toFixed(0)}%;background:${signalHex(
              signal
            )}"><em>${signal.toFixed(0)}</em><span>${esc(String(channel.channel ?? "?"))}</span></div>`;
          })
          .join("")}</div>`
    );
  }
  return parts.length > 0 ? parts.join("") : "<p>Sin datos para gráficas.</p>";
})()}
</section>
${conectividadHtml}
<section><h2 id="sec-rendimiento">Rendimiento y movilidad</h2>
<p>${data.roaming?.performed ? "Prueba de roaming realizada." : esc(data.roaming?.note ?? "Prueba de roaming no realizada o sin datos disponibles.")}</p>
</section>
<section class="break"><h2 id="sec-analisis">6. Análisis vinculados</h2>
${(() => {
  const detalles: any[] = data.analisisDetalle ?? [];
  if (detalles.length === 0) return "<p>Sin análisis vinculados.</p>";
  const typeLabels: Record<string, string> = {
    ap: "APs",
    bssid: "BSSIDs",
    ssid: "SSIDs",
    client: "Clientes",
    channel: "Canales",
    probing: "Probing clients",
    bluetooth: "Bluetooth",
  };
  const columnsByType: Record<string, Array<[string, (row: any) => string]>> = {
    ap: [
      ["Nombre", (r) => esc(r.name ?? r.mac ?? "—")],
      ["MAC", (r) => esc(r.mac ?? "")],
      ["Canal", (r) => esc(r.channel ?? "")],
      ["Banda", (r) => esc(r.band ?? "")],
      [
        "Señal",
        (r) =>
          `<span style="color:${signalHex(r.signal)}">${r.signal != null ? Number(r.signal).toFixed(0) : "—"}</span>`,
      ],
      ["SSID", (r) => esc(r.ssid ?? "")],
      ["Seguridad", (r) => esc(r.securityType ?? "")],
    ],
    bssid: [
      ["BSSID", (r) => esc(r.mac ?? r.name ?? "—")],
      ["SSID", (r) => esc(r.ssid ?? "")],
      ["Canal", (r) => esc(r.channel ?? "")],
      ["Banda", (r) => esc(r.band ?? "")],
      [
        "Señal",
        (r) =>
          `<span style="color:${signalHex(r.signal)}">${r.signal != null ? Number(r.signal).toFixed(0) : "—"}</span>`,
      ],
    ],
    ssid: [
      ["SSID", (r) => esc(r.ssid ?? r.name ?? "—")],
      ["Seguridad", (r) => esc(r.securityType ?? "")],
      ["Banda", (r) => esc(r.band ?? "")],
      [
        "Señal",
        (r) =>
          `<span style="color:${signalHex(r.signal)}">${r.signal != null ? Number(r.signal).toFixed(0) : "—"}</span>`,
      ],
    ],
    client: [
      ["Cliente", (r) => esc(r.name ?? r.mac ?? "—")],
      ["MAC", (r) => esc(r.mac ?? "")],
      ["SSID", (r) => esc(r.ssid ?? "")],
      ["Canal", (r) => esc(r.channel ?? "")],
      [
        "Señal",
        (r) =>
          `<span style="color:${signalHex(r.signal)}">${r.signal != null ? Number(r.signal).toFixed(0) : "—"}</span>`,
      ],
      ["Protocolo", (r) => esc(r.protocol ?? "")],
    ],
    channel: [
      ["Canal", (r) => esc(r.channel ?? "—")],
      ["Banda", (r) => esc(r.band ?? "")],
      [
        "Señal",
        (r) =>
          `<span style="color:${signalHex(r.signal)}">${r.signal != null ? Number(r.signal).toFixed(0) : "—"}</span>`,
      ],
    ],
    probing: [
      ["Cliente", (r) => esc(r.name ?? r.mac ?? "—")],
      ["MAC", (r) => esc(r.mac ?? "")],
      ["SSID buscada", (r) => esc(r.ssid ?? "")],
      ["Última vez", (r) => (r.lastSeen ? fmtDate(r.lastSeen) : "—")],
    ],
    bluetooth: [
      ["Dispositivo", (r) => esc(r.name ?? r.mac ?? "—")],
      ["MAC", (r) => esc(r.mac ?? "")],
      ["Última vez", (r) => (r.lastSeen ? fmtDate(r.lastSeen) : "—")],
    ],
  };
  return detalles
    .map((detail) => {
      const byType: Record<string, any[]> = {};
      for (const host of detail.hosts ?? []) {
        (byType[host.hostType] = byType[host.hostType] ?? []).push(host);
      }
      const counts = Object.entries(byType)
        .map(
          ([type, rows]) =>
            `<div><b>${rows.length}</b> ${esc(typeLabels[type] ?? type)}</div>`
        )
        .join("");
      const tables = Object.entries(byType)
        .map(([type, rows]) => {
          const cols = columnsByType[type];
          if (!cols) return "";
          return `<h3>${esc(typeLabels[type] ?? type)} (${rows.length})</h3>${table(
            cols.map(([label]) => label),
            rows.map((row) => cols.map(([, render]) => render(row)))
          )}`;
        })
        .join("");
      return `<div class="card"><h3 style="font-size:13px">${esc(detail.name ?? detail.guid)}</h3>
          <p class="muted">${esc(detail.unitName ? `Unidad: ${detail.unitName} · ` : "")}Inicio: ${fmtDate(detail.startTime)}</p>
          <div class="counts">${counts}</div>
          <h4 style="font-size:11px;margin:6px 0 2px;page-break-after:avoid">Mapa topográfico</h4>${topoHtml(detail)}
          ${tables}</div>`;
    })
    .join("");
})()}
</section>

<section class="break"><h2 id="sec-graficas-dispositivos">Gráficas de dispositivos</h2>
<div class="charts-grid">
  <div class="chart-card"><h3>Dispositivos por banda</h3>${bandaHtml || "<p class='muted'>Sin datos</p>"}</div>
  <div class="chart-card"><h3>Tipos de seguridad</h3>${seguridadHtml || "<p class='muted'>Sin información de seguridad</p>"}</div>
  <div class="chart-card"><h3>Distribución de nivel de señal (dBm)</h3>${senalHtml}</div>
  <div class="chart-card"><h3>Distribución de SNR (dB)</h3>${snrChartHtml}</div>
  <div class="chart-card"><h3>APs/BSSIDs por canal</h3>${canalHtml || "<p class='muted'>Sin información de canales</p>"}</div>
  <div class="chart-card"><h3>Top SSIDs por clientes</h3>${topSsidsHtml || "<p class='muted'>Sin clientes asociados a SSIDs</p>"}</div>
</div>
</section>

${radioHtml}

<section class="break"><h2 id="sec-evaluacion">Evaluación de criterios</h2>
${(() => {
  const evaluations: any[] = data.anexos?.evaluations ?? [];
  const labels: Record<string, string> = {
    COBERTURA: "Cobertura",
    RADIO: "Radiofrecuencia",
    CONECTIVIDAD: "Conectividad",
    RENDIMIENTO: "Rendimiento",
    MOVILIDAD: "Movilidad / roaming",
  };
  const order = [
    "COBERTURA",
    "RADIO",
    "CONECTIVIDAD",
    "RENDIMIENTO",
    "MOVILIDAD",
  ];
  if (evaluations.length === 0)
    return "<p>Ejecuta la evaluación para ver el detalle.</p>";
  return order
    .map((category) => {
      const rows = evaluations.filter((item) => item.category === category);
      if (rows.length === 0) return "";
      return `<h3>${labels[category]} (${rows.length})</h3><table><thead><tr><th>Métrica</th><th>Ubicación</th><th>Valor</th><th>Estado</th></tr></thead><tbody>${rows
        .map(
          (item) =>
            `<tr><td>${esc(item.metric)}</td><td>${esc(
              item.location ?? ""
            )}</td><td>${
              item.value !== null && item.value !== undefined
                ? `${esc(item.value)}${esc(item.unit ?? "")}`
                : "—"
            }</td><td style="color:${statusColor(item.status)}">${statusLabel(
              item.status
            )}</td></tr>`
        )
        .join("")}</tbody></table>`;
    })
    .join("");
})()}
</section>

<section class="break"><h2 id="sec-incidencias">Incidencias (${incidencias.length})</h2>
${
  incidencias.length === 0
    ? "<p>Sin incidencias registradas.</p>"
    : `<ol>${incidencias
        .map(
          (issue) => `<li>
        <strong>[${esc(issue.severity)}] ${esc(issue.title)}</strong>
        ${issue.description ? `<p class="muted">${esc(issue.description)}</p>` : ""}
        ${issue.recommendationText ? `<p>Recomendación: ${esc(issue.recommendationText)}</p>` : ""}
        <p class="muted">${[issue.location, issue.metric].filter(Boolean).map(esc).join(" · ")}</p>
        ${issue.photo ? `<img src="${esc(issue.photo)}" style="width:100%;max-height:340px;object-fit:contain;border:1px solid #d1d5db;border-radius:4px;display:block;margin:4px 0"/>` : ""}
      </li>`
        )
        .join("")}</ol>`
}
</section>

${recomendacionesHtml}

${
  (data.anexos?.audit ?? []).length
    ? `<section class="break"><h2 id="sec-anexos">Anexos (archivos Link-Live)</h2><div class="anexo-grid">${data.anexos.audit
        .map((item: any) => {
          const hasImgExt = (v: unknown) =>
            typeof v === "string" && /\.(png|jpe?g|gif|webp|bmp)$/i.test(v);
          const isDataImg = (v: unknown) =>
            typeof v === "string" && /^data:image\/[a-z+]+/i.test(v);
          const ext = (v: unknown) => {
            const m = /\.([0-9a-z]{1,5})$/i.exec(String(v ?? ""));
            return m ? m[1].toLowerCase() : "";
          };
          const thumbSrc =
            typeof item.thumb === "string" && item.thumb
              ? isDataImg(item.thumb) || hasImgExt(item.thumb)
                ? item.thumb
                : null
              : null;
          const directSrc =
            isDataImg(item.href) || hasImgExt(item.href) || hasImgExt(item.name)
              ? item.href
              : null;
          const imgSrc = thumbSrc || directSrc;
          const extName = ext(item.name) || ext(item.href) || "archivo";
          if (imgSrc) {
            return `<figure class="anexo-card"><div class="anexo-media"><img src="${esc(imgSrc)}" alt="${esc(item.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="anexo-file" style="display:none"><div class="anexo-file-icon">${esc(extName.length > 4 ? extName.slice(0, 4) : extName).toUpperCase()}</div><span>Vista previa no disponible</span></div></div><figcaption>${esc(item.name)}</figcaption></figure>`;
          }
          return `<figure class="anexo-card"><div class="anexo-media"><div class="anexo-file"><div class="anexo-file-icon">${esc(extName.length > 4 ? extName.slice(0, 4) : extName).toUpperCase()}</div><span>${esc(item.name)}</span></div></div><figcaption>${esc(item.name)}</figcaption></figure>`;
        })
        .join("")}</div></section>`
    : ""
}
<section class="break"><h2 id="sec-conclusiones">Conclusiones</h2>
<div class="card"><p style="white-space:pre-wrap">${esc(
    data.conclusiones?.finalText ||
      data.conclusiones?.draft ||
      "Pendiente de redactar."
  )}</p></div>
</section>
</body></html>`;
}

function decodeBase64Image(src: string): Buffer | null {
  const m = /^data:image\/[a-z+]+;base64,(.+)$/i.exec(src);
  if (!m) return null;
  try {
    return Buffer.from(m[1], "base64");
  } catch {
    return null;
  }
}

function pngJpegSize(buf: Buffer): { w: number; h: number } | null {
  try {
    if (buf.length > 24 && buf.toString("ascii", 1, 4) === "PNG")
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let off = 2;
      while (off + 9 < buf.length) {
        if (buf[off] !== 0xff) {
          off++;
          continue;
        }
        const marker = buf[off + 1];
        if (
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc
        )
          return { w: buf.readUInt16BE(off + 7), h: buf.readUInt16BE(off + 5) };
        off += 2 + buf.readUInt16BE(off + 2);
      }
    }
  } catch {}
  return null;
}

async function inlineImages(html: string): Promise<string> {
  const urls = [
    ...new Set(
      Array.from(html.matchAll(/src="(https?:\/\/[^"]+)"/g)).map((m) => m[1])
    ),
  ].slice(0, 14);
  await Promise.all(
    urls.map(async (u) => {
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 8000);
        const res = await fetch(u, { signal: ctl.signal });
        clearTimeout(timer);
        if (!res.ok) return;
        const ct = res.headers.get("content-type") ?? "image/jpeg";
        if (!ct.startsWith("image/")) return;
        const body = Buffer.from(await res.arrayBuffer());
        html = html
          .split(`src="${u}"`)
          .join(`src="data:${ct};base64,${body.toString("base64")}"`);
      } catch {
        /* imagen opcional */
      }
    })
  );
  return html;
}

export function findChromiumPath(): string | null {
  const candidates = [
    process.env.CHROMIUM_PATH,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    try {
      accessSync(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

export async function renderPdf(
  html: string,
  options?: { footerLabel?: string }
): Promise<Buffer> {
  let chromiumPath = findChromiumPath();
  if (!chromiumPath) {
    try {
      chromiumPath = nodeRequire("chromium-location") as string;
    } catch {
      /* no instalado */
    }
  }

  const puppeteer = await (async () => {
    try {
      return nodeRequire("puppeteer-core");
    } catch {
      throw new Error("PDF_NO_ENGINE");
    }
  })();

  if (!chromiumPath) throw new Error("PDF_NO_CHROMIUM");

  // Logo embebido en el header de cada página
  const LOGO_B64 =
    "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";
  const headerImg = LOGO_B64
    ? `<img src="data:image/webp;base64,${LOGO_B64}" style="position:absolute;top:0;right:0;height:33px;margin-right:6mm;object-fit:contain;"/>`
    : "";

  const browser = await puppeteer.launch({
    executablePath: chromiumPath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(await inlineImages(html), {
      waitUntil: "load",
      timeout: 45000,
    });
    const footerBrand = options?.footerLabel ?? "Informe de auditoría Wi-Fi";
    return (await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:8px;width:100%;padding:0 12mm;color:#6b7280;position:relative;">${headerImg}</div>`,
      footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#6b7280;">
        ${footerBrand} — Página <span class="pageNumber"></span> de <span class="totalPages"></span>
      </div>`,
      margin: { top: "14mm", bottom: "16mm", left: "12mm", right: "12mm" },
    })) as Buffer;
  } finally {
    await browser.close();
  }
}
