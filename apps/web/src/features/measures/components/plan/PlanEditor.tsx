import { useRef, useState } from "react";

import { Save, Trash2, Upload, X } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import { Card, CardContent } from "@/core/atomic-components/card";
import { useUpsertAreaPlan } from "../../hooks/use-upsert-area-plan";
import type { MeasureModel } from "../../models/measure.model";
import type {
  AreaPlan,
  AreaPlanPosition,
} from "../../types/area-plan.types";

interface PlanEditorProps {
  areaId: number;
  areaName: string;
  measures: MeasureModel[];
  initialPlan?: AreaPlan | null;
  onCancel: () => void;
  onSaved: () => void;
}

const NETALLY_COLORS: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  black: "bg-gray-400",
};

const getColorClass = (measure: MeasureModel): string => {
  const raw = (measure.raw ?? {}) as Record<string, unknown>;
  return NETALLY_COLORS[`${raw.overallColor ?? ""}`] ?? "bg-gray-300";
};

export const PlanEditor = ({
  areaId,
  areaName,
  measures,
  initialPlan,
  onCancel,
  onSaved,
}: PlanEditorProps) => {
  const [image, setImage] = useState<string | null>(
    initialPlan?.image ?? null
  );
  const [width, setWidth] = useState(initialPlan?.width ?? 0);
  const [height, setHeight] = useState(initialPlan?.height ?? 0);
  const [positions, setPositions] = useState<Record<string, AreaPlanPosition>>(
    initialPlan?.positions ?? {}
  );
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(
    measures.length > 0 ? `${measures[0].id}` : null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingIdRef = useRef<string | null>(null);

  const mutation = useUpsertAreaPlan(areaId);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const imageEl = new Image();
      imageEl.onload = () => {
        setImage(url);
        setWidth(imageEl.naturalWidth);
        setHeight(imageEl.naturalHeight);
      };
      imageEl.src = url;
    };
    reader.readAsDataURL(file);
  };

  const setPositionFromEvent = (
    measureId: string,
    clientX: number,
    clientY: number
  ) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setPositions((prev) => ({
      ...prev,
      [measureId]: {
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y)),
      },
    }));
  };

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!selectedMeasureId) return;
    setPositionFromEvent(selectedMeasureId, event.clientX, event.clientY);
  };

  const handleMarkerPointerDown =
    (measureId: string) => (event: React.PointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      setSelectedMeasureId(measureId);
      draggingIdRef.current = measureId;
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    };

  const handleContainerPointerMove = (event: React.PointerEvent) => {
    const measureId = draggingIdRef.current;
    if (!measureId) return;
    setPositionFromEvent(measureId, event.clientX, event.clientY);
  };

  const handlePointerUp = () => {
    draggingIdRef.current = null;
  };

  const handleSave = async () => {
    if (!image) return;
    await mutation.mutateAsync({
      name: areaName,
      image,
      width,
      height,
      positions,
    });
    onSaved();
  };

  const positionedCount = Object.keys(positions).length;

  return (
    <Card>
      <CardContent className="mt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Editor del plano</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" /> Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!image || mutation.isPending}
            >
              <Save className="w-4 h-4" />
              {mutation.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>

        <div>
          <label className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border cursor-pointer hover:bg-accent">
            <Upload className="w-4 h-4" />
            {image ? "Cambiar imagen del plano" : "Subir imagen del plano"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Puntos de medida</p>
          <div className="flex flex-wrap gap-2">
            {measures.map((measure, index) => {
              const id = `${measure.id}`;
              const placed = Boolean(positions[id]);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedMeasureId(id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${
                    selectedMeasureId === id
                      ? "border-primary bg-primary/10"
                      : "border-input"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${getColorClass(measure)}`}
                  />
                  <span>
                    {index + 1}. {measure.name}
                  </span>
                  {placed && (
                    <span className="text-xs text-muted-foreground">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Selecciona un punto y haz clic sobre la imagen para colocarlo.
          Arrastra los marcadores para moverlos.
        </p>

        <div
          ref={containerRef}
          className="relative w-full overflow-hidden rounded-2xl border select-none"
          onPointerMove={handleContainerPointerMove}
          onPointerUp={handlePointerUp}
        >
          {image ? (
            <>
              <img
                src={image}
                alt="Plano del área"
                draggable={false}
                className="block w-full h-auto"
                onClick={handleImageClick}
              />
              {measures.map((measure) => {
                const id = `${measure.id}`;
                const position = positions[id];
                if (!position) return null;
                return (
                  <div
                    key={id}
                    onPointerDown={handleMarkerPointerDown(id)}
                    className={`absolute flex items-center justify-center w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white text-xs font-bold text-white cursor-grab shadow ${
                      selectedMeasureId === id ? "ring-2 ring-primary" : ""
                    }`}
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      backgroundColor: "#111827",
                    }}
                    title={measure.name}
                  >
                    {measures.indexOf(measure) + 1}
                  </div>
                );
              })}
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              Sube una imagen del plano para empezar
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {positionedCount} de {measures.length} medidas posicionadas
          </p>
          {positionedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPositions({})}
            >
              <Trash2 className="w-4 h-4" /> Limpiar posiciones
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};