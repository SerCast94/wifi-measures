import { useState } from "react";
import { useParams } from "react-router";
import { FlaskConicalIcon, RefreshCwIcon } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import { EmptyState } from "@/core/atomic-components/empty-state";
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
  type LoraCoherence,
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

const elementRank = (label: string | null | undefined): [number, number] => {
  const text = label ?? "";
  const measure = text.match(/^Medida (\d+)/);
  if (measure) return [0, Number(measure[1])];
  const noise = text.match(/^Ruido (\d+)/);
  if (noise) return [1, Number(noise[1])];
  return [2, 0];
};

const byElementThenCategory = (
  a: LoraEvaluationItem,
  b: LoraEvaluationItem
): number => {
  const [at, an] = elementRank(a.sourceLabel);
  const [bt, bn] = elementRank(b.sourceLabel);
  if (at !== bt) return at - bt;
  if (an !== bn) return an - bn;
  const ca = CATEGORY_ORDER.indexOf(a.category);
  const cb = CATEGORY_ORDER.indexOf(b.category);
  const cm = ca === -1 ? 99 : ca;
  const cn = cb === -1 ? 99 : cb;
  if (cm !== cn) return cm - cn;
  return (a.metric ?? "").localeCompare(b.metric ?? "");
};

type BucketRange = { label: string; min: number; max: number; color: string };

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

const bucketize = (
  values: Array<number | null>,
  ranges: BucketRange[]
): Array<{ label: string; count: number; color: string }> =>
  ranges
    .map((range) => ({
      label: range.label,
      color: range.color,
      count: values.filter(
        (value) =>
          value != null && value >= range.min && value < range.max
      ).length,
    }))
    .filter((bucket) => bucket.count > 0);

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

const statusCounts = (
  evaluations: Array<{ status: LoraEvalStatus }>
): Record<LoraEvalStatus, number> => {
  const counts: Record<LoraEvalStatus, number> = {
    PASS: 0,
    WARNING: 0,
    FAIL: 0,
    UNKNOWN: 0,
  };
  for (const evaluation of evaluations) counts[evaluation.status] += 1;
  return counts;
};

const aggregateCoherence = (coherence: LoraCoherence[]) => {
  const map = new Map<string, { case: string; title: string }>();
  for (const item of coherence) {
    const key = item.case === "—" ? "—" : `Caso ${item.case}`;
    map.set(key, { case: key, title: item.title });
  }
  return Array.from(map.values()).map(({ case: caseLabel, title }) => ({
    caseLabel,
    title,
    total: coherence.filter((item) =>
      item.case === "—"
        ? caseLabel === "—"
        : caseLabel === `Caso ${item.case}`
    ).length,
    byStatus: statusCounts(
      coherence.filter((item) =>
        item.case === "—"
          ? caseLabel === "—"
          : caseLabel === `Caso ${item.case}`
      )
    ),
  }));
};

const CategoryBadRows = ({
  rows,
  category,
}: {
  rows: LoraEvaluationItem[];
  category: string;
}) => {
  const bad = rows.filter(
    (row) => row.status === "FAIL" || row.label === "CRÍTICA"
  );
  const unknown = rows.filter((row) => row.status === "UNKNOWN");
  if (bad.length === 0 && unknown.length === 0) return null;
  const items = [...bad, ...unknown].slice(0, 3);
  return (
    <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
      {items.map((item, index) => (
        <li key={index} className="mb-0.5">
          {category === "RUIDO"
            ? item.message
            : `${item.label ?? "Sin dato"}: ${item.value != null ? `${item.value} ${item.unit ?? ""}` : "—"} — ${item.message}`}
        </li>
      ))}
      {bad.length + unknown.length > 3 && (
        <li>…y {bad.length + unknown.length - 3} más (usa los filtros de abajo).</li>
      )}
    </ul>
  );
};

const FilterChip = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-background text-muted-foreground hover:bg-muted"
    }`}
  >
    {label}
  </button>
);

const PointDetailSection = ({
  title,
  meta,
  rows,
}: {
  title: string;
  meta?: string;
  rows: LoraEvaluationItem[];
}) => (
  <details className="group border-b last:border-b-0">
    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 py-2">
      <span className="text-sm font-semibold">{title}</span>
      <span className="flex items-center gap-1">
        {(["PASS", "WARNING", "FAIL", "UNKNOWN"] as const).map((status) => {
          const count = rows.filter((row) => row.status === status).length;
          if (count === 0) return null;
          return (
            <span
              key={status}
              className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
              style={{
                color: STATUS_COLORS[status],
                backgroundColor: `${STATUS_COLORS[status]}1a`,
              }}
            >
              {count}
            </span>
          );
        })}
      </span>
    </summary>
    {meta ? (
      <p className="mb-2 text-xs text-muted-foreground">{meta}</p>
    ) : null}
    <div className="overflow-x-auto pb-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="py-1 pr-2 font-medium">Categoría</th>
            <th className="py-1 pr-2 font-medium">Métrica</th>
            <th className="py-1 pr-2 font-medium">Valor</th>
            <th className="py-1 pr-2 font-medium">Nivel</th>
            <th className="py-1 pr-2 font-medium">Resultado</th>
            <th className="py-1 font-medium">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((evaluation) => (
            <tr
              key={`${evaluation.metric}-${categoryKey(evaluation)}`}
              className="border-b align-top last:border-b-0"
            >
              <td className="py-1 pr-2">
                {CATEGORY_LABELS[evaluation.category] ?? evaluation.category}
              </td>
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
  </details>
);

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
          <CardContent className="p-0">
            <EmptyState
              icon={FlaskConicalIcon}
              title="Análisis pendiente"
              description="Todavía no se ha ejecutado el análisis de este enlace. Pulsa «Ejecutar análisis» para evaluar la medida y el ruido seleccionados."
            />
          </CardContent>
        </Card>
      ) : (
        <LoraAnalysisContent
          analysis={analysis}
          blocks={blocks}
          noise={noise}
          measures={audit.measures}
          noiseRecords={audit.noise}
        />
      )}
    </div>
  );
};

const LoraAnalysisContent = ({
  analysis,
  blocks,
  noise,
  measures = [],
  noiseRecords = [],
}: {
  analysis: LoraAnalysis;
  blocks: Array<{ role: string | null; rssi: number | null; snr: number | null; packetLossPct: number | null; totalPackets: number | null }>;
  noise: Array<{ frequency: number | null; currentScan: number | null; weightedAverageScan: number | null }>;
  measures?: Array<{
    location?: string | null;
    time?: string | null;
    spreadingFactor?: string | null;
    txPower?: string | null;
  }>;
  noiseRecords?: Array<{ location?: string | null }>;
}) => {
  const summary = analysis.summary;

  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterSource, setFilterSource] = useState<string>("");

  const noiseLevels = noise
    .map((n) => n.currentScan)
    .filter((value): value is number => value != null);
  const noiseFloor = noiseLevels.length > 0 ? Math.max(...noiseLevels) : null;
  const marginValues = blocks.map((b) =>
    b.rssi != null && noiseFloor != null ? b.rssi - noiseFloor : null
  );

  const rssiBuckets = bucketize(blocks.map((b) => b.rssi), RSSI_RANGES);
  const snrBuckets = bucketize(blocks.map((b) => b.snr), SNR_RANGES);
  const marginBuckets = bucketize(marginValues, MARGIN_RANGES);
  const lossBuckets = bucketize(blocks.map((b) => b.packetLossPct), LOSS_RANGES);
  const noiseBuckets = bucketize(noise.map((n) => n.currentScan), NOISE_RANGES);

  const categories = CATEGORY_ORDER.filter((category) =>
    analysis.evaluations.some((evaluation) => evaluation.category === category)
  );

  const sources = Array.from(
    new Set(
      analysis.evaluations
        .map((evaluation) => evaluation.sourceLabel)
        .filter((source): source is string => Boolean(source))
    )
  ).sort((a, b) => {
    const [at, an] = elementRank(a);
    const [bt, bn] = elementRank(b);
    return at !== bt ? at - bt : an - bn;
  });

  const sortedRows = [...analysis.evaluations].sort(byElementThenCategory);

  const filteredRows = sortedRows.filter(
    (evaluation) =>
      (!filterCategory || evaluation.category === filterCategory) &&
      (!filterStatus || evaluation.status === filterStatus) &&
      (!filterSource || evaluation.sourceLabel === filterSource)
  );

  const coherenceByCase = aggregateCoherence(analysis.coherence);

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
          <CardTitle className="text-base">Resumen por categoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => {
            const rows = analysis.evaluations.filter(
              (evaluation) => evaluation.category === category
            );
            const states = statusCounts(rows);
            const total = rows.length;
            return (
              <div key={category} className="border-b pb-3 last:border-b-0">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    {CATEGORY_LABELS[category] ?? category}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {total} {category === "RUIDO" ? "bandas" : "bloques"}
                    </span>
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    {(["PASS", "WARNING", "FAIL", "UNKNOWN"] as const).map(
                      (status) => (
                        <span
                          key={status}
                          className="flex items-center gap-1"
                          style={{ color: STATUS_COLORS[status] }}
                        >
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[status] }}
                          />
                          {states[status]}
                        </span>
                      )
                    )}
                  </div>
                </div>
                <div className="mb-1 flex h-2.5 w-full overflow-hidden rounded bg-muted">
                  {(["PASS", "WARNING", "FAIL", "UNKNOWN"] as const).map(
                    (status) =>
                      states[status] > 0 ? (
                        <div
                          key={status}
                          style={{
                            width: `${(states[status] / total) * 100}%`,
                            backgroundColor: STATUS_COLORS[status],
                          }}
                        />
                      ) : null
                  )}
                </div>
                <CategoryBadRows rows={rows} category={category} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Gráficas del análisis</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {rssiBuckets.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-semibold">Distribución RSSI (dBm)</p>
              <HistogramBars buckets={rssiBuckets} />
              <p className="mt-1 text-xs text-muted-foreground">
                {blocks.length} bloques · agregados por umbral. Verde ≥ −70 ·
                ámbar −85…−70 · rojo &lt; −85 dBm.
              </p>
            </div>
          )}
          {snrBuckets.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-semibold">Distribución SNR (dB)</p>
              <HistogramBars buckets={snrBuckets} />
              <p className="mt-1 text-xs text-muted-foreground">
                {blocks.length} bloques · agregados por umbral. Verde ≥ 10 ·
                ámbar −5…10 · rojo &lt; −5 dB.
              </p>
            </div>
          )}
          {marginBuckets.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-semibold">
                Distribución del margen radio (dB)
              </p>
              <HistogramBars buckets={marginBuckets} />
              <p className="mt-1 text-xs text-muted-foreground">
                {blocks.length} bloques · margen = RSSI − piso de ruido. Verde ≥
                10 · ámbar 0…10 · rojo &lt; 0 dB.
              </p>
            </div>
          )}
          {lossBuckets.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-semibold">
                Distribución de pérdida de paquetes
              </p>
              <BucketRows buckets={lossBuckets} />
              <p className="mt-1 text-xs text-muted-foreground">
                {blocks.length} bloques · verde ≤ 5% · ámbar 5–20% · rojo &gt;
                20%.
              </p>
            </div>
          )}
          {noiseBuckets.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-semibold">
                Distribución de ruido (dBm)
              </p>
              <HistogramBars buckets={noiseBuckets} />
              <p className="mt-1 text-xs text-muted-foreground">
                {noise.length} frecuencias del scan actual · agregadas por
                umbral.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-1">
          <CardTitle className="text-base">
            Coherencia cruzada (resumen por caso)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {coherenceByCase.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin bloques para evaluar.
            </p>
          ) : (
            coherenceByCase.map(({ caseLabel, title, total, byStatus }) => (
              <div key={caseLabel} className="border-b pb-3 last:border-b-0">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {caseLabel} — {title}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {total} bloque{total === 1 ? "" : "s"}
                    </span>
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    {(["PASS", "WARNING", "FAIL", "UNKNOWN"] as const).map(
                      (status) =>
                        byStatus[status] > 0 ? (
                          <span
                            key={status}
                            className="flex items-center gap-1"
                            style={{ color: STATUS_COLORS[status] }}
                          >
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: STATUS_COLORS[status] }}
                            />
                            {byStatus[status]}
                          </span>
                        ) : null
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {analysis.coherence.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-semibold text-primary">
                Ver detalle de los casos
              </summary>
              <div className="mt-3 space-y-3">
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
            </details>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-1">
          <CardTitle className="text-base">
            Detalle del análisis
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {filteredRows.length} de {analysis.evaluations.length} condiciones
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <FilterChip
              active={!filterCategory}
              onClick={() => setFilterCategory("")}
              label="Todas las categorías"
            />
            {categories.map((category) => (
              <FilterChip
                key={category}
                active={filterCategory === category}
                onClick={() =>
                  setFilterCategory(
                    filterCategory === category ? "" : category
                  )
                }
                label={CATEGORY_LABELS[category] ?? category}
              />
            ))}
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <FilterChip
              active={!filterStatus}
              onClick={() => setFilterStatus("")}
              label="Todos los estados"
            />
            {(["PASS", "WARNING", "FAIL", "UNKNOWN"] as const).map((status) => (
              <FilterChip
                key={status}
                active={filterStatus === status}
                onClick={() =>
                  setFilterStatus(filterStatus === status ? "" : status)
                }
                label={LORA_EVAL_STATUS_LABELS[status]}
              />
            ))}
          </div>
          {sources.length > 1 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Filtrar por punto:
              </span>
              <select
                value={filterSource}
                onChange={(event) => setFilterSource(event.target.value)}
                className="h-8 rounded border border-input bg-background px-2 text-sm"
              >
                <option value="">Todos los puntos</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          )}
          {filteredRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay condiciones con el filtro seleccionado.
            </p>
          ) : (
            <div>
              {sources.map((source) => {
                const rows = filteredRows.filter(
                  (evaluation) => evaluation.sourceLabel === source
                );
                if (rows.length === 0) return null;
                const measureMatch = source.match(/^Medida (\d+)$/);
                const measureIndex = measureMatch
                  ? Number(measureMatch[1]) - 1
                  : -1;
                const measure = measureMatch ? measures[measureIndex] : undefined;
                const meta = measure
                  ? [
                      measure.time ? `Fecha/hora: ${measure.time}` : "",
                      measure.spreadingFactor
                        ? `SF: ${measure.spreadingFactor}`
                        : "",
                      measure.txPower ? `TX: ${measure.txPower}` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "";
                const noiseMatch = source.match(/^Ruido (\d+)$/);
                const noiseIndex = noiseMatch ? Number(noiseMatch[1]) - 1 : -1;
                const noiseRecord = noiseMatch
                  ? noiseRecords[noiseIndex]
                  : undefined;
                const subtitle = measure?.location ?? noiseRecord?.location ?? "";
                return (
                  <PointDetailSection
                    key={source}
                    title={`${source}${subtitle ? ` · ${subtitle}` : ""}`}
                    meta={meta}
                    rows={rows}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

const HistogramBars = ({
  buckets,
  height = 170,
}: {
  buckets: Array<{ label: string; count: number; color: string }>;
  height?: number;
}) => {
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1);
  return (
    <div
      className="flex items-end gap-2 border-b border-border pb-1"
      style={{ height }}
    >
      {buckets.map((bucket, index) => {
        const barHeight = (bucket.count / max) * 100;
        return (
          <div
            key={index}
            className="flex h-full min-w-[44px] flex-1 flex-col items-center justify-end"
          >
            <span className="text-xs font-bold">{bucket.count}</span>
            <div
              className="mt-1 w-full rounded-t"
              style={{
                height: `${Math.max(4, barHeight)}%`,
                backgroundColor: bucket.color,
              }}
            />
            <span className="mt-1 text-center text-[10px] leading-tight text-muted-foreground">
              {bucket.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const BucketRows = ({
  buckets,
}: {
  buckets: Array<{ label: string; count: number; color: string }>;
}) => {
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1);
  return (
    <div className="space-y-2">
      {buckets.map((bucket, index) => (
        <div
          key={index}
          className="grid grid-cols-[72px_1fr_28px] items-center gap-2"
        >
          <span className="text-[11px] text-muted-foreground">
            {bucket.label}
          </span>
          <div className="h-4 overflow-hidden rounded bg-muted">
            <div
              className="h-full rounded"
              style={{
                width: `${(bucket.count / max) * 100}%`,
                backgroundColor: bucket.color,
              }}
            />
          </div>
          <span className="text-right text-sm font-bold">{bucket.count}</span>
        </div>
      ))}
    </div>
  );
};

export default LoraAuditAnalysisPage;
