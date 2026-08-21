import type { MeasureModel } from "../models/measure.model";

export interface HeatmapMetric {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
}

export interface HeatmapPoint {
  measureId: number;
  lat: number;
  lon: number;
  label: string;
  value: number | null;
}

type SignalValue = unknown;

const CHANNEL_KEYS = [
  "CHANNEL1",
  "CHANNEL2",
  "CHANNEL3",
  "CHANNEL4",
  "CHANNEL5",
  "CHANNEL6",
  "CHANNEL7",
  "CHANNEL8",
] as const;

const RAW_METRIC_FIELDS: Record<string, string> = {
  signal: "linkSignalLevelMean",
  snr: "linkSNRMean",
  noise: "linkNoiseLevelMean",
};

// Parsea un número formateado en es-ES (decimal con coma, miles con punto)
// o un número en crudo.
export const parseSignalNumber = (value: SignalValue): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text === "" || text === "--") return null;
  const normalized = text.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const CHANNEL_METRICS: HeatmapMetric[] = Array.from(
  { length: 8 },
  (_, i) => ({
    key: `C${i + 1}`,
    label: `Canal ${i + 1}`,
    unit: "dBµV",
    min: 30,
    max: 120,
  })
);

export const RAW_METRICS: HeatmapMetric[] = [
  { key: "signal", label: "Señal (NetAlly)", unit: "dBm", min: -100, max: -30 },
  { key: "snr", label: "SNR (NetAlly)", unit: "dB", min: 0, max: 40 },
  { key: "noise", label: "Ruido (NetAlly)", unit: "dBm", min: -110, max: -60 },
];

export const ALL_METRICS: HeatmapMetric[] = [
  ...CHANNEL_METRICS,
  ...RAW_METRICS,
];

const channelOf = (measure: MeasureModel, index: number) =>
  measure.channels[CHANNEL_KEYS[index]];

export const getMetricValue = (
  measure: MeasureModel,
  metricKey: string
): number | null => {
  if (metricKey.startsWith("C")) {
    const channelIndex = Number(metricKey.slice(1)) - 1;
    if (channelIndex < 0 || channelIndex >= 8) return null;
    return parseSignalNumber(channelOf(measure, channelIndex)?.nivel);
  }

  const field = RAW_METRIC_FIELDS[metricKey];
  if (!field) return null;
  const raw = measure.raw as Record<string, unknown> | null | undefined;
  if (!raw) return null;
  return parseSignalNumber(raw[field]);
};

export const getAvailableMetrics = (
  measures: MeasureModel[]
): HeatmapMetric[] => {
  return ALL_METRICS.filter((metric) =>
    measures.some((measure) => getMetricValue(measure, metric.key) !== null)
  );
};

export const normalizeValue = (
  value: number,
  metric: HeatmapMetric
): number => {
  const range = metric.max - metric.min;
  if (range <= 0) return 0;
  return Math.max(0, Math.min(1, (value - metric.min) / range));
};

export const buildHeatmapPoints = (
  measures: MeasureModel[],
  metric: HeatmapMetric
): { points: [number, number, number][]; values: HeatmapPoint[] } => {
  const values: HeatmapPoint[] = measures
    .filter(
      (measure) =>
        measure.latitude != null &&
        measure.longitude != null &&
        Number.isFinite(measure.latitude) &&
        Number.isFinite(measure.longitude)
    )
    .map((measure) => ({
      measureId: measure.id,
      lat: measure.latitude,
      lon: measure.longitude,
      label: `${measure.metadata["AREA_GEOGR"]} P${measure.metadata["PTO_MEDIDA"]}-M${measure.metadata["N_MEDIDA"]}`,
      value: getMetricValue(measure, metric.key),
    }));

  return {
    points: values
      .filter((point): point is HeatmapPoint & { value: number } => {
        return point.value !== null && Number.isFinite(point.value);
      })
      .map((point) => [point.lat, point.lon, normalizeValue(point.value, metric)]),
    values,
  };
};