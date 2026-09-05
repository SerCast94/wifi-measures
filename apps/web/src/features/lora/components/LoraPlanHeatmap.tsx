import { useMemo, type ReactNode } from "react";

import { projectToImageXY } from "@/features/floorplans/lib/geo-projection";
import { normalizeGeoCalibration } from "@/features/floorplans/types/floorplan.types";
import type { GeoCalibration } from "@/features/floorplans/types/floorplan.types";
import type { LoraMeasure, LoraNoise } from "../types/lora.types";

interface LoraPlanHeatmapProps {
  image: string;
  width: number;
  height: number;
  geoCalibration?: GeoCalibration | null;
  measures?: LoraMeasure[];
  noise?: LoraNoise[];
  radius?: number;
}

interface PlannedPoint {
  x: number;
  y: number;
  value: number;
}

interface MetricSet {
  points: PlannedPoint[];
  dropped: number;
}

const MIN_ALPHA = 0.04;
const MAX_ALPHA = 0.62;

const colorFor = (t: number, alpha: number): string => {
  const hue = Math.round(Math.max(0, Math.min(1, t)) * 120);
  return `hsla(${hue}, 90%, 50%, ${alpha})`;
};

const noiseRecordValue = (noise: LoraNoise): number | null => {
  const valores = (noise.entries ?? [])
    .map((e) => Number(e.currentScan))
    .filter((v) => Number.isFinite(v));
  if (valores.length === 0) return null;
  return Math.max(...valores);
};

interface MetricConfig {
  key: string;
  points: PlannedPoint[];
  dropped: number;
  label: string;
  unit: string;
  thresholds: Array<{ val: number; label: string }>;
}

export const LoraPlanHeatmap = ({
  image,
  width,
  height,
  geoCalibration,
  measures = [],
  noise = [],
  radius,
}: LoraPlanHeatmapProps) => {
  const geo = useMemo(
    () => normalizeGeoCalibration(geoCalibration),
    [geoCalibration]
  );

  const collect = (
    sources: Array<any>,
    pick: (item: any) => {
      lat: number | null | undefined;
      lon: number | null | undefined;
      value: number | null | undefined;
    }
  ): MetricSet => {
    const points: PlannedPoint[] = [];
    let dropped = 0;
    if (!geo) return { points, dropped };
    for (const item of sources) {
      const { lat, lon, value } = pick(item);
      if (lat == null || lon == null || value == null) {
        dropped++;
        continue;
      }
      const nLat = Number(lat);
      const nLon = Number(lon);
      const nVal = Number(value);
      if (!Number.isFinite(nLat) || !Number.isFinite(nLon) || !Number.isFinite(nVal)) {
        dropped++;
        continue;
      }
      const xy = projectToImageXY(nLat, nLon, geo);
      if (!xy) {
        dropped++;
        continue;
      }
      points.push({ x: xy.x, y: xy.y, value: nVal });
    }
    return { points, dropped };
  };

  const blocks = useMemo(() => measures.flatMap((m) => m.blocks), [measures]);

  const signal = useMemo(
    () =>
      collect(blocks, (b) => ({
        lat: b.latitude,
        lon: b.longitude,
        value: b.rssi,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blocks, geo]
  );

  const snr = useMemo(
    () =>
      collect(blocks, (b) => ({
        lat: b.latitude,
        lon: b.longitude,
        value: b.snr,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blocks, geo]
  );

  const noiseMetric = useMemo(
    () =>
      collect(noise, (n) => ({
        lat: n.latitude,
        lon: n.longitude,
        value: noiseRecordValue(n as LoraNoise),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [noise, geo]
  );

  const W = Math.max(200, Math.round(width));
  const H = Math.max(150, Math.round(height));
  const scale = Math.min(1, 900 / W);
  const W2 = Math.max(200, Math.round(W * scale));
  const H2 = Math.max(150, Math.round(H * scale));
  const ratio = W / H;

  const metrics = useMemo<MetricConfig[]>(() => {
    const list: MetricConfig[] = [];
    if (signal.points.length > 0) {
      list.push({
        key: "signal",
        points: signal.points,
        dropped: signal.dropped,
        label: "Nivel de señal RSSI",
        unit: "dBm",
        thresholds: [
          { val: -80, label: "−80" },
          { val: -72, label: "−72" },
          { val: -67, label: "−67" },
        ],
      });
    }
    if (snr.points.length > 0) {
      list.push({
        key: "snr",
        points: snr.points,
        dropped: snr.dropped,
        label: "SNR",
        unit: "dB",
        thresholds: [
          { val: 15, label: "15" },
          { val: 25, label: "25" },
          { val: 40, label: "40" },
        ],
      });
    }
    if (noiseMetric.points.length > 0) {
      list.push({
        key: "noise",
        points: noiseMetric.points,
        dropped: noiseMetric.dropped,
        label: "Nivel de ruido",
        unit: "dBm",
        thresholds: [
          { val: -80, label: "−80" },
          { val: -72, label: "−72" },
          { val: -67, label: "−67" },
        ],
      });
    }
    return list;
  }, [signal, snr, noiseMetric]);

  const renderLayer = (
    metricPoints: PlannedPoint[]
  ): ReactNode => {
    const values = metricPoints.map((p) => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (max === min) {
      min -= 1;
      max += 1;
    }
    const maxR = Math.max(W2, H2) * (radius && radius > 0 ? radius : 0.16);
    const cell = Math.max(6, Math.floor(Math.max(W2, H2) / 200));
    const rects: ReactNode[] = [];
    for (let gy = 0; gy < H2; gy += cell) {
      for (let gx = 0; gx < W2; gx += cell) {
        let ws = 0;
        let vs = 0;
        let md = Infinity;
        for (const p of metricPoints) {
          const px = (p.x / 100) * W2;
          const py = (p.y / 100) * H2;
          const dx = gx - px;
          const dy = gy - py;
          const d2 = dx * dx + dy * dy;
          const d = Math.sqrt(d2);
          if (d < md) md = d;
          const w = 1 / (d2 + 1);
          ws += w;
          vs += w * p.value;
        }
        const alpha =
          Math.max(0, Math.min(1, 1 - md / maxR)) * (MAX_ALPHA - MIN_ALPHA) +
          MIN_ALPHA;
        if (md > maxR && alpha <= MIN_ALPHA) continue;
        const t = Math.max(0, Math.min(1, (vs / ws - min) / (max - min)));
        rects.push(
          <rect
            key={`${gx}-${gy}`}
            x={gx}
            y={gy}
            width={cell}
            height={cell}
            fill={colorFor(t, alpha)}
          />
        );
      }
    }
    const fontPx = Math.max(14, Math.round(Math.max(W2, H2) / 90));
    const marks = metricPoints.map((p, index) => {
      const clamp = (v: number) => Math.max(0.5, Math.min(99.5, v));
      const x = (clamp(p.x) / 100) * W2;
      const y = (clamp(p.y) / 100) * H2;
      return (
        <g key={`mark-${index}`}>
          <circle
            cx={x}
            cy={y}
            r={7}
            fill="rgba(255,255,255,.9)"
            stroke="#111827"
            strokeWidth={2}
          />
          <text
            x={x + 10}
            y={y}
            fontSize={fontPx}
            fontWeight="bold"
            fill="#111827"
            dominantBaseline="central"
            paintOrder="stroke"
            stroke="rgba(255,255,255,.9)"
            strokeWidth={4}
          >
            {p.value.toFixed(0)}
          </text>
        </g>
      );
    });

    return (
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${W2} ${H2}`}
        preserveAspectRatio="none"
      >
        <g>{rects}</g>
        {marks}
      </svg>
    );
  };

  const renderLegend = (metric: MetricConfig): ReactNode => {
    const values = metric.points.map((p) => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (max === min) {
      min -= 1;
      max += 1;
    }
    let gradStops = "";
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const hue = Math.round(t * 120);
      gradStops += `hsl(${hue},90%,50%) ${(t * 100).toFixed(1)}%${i < 20 ? "," : ""}`;
    }
    const ticks = metric.thresholds.map((th, index) => {
      const pct = max === min ? 50 : ((th.val - min) / (max - min)) * 100;
      if (pct < 0 || pct > 100) return null;
      return (
        <span
          key={index}
          className="absolute text-[9px] font-semibold text-muted-foreground"
          style={{
            top: "100%",
            left: `${pct}%`,
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
          }}
        >
          {th.label}
        </span>
      );
    });

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold">{min.toFixed(0)}</span>
          <div className="relative mb-2 flex-1">
            <div
              className="h-3 w-full overflow-hidden rounded"
              style={{ background: `linear-gradient(90deg,${gradStops})` }}
            />
            {ticks}
          </div>
          <span className="text-[11px] font-semibold">{max.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <i className="inline-block h-2.5 w-2.5" style={{ background: "#dc2626" }} />
            Pobre
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-2.5 w-2.5" style={{ background: "#eab308" }} />
            Aceptable
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-2.5 w-2.5" style={{ background: "#16a34a" }} />
            Excelente
          </span>
        </div>
      </div>
    );
  };

  const showHeat = geo != null && metrics.length > 0;

  return (
    <div className="space-y-4">
      {showHeat ? (
        metrics.map((metric) => (
          <figure key={metric.key}>
            <div
              className="relative mx-auto w-full overflow-hidden rounded-lg border"
              style={{ aspectRatio: `${ratio}` }}
            >
              <img
                src={image}
                alt="Plano asociado"
                className="absolute inset-0 h-full w-full"
              />
              {renderLayer(metric.points)}
            </div>
            <figcaption className="mt-2 space-y-1">
              <p className="text-sm font-medium">
                {metric.label}{" "}
                <span className="text-muted-foreground">({metric.unit})</span>
              </p>
              {renderLegend(metric)}
            </figcaption>
          </figure>
        ))
      ) : (
        <img
          src={image}
          alt="Plano asociado"
          className="mx-auto max-h-[250px] rounded-lg border object-contain"
        />
      )}

      {showHeat && (
        <ul className="space-y-1">
          {metrics.map((metric) => (
            <li key={metric.key} className="text-xs text-muted-foreground">
              {metric.label}: {metric.points.length}{" "}
              {metric.points.length === 1 ? "punto" : "puntos"}
              {metric.dropped > 0
                ? ` · ${metric.dropped} ${metric.dropped === 1 ? "punto" : "puntos"} fuera del plano omitidos`
                : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};