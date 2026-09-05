import { useMemo, useState } from "react";
import { Flame, Map, MapPinnedIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import CustomLoading from "@/core/components/CustomLoading";
import { Button } from "@/core/atomic-components/button";
import { ExteriorHeatmapMap } from "@/core/geo/ExteriorHeatmapMap";
import {
  useDeleteExteriorHeatmap,
  useExteriorHeatmaps,
} from "@/features/exterior-heatmaps/hooks/use-exterior-heatmaps";
import { useFloorPlans } from "@/features/floorplans/hooks/use-floorplans";
import { isExteriorPlan } from "@/features/floorplans/types/floorplan.types";
import { FloorPlansGrid } from "@/features/floorplans/components/FloorPlansGrid";
import { CreateFloorPlanFromMapDialog } from "@/features/floorplans/components/CreateFloorPlanFromMapDialog";
import { useLoraAudits } from "@/features/lora/hooks/use-lora";
import type { ExteriorHeatmap } from "@/features/exterior-heatmaps/types/exterior-heatmap.types";
import type { FloorPlan } from "@/features/floorplans/types/floorplan.types";

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

const LoraMapPage = () => {
  const { data: plans, isLoading: plansLoading } = useFloorPlans();
  const {
    data: heatmaps,
    isLoading: heatmapsLoading,
    isError: heatmapsError,
    refetch: refetchHeatmaps,
  } = useExteriorHeatmaps();
  const { data: audits } = useLoraAudits();
  const deleteHeatmap = useDeleteExteriorHeatmap();

  const [mapUploadOpen, setMapUploadOpen] = useState(false);
  const [viewerHeatmap, setViewerHeatmap] = useState<ExteriorHeatmap | null>(
    null
  );

  const loraMaps = useMemo(
    () => (heatmaps ?? []).filter((h) => h.tipo === "LORA"),
    [heatmaps]
  );

  const exteriorPlans = (plans ?? []).filter(isExteriorPlan);

  const planByAudit = useMemo(() => {
    const result: Record<string, FloorPlan> = {};
    const byId: Record<number, FloorPlan> = {};
    for (const plan of plans ?? []) byId[plan.id] = plan;
    for (const audit of audits ?? []) {
      if (audit.floorPlanId && byId[audit.floorPlanId]) {
        result[audit.id] = byId[audit.floorPlanId];
      }
    }
    return result;
  }, [audits, plans]);

  const viewerFloorPlan = viewerHeatmap?.loraAuditId
    ? planByAudit[viewerHeatmap.loraAuditId] ?? null
    : null;

  const mapInitialPoints = useMemo(() => {
    if (viewerHeatmap) {
      const pts = (viewerHeatmap.points ?? [])
        .filter(
          (p) => Number.isFinite(p.lat) && Number.isFinite(p.lon)
        )
        .map((p) => ({ lat: p.lat, lon: p.lon }));
      if (pts.length > 0) return pts;
    }
    const pts: Array<{ lat: number; lon: number }> = [];
    for (const audit of audits ?? []) {
      for (const measure of audit.measures ?? []) {
        for (const block of measure.blocks ?? []) {
          if (block.latitude != null && block.longitude != null) {
            pts.push({ lat: block.latitude, lon: block.longitude });
          }
        }
      }
      for (const noise of audit.noise ?? []) {
        if (noise.latitude != null && noise.longitude != null) {
          pts.push({ lat: noise.latitude, lon: noise.longitude });
        }
      }
    }
    return pts;
  }, [viewerHeatmap, audits]);

  const handleMapPlanCreated = (plan: FloorPlan) => {
    toast.success(
      `Plano «${plan.name}» guardado y subido a NetAlly. Podrás usarlo en AirMapper.`
    );
  };

  const handleViewHeatmap = (heatmap: ExteriorHeatmap) => {
    setViewerHeatmap(viewerHeatmap?.id === heatmap.id ? null : heatmap);
  };

  const handleDeleteHeatmap = (heatmap: ExteriorHeatmap) => {
    if (!window.confirm(`¿Eliminar el mapa de calor «${heatmap.name}»?`)) return;
    deleteHeatmap.mutate(heatmap.id, {
      onSuccess: () => {
        toast.success("Mapa de calor eliminado");
        if (viewerHeatmap?.id === heatmap.id) setViewerHeatmap(null);
      },
      onError: (err) => toast.error(`Error al eliminar: ${err.message}`),
    });
  };

  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <div className="flex flex-col items-center justify-between gap-2 mt-2 mb-4 sm:flex-row">
        <h1 className="flex gap-4 px-2 mb-2 text-lg font-bold sm:items-center sm:text-2xl">
          <MapPinnedIcon className="w-6 h-6" />
          Mapas de calor exterior — LoRa
        </h1>
        <Button onClick={() => setMapUploadOpen(true)}>
          <Map className="mr-2 h-4 w-4" />
          Crear plano desde mapa
        </Button>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Vincula un plano georeferenciado para usarlo como base del mapa.
      </p>

      {/* Parte 1: mapas de calor LoRa */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold sm:text-lg">
          <Flame className="h-5 w-5" />
          Mapas de calor exterior LoRa
        </h2>

        {heatmapsLoading ? (
          <CustomLoading />
        ) : heatmapsError ? (
          <div className="rounded-xl border bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Error al cargar los mapas de calor.
            </p>
            <button
              type="button"
              onClick={() => refetchHeatmaps()}
              className="mt-2 text-sm text-primary underline"
            >
              Reintentar
            </button>
          </div>
        ) : !loraMaps.length ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-muted/20 p-8 text-center">
            <Flame className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aún no hay mapas de calor exteriores LoRa
            </p>
            <p className="text-xs text-muted-foreground">
              Los mapas de calor aparecerán aquí cuando se generen a partir de
              las auditorías LoRa con coordenadas GPS.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {loraMaps.map((heatmap) => (
                <div
                  key={heatmap.id}
                  className="flex flex-col overflow-hidden rounded-xl border"
                >
                  <div className="flex h-24 w-full items-center justify-center gap-2 bg-muted/40">
                    <Flame className="h-6 w-6 text-orange-500" />
                    <span className="text-sm font-semibold">
                      {heatmap.points.length} puntos
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <p className="truncate text-sm font-semibold">
                      {heatmap.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Mapa exterior · {formatDate(heatmap.createdAt)}
                    </p>
                    {heatmap.loraAuditId && planByAudit[heatmap.loraAuditId] ? (
                      <p className="truncate text-xs text-muted-foreground">
                        Plano base:{" "}
                        <span className="font-medium text-foreground/80">
                          {planByAudit[heatmap.loraAuditId!].name}
                        </span>
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-center gap-1 border-t pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleViewHeatmap(heatmap)}
                      >
                        <Map className="mr-1 h-4 w-4" />
                        {viewerHeatmap?.id === heatmap.id
                          ? "Ocultar"
                          : "Ir al mapa de calor"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto text-destructive hover:text-destructive"
                        onClick={() => handleDeleteHeatmap(heatmap)}
                        disabled={deleteHeatmap.isPending}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {viewerHeatmap && (
              <div className="mt-4">
                <h3 className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold sm:text-base">
                  {viewerHeatmap.name}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setViewerHeatmap(null)}
                  >
                    Ocultar
                  </Button>
                </h3>
                <ExteriorHeatmapMap
                  points={viewerHeatmap.points}
                  metricLabel="Señal"
                  unit="dBm"
                  floorPlan={
                    viewerFloorPlan?.image && viewerFloorPlan.geoCalibration
                      ? {
                          image: viewerFloorPlan.image,
                          geoCalibration: {
                            topLeftLat:
                              viewerFloorPlan.geoCalibration.topLeftLat,
                            topLeftLon:
                              viewerFloorPlan.geoCalibration.topLeftLon,
                            bottomRightLat:
                              viewerFloorPlan.geoCalibration.bottomRightLat,
                            bottomRightLon:
                              viewerFloorPlan.geoCalibration.bottomRightLon,
                          },
                        }
                      : null
                  }
                />
              </div>
            )}
          </>
        )}
      </section>

      {/* Parte 2: planos de mapa exterior */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold sm:text-lg">
          <Upload className="h-5 w-5" />
          Planos de mapa exterior subidos
        </h2>
        <FloorPlansGrid
          plans={exteriorPlans}
          isLoading={plansLoading}
          emptyMessage="Aún no hay planos de mapa exterior. Pulsa «Crear plano desde mapa» para capturar uno."
        />
      </section>

      <CreateFloorPlanFromMapDialog
        open={mapUploadOpen}
        onOpenChange={setMapUploadOpen}
        onCreated={handleMapPlanCreated}
        initialPoints={mapInitialPoints}
      />
    </div>
  );
};

export default LoraMapPage;