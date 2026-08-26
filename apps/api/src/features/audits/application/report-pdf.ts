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
  // x/y de Link-Live son porcentajes (0-100), igual que en el visor web.
  const points: any[] = Array.isArray(data.points) ? data.points : [];
  const dots = points
    .filter((point) => point.value !== null && point.value !== undefined)
    .map(
      (point) =>
        `<span title="${esc(point.metric)}: ${Math.round(point.value)}" style="position:absolute;left:${Math.min(
          100,
          Math.max(0, Number(point.x))
        )}%;top:${Math.min(100, Math.max(0, Number(point.y)))}%;width:7px;height:7px;margin-left:-3.5px;margin-top:-3.5px;border-radius:50%;opacity:.85;background:${
          point.metric === "snr"
            ? point.value >= 25 ? "#16a34a" : point.value >= 20 ? "#d97706" : "#dc2626"
            : signalHex(Number(point.value))
        }"></span>`
    )
    .join("");
  const src = String(data.image).startsWith("data:")
    ? String(data.image)
    : `data:image/png;base64,${data.image}`;
  return `<div class="heatmap"><img src="${src}" alt="plano"/>${dots}</div>`;
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
  const calidad = data.dataQuality;

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

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/><style>
  @page { size: A4; margin: 16mm 12mm 18mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color:#111827; margin:0; }
  h1 { font-size: 22px; margin:0 0 4px; }
  h2 { font-size: 15px; border-bottom:1.5px solid #111827; padding-bottom:3px; margin:18px 0 8px; }
  h3 { font-size: 12px; margin:10px 0 4px; }
  section.break { page-break-before: always; }
  .card { border:1px solid #d1d5db; border-radius:6px; padding:8px; margin-bottom:10px; page-break-inside: avoid; }
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
</style></head><body>
<h1>Informe de auditoría Wi-Fi</h1>
<p style="font-size:14px">${esc(header.name)}</p>
<dl>
  <dt>Código</dt><dd>${esc(header.code) || "—"}</dd>
  <dt>Cliente</dt><dd>${esc(header.client) || "—"}</dd>
  <dt>Proyecto</dt><dd>${esc(header.project) || "—"}</dd>
  <dt>Ubicación</dt><dd>${esc(header.location) || "—"}</dd>
  <dt>Técnico</dt><dd>${esc(header.technician) || "—"}</dd>
  <dt>Perfil</dt><dd>${esc(header.profileName) || "—"}</dd>
  <dt>Fecha</dt><dd>${fmtDate(header.auditDate)}</dd>
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
${conectividadHtml}
<section class="break"><h2>Rendimiento y movilidad</h2>
<p>${data.roaming?.performed ? "Prueba de roaming realizada." : esc(data.roaming?.note ?? "Prueba de roaming no realizada o sin datos disponibles.")}</p>
</section>
${radioHtml}

<section class="break"><h2>Incidencias (${incidencias.length})</h2>
${
  incidencias.length === 0
    ? "<p>Sin incidencias registradas.</p>"
    : `<ol>${incidencias
        .map(
          (issue) => `<li>
        ${issue.photo ? `<img src="${esc(issue.photo)}" style="max-height:90px;border:1px solid #d1d5db;border-radius:4px;display:block;margin:4px 0"/>` : ""}
        <strong>[${esc(issue.severity)}] ${esc(issue.title)}</strong>
        ${issue.description ? `<p class="muted">${esc(issue.description)}</p>` : ""}
        ${issue.recommendationText ? `<p>Recomendación: ${esc(issue.recommendationText)}</p>` : ""}
        <p class="muted">${[issue.location, issue.metric].filter(Boolean).map(esc).join(" · ")}</p>
      </li>`
        )
        .join("")}</ol>`
}
</section>

${recomendacionesHtml}

${
  (data.anexos?.audit ?? []).length
    ? `<section class="break"><h2>Anexos (archivos Link-Live)</h2><ul>${data.anexos.audit
        .map(
          (item: any) =>
            `<li><a href="${esc(item.href)}">${esc(item.name)}</a>${
              /\.(png|jpe?g|gif|webp)$/i.test(String(item.href)) || String(item.href).startsWith("data:")
                ? `<br/><img src="${esc(item.thumb || item.href)}" style="max-height:110px;border:1px solid #d1d5db;border-radius:4px;margin:4px 0"/>`
                : ""
            }</li>`
        )
        .join("")}</ul></section>`
    : ""
}

<section class="break"><h2>Conclusiones</h2>
<div class="card"><p style="white-space:pre-wrap">${esc(
    data.conclusiones?.finalText || data.conclusiones?.draft || "Pendiente de redactar."
  )}</p></div>
</section>

${
  calidad?.problems?.length
    ? `<section><h2>Anexo: calidad de los datos</h2><ul>${calidad.problems
        .map((problem: any) => `<li>[${esc(problem.severity)}] ${esc(problem.message)} (${esc(problem.count)})</li>`)
        .join("")}</ul></section>`
    : ""
}
</body></html>`;
}

/** Localiza el binario de Chromium en el sistema. */
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
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });
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
