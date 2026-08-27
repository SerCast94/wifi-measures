/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Generación de PDF real del informe mediante headless Chromium
 * (puppeteer-core + binario del sistema). Incluye numeración física de
 * páginas vía footerTemplate de Puppeteer.
 */

const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const fmtDate = (value: any): string =>
  value ? new Date(value).toLocaleDateString("es-ES") : "—";

const signalHex = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "#9ca3af";
  if (value >= -67) return "#16a34a";
  if (value >= -72) return "#d97706";
  return "#dc2626";
};

const statusLabel = (status: string): string =>
  ({ PASS: "Conforme", WARNING: "En el límite", FAIL: "No conforme", UNKNOWN: "No disponible" })[
    status
  ] ?? status;

const statusColor = (status: string): string =>
  ({ PASS: "#16a34a", WARNING: "#d97706", FAIL: "#dc2626", UNKNOWN: "#6b7280" })[status] ?? "#374151";

function heatmap(data: any): string {
  if (!data?.image) return "";
  const srcRaw = String(data.image);
  const src = srcRaw.startsWith("data:") ? srcRaw : `data:image/png;base64,${srcRaw}`;
  const imgTag = `<img src="${src}" alt="plano"/>`;
  let points: any[] = (Array.isArray(data.points) ? data.points : []).filter(
    (p: any) => p.value != null && Number.isFinite(Number(p.value))
  );
  // Una sola métrica por mapa (la web pinta una métrica por vista): preferir rssi
  const metricCounts = new Map<string, number>();
  for (const pt of points) {
    const m = String(pt.metric ?? "rssi");
    metricCounts.set(m, (metricCounts.get(m) ?? 0) + 1);
  }
  const preferred = metricCounts.has("rssi") ? "rssi" : [...metricCounts.entries()].sort((x, y) => y[1] - x[1])[0][0];
  points = points.filter((pt: any) => String(pt.metric ?? "rssi") === preferred);
  if (points.length === 0) return `<div class="heatmap">${imgTag}</div>`;
  const vals = points.map((p: any) => Number(p.value));
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (max === min) { min -= 1; max += 1; }
  // Dimensiones reales de la imagen para calcular en espacio de píxeles (como la web)
  const buf = decodeBase64Image(src);
  const dim = buf ? pngJpegSize(buf) : null;
  const scale = dim ? Math.min(1, 900 / dim.w) : 1;
  const W = Math.max(200, Math.round((dim ? dim.w : 800) * scale));
  const H = Math.max(150, Math.round((dim ? dim.h : 600) * scale));
  const maxR = Math.max(W, H) * 0.16;
  const cell = Math.max(6, Math.floor(Math.max(W, H) / 200));
  const MIN_A = 0.04;
  const MAX_A = 0.62;
  let rects = "";
  for (let gy = 0; gy < H; gy += cell) {
    for (let gx = 0; gx < W; gx += cell) {
      let ws = 0, vs = 0, md = Infinity;
      for (const p of points) {
        const px = (Number(p.x) / 100) * W;
        const py = (Number(p.y) / 100) * H;
        const dx = gx - px, dy = gy - py;
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2);
        if (d < md) md = d;
        const w = 1 / (d2 + 1);
        ws += w; vs += w * Number(p.value);
      }
      const alpha = Math.max(0, Math.min(1, 1 - md / maxR)) * (MAX_A - MIN_A) + MIN_A;
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
  let stops = "";
  for (let i = 0; i <= 10; i++) stops += `hsl(${i * 12},90%,50%) ${i * 10}%`;
  return `<div class="heatmap"><div class="heat-box">${imgTag}<svg class="heat-overlay" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><g>${rects}</g>${marks}</svg></div><div class="heat-legend"><span>${esc(data.metricLabel ?? (preferred === "snr" ? "SNR" : "Nivel de señal"))} (${esc(data.unit ?? "dBm")})</span><i style="background:linear-gradient(90deg,${stops})"></i><em>${min.toFixed(0)} … ${max.toFixed(0)}</em></div></div>`;
}

function hbar(items: Array<{ label: string; value: number; color: string }>): string {
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

function vbar(items: Array<{ label: string; value: number; color: string }>): string {
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
  return b.includes("2.4") ? "#f59e0b" : b.includes("5") ? "#3b82f6" : b.includes("6") ? "#8b5cf6" : "#94a3b8";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conectividadRows: any[] = data.conectividad?.rows ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radioSsids: any[] = data.radio?.ssids ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radioAps: any[] = data.radio?.aps ?? [];
  const incidencias: any[] = data.incidencias ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recomendaciones: any[] = data.recomendaciones ?? [];



  const coberturaHtml = cobertura.length
    ? `<section><h2>Cobertura por encuesta</h2>${cobertura
        .map(
          (surveyRow) => `<div class="card">
        <h3>${esc(surveyRow.name)}${surveyRow.floorName ? ` — ${esc(surveyRow.floorName)}` : ""}</h3>
        <p class="muted">${esc(surveyRow.pointCount)} puntos medidos</p>
        ${heatmap(surveyRow)}
        <ul>${(surveyRow.evaluations ?? [])
          .map(
            (item: any) =>
              `<li><strong>${esc(item.metric)}</strong>: ${
                item.value !== null && item.value !== undefined
                  ? `${esc(item.value)}${esc(item.unit ?? "")}`
                  : "sin dato"
              } — <span style="color:${statusColor(item.status)}">${statusLabel(item.status)}</span></li>`
          )
          .join("")}</ul></div>`
        )
        .join("")}</section>`
    : "";

  const conectividadHtml = conectividadRows.length
    ? `<section class="break"><h2>Conectividad por punto</h2>${conectividadRows
        .map(
          (row) => `<p><strong>${esc(row.point)}</strong></p><ul>${Object.entries(
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
        radioSsids.slice(0, 30).map((ssid) => [
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
        radioAps.slice(0, 40).map((ap) => [
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
      ? `<section class="break"><h2>Entorno radioeléctrico detectado</h2>${ssidsHtml}${apsHtml}</section>`
      : "";

  const recomendacionesLabels: Record<string, string> = {
    INMEDIATA: "Acciones inmediatas",
    OPTIMIZACION: "Optimización",
    INFRAESTRUCTURA: "Infraestructura",
  };
  const recomendacionesHtml = recomendaciones.some(
    (group) => (group.items ?? []).length > 0
  )
    ? `<section class="break"><h2>Recomendaciones</h2>${recomendaciones
        .filter((group) => (group.items ?? []).length > 0)
        .map(
          (group) => `<h3>${esc(recomendacionesLabels[group.category] ?? group.category)}</h3>
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
  const bucketize = (values: number[], buckets: Array<{ label: string; min: number; max: number }>) =>
    buckets.map((b) => ({ label: b.label, value: values.filter((v) => v >= b.min && v < b.max).length }));
  const signalValues = allHosts.filter((h) => h.signal != null).map((h) => Number(h.signal));
  const snrValues = allHosts.filter((h) => h.snr != null).map((h) => Number(h.snr));
  const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#ec4899", "#6b7280"];
  const bandaHtml = hbar(byKey(allHosts, (h) => (h.band ? String(h.band) : null)).map(([label, value]) => ({ label, value, color: bandColor(label) })));
  const seguridadHtml = (() => {
    const rows = byKey(allHosts, (h) => (h.securityType ? String(h.securityType) : null)).slice(0, 8);
    if (rows.length === 0) return "";
    return hbar(rows.map(([label, value], i) => ({ label, value, color: PIE_COLORS[i % PIE_COLORS.length] })));
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
      if ((h.hostType !== "ap" && h.hostType !== "bssid") || !h.channel) continue;
      const ch = String(h.channel);
      const band = String(h.band ?? "Otra");
      if (!map.has(ch)) map.set(ch, new Map());
      const bands = map.get(ch)!;
      bands.set(band, (bands.get(band) ?? 0) + 1);
    }
    const channels = [...map.keys()].sort((a, b) => Number(a) - Number(b));
    if (channels.length === 0) return "";
    const bandsSet = [...new Set(channels.flatMap((ch) => [...map.get(ch)!.keys()]))];
    const rows = channels.map((ch) => {
      const total = [...map.get(ch)!.values()].reduce((a, b) => a + b, 0);
      let bar = "";
      for (const band of bandsSet) {
        const count = map.get(ch)!.get(band) ?? 0;
        if (count > 0) bar += `<div style="flex:${count};background:${bandColor(band)}"></div>`;
      }
      return `<tr><td class="hl">Ch ${esc(ch)}</td><td class="hb"><div style="display:flex;height:11px;border-radius:2px;overflow:hidden">${bar}</div></td><td class="hv">${total}</td></tr>`;
    });
    const legend = bandsSet.map((band) => `<span style="margin-right:10px"><i style="display:inline-block;width:9px;height:9px;background:${bandColor(band)};border-radius:2px;margin-right:3px"></i>${esc(band)}</span>`).join("");
    return `<table class="hbars">${rows.join("")}</table><p style="font-size:9px;color:#6b7280">${legend}</p>`;
  })();
  const topSsidsHtml = (() => {
    const clientsBySsid = new Map<string, Set<string>>();
    for (const h of allHosts) {
      if (h.hostType === "client" && h.ssid && h.mac) {
        if (!clientsBySsid.has(String(h.ssid))) clientsBySsid.set(String(h.ssid), new Set());
        clientsBySsid.get(String(h.ssid))!.add(String(h.mac));
      }
    }
    const rows = [...clientsBySsid.entries()]
      .map(([ssid, set]) => ({ ssid, value: set.size }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    if (rows.length === 0) return "";
    return hbar(rows.map((r) => ({ label: r.ssid.length > 26 ? `${r.ssid.slice(0, 25)}…` : r.ssid, value: r.value, color: "#22c55e" })));
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
  .heatmap { position:relative; display:inline-block; max-width:100%; margin:6px 0; }
  .heatmap img { max-width:420px; max-height:300px; border:1px solid #d1d5db; border-radius:4px; }
  .cover { page-break-after: always; text-align:center; padding-top:140px; }
  .cover h1 { font-size:34px; margin-bottom:8px; }
  .cover .sub { font-size:16px; color:#374151; margin-bottom:40px; }
  .cover .meta { display:inline-block; text-align:left; margin-top:30px; font-size:12px; }
  .cover .meta div { margin:4px 0; }
  .cover .result { display:inline-block; margin-top:36px; padding:8px 22px; border:2px solid #111827; border-radius:8px; font-size:14px; font-weight:bold; }
  .toc { page-break-after: always; }
  .toc h2 { margin-top:0; }
  .toc ol { font-size:12px; line-height:1.9; }
  .bars { display:flex; height:18px; border-radius:4px; overflow:hidden; margin:6px 0 2px; }
  .bars div { height:100%; }
  .vbars { display:flex; align-items:flex-end; gap:6px; height:120px; margin:8px 0; page-break-inside:avoid; }
  .vbars .vb { width:26px; background:#2563eb; border-radius:3px 3px 0 0; position:relative; }
  .vbars .vb span { position:absolute; bottom:-14px; left:50%; transform:translateX(-50%); font-size:8px; color:#374151; }
  .vbars .vb em { position:absolute; top:-13px; left:50%; transform:translateX(-50%); font-size:8px; font-style:normal; color:#111827; }
  .counts { display:flex; flex-wrap:wrap; gap:8px; margin:6px 0 10px; }
  .counts div { border:1px solid #d1d5db; border-radius:5px; padding:4px 10px; font-size:10px; }
  .counts b { font-size:13px; }
  .heatmap { display:inline-block; max-width:100%; margin:6px 0; }
  .heat-box { position:relative; }
  .heat-box img { display:block; max-width:100%; max-height:300px; border:1px solid #d1d5db; border-radius:4px; }
  .heat-overlay { position:absolute; left:0; top:0; width:100%; height:100%; }
  .heat-legend { display:inline-block; border:1px solid #d1d5db; background:#fff; padding:4px 8px; font-size:9px; margin-top:2px; }
  .heat-legend span { font-weight:bold; }
  .heat-legend i { display:block; width:180px; height:10px; margin:3px 0; }
  .hbars { width:auto; max-width:100%; }
  .hbars td { border:none; padding:1.5px 4px; font-size:9.5px; }
  .hbars .hl { text-align:right; white-space:nowrap; }
  .hbars .hb { width:220px; }
  .hbars .hb div { height:11px; border-radius:2px; min-width:2px; }
  .hbars .hv { font-weight:bold; width:26px; }
  .topo { display:flex; gap:8px; align-items:flex-start; margin:6px 0; page-break-inside:avoid; }
  .topo svg { border:1px solid #e5e7eb; border-radius:5px; background:#fafafa; }
  .topo-l { list-style:none; margin:2px 0 0 !important; font-size:9px; line-height:1.7; }
  .anexo-grid { display:flex; flex-wrap:wrap; gap:16px; }
  .anexo-card { width:320px; margin:0; page-break-inside:avoid; }
  .anexo-card img { width:320px; height:300px; object-fit:contain; border:1px solid #d1d5db; border-radius:6px; background:#fff; }
  .anexo-card span { display:flex; align-items:center; justify-content:center; height:300px; border:1px dashed #d1d5db; border-radius:6px; color:#6b7280; font-size:10px; }
  .anexo-card figcaption { font-size:9px; color:#374151; margin-top:3px; word-break:break-word; }
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
    <li>Resumen ejecutivo</li>
    <li>Gráficas del análisis</li>
    <li>Cobertura por encuesta</li>
    <li>Conectividad por punto</li>
    <li>Rendimiento y movilidad</li>
    <li>Análisis vinculados</li>
    <li>Gráficas de dispositivos</li>
    <li>Entorno radioeléctrico detectado</li>
    <li>Evaluación de criterios</li>
    <li>Incidencias</li>
    <li>Recomendaciones</li>
    <li>Anexos</li>
    <li>Conclusiones</li>
    
  </ol>
</div>

<h2>1. Resumen ejecutivo</h2>
<dl>
  <dt>Cliente</dt><dd>${esc(header.client) || "—"}</dd>
  <dt>Proyecto</dt><dd>${esc(header.project) || "—"}</dd>
  <dt>Perfil de criterios</dt><dd>${esc(header.profileName) || "—"}</dd>
  <dt>Técnico</dt><dd>${esc(header.technician) || "—"}</dd>
  <dt>Resultado global</dt><dd><b>${esc(data.resumen?.globalResult?.replace(/_/g, " ") ?? "Pendiente")}</b></dd>
</dl>

<section><h2>Resumen ejecutivo</h2>
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

<section class="break"><h2>2. Gráficas del análisis</h2>
${
  (() => {
    const total = Number(kpis.evaluationsTotal ?? 0);
    const parts: string[] = [];
    if (total > 0) {
      const items = [
        { label: "Conforme", value: Number(kpis.pass ?? 0), color: "#16a34a" },
        { label: "Límite", value: Number(kpis.warning ?? 0), color: "#d97706" },
        { label: "No conforme", value: Number(kpis.fail ?? 0), color: "#dc2626" },
        { label: "Sin datos", value: Number(kpis.unknown ?? 0), color: "#9ca3af" },
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
          .map((item) => `${item.label}: ${item.value} (${Math.round((item.value / total) * 100)}%)`)
          .join(" · ")}</p>`
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channels: any[] = (data.radio?.channels ?? []).slice(0, 14);
    if (channels.length > 0) {
      parts.push(
        `<h3>Señal por canal (dBm)</h3><div class="vbars">${channels
          .map((channel) => {
            const signal = Number(channel.signal ?? -100);
            const height = Math.max(4, Math.min(100, ((signal + 100) / 70) * 100));
            return `<div class="vb" style="height:${height.toFixed(0)}%;background:${signalHex(
              signal
            )}"><em>${signal.toFixed(0)}</em><span>${esc(String(channel.channel ?? "?"))}</span></div>`;
          })
          .join("")}</div>`
      );
    }
    return parts.length > 0 ? parts.join("") : "<p>Sin datos para gráficas.</p>";
  })()
}
</section>
${conectividadHtml}
<section class="break"><h2>Rendimiento y movilidad</h2>
<p>${data.roaming?.performed ? "Prueba de roaming realizada." : esc(data.roaming?.note ?? "Prueba de roaming no realizada o sin datos disponibles.")}</p>
</section>
<section><h2>6. Análisis vinculados</h2>
${
  (() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detalles: any[] = data.analisisDetalle ?? [];
    if (detalles.length === 0) return "<p>Sin análisis vinculados.</p>";
    const typeLabels: Record<string, string> = {
      ap: "APs", bssid: "BSSIDs", ssid: "SSIDs", client: "Clientes",
      channel: "Canales", probing: "Probing clients", bluetooth: "Bluetooth",
    };
    const columnsByType: Record<string, Array<[string, (row: any) => string]>> = {
      ap: [["Nombre", (r) => esc(r.name ?? r.mac ?? "—")], ["MAC", (r) => esc(r.mac ?? "")], ["Canal", (r) => esc(r.channel ?? "")], ["Banda", (r) => esc(r.band ?? "")], ["Señal", (r) => `<span style="color:${signalHex(r.signal)}">${r.signal != null ? Number(r.signal).toFixed(0) : "—"}</span>`], ["SSID", (r) => esc(r.ssid ?? "")], ["Seguridad", (r) => esc(r.securityType ?? "")]],
      bssid: [["BSSID", (r) => esc(r.mac ?? r.name ?? "—")], ["SSID", (r) => esc(r.ssid ?? "")], ["Canal", (r) => esc(r.channel ?? "")], ["Banda", (r) => esc(r.band ?? "")], ["Señal", (r) => `<span style="color:${signalHex(r.signal)}">${r.signal != null ? Number(r.signal).toFixed(0) : "—"}</span>`]],
      ssid: [["SSID", (r) => esc(r.ssid ?? r.name ?? "—")], ["Seguridad", (r) => esc(r.securityType ?? "")], ["Banda", (r) => esc(r.band ?? "")], ["Señal", (r) => `<span style="color:${signalHex(r.signal)}">${r.signal != null ? Number(r.signal).toFixed(0) : "—"}</span>`]],
      client: [["Cliente", (r) => esc(r.name ?? r.mac ?? "—")], ["MAC", (r) => esc(r.mac ?? "")], ["SSID", (r) => esc(r.ssid ?? "")], ["Canal", (r) => esc(r.channel ?? "")], ["Señal", (r) => `<span style="color:${signalHex(r.signal)}">${r.signal != null ? Number(r.signal).toFixed(0) : "—"}</span>`], ["Protocolo", (r) => esc(r.protocol ?? "")]],
      channel: [["Canal", (r) => esc(r.channel ?? "—")], ["Banda", (r) => esc(r.band ?? "")], ["Señal", (r) => `<span style="color:${signalHex(r.signal)}">${r.signal != null ? Number(r.signal).toFixed(0) : "—"}</span>`]],
      probing: [["Cliente", (r) => esc(r.name ?? r.mac ?? "—")], ["MAC", (r) => esc(r.mac ?? "")], ["SSID buscada", (r) => esc(r.ssid ?? "")], ["Última vez", (r) => (r.lastSeen ? fmtDate(r.lastSeen) : "—")]],
      bluetooth: [["Dispositivo", (r) => esc(r.name ?? r.mac ?? "—")], ["MAC", (r) => esc(r.mac ?? "")], ["Última vez", (r) => (r.lastSeen ? fmtDate(r.lastSeen) : "—")]],
    };
    return detalles
      .map((detail) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const byType: Record<string, any[]> = {};
        for (const host of detail.hosts ?? []) {
          (byType[host.hostType] = byType[host.hostType] ?? []).push(host);
        }
        const counts = Object.entries(byType)
          .map(([type, rows]) => `<div><b>${rows.length}</b> ${esc(typeLabels[type] ?? type)}</div>`)
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
  })()
}
</section>

<section class="break"><h2>Gráficas de dispositivos</h2>
<div style="display:flex;flex-wrap:wrap;gap:14px">
  <div style="min-width:240px"><h3>Dispositivos por banda</h3>${bandaHtml || "<p class='muted'>Sin datos</p>"}</div>
  <div style="min-width:240px"><h3>Tipos de seguridad</h3>${seguridadHtml || "<p class='muted'>Sin información de seguridad</p>"}</div>
  <div style="min-width:260px"><h3>Distribución de nivel de señal (dBm)</h3>${senalHtml}</div>
  <div style="min-width:260px"><h3>Distribución de SNR (dB)</h3>${snrChartHtml}</div>
  <div style="min-width:280px"><h3>APs/BSSIDs por canal</h3>${canalHtml || "<p class='muted'>Sin información de canales</p>"}</div>
  <div style="min-width:280px"><h3>Top SSIDs por clientes</h3>${topSsidsHtml || "<p class='muted'>Sin clientes asociados a SSIDs</p>"}</div>
</div>
</section>

${radioHtml}

<section class="break"><h2>Evaluación de criterios</h2>
${
  (() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const evaluations: any[] = data.anexos?.evaluations ?? [];
    const labels: Record<string, string> = {
      COBERTURA: "Cobertura",
      RADIO: "Radiofrecuencia",
      CONECTIVIDAD: "Conectividad",
      RENDIMIENTO: "Rendimiento",
      MOVILIDAD: "Movilidad / roaming",
    };
    const order = ["COBERTURA", "RADIO", "CONECTIVIDAD", "RENDIMIENTO", "MOVILIDAD"];
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
  })()
}
</section>

<section class="break"><h2>Incidencias (${incidencias.length})</h2>
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
    ? `<section class="break"><h2>Anexos (archivos Link-Live)</h2><div class="anexo-grid">${data.anexos.audit
        .map((item: any) => {
          const hasExt = (v: unknown) =>
            typeof v === "string" && /\.(png|jpe?g|gif|webp)$/i.test(v);
          const src =
            item.thumb ||
            (hasExt(item.href) || hasExt(item.name) || String(item.href).startsWith("data:")
              ? item.href
              : null);
          return `<figure class="anexo-card">${src ? `<img src="${esc(src)}"/>` : '<span>Sin vista previa disponible</span>'}<figcaption>${esc(item.name)}</figcaption></figure>`;
        })
        .join("")}</div></section>`
    : ""
}
<section class="break"><h2>Conclusiones</h2>
<div class="card"><p style="white-space:pre-wrap">${esc(
    data.conclusiones?.finalText || data.conclusiones?.draft || "Pendiente de redactar."
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
        if (buf[off] !== 0xff) { off++; continue; }
        const marker = buf[off + 1];
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc)
          return { w: buf.readUInt16BE(off + 7), h: buf.readUInt16BE(off + 5) };
        off += 2 + buf.readUInt16BE(off + 2);
      }
    }
  } catch {}
  return null;
}

async function inlineImages(html: string): Promise<string> {
  const urls = [
    ...new Set(Array.from(html.matchAll(/src="(https?:\/\/[^"]+)"/g)).map((m) => m[1])),
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
        html = html.split(`src="${u}"`).join(`src="data:${ct};base64,${body.toString("base64")}"`);
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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("fs").accessSync(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

export async function renderPdf(html: string): Promise<Buffer> {
  let chromiumPath = findChromiumPath();
  if (!chromiumPath) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      chromiumPath = require("chromium-location") as string;
    } catch {
      /* no instalado */
    }
  }

  const puppeteer = await (async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require("puppeteer-core");
    } catch {
      throw new Error("PDF_NO_ENGINE");
    }
  })();

  if (!chromiumPath) throw new Error("PDF_NO_CHROMIUM");

  const browser = await puppeteer.launch({
    executablePath: chromiumPath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(await inlineImages(html), { waitUntil: "load", timeout: 45000 });
    return (await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:8px;width:100%;padding:0 12mm;color:#6b7280;"></div>`,
      footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#6b7280;">
        Informe de auditoría Wi-Fi — Página <span class="pageNumber"></span> de <span class="totalPages"></span>
      </div>`,
      margin: { top: "14mm", bottom: "16mm", left: "12mm", right: "12mm" },
    })) as Buffer;
  } finally {
    await browser.close();
  }
}
