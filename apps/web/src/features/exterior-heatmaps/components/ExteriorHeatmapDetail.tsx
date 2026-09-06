import { useMemo } from "react";
import { MapPinnedIcon } from "lucide-react";

import { Badge } from "@/core/atomic-components/badge";
import { Button } from "@/core/atomic-components/button";
import { Breadcrumbs } from "@/core/components/Breadcrumbs";
import { ExteriorHeatmapMap } from "@/core/geo/ExteriorHeatmapMap";
import { useExteriorHeatmap } from "@/features/exterior-heatmaps/hooks/use-exterior-heatmaps";
import { useFloorPlans } from "@/features/floorplans/hooks/use-floorplans";
import { useLoraAudit } from "@/features/lora/hooks/use-lora";
import { LoraPlanHeatmap } from "@/features/lora/components/LoraPlanHeatmap";

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

interface ExteriorHeatmapDetailProps {
  heatmapId: string;
  backTo: string;
  backLabel: string;
  withFloorPlan?: boolean;
}

export const ExteriorHeatmapDetail = ({
  heatmapId,
  backTo,
  backLabel,
  withFloorPlan = false,
}: ExteriorHeatmapDetailProps) => {
  const {
    data: heatmap,
    isLoading,
    isError,
    refetch,
  } = useExteriorHeatmap(heatmapId);
  const { data: plans } = useFloorPlans();
  const { data: loraAudit } = useLoraAudit(heatmap?.loraAuditId ?? "");

  const floorPlan = useMemo(() => {
    if (!withFloorPlan || !loraAudit?.floorPlanId) return null;
    return (plans ?? []).find((p) => p.id === loraAudit.floorPlanId) ?? null;
  }, [withFloorPlan, loraAudit, plans]);

  if (isLoading) {
    return (
      <div className="container max-w-6xl px-2 py-2 mx-auto mb-4 sm:py-6">
        <p className="text-sm text-muted-foreground">Cargando mapa de calor…</p>
      </div>
    );
  }

  if (isError || !heatmap) {
    return (
      <div className="container max-w-6xl px-2 py-2 mx-auto mb-4 sm:py-6">
        <p className="text-sm text-muted-foreground">
          No se encontró el mapa de calor.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => refetch()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  const floorPlanOverlay =
    floorPlan?.image && floorPlan.geoCalibration
      ? {
          image: floorPlan.image,
          geoCalibration: {
            topLeftLat: floorPlan.geoCalibration.topLeftLat,
            topLeftLon: floorPlan.geoCalibration.topLeftLon,
            bottomRightLat: floorPlan.geoCalibration.bottomRightLat,
            bottomRightLon: floorPlan.geoCalibration.bottomRightLon,
          },
        }
      : null;

  const hasMeasures = (loraAudit?.measures?.length ?? 0) > 0;
  const hasNoise = (loraAudit?.noise?.length ?? 0) > 0;
  const planImage = floorPlan?.image ?? null;
  const hasPlanView =
    planImage !== null &&
    Boolean(floorPlan?.geoCalibration) &&
    (hasMeasures || hasNoise);
  const planPending = withFloorPlan && !floorPlan && !isError;

  return (
    <div className="container max-w-6xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <Breadcrumbs
          items={[
            { label: backLabel, to: backTo },
            { label: heatmap.name },
          ]}
        />
      </div>

      <div className="flex flex-col items-center justify-between gap-2 mb-4 sm:flex-row">
        <h1 className="flex gap-4 px-2 text-lg font-bold sm:items-center sm:text-2xl">
          <MapPinnedIcon className="w-6 h-6" />
          {heatmap.name}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary">{heatmap.points.length} puntos</Badge>
          <Badge variant="secondary">{formatDate(heatmap.createdAt)}</Badge>
        </div>
      </div>

      {planPending ? (
        <p className="text-sm text-muted-foreground">Cargando plano…</p>
      ) : hasPlanView && floorPlan && planImage ? (
        <div className="rounded-lg border bg-background p-3 sm:p-4">
          <LoraPlanHeatmap
            image={planImage}
            width={floorPlan.width}
            height={floorPlan.height}
            geoCalibration={floorPlan.geoCalibration}
            measures={loraAudit?.measures ?? []}
            noise={loraAudit?.noise ?? []}
            radius={loraAudit?.heatmapRadius ?? 0.16}
          />
        </div>
      ) : (
        <ExteriorHeatmapMap
          points={heatmap.points}
          metricLabel="Señal"
          unit="dBm"
          heightClassName="h-[560px]"
          floorPlan={floorPlanOverlay}
        />
      )}
    </div>
  );
};