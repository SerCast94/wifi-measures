import { useMemo } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Printer } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/core/atomic-components/badge";
import { Button } from "@/core/atomic-components/button";
import { Card, CardContent } from "@/core/atomic-components/card";
import { useAreaPlan } from "@/features/measures/hooks/use-area-plan";
import { useSurveys } from "@/features/surveys/hooks/use-surveys";
import { useAnalyses } from "@/features/analyses/hooks/use-analyses";
import { useAnalysisHosts } from "@/features/analyses/hooks/use-analysis-hosts";
import {
  ANALYSIS_HOST_TYPES,
  type AnalysisHostCounts,
} from "@/features/analyses/types/analysis.types";
import { AnalysisCharts } from "@/features/analyses/components/charts/AnalysisCharts";
import { AnalysisTopology } from "@/features/analyses/components/topology/AnalysisTopology";
import {
  getResultsByMonth,
  getSignalHistogram,
  getSnrHistogram,
  getTopFailureReasons,
} from "@/features/dashboard/lib/measures-stats";
import type { Area } from "@/features/measures/types/areas.types";

const COLOR_HEX: Record<string, string> = {
  red: "#ef4444",
  yellow: "#facc15",
  green: "#22c55e",
  black: "#6b7280",
};

const NETALLY_COLORS: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  black: "bg-gray-400",
};

const KPI_ACCENTS: Record<string, string> = {
  primary: "border-t-primary",
  green: "border-t-green-500",
  blue: "border-t-blue-500",
  purple: "border-t-purple-500",
  red: "border-t-red-500",
};

const toNumber = (value: unknown): number | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "string" && (value.includes("--") || value.trim() === "")) {
    return null;
  }
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

interface AreaReportProps {
  area: Area;
}

export const AreaReport = ({ area }: AreaReportProps) => {
  const { data: plan } = useAreaPlan(area.id);
  const { data: surveys } = useSurveys();
  const { data: analyses } = useAnalyses();

  const measures = useMemo(
    () =>
      [...area.measures].sort(
        (a, b) => a.datetime.getTime() - b.datetime.getTime()
      ),
    [area.measures]
  );

  const stats = useMemo(() => {
    const withRaw = measures.filter((measure) => measure.raw);
    const total = measures.length;
    let green = 0;
    let yellow = 0;
    let red = 0;
    let signalSum = 0;
    let signalCount = 0;
    let snrSum = 0;
    let snrCount = 0;

    for (const measure of withRaw) {
      const raw = measure.raw as Record<string, unknown>;
      switch (`${raw.overallColor ?? ""}`) {
        case "green":
          green += 1;
          break;
        case "yellow":
          yellow += 1;
          break;
        case "red":
          red += 1;
          break;
      }
      const signal = toNumber(raw.linkSignalLevelMean);
      if (signal !== null) {
        signalSum += signal;
        signalCount += 1;
      }
      const snr = toNumber(raw.linkSNRMean);
      if (snr !== null) {
        snrSum += snr;
        snrCount += 1;
      }
    }

    return {
      total,
      green,
      yellow,
      red,
      successRate: total > 0 ? Math.round((green / total) * 100) : 0,
      avgSignal: signalCount > 0 ? signalSum / signalCount : null,
      avgSnr: snrCount > 0 ? snrSum / snrCount : null,
      byMonth: getResultsByMonth(measures, 6),
      signalHistogram: getSignalHistogram(measures),
      snrHistogram: getSnrHistogram(measures),
      topFailures: getTopFailureReasons(measures, 5),
    };
  }, [measures]);

  const sourceSurvey =
    plan?.heatmap?.source === "linklive" && plan.heatmap.surveyId && surveys
      ? surveys.find((survey) => survey.idLinkLive === plan.heatmap?.surveyId)
      : undefined;

  // Análisis de descubrimiento vinculado a la encuesta del área
  const linkedAnalysis =
    sourceSurvey?.analysisGuid && analyses
      ? analyses.find(
          (analysis) =>
            analysis.guid === sourceSurvey.analysisGuid ||
            analysis.analysisGuid === sourceSurvey.analysisGuid ||
            analysis.idLinkLive === sourceSurvey.analysisGuid
        )
      : undefined;

  const { data: discoveryHosts } = useAnalysisHosts(
    linkedAnalysis?.id ?? 0
  );

  const firstMeasure = measures[0];
  const generatedAt = new Date();

  const kpis = [
    { label: "Medidas", value: `${stats.total}`, accent: "primary" },
    { label: "Result correctas", value: `${stats.successRate}%`, accent: "green" },
    {
      label: "Señal media",
      value:
        stats.avgSignal !== null ? `${stats.avgSignal.toFixed(1)} dBm` : "—",
      accent: "blue",
    },
    {
      label: "SNR media",
      value: stats.avgSnr !== null ? `${stats.avgSnr.toFixed(1)} dB` : "—",
      accent: "purple",
    },
    { label: "Fallos", value: `${stats.red}`, accent: "red" },
  ];

  const hasDiscovery = Boolean(linkedAnalysis);
  const numConclusiones = hasDiscovery ? 6 : 5;

  return (
    <div className="space-y-8">
      {/* Acciones (no se imprimen) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/areas/${area.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver al área
        </Link>
        <Button onClick={() => window.print()} size="sm">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir / Guardar PDF
        </Button>
      </div>

      {/* Portada */}
      <div className="avoid-break space-y-2 rounded-xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Informe técnico de medida Wi-Fi
        </p>
        <h1 className="text-3xl font-bold">Área {area.name}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-sm text-muted-foreground">
          <span>Provincia: {area.provincia || "—"}</span>
          <span>
            Generado el{" "}
            {format(generatedAt, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
          </span>
          {firstMeasure && (
            <>
              <span>Técnico: {firstMeasure.technician || "—"}</span>
              <span>Responsable: {firstMeasure.responsible || "—"}</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary">{stats.total} medidas</Badge>
          <Badge variant="secondary">{stats.green} correctas</Badge>
          {hasDiscovery && (
            <Badge variant="secondary">
              Descubrimiento: {linkedAnalysis!.hostCount ?? 0} dispositivos
            </Badge>
          )}
          {sourceSurvey && (
            <Badge variant="outline">Encuesta: {sourceSurvey.name ?? sourceSurvey.surveyName}</Badge>
          )}
        </div>
      </div>

      {/* 1. Resumen ejecutivo */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Resumen ejecutivo</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className={`border-t-4 ${KPI_ACCENTS[kpi.accent]}`}>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold">{kpi.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {kpi.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
          <p>
            El área <strong>{area.name}</strong> cuenta con{" "}
            <strong>{stats.total}</strong> medidas registradas. De ellas,{" "}
            <strong>{stats.green}</strong> han resultado correctas (
            {stats.successRate}%), <strong>{stats.yellow}</strong> con
            advertencias y <strong>{stats.red}</strong> fallidas.
            {stats.avgSignal !== null && (
              <> La señal media registrada es de{" "}
              <strong>{stats.avgSignal.toFixed(1)} dBm</strong></>
            )}
            {stats.avgSnr !== null && (
              <> con una SNR media de <strong>{stats.avgSnr.toFixed(1)} dB</strong></>
            )}
            .
            {stats.topFailures.length > 0 && (
              <> El motivo de fallo más frecuente es: «
              <strong>{stats.topFailures[0].reason}</strong>» (
              {stats.topFailures[0].count} apariciones).</>
            )}
          </p>
        </div>
      </section>

      {/* 2. Análisis gráfico de medidas */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Análisis gráfico de medidas</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="avoid-break">
            <CardContent className="p-4">
              <p className="mb-2 text-sm font-semibold">
                Resultados por mes (últimos 6 meses)
              </p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byMonth} margin={{ top: 4, right: 8, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" fontSize={11} tickLine={false} />
                    <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    {["green", "yellow", "red", "black"].map((color) => (
                      <Bar
                        key={color}
                        dataKey={color}
                        stackId="a"
                        fill={COLOR_HEX[color]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="avoid-break">
            <CardContent className="p-4">
              <p className="mb-2 text-sm font-semibold">
                Distribución de señal (dBm)
              </p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.signalHistogram} margin={{ top: 4, right: 8, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" fontSize={11} tickLine={false} />
                    <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="avoid-break">
            <CardContent className="p-4">
              <p className="mb-2 text-sm font-semibold">Distribución de SNR (dB)</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.snrHistogram} margin={{ top: 4, right: 8, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" fontSize={11} tickLine={false} />
                    <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="avoid-break">
            <CardContent className="p-4">
              <p className="mb-2 text-sm font-semibold">Motivos de fallo más frecuentes</p>
              {stats.topFailures.length > 0 ? (
                <ul className="space-y-1.5 py-4 text-sm">
                  {stats.topFailures.map((failure) => (
                    <li key={failure.reason} className="flex items-center justify-between gap-2">
                      <span className="truncate">{failure.reason}</span>
                      <Badge variant="secondary">{failure.count}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No se han registrado fallos.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. Plano y mapa de calor */}
      {plan?.image && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. Plano y mapa de calor</h2>
          <Card className="avoid-break">
            <CardContent className="p-4">
              <img
                src={plan.image}
                alt={`Plano del área ${area.name}`}
                className="mx-auto max-w-full rounded-md border"
              />
              {sourceSurvey && (
                <p className="no-print mt-2 text-xs text-muted-foreground">
                  Heatmap importado de la encuesta{" "}
                  <Link
                    to={`/surveys/${sourceSurvey.id}`}
                    className="text-primary hover:underline"
                  >
                    {sourceSurvey.name ?? sourceSurvey.surveyName}
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* 4. Detalle de medidas */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {plan?.image ? "4" : "3"}. Detalle de medidas ({measures.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border avoid-break">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Perfil</th>
                <th className="px-3 py-2">Señal (dBm)</th>
                <th className="px-3 py-2">SNR (dB)</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Motivo de fallo</th>
              </tr>
            </thead>
            <tbody>
              {measures.map((measure) => {
                const raw = (measure.raw ?? {}) as Record<string, unknown>;
                const color = `${raw.overallColor ?? ""}`;
                const failures = [
                  ...((raw.linkFailureReasons ?? []) as unknown[]),
                  ...((raw.failureReasons ?? []) as unknown[]),
                ].map(String);
                return (
                  <tr key={measure.id} className="border-t">
                    <td className="whitespace-nowrap px-3 py-2">
                      {format(measure.datetime, "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="px-3 py-2">{measure.name}</td>
                    <td className="px-3 py-2">
                      {toNumber(raw.linkSignalLevelMean) ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {toNumber(raw.linkSNRMean) ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5 capitalize">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            NETALLY_COLORS[color] ?? "bg-gray-300"
                          }`}
                        />
                        {color || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-red-600">
                      {failures.length > 0 ? failures.join(" · ") : "—"}
                    </td>
                  </tr>
                );
              })}
              {measures.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    Sin medidas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Descubrimiento de red */}
      {hasDiscovery && linkedAnalysis && (
        <section className="space-y-3 print-break">
          <h2 className="text-lg font-semibold">5. Descubrimiento de red</h2>
          <p className="text-sm text-muted-foreground">
            Resultados del análisis «{linkedAnalysis.name ?? linkedAnalysis.fileName ?? linkedAnalysis.idLinkLive}»
            capturado por {linkedAnalysis.unitName ?? "unidad NetAlly"}
            {linkedAnalysis.startTime &&
              ` el ${format(new Date(linkedAnalysis.startTime), "dd/MM/yyyy HH:mm", { locale: es })}`}
            .
          </p>

          {/* Resumen por tipo de dispositivo */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {ANALYSIS_HOST_TYPES.map((type) => {
              const counts = (linkedAnalysis.hostCounts ?? {}) as AnalysisHostCounts;
              const value = counts[type.key as keyof AnalysisHostCounts] ?? 0;
              return (
                <Card key={type.key} className="border-t-2 border-t-blue-400">
                  <CardContent className="p-2.5 text-center">
                    <p className="text-lg font-bold">{value}</p>
                    <p className="text-[11px] text-muted-foreground">{type.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {discoveryHosts && discoveryHosts.length > 0 ? (
            <>
              <AnalysisCharts hosts={discoveryHosts} />

              <h3 className="pt-2 text-base font-semibold">5.1 Topología de la red</h3>
              <AnalysisTopology
                analysisName={
                  linkedAnalysis.name ?? linkedAnalysis.fileName ?? linkedAnalysis.idLinkLive
                }
                hosts={discoveryHosts}
              />
            </>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Cargando dispositivos del análisis…
            </p>
          )}
        </section>
      )}

      {/* Conclusiones */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{numConclusiones}. Conclusiones</h2>
        <div className="rounded-lg border p-4 text-sm leading-relaxed">
          <ul className="list-inside list-disc space-y-1">
            <li>
              Cobertura: {stats.green} de {stats.total} pruebas de conexión
              completadas sin errores ({stats.successRate}%).
            </li>
            {stats.avgSignal !== null && (
              <li>
                Nivel de señal medio de {stats.avgSignal.toFixed(1)} dBm
                {stats.avgSignal >= -65
                  ? ", adecuado para servicios de alta demanda."
                  : stats.avgSignal >= -72
                  ? ", aceptable para la mayoría de servicios."
                  : ", por debajo de lo recomendado; revisar cobertura."}
              </li>
            )}
            {stats.avgSnr !== null && (
              <li>
                SNR media de {stats.avgSnr.toFixed(1)} dB
                {stats.avgSnr >= 35
                  ? ", excelente calidad de enlace."
                  : stats.avgSnr >= 25
                  ? ", calidad suficiente para voz y datos."
                  : ", baja relación señal/ruido; evaluar interferencias."}
              </li>
            )}
            {stats.topFailures.length > 0 && (
              <li>
                Principal incidencia a resolver: «{stats.topFailures[0].reason}».
              </li>
            )}
            {hasDiscovery && discoveryHosts && discoveryHosts.length > 0 && (
              <li>
                Inventario de red: {discoveryHosts.length} dispositivos
                detectados en el descubrimiento, incluyendo{" "}
                {(linkedAnalysis!.hostCounts?.ap ?? 0)} APs y{" "}
                {(linkedAnalysis!.hostCounts?.client ?? 0)} clientes.
              </li>
            )}
            {sourceSurvey && (
              <li>
                Se dispone de mapa de calor de la encuesta «
                {sourceSurvey.name ?? sourceSurvey.surveyName}» asociada a esta
                área.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
};
