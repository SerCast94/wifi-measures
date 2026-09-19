import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { projectToImageXY, projectToLatLon } from "@/features/floorplans/lib/geo-projection";
import { normalizeGeoCalibration } from "@/features/floorplans/types/floorplan.types";
import type { GeoCalibration } from "@/features/floorplans/types/floorplan.types";
import { cn } from "@/core/lib/utils";
import {
  LORA_LEVEL_COLOR,
  LORA_LEVEL_LABEL,
  NOISE_SCALE,
  RSSI_LEVEL_BUCKETS,
  SIGNAL_SCALE,
  SNR_LEVEL_BUCKETS,
  SNR_SCALE,
  noiseGradientColor,
  isNoCoverageSample,
  rssiLevel,
  snrLevel,
  type LoraBucket,
  type LoraQualityLevel,
} from "../lib/lora-baremo";
import type { LoraMeasure, LoraNoise } from "../types/lora.types";

interface LoraPlanHeatmapProps {
  image: string;
  width: number;
  height: number;
  geoCalibration?: GeoCalibration | null;
  measures?: LoraMeasure[];
  noise?: LoraNoise[];
  radius?: number;
  antenna?: { lat: number; lon: number } | null;
  editable?: boolean;
  onMoveMeasure?: (measureId: number, lat: number, lon: number) => void;
  onMoveNoise?: (noiseId: number, lat: number, lon: number) => void;
  onMoveAntenna?: (lat: number, lon: number) => void;
}

type MetricKey = "signal" | "snr" | "noise";

const ANTENNA_DRAG_ID = "antenna";

interface SamplePt {
  x: number;
  y: number;
  value: number | null;
  measureId: number;
  level: LoraQualityLevel;
}

interface NoisePt {
  x: number;
  y: number;
  value: number;
  noiseId: number;
}

interface DragState {
  kind: "measure" | "noise" | "antenna";
  id: number | string;
  x: number;
  y: number;
}

const MIN_ALPHA = 0.14;
const MAX_ALPHA = 0.9;

const noiseRecordValue = (noise: LoraNoise): number | null => {
  const valores = (noise.entries ?? [])
    .map((e) => e.currentScan)
    .filter((v) => v != null && Number.isFinite(Number(v)))
    .map((v) => Number(v));
  if (valores.length === 0) return null;
  return Math.max(...valores);
};

const clampPct = (v: number) => Math.max(0, Math.min(100, v));

export const LoraPlanHeatmap = ({
  image,
  width,
  height,
  geoCalibration,
  measures = [],
  noise = [],
  radius,
  antenna,
  editable = false,
  onMoveMeasure,
  onMoveNoise,
  onMoveAntenna,
}: LoraPlanHeatmapProps) => {
  const geo = useMemo(
    () => normalizeGeoCalibration(geoCalibration),
    [geoCalibration]
  );

  const [active, setActive] = useState<MetricKey>("signal");
  const [drag, setDrag] = useState<DragState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const W = Math.max(200, Math.round(width));
  const H = Math.max(150, Math.round(height));
  const scale = Math.min(1, 900 / W);
  const viewW = Math.max(200, Math.round(W * scale));
  const viewH = Math.max(150, Math.round(H * scale));
  const ratio = W / H;
  const maxR =
    Math.max(viewW, viewH) * (radius && radius > 0 ? radius : 0.16);
  const cell = Math.max(6, Math.floor(Math.max(viewW, viewH) / 200));
  const fontPx = Math.max(14, Math.round(Math.max(viewW, viewH) / 90));

  const samples = useMemo(
    () => measures.flatMap((m) => m.samples),
    [measures]
  );

  const samplePtsByMetric = (
    samples: LoraMeasure["samples"],
    key: "rssi" | "snr"
  ): SamplePt[] => {
    if (!geo) return [];
    const pts: SamplePt[] = [];
    for (const sample of samples) {
      if (sample.latitude == null || sample.longitude == null) continue;
      const xy = projectToImageXY(
        Number(sample.latitude),
        Number(sample.longitude),
        geo
      );
      if (!xy) continue;
      const raw = sample[key];
      const valued =
        raw != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
      const noCov = isNoCoverageSample({
        rssi: sample.rssi,
        snr: sample.snr,
        signal: sample.signal,
        packetLossPct: sample.packetLossPct,
      });
      pts.push({
        x: xy.x,
        y: xy.y,
        value: valued,
        measureId: sample.measureId,
        level: noCov
          ? "SIN_COBERTURA"
          : valued
            ? key === "rssi"
              ? rssiLevel(valued)
              : snrLevel(valued)
            : "SIN_COBERTURA",
      });
    }
    return pts;
  };

  const signalPts = useMemo(
    () => samplePtsByMetric(samples, "rssi"),
    [samples, geo] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const snrPts = useMemo(
    () => samplePtsByMetric(samples, "snr"),
    [samples, geo] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const noisePts = useMemo<NoisePt[]>(() => {
    if (!geo) return [];
    const pts: NoisePt[] = [];
    for (const n of noise) {
      if (n.latitude == null || n.longitude == null) continue;
      const xy = projectToImageXY(
        Number(n.latitude),
        Number(n.longitude),
        geo
      );
      if (!xy) continue;
      const value = noiseRecordValue(n);
      if (value == null) continue;
      pts.push({ x: xy.x, y: xy.y, value, noiseId: n.id });
    }
    return pts;
  }, [noise, geo]);

  const antennaPt = useMemo(() => {
    if (!geo || !antenna) return null;
    const lat = Number(antenna.lat);
    const lon = Number(antenna.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return projectToImageXY(lat, lon, geo);
  }, [geo, antenna]);

  const metrics = (
    [
      { key: "signal", label: "Nivel de señal RSSI", unit: "dBm", min: SIGNAL_SCALE.min, max: SIGNAL_SCALE.max },
      { key: "snr", label: "SNR", unit: "dB", min: SNR_SCALE.min, max: SNR_SCALE.max },
      { key: "noise", label: "Nivel de ruido", unit: "dBm", min: NOISE_SCALE.min, max: NOISE_SCALE.max },
    ] as const
  ).filter((metric) => {
    if (metric.key === "signal") return signalPts.length > 0;
    if (metric.key === "snr") return snrPts.length > 0;
    return noisePts.length > 0;
  }) satisfies ReadonlyArray<{
    key: MetricKey;
    label: string;
    unit: string;
    min: number;
    max: number;
  }>;

  useEffect(() => {
    if (metrics.length === 0) return;
    setActive((prev) =>
      metrics.some((m) => m.key === prev) ? prev : metrics[0].key
    );
  }, [metrics.length, metrics, active]);

  const current = metrics.find((m) => m.key === active) ?? metrics[0];

  const toView = (x: number, y: number) => ({
    x: (clampPct(x) / 100) * viewW,
    y: (clampPct(y) / 100) * viewH,
  });

  const colorOf = (pt: SamplePt | NoisePt): string => {
    if ("measureId" in pt) {
      if (pt.level === "SIN_COBERTURA") return LORA_LEVEL_COLOR.SIN_COBERTURA;
      return LORA_LEVEL_COLOR[pt.level];
    }
    return noiseGradientColor(pt.value);
  };

  const renderLayer = (): ReactNode => {
    const isNoise = active === "noise";
    const points = isNoise
      ? (noisePts as NoisePt[])
      : (active === "signal" ? signalPts : snrPts) as SamplePt[];
    const valued = points.filter((p) => p.value != null);
    const rects: ReactNode[] = [];
    if (valued.length > 0) {
      for (let gy = 0; gy < viewH; gy += cell) {
        for (let gx = 0; gx < viewW; gx += cell) {
          let md = Infinity;
          let best: SamplePt | NoisePt | null = null;
          for (const p of valued) {
            const v = toView(p.x, p.y);
            const dx = gx - v.x;
            const dy = gy - v.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < md) {
              md = d;
              best = p;
            }
          }
          if (!best || md > maxR) continue;
          const alpha =
            Math.max(0, Math.min(1, 1 - md / maxR)) * (MAX_ALPHA - MIN_ALPHA) +
            MIN_ALPHA;
          rects.push(
            <rect
              key={`${gx}-${gy}`}
              x={gx}
              y={gy}
              width={cell}
              height={cell}
              fill={colorOf(best)}
              opacity={alpha}
            />
          );
        }
      }
    }

    const marks = points.map((p, index) => {
      const dragged =
        drag != null &&
        (("measureId" in p && drag.kind === "measure" && drag.id === p.measureId) ||
          ("noiseId" in p && drag.kind === "noise" && drag.id === p.noiseId));
      const v = toView(dragged && drag ? drag.x : p.x, dragged && drag ? drag.y : p.y);
      const x = Math.max(0.5, Math.min(viewW - 0.5, v.x));
      const y = Math.max(0.5, Math.min(viewH - 0.5, v.y));
      const noSignal = (p: SamplePt | NoisePt): boolean =>
        !isNoise && ("measureId" in p ? p.level === "SIN_COBERTURA" : p.value == null);
      const markerClass = editable && !isNoise ? "cursor-grab" : "";
      if (isNoise) {
        const np = p as NoisePt;
        return (
          <g
            key={`mark-${index}`}
            className={markerClass}
            style={{ cursor: editable ? "grab" : undefined }}
            onPointerDown={editable ? (e) => startDrag(e, "noise", np.noiseId) : undefined}
          >
            <circle
              cx={x}
              cy={y}
              r={7}
              fill={noiseGradientColor(np.value)}
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
              {np.value.toFixed(0)}
            </text>
          </g>
        );
      }
      const sample = p as SamplePt;
      if (noSignal(p)) {
        return (
          <g
            key={`mark-${index}`}
            className={markerClass}
            style={{ cursor: editable ? "grab" : undefined }}
            onPointerDown={editable ? (e) => startDrag(e, "measure", sample.measureId) : undefined}
          >
            <circle
              cx={x}
              cy={y}
              r={8}
              fill={LORA_LEVEL_COLOR.SIN_COBERTURA}
              stroke="#fff"
              strokeWidth={2}
            />
            <path
              d={`M ${x - 4.5} ${y - 4.5} L ${x + 4.5} ${y + 4.5} M ${x + 4.5} ${y - 4.5} L ${x - 4.5} ${y + 4.5}`}
              stroke="#fff"
              strokeWidth={2.2}
            />
          </g>
        );
      }
      return (
        <g
          key={`mark-${index}`}
          className={markerClass}
          style={{ cursor: editable ? "grab" : undefined }}
          onPointerDown={editable ? (e) => startDrag(e, "measure", sample.measureId) : undefined}
        >
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
            {sample.value == null ? "×" : sample.value.toFixed(0)}
          </text>
        </g>
      );
    });

    const renderAntenna = (): ReactNode => {
      if (!editable && !antennaPt) return null;
      const dragged = drag != null && drag.kind === "antenna";
      const source =
        (dragged && drag) || antennaPt || (editable ? { x: 50, y: 50 } : null);
      if (!source) return null;
      const v = toView(source.x, source.y);
      const x = Math.max(0.5, Math.min(viewW - 0.5, v.x));
      const y = Math.max(0.5, Math.min(viewH - 0.5, v.y));
      const ghost = !antennaPt && !dragged;
      return (
        <g
          className={editable ? "cursor-grab" : undefined}
          style={{
            cursor: editable ? "grab" : undefined,
            opacity: ghost ? 0.6 : 1,
          }}
          onPointerDown={
            editable
              ? (e) => startDrag(e, "antenna", ANTENNA_DRAG_ID)
              : undefined
          }
        >
          <circle
            cx={x}
            cy={y}
            r={12}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={2}
            strokeDasharray="3 3"
          />
          <circle cx={x} cy={y} r={11} fill="rgba(255,255,255,0.55)" stroke="none" />
          <path
            d={`M ${x - 5} ${y + 12.5} L ${x} ${y + 8} M ${x + 5} ${y + 12.5} L ${x} ${y + 8}`}
            stroke="#0f172a"
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
          />
          <rect
            x={x - 1.3}
            y={y + 1.5}
            width={2.6}
            height={11}
            rx={1.3}
            fill="#0f172a"
          />
          <rect
            x={x - 4.2}
            y={y - 8.5}
            width={8.4}
            height={12}
            rx={2}
            fill="#0f172a"
          />
          <circle cx={x} cy={y - 2.2} r={1.9} fill="#22c55e" />
          <path
            d={`M ${x + 5.2} ${y - 4} a 4 4 0 0 1 0 8`}
            stroke="#334155"
            strokeWidth={1.7}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M ${x + 7.4} ${y - 6.5} a 6.5 6.5 0 0 1 0 13`}
            stroke="#64748b"
            strokeWidth={1.7}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    };

    return (
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="none"
      >
        <g>{rects}</g>
        {marks}
        {renderAntenna()}
      </svg>
    );
  };

  const startDrag = (
    event: React.PointerEvent,
    kind: DragState["kind"],
    id: number | string
  ) => {
    if (!geo) return;
    event.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setDrag({ kind, id, x: clampPct(x), y: clampPct(y) });
    containerRef.current?.setPointerCapture?.(event.pointerId);
  };

  const updateDrag = (event: React.PointerEvent) => {
    if (!drag) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setDrag((prev) =>
      prev ? { ...prev, x: clampPct(x), y: clampPct(y) } : prev
    );
  };

  const endDrag = () => {
    if (!drag || !geo) {
      setDrag(null);
      return;
    }
    const pos = projectToLatLon(drag.x, drag.y, geo);
    if (pos) {
      if (drag.kind === "measure") onMoveMeasure?.(drag.id as number, pos.lat, pos.lon);
      else if (drag.kind === "noise") onMoveNoise?.(drag.id as number, pos.lat, pos.lon);
      else onMoveAntenna?.(pos.lat, pos.lon);
    }
    setDrag(null);
  };

  const legendBar = (
    buckets: LoraBucket[],
    min: number,
    max: number,
    ticks: number[],
    title: string,
    unit: string,
    cobertura: boolean
  ): ReactNode => {
    const span = (v: number) =>
      clampPct(((v - min) / (max - min)) * 100);
    const segs = buckets.map((b, index) => {
      const lo = span(b.min === -Infinity ? min : b.min);
      const hi = span(b.max === Infinity ? max : b.max);
      if (hi <= lo) return null;
      return (
        <span
          key={index}
          className="absolute top-0 h-full"
          style={{ left: `${lo}%`, width: `${hi - lo}%`, background: b.color }}
        />
      );
    });
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {title} <span className="text-muted-foreground">({unit})</span> · baremo LoRa
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold">{min}</span>
          <div className="relative mb-2 flex-1">
            <div className="relative h-3 w-full overflow-hidden rounded border border-black/10">
              {segs}
            </div>
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute text-[9px] font-semibold text-muted-foreground"
                style={{
                  top: "calc(100% + 3px)",
                  left: `${span(tick)}%`,
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                }}
              >
                {tick}
                <i className="absolute -top-[7px] left-1/2 h-1 w-px -translate-x-1/2 bg-muted-foreground/60" />
              </span>
            ))}
          </div>
          <span className="text-[11px] font-semibold">{max}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {buckets.map((b) => (
            <span
              key={b.level}
              className="flex items-center gap-1 text-[11px] text-muted-foreground"
            >
              <i
                className="inline-block h-2.5 w-2.5 rounded-sm border border-black/10"
                style={{ background: b.color }}
              />
              {LORA_LEVEL_LABEL[b.level]}
            </span>
          ))}
          {cobertura && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <i
                className="inline-block h-2.5 w-2.5 rounded-sm border border-black/10"
                style={{ background: LORA_LEVEL_COLOR.SIN_COBERTURA }}
              />
              Sin cobertura
            </span>
          )}
        </div>
      </div>
    );
  };

  const noiseLegend = (): ReactNode => {
    const span = (v: number) =>
      clampPct(((v - NOISE_SCALE.min) / (NOISE_SCALE.max - NOISE_SCALE.min)) * 100);
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium">
          Nivel de ruido <span className="text-muted-foreground">(dBm)</span> · escala fija
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold">{NOISE_SCALE.min}</span>
          <div className="relative mb-2 flex-1">
            <div
              className="h-3 w-full rounded border border-black/10"
              style={{
                background: `linear-gradient(90deg, #dc2626 0%, #eab308 ${span(-100)}%, #22c55e 100%)`,
              }}
            />
            <span
              className="absolute text-[9px] font-semibold text-muted-foreground"
              style={{
                top: "calc(100% + 3px)",
                left: `${span(-100)}%`,
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              −100
              <i className="absolute -top-[7px] left-1/2 h-1 w-px -translate-x-1/2 bg-muted-foreground/60" />
            </span>
          </div>
          <span className="text-[11px] font-semibold">{NOISE_SCALE.max}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Ruido de fondo (dBm). Rojo = más ruido, verde = menos ruido.
        </p>
      </div>
    );
  };

  if (metrics.length === 0 || !current || !geo) {
    return (
      <div className="space-y-4">
        <img
          src={image}
          alt="Plano asociado"
          className="mx-auto max-h-[250px] rounded-lg border object-contain"
        />
      </div>
    );
  }

  const counts: Array<{ label: string; value: string }> = [];
  if (signalPts.length > 0) {
    const noSignal = signalPts.filter((p) => p.level === "SIN_COBERTURA").length;
    counts.push({
      label: "RSSI",
      value: `${signalPts.length} punto${signalPts.length === 1 ? "" : "s"}${
        noSignal > 0 ? ` · ${noSignal} sin señal (rojo)` : ""
      }`,
    });
  }
  if (snrPts.length > 0) {
    const noSignal = snrPts.filter((p) => p.level === "SIN_COBERTURA").length;
    counts.push({
      label: "SNR",
      value: `${snrPts.length} punto${snrPts.length === 1 ? "" : "s"}${
        noSignal > 0 ? ` · ${noSignal} sin señal (rojo)` : ""
      }`,
    });
  }
  if (noisePts.length > 0) {
    counts.push({
      label: "Ruido",
      value: `${noisePts.length} punto${noisePts.length === 1 ? "" : "s"}`,
    });
  }
  if (antennaPt || editable) {
    counts.push({
      label: "Antena",
      value: !antennaPt
        ? "sin colocar · arrastra el marcador de antena hasta el gateway/emisor"
        : editable
          ? "arrástrala para moverla (se guarda al soltar)"
          : "posición guardada en el plano",
    });
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            type="button"
            onClick={() => setActive(metric.key)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              active === metric.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {metric.label}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg border select-none"
        style={{ aspectRatio: `${ratio}` }}
        onPointerMove={updateDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          src={image}
          alt="Plano asociado"
          draggable={false}
          className="absolute inset-0 h-full w-full"
        />
        {renderLayer()}
        {editable && (
          <div className="pointer-events-none absolute right-2 top-2 rounded-md border bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
            Arrastra un punto para reposicionarlo (se guarda al soltar)
          </div>
        )}
      </div>

      <div className="mx-auto max-w-xl space-y-1">
        {active === "signal" && legendBar(
          RSSI_LEVEL_BUCKETS,
          SIGNAL_SCALE.min,
          SIGNAL_SCALE.max,
          [-115, -100, -85, -70],
          "Nivel de señal RSSI",
          "dBm",
          true
        )}
        {active === "snr" && legendBar(
          SNR_LEVEL_BUCKETS,
          SNR_SCALE.min,
          SNR_SCALE.max,
          [-5, 0, 5, 10],
          "Relación señal-ruido",
          "dB",
          true
        )}
        {active === "noise" && noiseLegend()}
      </div>

      {counts.length > 0 && (
        <ul className="space-y-1">
          {counts.map((c) => (
            <li key={c.label} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{c.label}:</span>{" "}
              {c.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};