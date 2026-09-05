import { useEffect, useMemo } from "react";
import L from "leaflet";
// leaflet.heat es un IIFE antiguo que registra L.heatLayer sobre el L global.
// Garantizamos window.L y cargamos el side-effect después de leaflet.
(globalThis as any).L = L;
import "leaflet.heat";
import {
  MapContainer,
  ImageOverlay,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import {
  createLayerComponent,
  type LayerProps,
  type LeafletContextInterface,
} from "@react-leaflet/core";

import "leaflet/dist/leaflet.css";

export interface ExteriorHeatmapPoint {
  lat: number;
  lon: number;
  value: number;
  label: string;
}

export interface ExteriorHeatmapMapProps {
  points: ExteriorHeatmapPoint[];
  metricLabel: string;
  unit: string;
  heightClassName?: string;
  floorPlan?: {
    image: string;
    geoCalibration: {
      topLeftLat: number;
      topLeftLon: number;
      bottomRightLat: number;
      bottomRightLon: number;
    };
  } | null;
  noisePoint?: ExteriorHeatmapPoint | null;
}

const MIN_ALPHA = 0.04;

const colorFor = (t: number, alpha: number): string => {
  const hue = Math.max(0, Math.min(1, t)) * 120;
  return `hsla(${hue}, 90%, 50%, ${alpha})`;
};

interface HeatLayerProps extends LayerProps {
  points: [number, number, number][];
  options?: L.HeatMapOptions;
}

const createHeatLayer = (
  props: HeatLayerProps,
  context: LeafletContextInterface
) => {
  const instance = L.heatLayer(props.points, props.options);
  return { instance, context };
};

const updateHeatLayer = (
  instance: L.HeatLayer,
  props: HeatLayerProps,
  prev: HeatLayerProps
) => {
  if (prev.points !== props.points) {
    instance.setLatLngs(props.points);
  }
  if (prev.options !== props.options) {
    instance.setOptions(props.options ?? {});
  }
};

const HeatLayer = createLayerComponent<L.HeatLayer, HeatLayerProps>(
  createHeatLayer,
  updateHeatLayer
);

const FitBounds = ({
  points,
  floorPlan,
}: {
  points: ExteriorHeatmapPoint[];
  floorPlan?: ExteriorHeatmapMapProps["floorPlan"];
}) => {
  const map = useMap();

  useEffect(() => {
    if (floorPlan?.geoCalibration) {
      const geo = floorPlan.geoCalibration;
      const bounds = L.latLngBounds(
        [geo.bottomRightLat, geo.topLeftLon],
        [geo.topLeftLat, geo.bottomRightLon]
      );
      map.fitBounds(bounds, { padding: [20, 20] });
      return;
    }
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lon], 16);
      return;
    }
    const bounds = L.latLngBounds(
      points.map((p) => [p.lat, p.lon] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points, floorPlan]);

  return null;
};

const Legend = ({
  metricLabel,
  unit,
  min,
  max,
}: {
  metricLabel: string;
  unit: string;
  min: number;
  max: number;
}) => {
  const stops = Array.from({ length: 11 }, (_, i) => colorFor(i / 10, 1));
  const gradient = `linear-gradient(to right, ${stops.join(", ")})`;

  return (
    <div className="pointer-events-none absolute bottom-6 left-3 z-[1000] rounded-lg border bg-card/95 px-3 py-2 shadow">
      <p className="mb-1.5 text-xs font-semibold text-foreground">
        {metricLabel} ({unit})
      </p>
      <div className="h-3 w-44 rounded" style={{ background: gradient }} />
      <div className="mt-1 flex justify-between text-[11px] font-semibold text-foreground">
        <span>{max.toFixed(0)}</span>
        <span>{min.toFixed(0)}</span>
      </div>
    </div>
  );
};

const EmptyState = ({ metricLabel }: { metricLabel: string }) => (
  <div className="flex h-full min-h-[300px] w-full flex-col items-center justify-center gap-2 rounded-2xl border bg-muted/30 p-8 text-center">
    <p className="text-sm font-medium text-foreground">
      No hay puntos con coordenadas para {metricLabel}
    </p>
    <p className="text-xs text-muted-foreground">
      Carga medidas con latitud/longitud válidas para visualizar el mapa de calor.
    </p>
  </div>
);

const markerIcon = (value: number) =>
  L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:50%;background:#fff;border:2px solid #111827;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#111827;box-shadow:0 1px 3px rgba(0,0,0,.4)">${value.toFixed(0)}</div>`,
  });

const noiseMarkerIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:4px;background:#7c3aed;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.5)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h2l3-9 4 18 4-12 3 6h4"/></svg></div>`,
  });

export const ExteriorHeatmapMap = ({
  points,
  metricLabel,
  unit,
  heightClassName = "h-[520px]",
  floorPlan = null,
  noisePoint = null,
}: ExteriorHeatmapMapProps) => {
  const validPoints = useMemo(
    () =>
      points.filter(
        (p) =>
          Number.isFinite(p.lat) &&
          Number.isFinite(p.lon) &&
          Number.isFinite(p.value)
      ),
    [points]
  );

  const floorPlanBounds = useMemo(() => {
    if (!floorPlan?.geoCalibration) return null;
    const geo = floorPlan.geoCalibration;
    return L.latLngBounds(
      [geo.bottomRightLat, geo.topLeftLon],
      [geo.topLeftLat, geo.bottomRightLon]
    );
  }, [floorPlan]);

  const { planPoints, omittedCount, noiseInsidePlan } = useMemo(() => {
    if (!floorPlanBounds) {
      return {
        planPoints: validPoints,
        omittedCount: 0,
        noiseInsidePlan: true,
      };
    }
    const planPoints = validPoints.filter((p) =>
      floorPlanBounds.contains([p.lat, p.lon])
    );
    const noiseInsidePlan =
      noisePoint == null ||
      (Number.isFinite(noisePoint.lat) &&
        Number.isFinite(noisePoint.lon) &&
        floorPlanBounds.contains([noisePoint.lat, noisePoint.lon]));
    const omitted =
      validPoints.length - planPoints.length + (noiseInsidePlan ? 0 : 1);
    return { planPoints, omittedCount: omitted, noiseInsidePlan };
  }, [validPoints, floorPlanBounds, noisePoint]);

  const heatPoints = useMemo<[number, number, number][]>(
    () => planPoints.map((p) => [p.lat, p.lon, p.value]),
    [planPoints]
  );

  const range = useMemo(() => {
    if (planPoints.length === 0) return { min: 0, max: 1 };
    const values = planPoints.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return max === min ? { min: min - 1, max: max + 1 } : { min, max };
  }, [planPoints]);

  const center: [number, number] =
    planPoints.length > 0
      ? [planPoints[0].lat, planPoints[0].lon]
      : [40.4168, -3.7038];

  if (planPoints.length === 0 && !(noisePoint && noiseInsidePlan)) {
    return <EmptyState metricLabel={metricLabel} />;
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border ${heightClassName}`}
    >
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom
        className="h-full w-full"
      >
        {floorPlanBounds && floorPlan?.image ? (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              opacity={0.3}
            />
            <ImageOverlay
              url={floorPlan.image}
              bounds={floorPlanBounds}
              opacity={0.85}
            />
          </>
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        {planPoints.length > 0 && (
          <HeatLayer
            points={heatPoints}
            options={{
              radius: 30,
              blur: 22,
              minOpacity: MIN_ALPHA,
              max: 1,
              gradient: {
                0.2: colorFor(0, 1),
                0.4: colorFor(0.25, 1),
                0.6: colorFor(0.5, 1),
                0.8: colorFor(0.75, 1),
                1.0: colorFor(1, 1),
              },
            }}
          />
        )}
        {planPoints.map((p, index) => (
          <Marker
            key={`${p.lat}-${p.lon}-${index}`}
            position={[p.lat, p.lon]}
            icon={markerIcon(p.value)}
          >
            <Tooltip direction="top" offset={[0, -14]}>
              <span className="font-medium">
                {p.label || `Punto ${index + 1}`}
              </span>
              <br />
              <span className="text-muted-foreground">
                {p.value.toFixed(0)} {unit}
              </span>
            </Tooltip>
          </Marker>
        ))}
        {noisePoint &&
          noiseInsidePlan &&
          Number.isFinite(noisePoint.lat) &&
          Number.isFinite(noisePoint.lon) && (
          <Marker
            position={[noisePoint.lat, noisePoint.lon]}
            icon={noiseMarkerIcon()}
          >
            <Tooltip direction="top" offset={[0, -14]}>
              <span className="font-medium">{noisePoint.label}</span>
              <br />
              <span className="text-muted-foreground">
                {noisePoint.value.toFixed(1)} {unit}
              </span>
            </Tooltip>
          </Marker>
        )}
        <FitBounds points={planPoints} floorPlan={floorPlan} />
      </MapContainer>
      <Legend metricLabel={metricLabel} unit={unit} min={range.min} max={range.max} />
      {omittedCount > 0 && (
        <div className="pointer-events-none absolute right-3 top-3 z-[1000] max-w-[220px] rounded-lg border bg-card/95 px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow">
          {omittedCount}{" "}
          {omittedCount === 1 ? "punto fuera" : "puntos fuera"} del plano
          omitido{omittedCount === 1 ? "" : "s"} del mapa
        </div>
      )}
    </div>
  );
};
