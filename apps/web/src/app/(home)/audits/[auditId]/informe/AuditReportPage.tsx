import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { PrinterIcon, SaveIcon, FileCheck2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/core/atomic-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";
import CustomLoading from "@/core/components/CustomLoading";
import AuditHeader from "../AuditHeader";
import { SurveyHeatmap } from "@/features/surveys/components/SurveyHeatmap";
import { EvalStatusBadge } from "@/features/audits/components/badges";
import { AnalysisCharts } from "@/features/analyses/components/charts/AnalysisCharts";
import { AnalysisTopology } from "@/features/analyses/components/topology/AnalysisTopology";
import { StatCards } from "@/features/analyses/components/StatCards";
import { HostsTable } from "@/features/analyses/components/table/HostsTable";
import {
  ANALYSIS_HOST_TYPES,
  getAnalysisHostTypeLabel,
} from "@/features/analyses/types/analysis.types";
import { useAnalysis } from "@/features/analyses/hooks/use-analysis";
import { useAnalysisHosts } from "@/features/analyses/hooks/use-analysis-hosts";
import { useAuditEvaluations } from "@/features/audits/hooks/use-audit-workflow";

/** Sección por análisis vinculado: réplica completa del detalle de Análisis
 *  (stat cards, tablas por tipo de host, gráficas y topología). */
const AnalysisReportSection = ({
  analysisId,
  name,
}: {
  analysisId: number;
  name: string;
}) => {
  const { data: analysis } = useAnalysis(analysisId);
  const { data: allHosts } = useAnalysisHosts(analysisId);
  if (!analysis || !allHosts || allHosts.length === 0) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = analysis as any;
  const analysisName = name || a.name || a.fileName || "";
  return (
    <div className="report-card mb-4 rounded-lg border p-3">
      <h3 className="mb-2 text-sm font-semibold">Análisis: {analysisName}</h3>
      <StatCards counts={a.hostCounts} activeType="" onSelect={() => {}} />
      {ANALYSIS_HOST_TYPES.map((type) => {
        const rows = allHosts.filter((host) => host.hostType === type.key);
        if (rows.length === 0) return null;
        return (
          <div key={type.key} className="mt-3">
            <p className="mb-1 text-xs font-semibold">
              {getAnalysisHostTypeLabel(type.key)} ({rows.length})
            </p>
            <div className="overflow-x-auto">
            <HostsTable hostType={type.key} hosts={rows as never} pageSize={9999} />
          </div>
          </div>
        );
      })}
      <div className="mt-4">
        <AnalysisCharts hosts={allHosts} />
      </div>
      <div className="mt-3 h-[420px] w-full overflow-hidden rounded border">
        <AnalysisTopology analysisName={analysisName} hosts={allHosts} />
      </div>
    </div>
  );
};
import { useAudit } from "@/features/audits/hooks/use-audits";
import { useReportData, useSaveReportVersion } from "@/features/audits/hooks/use-audit-workflow";
import {
  useConclusion,
  useUpdateConclusion,
} from "@/features/audits/hooks/use-audit-records";
import JSZip from "jszip";

const GLOBAL_RESULTS = [
  "APROBADO",
  "APROBADO_CON_OBSERVACIONES",
  "NO_CONFORME",
  "SIN_DATOS_SUFICIENTES",
] as const;

const GLOBAL_RESULT_LABELS: Record<string, string> = {
  APROBADO: "Aprobado",
  APROBADO_CON_OBSERVACIONES: "Aprobado con observaciones",
  NO_CONFORME: "No conforme",
  SIN_DATOS_SUFICIENTES: "Sin datos suficientes",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asRecord = (value: unknown): any => value as any;

/** Empaqueta heatmaps (canvas), gráficas (SVG→PNG) e imágenes de anexos. */
const downloadImagesZip = async (auditId: string, code?: string | null) => {
  const container = document.querySelector("[data-report-root]") ?? document;
  const zip = new JSZip();
  let count = 0;

  const addPng = async (blob: Blob, name: string) => {
    zip.file(`${String(++count).padStart(2, "0")}-${name}.png`, blob);
  };

  const svgToPng = async (svg: SVGSVGElement, name: string) => {
    const xml = new XMLSerializer().serializeToString(svg);
    const { width, height } = svg.getBoundingClientRect();
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (blob) await addPng(blob, name);
  };

  container.querySelectorAll("canvas").forEach((canvas, index) => {
    const dataUrl = canvas.toDataURL("image/png");
    zip.file(
      `${String(++count).padStart(2, "0")}-heatmap-${index + 1}.png`,
      dataUrl.split(",")[1],
      { base64: true }
    );
  });

  const charts = container.querySelectorAll<SVGSVGElement>(".recharts-surface");
  for (let index = 0; index < charts.length; index++) {
    try {
      await svgToPng(charts[index], `grafica-${index + 1}`);
    } catch {
      /* gráfica no serializable */
    }
  }

  const images = container.querySelectorAll<HTMLImageElement>("img[data-anexo]");
  for (let index = 0; index < images.length; index++) {
    const src = images[index].src;
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      await addPng(blob, `anexo-${index + 1}`);
    } catch {
      /* remota no descargable (CORS/permisos) */
    }
  }

  if (count === 0) {
    toast.info("No hay imágenes exportables en este informe.");
    return;
  }
  const archive = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(archive);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `informe-${code || auditId.slice(0, 8)}-imagenes.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
  toast.success(`${count} imagen(es) exportadas.`);
};

const STATUS_COLORS: Record<string, string> = {
  PASS: "#16a34a",
  WARNING: "#d97706",
  FAIL: "#dc2626",
  UNKNOWN: "#9ca3af",
};

const signalColor = (
  value: number | null | undefined,
  warnMin: number,
  passMin: number
): string => {
  if (value === null || value === undefined) return "#9ca3af";
  if (value >= passMin) return "#16a34a";
  if (value >= warnMin) return "#d97706";
  return "#dc2626";
};

/** Mapa de calor real (interpolado, igual que el visor de Mapas de calor)
 *  reutilizando el componente SurveyHeatmap sobre el plano del survey. */
const HeatmapImage = ({
  image,
  points,
}: {
  image: string;
  width?: number;
  height?: number;
  points: Array<{ metric: string; x: number; y: number; value: number | null }>;
}) => {
  const metric = points.some((p) => p.metric === "snr") ? "snr" : "signal";
  const metricPoints = points
    .filter((p) => p.metric === metric)
    .map((p) => ({ x: p.x, y: p.y, value: p.value }));

  return (
    <div>
      <SurveyHeatmap
        image={image.startsWith("data:") ? image : `data:image/png;base64,${image}`}
        points={metricPoints}
        unit={metric === "snr" ? "dB" : "dBm"}
        metricLabel={metric === "snr" ? "SNR" : "Señal"}
      />
    </div>
  );
};

const ReportSectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="report-card mb-4 break-inside-avoid">
    <CardHeader className="report-section-title pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const AuditReportPage = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const { data: report } = useReportData(auditId);
  const { data: conclusion } = useConclusion(auditId);
  const updateConclusion = useUpdateConclusion(auditId);
  const saveVersion = useSaveReportVersion(auditId);
  const { data: audit } = useAudit(auditId);
  const { data: evaluaciones = [] } = useAuditEvaluations(auditId);

  const [finalText, setFinalText] = useState<string | null>(null);
  const [globalResult, setGlobalResult] = useState<string | null>(null);

  useEffect(() => {
    if (conclusion) {
      setFinalText(conclusion.finalText ?? conclusion.draft ?? "");
      setGlobalResult(conclusion.globalResult ?? null);
    }
  }, [conclusion]);

  if (!report || !audit) return <CustomLoading />;

  const resumen = asRecord(report.resumen);
  const kpis = asRecord(resumen?.kpis) ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cobertura = (asRecord(report.cobertura) as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conectividadRows = (asRecord(asRecord(report.conectividad)?.rows) as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const incidencias = (asRecord(report.incidencias) as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recomendaciones = (asRecord(report.recomendaciones) as any[]) ?? [];
  const rendimiento = asRecord(report.roaming);
  const calidad = asRecord(report.dataQuality);
  const radio = asRecord(report.radio) ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radioAps = (radio.aps as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radioSsids = (radio.ssids as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radioChannels = ((radio.channels as any[]) ?? [])
    .slice()
    .sort((a, b) => Number(b.signal ?? -999) - Number(a.signal ?? -999));

  const statusPieData = [
    { name: "Conforme", value: kpis.pass ?? 0, key: "PASS" },
    { name: "Límite", value: kpis.warning ?? 0, key: "WARNING" },
    { name: "No conforme", value: kpis.fail ?? 0, key: "FAIL" },
    { name: "Sin datos", value: kpis.unknown ?? 0, key: "UNKNOWN" },
  ].filter((entry) => entry.value > 0);

  const utilizationBarData = radioChannels.map((channel) => ({
    canal: String(channel.channel ?? "?"),
    señal: channel.signal ?? 0,
  }));

  const handleSaveConclusion = async () => {
    try {
      await updateConclusion.mutateAsync({
        finalText: finalText ?? undefined,
        globalResult: globalResult ?? undefined,
      });
      toast.success("Conclusión guardada.");
    } catch {
      // gestionado globalmente
    }
  };

  const handleSaveVersionAndPrint = async () => {
    try {
      const saved = await saveVersion.mutateAsync([
        "resumen",
        "cobertura",
        "radio",
        "conectividad",
        "rendimiento",
        "roaming",
        "descubrimiento",
        "incidencias",
        "conclusiones",
        "recomendaciones",
        "anexos",
      ]);
      toast.success(`Informe v${saved.version} registrado. Abriendo diálogo de impresión…`);
      setTimeout(() => window.print(), 300);
    } catch {
      // gestionado globalmente
    }
  };

  return (
    <div
      data-report-root
      className="container max-w-4xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0 print:max-w-none print:px-0"
    >
      <style>{`
        @media print {
          @page { size: A4; margin: 16mm 14mm; }
          body { background: white !important; }
          .report-document { font-size: 11px; color: #111827; }
          .report-document h1 { font-size: 22px; }
          .report-card { break-inside: avoid; border-color: #d1d5db !important; box-shadow: none !important; }
          .report-card img, .report-card canvas { print-color-adjust: exact; -webkit-print-color-adjust: exact; max-width: 100%; }
          .report-section-title { break-after: avoid; }
        }
      `}</style>
      <div className="print:hidden">
        <AuditHeader />
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <PrinterIcon className="w-4 h-4 mr-1" /> Imprimir / PDF
          </Button>
          <Button onClick={handleSaveVersionAndPrint} disabled={saveVersion.isPending}>
            <FileCheck2Icon className="w-4 h-4 mr-1" />
            Registrar versión e imprimir
          </Button>
          <Button variant="outline" onClick={() => downloadImagesZip(auditId, audit?.code)}>
            Descargar imágenes (ZIP)
          </Button>
        </div>
      </div>

      {/* Portada */}
      {(() => {
        const header = asRecord(report.header);
        return (
      <div className="mb-8 border-b pb-6">
        <h1 className="text-2xl font-bold">Informe de auditoría Wi-Fi</h1>
        <p className="mt-1 text-lg">{String(header.name)}</p>
        <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
          {[
            ["Código", header.code],
            ["Cliente", header.client],
            ["Proyecto", header.project],
            ["Ubicación", header.location],
            ["Edificio", header.building],
            ["Técnico", header.technician],
            ["Perfil de criterios", header.profileName],
            ["Fecha", header.auditDate ? new Date(String(header.auditDate)).toLocaleDateString("es-ES") : null],
            ["Resultado global", resumen?.globalResult ? GLOBAL_RESULT_LABELS[String(resumen.globalResult)] : "Pendiente"],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between sm:block">
              <dt className="font-medium">{String(label)}</dt>
              <dd className="text-muted-foreground">{value ? String(value) : "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
        );
      })()}

      {/* Resumen ejecutivo */}
      <ReportSectionCard title="Resumen ejecutivo">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><p className="text-xl font-bold">{kpis.evaluationsTotal ?? 0}</p><p className="text-muted-foreground">criterios evaluados</p></div>
          <div><p className="text-xl font-bold text-green-700">{kpis.pctPass ?? 0}%</p><p className="text-muted-foreground">conformes</p></div>
          <div><p className="text-xl font-bold text-red-700">{kpis.pctFail ?? 0}%</p><p className="text-muted-foreground">no conformes</p></div>
          <div><p className="text-xl font-bold">{incidencias.length}</p><p className="text-muted-foreground">incidencias activas</p></div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Capturas analizadas: {kpis.measures ?? 0} medidas · {kpis.surveys ?? 0} encuestas ·{" "}
          {kpis.analyses ?? 0} análisis. Descubrimiento: {kpis.aps ?? 0} APs,{" "}
          {kpis.ssids ?? 0} SSIDs.
        </p>
      </ReportSectionCard>

      {/* Gráficas del análisis */}
      <ReportSectionCard title="Gráficas del análisis">
        <div className="grid gap-6 lg:grid-cols-2">
          {statusPieData.length > 0 ? (
            <div>
              <p className="mb-1 text-sm font-medium">Resultado de criterios</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {statusPieData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : null}
          {utilizationBarData.length > 0 ? (
            <div>
              <p className="mb-1 text-sm font-medium">
                Señal por canal (dBm, mejores 14)
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={utilizationBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="canal" fontSize={11} />
                  <YAxis domain={[-100, 0]} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="señal" radius={[3, 3, 0, 0]}>
                    {utilizationBarData.map((entry) => (
                      <Cell
                        key={entry.canal}
                        fill={signalColor(entry.señal, -72, -67)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      </ReportSectionCard>

      {/* Cobertura */}
      {cobertura.length > 0 ? (
        <ReportSectionCard title="Cobertura por encuesta">
          <div className="space-y-4">
            {cobertura.map((surveyRow) => (
              <div key={String(surveyRow.guid)} className="rounded-md border p-3">
                <p className="font-medium">{String(surveyRow.name)}</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  {surveyRow.floorName ? `${surveyRow.floorName} · ` : ""}
                  {String(surveyRow.pointCount)} puntos medidos
                </p>
                {surveyRow.image ? (
                  <div className="mb-3">
                    <HeatmapImage
                      image={String(surveyRow.image)}
                      points={asRecord(surveyRow.points) ?? []}
                    />
                  </div>
                ) : null}
                <ul className="space-y-1 text-sm">
                  {(surveyRow.evaluations as unknown[]).map((evaluation, index) => {
                    const item = asRecord(evaluation);
                    return (
                      <li key={index} className="flex items-center justify-between gap-2">
                        <span>
                          {String(item.metric)}
                          {item.value !== null && item.value !== undefined
                            ? `: ${item.value}${item.unit ?? ""}`
                            : ": sin dato"}
                        </span>
                        <span
                          className={
                            item.status === "PASS"
                              ? "text-green-700"
                              : item.status === "FAIL"
                                ? "text-red-700 font-medium"
                                : item.status === "WARNING"
                                  ? "text-amber-600"
                                  : "text-muted-foreground"
                          }
                        >
                          {item.status === "PASS"
                            ? "Conforme"
                            : item.status === "FAIL"
                              ? "No conforme"
                              : item.status === "WARNING"
                                ? "En el límite"
                                : "No disponible"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </ReportSectionCard>
      ) : null}

      {/* Análisis de espectro detallado */}
      {(radioChannels.length > 0 ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((radio.interference as any[]) ?? []).length > 0 ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((radio.security as any[]) ?? []).length > 0) ? (
        <ReportSectionCard title="Análisis de espectro">
          <div className="grid gap-4 lg:grid-cols-2">
            {radioChannels.length > 0 ? (
              <div>
                <p className="mb-1 text-sm font-medium">Utilización / señal por canal</p>
                <div className="overflow-x-auto"><table className="w-full border-collapse text-xs [&_th]:whitespace-nowrap">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-2 py-1">Canal</th>
                      <th className="px-2 py-1">Banda</th>
                      <th className="px-2 py-1">Señal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {radioChannels.map((channel, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="px-2 py-1">{String(channel.channel ?? "—")}</td>
                        <td className="px-2 py-1">{String(channel.band ?? "—")}</td>
                        <td
                          className="px-2 py-1"
                          style={{ color: signalColor(Number(channel.signal ?? NaN), -72, -67) }}
                        >
                          {channel.signal != null ? Number(channel.signal).toFixed(0) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            ) : null}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(radio.interference as any[])?.length ? (
              <div>
                <p className="mb-1 text-sm font-medium">Interferencias evaluadas</p>
                <ul className="space-y-1 text-xs">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(radio.interference as any[]).map((item, index) => (
                    <li key={index} className="flex items-center justify-between gap-2">
                      <span>{String(item.metric)}{item.location ? ` · ${item.location}` : ""}</span>
                      <span
                        className={
                          item.status === "PASS"
                            ? "text-green-700"
                            : item.status === "FAIL"
                              ? "text-red-700 font-medium"
                              : item.status === "WARNING"
                                ? "text-amber-600"
                                : "text-muted-foreground"
                        }
                      >
                        {item.value != null ? `${item.value}${item.unit ?? ""}` : item.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(radio.security as any[])?.length ? (
              <div>
                <p className="mb-1 text-sm font-medium">Seguridad de redes detectadas</p>
                <div className="overflow-x-auto"><table className="w-full border-collapse text-xs [&_th]:whitespace-nowrap">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-2 py-1">Tipo</th>
                      <th className="px-2 py-1 text-right">Redes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(radio.security as any[]).map((row, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="px-2 py-1">{String(row.type)}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{Number(row.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            ) : null}
          </div>
        </ReportSectionCard>
      ) : null}

      {/* Análisis completo vinculado (gráficas + topología) */}
      {((asRecord(report.anexos)?.members?.analyses ?? []) as unknown[]).length > 0 ? (
        <ReportSectionCard title="Análisis vinculados">
          {(asRecord(report.anexos).members.analyses as unknown[]).map((rawItem) => {
            const item = asRecord(rawItem);
            return (
              <AnalysisReportSection
                key={String(item.id)}
                analysisId={Number(item.id)}
                name={String(item.name ?? "")}
              />
            );
          })}
        </ReportSectionCard>
      ) : null}

      {/* Entorno radioeléctrico detectado */}
      {radioAps.length > 0 || radioSsids.length > 0 ? (
        <ReportSectionCard title="Entorno radioeléctrico detectado">
          {radioSsids.length > 0 ? (
            <div className="mb-4">
              <p className="mb-1 text-sm font-medium">SSIDs ({radioSsids.length})</p>
              <div className="overflow-x-auto"><table className="w-full border-collapse text-xs [&_th]:whitespace-nowrap">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-2 py-1">SSID</th>
                    <th className="px-2 py-1">Seguridad</th>
                    <th className="px-2 py-1">Banda</th>
                    <th className="px-2 py-1">Señal</th>
                  </tr>
                </thead>
                <tbody>
                  {radioSsids.map((ssid, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="px-2 py-1">{String(ssid.ssid ?? "—")}</td>
                      <td className="px-2 py-1">{String(ssid.securityType ?? "—")}</td>
                      <td className="px-2 py-1">{String(ssid.band ?? "—")}</td>
                      <td
                        className="px-2 py-1"
                        style={{ color: signalColor(Number(ssid.signal ?? NaN), -72, -67) }}
                      >
                        {ssid.signal != null ? Number(ssid.signal).toFixed(0) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          ) : null}
          {radioAps.length > 0 ? (
            <div>
              <p className="mb-1 text-sm font-medium">Puntos de acceso ({radioAps.length})</p>
              <div className="overflow-x-auto"><table className="w-full border-collapse text-xs [&_th]:whitespace-nowrap">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-2 py-1">Nombre / SSID</th>
                    <th className="px-2 py-1">MAC</th>
                    <th className="px-2 py-1">Canal</th>
                    <th className="px-2 py-1">Banda</th>
                    <th className="px-2 py-1">Señal</th>
                  </tr>
                </thead>
                <tbody>
                  {radioAps.map((ap, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="px-2 py-1">{String(ap.name ?? ap.ssid ?? "—")}</td>
                      <td className="px-2 py-1 font-mono">{String(ap.mac ?? "—")}</td>
                      <td className="px-2 py-1">{String(ap.channel ?? "—")}</td>
                      <td className="px-2 py-1">{String(ap.band ?? "—")}</td>
                      <td
                        className="px-2 py-1"
                        style={{ color: signalColor(Number(ap.signal ?? NaN), -72, -67) }}
                      >
                        {ap.signal != null ? Number(ap.signal).toFixed(0) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
              
            </div>
          ) : null}
        </ReportSectionCard>
      ) : null}

      {/* Conectividad */}
      {conectividadRows.length > 0 ? (
        <ReportSectionCard title="Conectividad por punto de prueba">
          <div className="space-y-3">
            {conectividadRows.map((row, rowIndex) => (
              <div key={rowIndex} className="rounded-md border p-3 text-sm">
                <p className="mb-1 font-medium">{String(row.point)}</p>
                <ul className="space-y-0.5">
                  {Object.entries(asRecord(row.results)).map(([metric, result]) => {
                    const item = asRecord(result);
                    return (
                      <li key={metric}>
                        <span className="font-medium">{metric}: </span>
                        <span
                          className={
                            item.status === "PASS"
                              ? "text-green-700"
                              : item.status === "FAIL"
                                ? "text-red-700"
                                : "text-muted-foreground"
                          }
                        >
                          {item.status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </ReportSectionCard>
      ) : null}

      {/* Rendimiento / movilidad */}
      <ReportSectionCard title="Rendimiento y movilidad">
        <p className="text-sm text-muted-foreground">
          Prueba de roaming:{" "}
          {rendimiento?.performed ? "realizada" : "no realizada o sin datos disponibles."}
        </p>
        {rendimiento?.note ? (
          <p className="mt-1 text-sm text-muted-foreground">{String(rendimiento.note)}</p>
        ) : null}
      </ReportSectionCard>

      {/* Evaluación detallada */}
      {(() => {
        const categorias = [
          "COBERTURA",
          "RADIO",
          "CONECTIVIDAD",
          "RENDIMIENTO",
          "MOVILIDAD",
        ] as const;
        const labels: Record<string, string> = {
          COBERTURA: "Cobertura",
          RADIO: "Radiofrecuencia",
          CONECTIVIDAD: "Conectividad",
          RENDIMIENTO: "Rendimiento",
          MOVILIDAD: "Movilidad / roaming",
        };
        return (
      <ReportSectionCard title="Evaluación de criterios">
        {evaluaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ejecuta la evaluación para ver el detalle.
          </p>
        ) : (
          <div className="space-y-3">
            {categorias.map((category) => {
              const rows = evaluaciones.filter((e) => e.category === category);
              if (rows.length === 0) return null;
              return (
                <div key={category} className="rounded-md border p-3">
                  <p className="mb-1 text-sm font-semibold">
                    {labels[category]}{" "}
                    <span className="font-normal text-muted-foreground">({rows.length})</span>
                  </p>
                  <ul className="space-y-1">
                    {rows.map((evaluation) => (
                      <li key={evaluation.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>
                          {evaluation.metric}
                          {evaluation.locationLabel ? (
                            <span className="ml-1 text-xs text-muted-foreground">
                              · {evaluation.locationLabel}
                            </span>
                          ) : null}
                          {evaluation.value !== null && evaluation.value !== undefined ? (
                            <span className="ml-1">
                              ({evaluation.value}
                              {evaluation.unit ?? ""})
                            </span>
                          ) : null}
                        </span>
                        <EvalStatusBadge status={evaluation.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </ReportSectionCard>
        );
      })()}

      {/* Incidencias */}
      <ReportSectionCard title={`Incidencias (${incidencias.length})`}>
        {incidencias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin incidencias registradas.</p>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {incidencias.map((issue) => (
              <li key={String(issue.id)}>
                {issue.photo ? (
                  <img
                    src={String(issue.photo)}
                    alt={`Foto de ${String(issue.title)}`}
                    className="mb-1 max-h-40 rounded border object-cover print:max-h-32"
                  />
                ) : null}
                <span className="font-medium">[{String(issue.severity)}] {String(issue.title)}</span>
                {issue.description ? (
                  <p className="text-muted-foreground">{String(issue.description)}</p>
                ) : null}
                {issue.recommendationText ? (
                  <p>Recomendación: {String(issue.recommendationText)}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </ReportSectionCard>

      {/* Recomendaciones */}
      <ReportSectionCard title="Recomendaciones">
        {recomendaciones.every((group) => (group.items as unknown[]).length === 0) ? (
          <p className="text-sm text-muted-foreground">Sin recomendaciones generadas.</p>
        ) : (
          recomendaciones.map((group) => {
            const items = (group.items as unknown[]).map((item) => asRecord(item));
            if (items.length === 0) return null;
            const labels: Record<string, string> = {
              INMEDIATA: "Acciones inmediatas",
              OPTIMIZACION: "Optimización",
              INFRAESTRUCTURA: "Infraestructura",
            };
            return (
              <div key={String(group.category)} className="mb-3">
                <p className="font-medium">{labels[String(group.category)] ?? String(group.category)}</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {items.map((item, index) => (
                    <li key={index}>{String(item.text)}</li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </ReportSectionCard>

      {/* Anexos (solo lectura) */}
      {(() => {
        const anexos = (asRecord(report.anexos)?.audit ?? []) as Array<{
          name: string;
          href: string;
          thumb?: string;
        }>;
        if (anexos.length === 0) return null;
        return (
          <ReportSectionCard title={`Anexos (${anexos.length})`}>
            <ul className="space-y-2">
              {anexos.map((anexo, index) => (
                <li key={index} className="space-y-1 text-sm">
                  <a
                    href={anexo.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {anexo.name}
                  </a>
                  <img
                    data-anexo
                    src={anexo.thumb || anexo.href}
                    alt={anexo.name}
                    className="max-h-40 rounded border print:max-h-48"
                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                  />
                </li>
              ))}
            </ul>
          </ReportSectionCard>
        );
      })()}

      {/* Conclusiones editables */}
      <ReportSectionCard title="Conclusiones">
        <textarea
          value={finalText ?? ""}
          onChange={(event) => setFinalText(event.target.value)}
          rows={6}
          placeholder="Redacta la conclusión final de la auditoría…"
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3 print:hidden">
          <Select value={globalResult ?? ""} onValueChange={setGlobalResult}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Resultado global…" />
            </SelectTrigger>
            <SelectContent>
              {GLOBAL_RESULTS.map((option) => (
                <SelectItem key={option} value={option}>
                  {GLOBAL_RESULT_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleSaveConclusion} disabled={updateConclusion.isPending}>
            <SaveIcon className="w-4 h-4 mr-1" /> Guardar conclusión
          </Button>
        </div>
      </ReportSectionCard>

      {/* Calidad de datos (anexo) */}
      {calidad?.problems?.length ? (
        <ReportSectionCard title="Anexo: calidad de los datos">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {(calidad.problems as unknown[]).map((problem) => {
              const item = asRecord(problem);
              return (
                <li key={`${String(item.severity)}-${String(item.message)}`}>
                  [{String(item.severity)}] {String(item.message)} ({String(item.count)})
                </li>
              );
            })}
          </ul>
        </ReportSectionCard>
      ) : null}
    </div>
  );
};

export default AuditReportPage;
