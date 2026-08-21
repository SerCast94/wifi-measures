import { useMemo } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

import { Card, CardContent } from "@/core/atomic-components/card";
import type { MeasureModel } from "@/features/measures/models/measure.model";

interface GraficasTabProps {
  measure: MeasureModel;
}

const toNumber = (value: unknown): number | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "string" && (value.includes("--") || value.trim() === "")) {
    return null;
  }
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

interface MetricDef {
  name: string;
  value: number | null;
  color?: string;
  min: number;
  max: number;
  unit: string;
}

const buildMetrics = (raw: Record<string, unknown>): MetricDef[] => [
  {
    name: "Señal",
    value: toNumber(raw.linkSignalLevelMean),
    color: `${raw.linkSignalLevelMeanColor ?? ""}`,
    min: -90,
    max: -30,
    unit: "dBm",
  },
  {
    name: "SNR",
    value: toNumber(raw.linkSNRMean),
    color: `${raw.linkSNRMeanColor ?? ""}`,
    min: 0,
    max: 60,
    unit: "dB",
  },
  {
    name: "Ruido",
    value: toNumber(raw.linkNoiseLevelMean),
    min: -100,
    max: -60,
    unit: "dBm",
  },
  {
    name: "% vel. máx.",
    value: toNumber(raw.linkPhyPctOfMaxDataRateMean),
    color: `${raw.linkPhyPctOfMaxDataRateMeanColor ?? ""}`,
    min: 0,
    max: 100,
    unit: "%",
  },
  {
    name: "Reintentos",
    value: toNumber(raw.linkRetryRateMean),
    color: `${raw.linkRetryRateMeanColor ?? ""}`,
    min: 0,
    max: 100,
    unit: "%",
  },
];

const METRIC_BAR_COLORS: Record<string, string> = {
  red: "#ef4444",
  yellow: "#facc15",
  green: "#22c55e",
};

const GaugeBar = ({ metric }: { metric: MetricDef }) => {
  const { value, min, max, color, name, unit } = metric;
  if (value === null) return null;

  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const barColor =
    (color && METRIC_BAR_COLORS[color]) ??
    (color === "black" ? "#9ca3af" : "#3b82f6");

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          {name}{" "}
          <span className="text-[10px] opacity-70">({unit})</span>
        </p>
        <p className="text-sm font-semibold" style={{ color: barColor }}>
          {value}
        </p>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

interface ChannelPoint {
  channel: string | number;
  value: number;
}

/** Normaliza entradas tipo {channel|ch|x, util|value|y|count|aps}. */
const normalizeChannelArray = (input: unknown): ChannelPoint[] => {
  if (!Array.isArray(input)) return [];
  const points: ChannelPoint[] = [];
  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const channel =
      record.channel ?? record.ch ?? record.x ?? record.channelNumber;
    const rawValue =
      record.util ?? record.utilization ?? record.value ?? record.y ??
      record.count ?? record.aps ?? record.apsCount ?? record.devices;
    const value = toNumber(rawValue);
    if (channel === undefined || channel === null || value === null) continue;
    points.push({ channel: channel as string | number, value });
  }
  return points.sort(
    (a, b) => Number(a.channel) - Number(b.channel)
  );
};

const SessionCharts = ({ raw }: { raw: Record<string, unknown> }) => {
  const utilization = useMemo(
    () => normalizeChannelArray(raw.channelUtilArray),
    [raw]
  );
  const non80211Util = useMemo(
    () => normalizeChannelArray(raw.channelNon80211UtilArray),
    [raw]
  );
  const coChannel = useMemo(
    () => normalizeChannelArray(raw.coChannelInterference),
    [raw]
  );
  const adjacent = useMemo(
    () => normalizeChannelArray(raw.adjacentChannelInterference),
    [raw]
  );

  const hasUtilization = utilization.length > 0 || non80211Util.length > 0;
  const hasInterference = coChannel.length > 0 || adjacent.length > 0;

  if (!hasUtilization && !hasInterference) return null;

  const mergeByChannel = (
    primary: ChannelPoint[],
    secondary: ChannelPoint[],
    primaryName: string,
    secondaryName: string
  ) => {
    const channels = [
      ...new Set([
        ...primary.map((p) => String(p.channel)),
        ...secondary.map((p) => String(p.channel)),
      ]),
    ];
    return channels.map((channel) => ({
      channel,
      [primaryName]:
        primary.find((p) => String(p.channel) === channel)?.value ?? 0,
      [secondaryName]:
        secondary.find((p) => String(p.channel) === channel)?.value ?? 0,
    })) as Record<string, string | number>[];
  };

  return (
    <>
      {hasUtilization && (
        <Card>
          <CardContent className="mt-4">
            <p className="mb-3 text-sm font-semibold">
              Utilización de canales (%)
            </p>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mergeByChannel(
                    utilization,
                    non80211Util,
                    "Wi-Fi",
                    "No Wi-Fi"
                  )}
                  margin={{ top: 4, right: 8, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="channel" fontSize={12} tickLine={false} />
                  <YAxis fontSize={12} tickLine={false} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Wi-Fi" stackId="u" fill="#3b82f6" />
                  <Bar
                    dataKey="No Wi-Fi"
                    stackId="u"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {hasInterference && (
        <Card>
          <CardContent className="mt-4">
            <p className="mb-3 text-sm font-semibold">
              Interferencias por canal (APs detectados)
            </p>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mergeByChannel(
                    coChannel,
                    adjacent,
                    "Co-canal",
                    "Adyacente"
                  )}
                  margin={{ top: 4, right: 8, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="channel" fontSize={12} tickLine={false} />
                  <YAxis allowDecimals={false} fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Co-canal" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Adyacente" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export const GraficasTab = ({ measure }: GraficasTabProps) => {
  const raw = (measure.raw ?? {}) as Record<string, unknown>;

  const metrics = useMemo(() => buildMetrics(raw), [raw]);
  const availableMetrics = metrics.filter(
    (metric): metric is MetricDef & { value: number } => metric.value !== null
  );

  if (availableMetrics.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No hay datos de señal/SNR para esta medida.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comparativa general */}
      <Card>
        <CardContent className="mt-4">
          <p className="mb-3 text-sm font-semibold">Comparativa de métricas</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={availableMetrics.map((metric) => ({
                  name: metric.name,
                  value: metric.value,
                  color:
                    METRIC_BAR_COLORS[metric.color ?? ""] ?? undefined,
                }))}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={110} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {availableMetrics.map((metric) => (
                    <Cell
                      key={metric.name}
                      fill={
                        METRIC_BAR_COLORS[metric.color ?? ""] ?? "#3b82f6"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gauges por métrica */}
      <Card>
        <CardContent className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) =>
            metric.value !== null ? (
              <GaugeBar key={metric.name} metric={metric} />
            ) : null
          )}
        </CardContent>
      </Card>

      {/* Datos de sesión (si existen) */}
      <SessionCharts raw={raw} />
    </div>
  );
};
