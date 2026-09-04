import { useState } from "react";
import {
  FileImage,
  FileText,
  Eye,
  Ruler,
  Trash2,
  Layers,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/core/atomic-components/button";
import { Badge } from "@/core/atomic-components/badge";
import { Card, CardContent } from "@/core/atomic-components/card";

import { useDeleteFloorPlan } from "../hooks/use-delete-floorplan";
import { CalibrateScaleDialog } from "./CalibrateScaleDialog";
import { FloorPlanViewerDialog } from "./FloorPlanViewerDialog";
import type { FloorPlan } from "../types/floorplan.types";

const ACTIVE_BASE_KEY = "wifi_measures:activeFloorPlan";

const getActiveBase = (): number | null => {
  try {
    const raw = window.localStorage.getItem(ACTIVE_BASE_KEY);
    const parsed = raw ? Number(raw) : null;
    return parsed && Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface FloorPlansGridProps {
  plans: FloorPlan[];
  isLoading?: boolean;
  isError?: boolean;
  onRefetch?: () => void;
  emptyMessage?: string;
}

export const FloorPlansGrid = ({
  plans,
  isLoading,
  isError,
  onRefetch,
  emptyMessage = "Aún no hay planos subidos.",
}: FloorPlansGridProps) => {
  const deletePlan = useDeleteFloorPlan();
  const [calibratePlan, setCalibratePlan] = useState<FloorPlan | null>(null);
  const [viewerPlan, setViewerPlan] = useState<FloorPlan | null>(null);
  const [activeBase, setActiveBase] = useState<number | null>(getActiveBase);

  const handleDelete = (plan: FloorPlan) => {
    if (
      !window.confirm(
        `¿Eliminar el plano «${plan.name}»? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    deletePlan.mutate(plan.id, {
      onSuccess: () => {
        toast.success("Plano eliminado");
        if (activeBase === plan.id) {
          try {
            window.localStorage.removeItem(ACTIVE_BASE_KEY);
          } catch {
            /* noop */
          }
          setActiveBase(null);
        }
      },
      onError: (err) => toast.error(`Error al eliminar: ${err.message}`),
    });
  };

  const handleSelectBase = (plan: FloorPlan) => {
    const next = activeBase === plan.id ? null : plan.id;
    setActiveBase(next);
    try {
      if (next) window.localStorage.setItem(ACTIVE_BASE_KEY, String(next));
      else window.localStorage.removeItem(ACTIVE_BASE_KEY);
    } catch {
      /* noop */
    }
    toast.success(
      next
        ? "Plano seleccionado como base del mapa de calor"
        : "Base del mapa de calor deseleccionada"
    );
  };

  return (
    <Card>
      <CardContent className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando planos…
          </div>
        ) : isError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Error al cargar los planos.
            </p>
            <button
              type="button"
              onClick={() => onRefetch?.()}
              className="mt-2 text-sm text-primary underline"
            >
              Reintentar
            </button>
          </div>
        ) : !plans || plans.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground text-center">
            {emptyMessage}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col overflow-hidden rounded-xl border ${
                  activeBase === plan.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setViewerPlan(plan)}
                  className="flex h-36 w-full items-center justify-center overflow-hidden bg-muted/40"
                >
                  {plan.image ? (
                    <img
                      src={plan.image}
                      alt={plan.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      {plan.fileType === "pdf" ? (
                        <FileText className="h-8 w-8" />
                      ) : (
                        <FileImage className="h-8 w-8" />
                      )}
                      <span className="text-xs">Sin preview</span>
                    </div>
                  )}
                </button>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{plan.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {plan.floorZone || "Sin planta/zona"} ·{" "}
                        {formatDate(plan.createdAt)}
                      </p>
                    </div>
                    {plan.fileType === "pdf" && (
                      <Badge variant="secondary">PDF</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {plan.scale ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/50 text-emerald-600"
                      >
                        <Ruler className="mr-1 h-3 w-3" />
                        {plan.scale.pixelsPerMeter.toFixed(2)} px/m
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Escala: No definida</Badge>
                    )}
                    {activeBase === plan.id && (
                      <Badge className="bg-primary">Base del mapa</Badge>
                    )}
                  </div>

                  <div className="mt-auto flex items-center gap-1 border-t pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewerPlan(plan)}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!plan.image}
                      onClick={() => setCalibratePlan(plan)}
                      title={plan.scale ? "Editar escala" : "Calibrar escala"}
                    >
                      <Ruler className="h-4 w-4" />
                      {plan.scale ? "Editar escala" : "Calibrar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSelectBase(plan)}
                      title="Seleccionar como base del mapa de calor"
                    >
                      <Layers className="h-4 w-4" />
                      Base
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-destructive hover:text-destructive"
                      onClick={() => handleDelete(plan)}
                      disabled={deletePlan.isPending}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CalibrateScaleDialog
        open={!!calibratePlan}
        plan={calibratePlan}
        onOpenChange={(open) => {
          if (!open) setCalibratePlan(null);
        }}
      />
      <FloorPlanViewerDialog
        open={!!viewerPlan}
        plan={viewerPlan}
        onOpenChange={(open) => {
          if (!open) setViewerPlan(null);
        }}
      />
    </Card>
  );
};