import { useParams } from "react-router";
import { RefreshCwIcon } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import CustomLoading from "@/core/components/CustomLoading";
import LoraAuditHeader from "../LoraAuditHeader";
import {
  useLoraAnalysis,
  useLoraAnalysisData,
  useLoraAudit,
  useRunLoraAnalysis,
} from "@/features/lora/hooks/use-lora";
import {
  LORA_EVAL_STATUS_LABELS,
  LORA_GLOBAL_RESULT_LABELS,
  type LoraAnalysis,
  type LoraEvalStatus,
  type LoraEvaluationItem,
} from "@/features/lora/types/lora.types";

const STATUS_COLORS: Record<LoraEvalStatus, string> = {
  PASS: "#16a34a",
  WARNING: "#d97706",
  FAIL: "#dc2626",
  UNKNOWN: "#9ca3af",
};

const METRIC_LABELS: Record<string, string> = {
  RSSI: "RSSI",
  SNR: "SNR",
  PACKET_LOSS: "Pérdida de paquetes",
  MARGIN: "Margen radio",
  NOISE_DELTA: "Variación de ruido",
  COHERENCIA: "Coherencia cruzada",
};

const CATEGORY_LABELS: Record<string, string> = {
  RADIO: "Radio (RSSI / SNR)",
  PAQUETES: "Paquetes",
  RUIDO: "Ruido por banda",
  MARGEN: "Margen radio",
  COHERENCIA: "Coherencia cruzada",
};

const CATEGORY_ORDER = ["RADIO", "PAQUETES", "RUIDO", "MARGEN", "COHERENCIA"];

const categoryKey = (item: LoraEvaluationItem): string =>
  item.metric === "NOISE_DELTA"
    ? item.message.split(":")[0] ?? "ruido"
    : item.metric;

const EvalStatusPill = ({ status }: { status: LoraEvalStatus }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
    style={{
      color: STATUS_COLORS[status],
      backgroundColor: `${STATUS_COLORS[status]}1a`,
    }}
  >
    {LORA_EVAL_STATUS_LABELS[status]}
  </span>
);

const GroupHeader = ({
  title,
  count,
  evaluations,
}: {
  title: string;
  count: number;
  evaluations: LoraEvaluationItem[];
}) => {
  const counts: Record<LoraEvalStatus, number> = {
    PASS: 0,
    WARNING: 0,
    FAIL: 0,
    UNKNOWN: 0,
  };
  for (const e of evaluations) counts[e.status] += 1;
  return (
    <CardHeader className="flex flex-row items-center justify-between pb-1">
      <CardTitle className="text-base">
        {title} <span className="text-sm font-normal text-muted-foreground">({count})</span>
      </CardTitle>
      <div className="flex items-center gap-2 text-xs">
        {(["PASS", "WARNING", "FAIL"] as const).map((status) => (
          <span key={status} className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            {counts[status]}
          </span>
        ))}
      </div>
    </CardHeader>
  );
};

const LoraAuditAnalysisPage = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const { data: audit, isLoading: loadingAudit } = useLoraAudit(auditId);
  const { data: analysis, isLoading: loadingAnalysis } = useLoraAnalysis(auditId);
  const { data: chartData } = useLoraAnalysisData(auditId);
  const runAnalysis = useRunLoraAnalysis(auditId);

  if (loadingAudit || loadingAnalysis || !audit) return <CustomLoading />;

  const blocks = chartData?.blocks ?? [];
  const noise = chartData?.noise ?? [];

  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <LoraAuditHeader />

      <div className="mb-4 flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => runAnalysis.mutate()}
          disabled={runAnalysis.isPending}
        >
          <RefreshCwIcon
            className={`h-4 w-4 mr-1 ${runAnalysis.isPending ? "animate-spin" : ""}`}
          />
          Ejecutar análisis
        </Button>
      </div>

      {runAnalysis.isPending ? (
        <CustomLoading />
      ) : !analysis || analysis.evaluations.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Todavía no se ha ejecutado el análisis de este enlace. Pulsa
            «Ejecutar análisis» para evaluar la medida y el ruido seleccionados.
          </CardContent>
        </Card>
      ) : (
        <LoraAnalysisContent
          analysis={analysis}
          blocks={blocks}
          noise={noise}
        />
      )}
    </div>
  );
};

const LoraAnalysisContent = ({
  analysis,
  blocks,
  noise,
}: {
  analysis: LoraAnalysis;
  blocks: Array<{ role: string | null; rssi: number | null; snr: number | null; packetLossPct: number | null; totalPackets: number | null }>;
  noise: Array<{ frequency: number | null; currentScan: number | null; weightedAverageScan: number | null }>;
}) => {
  const summary = analysis.summary;

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Resultado global</p>
              <p className="text-xl font-bold">
                {LORA_GLOBAL_RESULT_LABELS[summary.globalResult] ??
                  summary.globalResult}
              </p>
            </div>
            <div className="flex gap-4">
              {(
                [
                  ["PASS", "Conformes"],
                  ["WARNING", "En el límite"],
                  ["FAIL", "No conformes"],
                  ["UNKNOWN", "Sin datos"],
                ] as const
              ).map(([status, label]) => (
                <div key={status} className="text-center">
                  <p
                    className="text-2xl font-bold"
                    style={{ color: STATUS_COLORS[status] }}
                  >
                    {summary.byStatus[status]}
                  </p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
          {summary.paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-2 text-sm text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </CardContent>
      </Card>

      {summary.recommendations.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm">
              {summary.recommendations.map((recommendation, index) => (
                <li key={index} className="mb-1 text-muted-foreground">
                  {recommendation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Gráficas del análisis</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {blocks.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">RSSI por bloque (dBm)</p>
              <VerticalBars
                items={blocks.map((b) => ({
                  label: b.role ?? "Bloque",
                  value: b.rssi,
                  color:
                    b.rssi == null
                      ? STATUS_COLORS.UNKNOWN
                      : b.rssi >= -70
                        ? STATUS_COLORS.PASS
                        : b.rssi >= -85
                          ? STATUS_COLORS.WARNING
                          : STATUS_COLORS.FAIL,
                }))}
                domain={[-120, 0]}
              />
            </div>
          )}
          {blocks.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">SNR por bloque (dB)</p>
              <VerticalBars
                items={blocks.map((b) => ({
                  label: b.role ?? "Bloque",
                  value: b.snr,
                  color:
                    b.snr == null
                      ? STATUS_COLORS.UNKNOWN
                      : b.snr >= 10
                        ? STATUS_COLORS.PASS
                        : b.snr >= -5
                          ? STATUS_COLORS.WARNING
                          : STATUS_COLORS.FAIL,
                }))}
                domain={[-20, 20]}
              />
            </div>
          )}
          {blocks.some((b) => b.packetLossPct != null) && (
            <div>
              <p className="mb-2 text-sm font-semibold">
                Pérdida de paquetes por bloque (%)
              </p>
              <HorizontalLossChart
                items={blocks.map((b) => ({
                  label: b.role ?? "Bloque",
                  pct:
                    b.packetLossPct != null ? Number(b.packetLossPct) : null,
                  color:
                    b.packetLossPct == null
                      ? STATUS_COLORS.UNKNOWN
                      : b.packetLossPct <= 5
                        ? STATUS_COLORS.PASS
                        : b.packetLossPct <= 20
                          ? STATUS_COLORS.WARNING
                          : STATUS_COLORS.FAIL,
                }))}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Verde ≤ 5% · ámbar 5–20% · rojo &gt; 20%.
              </p>
            </div>
          )}
          {noise.some((n) => n.currentScan != null) && (
            <div>
              <p className="mb-2 text-sm font-semibold">
                Ruido por frecuencia (dBm)
              </p>
              <VerticalBars
                items={noise.map((n) => ({
                  label:
                    n.frequency != null
                      ? `${Number(n.frequency).toFixed(0)} MHz`
                      : "?",
                  value: n.currentScan,
                  color: "#6366f1",
                }))}
                domain={[-130, -60]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Coherencia cruzada (casos)</CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.coherence.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin bloques para evaluar.</p>
          ) : (
            <div className="space-y-3">
              {analysis.coherence.map((coherence, index) => (
                <div key={index} className="border-b py-2 last:border-b-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {coherence.case === "—"
                        ? "Sin caso"
                        : `Caso ${coherence.case}`}{" "}
                      — {coherence.title}
                    </span>
                    <EvalStatusPill status={coherence.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {coherence.message}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <b>Recomendación:</b> {coherence.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {CATEGORY_ORDER.map((category) => {
        const rows = analysis.evaluations.filter(
          (evaluation) => evaluation.category === category
        );
        if (rows.length === 0) return null;
        return (
          <Card key={category} className="mb-4">
            <GroupHeader
              title={CATEGORY_LABELS[category] ?? category}
              count={rows.length}
              evaluations={rows}
            />
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-1 pr-2 font-medium">Métrica</th>
                      <th className="py-1 pr-2 font-medium">Valor</th>
                      <th className="py-1 pr-2 font-medium">Nivel</th>
                      <th className="py-1 font-medium">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((evaluation) => (
                      <tr
                        key={`${evaluation.metric}-${categoryKey(evaluation)}`}
                        className="border-b align-top"
                      >
                        <td className="py-1 pr-2 font-medium">
                          {METRIC_LABELS[evaluation.metric] ?? evaluation.metric}
                        </td>
                        <td className="py-1 pr-2 whitespace-nowrap">
                          {evaluation.value != null
                            ? `${evaluation.value} ${evaluation.unit ?? ""}`
                            : "—"}
                        </td>
                        <td className="py-1 pr-2">{evaluation.label ?? "—"}</td>
                        <td className="py-1">
                          <EvalStatusPill status={evaluation.status} />
                        </td>
                        <td className="py-1 text-xs text-muted-foreground">
                          {evaluation.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
};

const VerticalBars = ({
  items,
  domain,
  height = 180,
}: {
  items: Array<{ label: string; value: number | null; color: string }>;
  domain: [number, number];
  height?: number;
}) => {
  const usable = items.filter((item) => item.value != null);
  const span = Math.max(1, domain[1] - domain[0]);
  return (
    <div
      className="flex items-end gap-3 border-b border-border pb-1"
      style={{ height }}
    >
      {usable.map((item, index) => {
        const ratio = ((item.value as number) - domain[0]) / span;
        const barHeight = Math.max(6, Math.min(100, ratio * 100));
        return (
          <div
            key={index}
            className="flex h-full min-w-[52px] flex-1 flex-col items-center justify-end"
          >
            <span className="text-xs font-bold">
              {(item.value as number).toFixed(1)}
            </span>
            <div
              className="mt-1 w-full rounded-t"
              style={{
                height: `${barHeight}%`,
                backgroundColor: item.color,
              }}
            />
            <span className="mt-1 line-clamp-2 text-center text-[10px] text-muted-foreground">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const HorizontalLossChart = ({
  items,
}: {
  items: Array<{ label: string; pct: number | null; color: string }>;
}) => (
  <div className="space-y-2">
    {items.map((item, index) => {
      const width = Math.max(2, Math.min(100, item.pct ?? 0));
      return (
        <div key={index} className="grid grid-cols-[60px_1fr] items-center gap-2">
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-muted-foreground">{item.label}</span>
            <span className="text-sm font-bold">
              {item.pct != null ? `${item.pct.toFixed(1)}%` : "—"}
            </span>
          </div>
          <div className="h-4 overflow-hidden rounded bg-muted">
            <div
              className="h-full rounded"
              style={{ width: `${width}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      );
    })}
  </div>
);

export default LoraAuditAnalysisPage;
