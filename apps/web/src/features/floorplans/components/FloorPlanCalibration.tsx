import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, RotateCcw } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import { Input } from "@/core/atomic-components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";
import { Label } from "@/core/atomic-components/label";
import { Badge } from "@/core/atomic-components/badge";

import {
  computePixelsPerMeter,
  pixelsToReal,
  UNIT_LABELS,
} from "../lib/floorplan-validation";
import type { ScaleUnit } from "../types/floorplan.types";

export interface CalibrationPoint {
  x: number;
  y: number;
}

interface FloorPlanCalibrationProps {
  image: string;
  naturalWidth: number;
  naturalHeight: number;
  initialScale?: {
    pixelDistance: number;
    realDistance: number;
    unit: ScaleUnit;
    pointA: CalibrationPoint;
    pointB: CalibrationPoint;
  } | null;
  onSave: (data: {
    pixelsPerMeter: number;
    pixelDistance: number;
    realDistance: number;
    unit: ScaleUnit;
    pointA: CalibrationPoint;
    pointB: CalibrationPoint;
  }) => void;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;

export const FloorPlanCalibration = ({
  image,
  naturalWidth,
  naturalHeight,
  initialScale,
  onSave,
}: FloorPlanCalibrationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pointA, setPointA] = useState<CalibrationPoint | null>(
    initialScale?.pointA ?? null
  );
  const [pointB, setPointB] = useState<CalibrationPoint | null>(
    initialScale?.pointB ?? null
  );
  const [realDistance, setRealDistance] = useState<string>(
    initialScale ? String(initialScale.realDistance) : ""
  );
  const [unit, setUnit] = useState<ScaleUnit>(initialScale?.unit ?? "m");

  const visibleScale = fitScale * zoom;

  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const maxW = Math.max(200, el.clientWidth - 32);
      const maxH = Math.max(200, el.clientHeight - 32);
      if (naturalWidth <= 0 || naturalHeight <= 0) return;
      const scale = Math.min(maxW / naturalWidth, maxH / naturalHeight, 1);
      setFitScale(scale);
    };
    measure();
  }, [naturalWidth, naturalHeight, image]);

  const pixelDistance = useMemo(() => {
    if (!pointA || !pointB) return 0;
    // Los puntos se guardan normalizados (0-1); la distancia en píxeles reales
    // se calcula usando las dimensiones nativas del plano.
    const pxA = { x: pointA.x * naturalWidth, y: pointA.y * naturalHeight };
    const pxB = { x: pointB.x * naturalWidth, y: pointB.y * naturalHeight };
    return Math.hypot(pxB.x - pxA.x, pxB.y - pxA.y);
  }, [pointA, pointB, naturalWidth, naturalHeight]);

  const parsedReal = Number(realDistance);
  const realValid = Number.isFinite(parsedReal) && parsedReal > 0 && pixelDistance > 0;

  const setPoint = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // La imagen se muestra escalada por visibleScale; convertir a coordenadas
    // naturales del plano (píxeles originales) y normalizar a 0-1.
    const naturalX = (event.clientX - rect.left) / visibleScale;
    const naturalY = (event.clientY - rect.top) / visibleScale;
    const nx = Math.max(0, Math.min(1, naturalX / naturalWidth));
    const ny = Math.max(0, Math.min(1, naturalY / naturalHeight));
    const next: CalibrationPoint = { x: nx, y: ny };
    if (!pointA) {
      setPointA(next);
      return;
    }
    setPointB(next);
  };

  const resetPoints = () => {
    setPointA(null);
    setPointB(null);
  };

  const scaleResult = realValid
    ? computePixelsPerMeter(pixelDistance, parsedReal, unit)
    : 0;

  const displayA = pointA
    ? { x: pointA.x * naturalWidth, y: pointA.y * naturalHeight }
    : null;
  const displayB = pointB
    ? { x: pointB.x * naturalWidth, y: pointB.y * naturalHeight }
    : null;

  const handleSave = () => {
    if (!realValid || !pointA || !pointB) return;
    onSave({
      pixelsPerMeter: scaleResult,
      pixelDistance,
      realDistance: parsedReal,
      unit,
      pointA,
      pointB,
    });
  };

  const previewReal = pointA && pointB && scaleResult > 0
    ? pixelsToReal(pixelDistance, scaleResult, unit)
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-md border p-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.25))}
            title="Alejar"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-14 text-center text-xs text-muted-foreground">
            {Math.round(visibleScale * 100)}%
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.25))}
            title="Acercar"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setZoom(1)}
            title="Ajustar al contenedor"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetPoints}
          disabled={!pointA && !pointB}
        >
          Reiniciar puntos
        </Button>
      </div>

      <div
        ref={containerRef}
        className="relative h-[440px] w-full overflow-auto rounded-lg border"
        onClick={(e) => setPoint(e)}
      >
        <div
          className="relative origin-top-left"
          style={{
            width: naturalWidth * visibleScale,
            height: naturalHeight * visibleScale,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: `${naturalWidth * visibleScale}px ${
                naturalHeight * visibleScale
              }px`,
              backgroundPosition: "top left",
              backgroundRepeat: "no-repeat",
            }}
          />
          {displayA ? (
            <div
              className="absolute z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground"
              style={{
                left: displayA.x * visibleScale,
                top: displayA.y * visibleScale,
              }}
            >
              <span className="text-[10px] font-bold">A</span>
            </div>
          ) : null}
          {displayB ? (
            <div
              className="absolute z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              style={{
                left: displayB.x * visibleScale,
                top: displayB.y * visibleScale,
              }}
            >
              <span className="text-[10px] font-bold">B</span>
            </div>
          ) : null}
          {displayA && displayB ? (
            <svg
              className="absolute inset-0 z-10 h-full w-full"
              style={{ width: naturalWidth * visibleScale, height: naturalHeight * visibleScale }}
              viewBox={`0 0 ${naturalWidth * visibleScale} ${naturalHeight * visibleScale}`}
              preserveAspectRatio="none"
            >
              <line
                x1={displayA.x * visibleScale}
                y1={displayA.y * visibleScale}
                x2={displayB.x * visibleScale}
                y2={displayB.y * visibleScale}
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            </svg>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <Label>Distancia en píxeles</Label>
          <div className="mt-1 rounded-md border bg-muted px-3 py-2 font-mono">
            {pixelDistance > 0 ? pixelDistance.toFixed(1) : "—"} px
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label>Distancia real</Label>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="Ej. 10"
              value={realDistance}
              onChange={(e) => setRealDistance(e.target.value)}
            />
          </div>
          <Select
            value={unit}
            onValueChange={(v) => setUnit(v as ScaleUnit)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Unidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="m">{UNIT_LABELS.m}</SelectItem>
              <SelectItem value="cm">{UNIT_LABELS.cm}</SelectItem>
              <SelectItem value="ft">{UNIT_LABELS.ft}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {previewReal !== null && (
        <p className="text-xs text-muted-foreground">
          Línea equivalente a{" "}
          <span className="font-semibold">
            {previewReal.toFixed(2)} {unit}
          </span>{" "}
          (distancia real introducida)
        </p>
      )}

      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 p-3">
        <div>
          <p className="text-xs text-muted-foreground">
            Escala calculada
          </p>
          <p className="text-lg font-bold">
            {scaleResult > 0 ? `${scaleResult.toFixed(2)} px/m` : "—"}
          </p>
        </div>
        {scaleResult > 0 && (
          <Badge variant="secondary">
            1 px = {(1 / scaleResult).toFixed(4)} m
          </Badge>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!realValid || !pointA || !pointB}>
          Guardar escala
        </Button>
      </div>
    </div>
  );
};
