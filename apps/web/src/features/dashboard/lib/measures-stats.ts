import type { MeasureModel } from "@/features/measures/models/measure.model";

export interface MonthBucket {
  key: string;
  label: string;
  red: number;
  yellow: number;
  green: number;
  black: number;
}

export interface HistogramBucket {
  label: string;
  count: number;
}

const MONTH_LABELS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const getRaw = (measure: MeasureModel): Record<string, unknown> =>
  (measure.raw ?? {}) as Record<string, unknown>;

const toNumber = (value: unknown): number | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  if (typeof value === "string" && value.includes("--")) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

/** Resultados por mes (últimos `months` meses), apilados por color. */
export const getResultsByMonth = (
  measures: MeasureModel[],
  months = 6
): MonthBucket[] => {
  const buckets: MonthBucket[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: `${MONTH_LABELS[date.getMonth()]} ${`${date.getFullYear()}`.slice(2)}`,
      red: 0,
      yellow: 0,
      green: 0,
      black: 0,
    });
  }

  const index = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const measure of measures) {
    const date = measure.datetime;
    const bucket = index.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (!bucket) continue;
    const color = `${getRaw(measure).overallColor ?? ""}`;
    if (color === "red" || color === "yellow" || color === "green" || color === "black") {
      bucket[color] += 1;
    } else {
      bucket.black += 1;
    }
  }

  return buckets;
};

/** Histograma genérico por rangos. */
const buildHistogram = (
  measures: MeasureModel[],
  pick: (raw: Record<string, unknown>) => number | null,
  ranges: { label: string; min?: number; max?: number }[]
): HistogramBucket[] => {
  const buckets = ranges.map((range) => ({ label: range.label, count: 0 }));
  let outOfRange = 0;

  for (const measure of measures) {
    const value = pick(getRaw(measure));
    if (value === null) continue;
    const bucketIndex = ranges.findIndex(
      (range) =>
        (range.min === undefined || value >= range.min) &&
        (range.max === undefined || value < range.max)
    );
    if (bucketIndex === -1) {
      outOfRange += 1;
      continue;
    }
    buckets[bucketIndex].count += 1;
  }

  if (outOfRange > 0 && buckets.length > 0) {
    buckets[buckets.length - 1].count += outOfRange;
  }

  return buckets;
};

/** Distribución de nivel de señal medio (dBm). */
export const getSignalHistogram = (
  measures: MeasureModel[]
): HistogramBucket[] =>
  buildHistogram(
    measures,
    (raw) => toNumber(raw.linkSignalLevelMean),
    [
      { label: "< -80", max: -80 },
      { label: "-80/-70", min: -80, max: -70 },
      { label: "-70/-60", min: -70, max: -60 },
      { label: "-60/-50", min: -60, max: -50 },
      { label: "-50/-40", min: -50, max: -40 },
      { label: "≥ -40", min: -40 },
    ]
  );

/** Distribución de SNR medio (dB). */
export const getSnrHistogram = (measures: MeasureModel[]): HistogramBucket[] =>
  buildHistogram(
    measures,
    (raw) => toNumber(raw.linkSNRMean),
    [
      { label: "< 10", max: 10 },
      { label: "10-20", min: 10, max: 20 },
      { label: "20-30", min: 20, max: 30 },
      { label: "30-40", min: 30, max: 40 },
      { label: "≥ 40", min: 40 },
    ]
  );

/** Top motivos de fallo más frecuentes. */
export const getTopFailureReasons = (
  measures: MeasureModel[],
  limit = 6
): { reason: string; count: number }[] => {
  const counts = new Map<string, number>();
  for (const measure of measures) {
    const raw = getRaw(measure);
    const failures = [
      ...((raw.linkFailureReasons ?? []) as unknown[]),
      ...((raw.failureReasons ?? []) as unknown[]),
    ];
    for (const failure of failures) {
      const reason = String(failure).trim();
      if (!reason) continue;
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};
