import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Flame, LogInIcon, Map, MapPinnedIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import CustomLoading from "@/core/components/CustomLoading";
import { Badge } from "@/core/atomic-components/badge";
import { Button } from "@/core/atomic-components/button";
import { Card, CardContent } from "@/core/atomic-components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/atomic-components/table";
import { useFloorPlans } from "@/features/floorplans/hooks/use-floorplans";
import { isExteriorLoraPlan } from "@/features/floorplans/types/floorplan.types";
import { FloorPlansGrid } from "@/features/floorplans/components/FloorPlansGrid";
import { CreateFloorPlanFromMapDialog } from "@/features/floorplans/components/CreateFloorPlanFromMapDialog";
import { useLoraAudits } from "@/features/lora/hooks/use-lora";
import {
  useDeleteExteriorHeatmap,
  useExteriorHeatmaps,
} from "@/features/exterior-heatmaps/hooks/use-exterior-heatmaps";
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

  const loraMaps = useMemo(
    () => (heatmaps ?? []).filter((h) => h.tipo === "LORA"),
    [heatmaps]
  );

  const loraExteriorPlans = (plans ?? []).filter(isExteriorLoraPlan);

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

  const auditName = (id: string | null): string => {
    const audit = (audits ?? []).find((a) => a.id === id);
    if (!audit) return "—";
    return audit.code ? `${audit.name} (${audit.code})` : audit.name;
  };

  const mapInitialPoints = useMemo(() => {
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
  }, [audits]);

  const handleDeleteHeatmap = (id: string) => {
    if (!window.confirm("¿Eliminar este mapa de calor?")) return;
    deleteHeatmap.mutate(id, {
      onSuccess: () => toast.success("Mapa de calor eliminado"),
      onError: (err) => toast.error(`Error al eliminar: ${err.message}`),
    });
  };

  const handleMapPlanCreated = (plan: FloorPlan) => {
    toast.success(
      `Plano «${plan.name}» guardado y subido a NetAlly. Podrás usarlo en AirMapper.`
    );
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
        Los mapas de calor exteriores LoRa se generan automáticamente al
        configurar una auditoría con medidas, ruido y plano asociado.
      </p>

      {/* Parte 1: mapas de calor LoRa */}
      <Card>
        <CardContent className="mt-4">
          {heatmapsLoading ? (
            <CustomLoading />
          ) : heatmapsError ? (
            <div className="py-8 text-center">
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
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl p-8 text-center">
              <Flame className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Aún no hay mapas de calor exteriores LoRa
              </p>
              <p className="text-xs text-muted-foreground">
                Los mapas de calor aparecerán aquí cuando se generen a partir de
                las auditorías LoRa con coordenadas GPS y plano asociado.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mapa de calor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Puntos</TableHead>
                  <TableHead>Auditoría</TableHead>
                  <TableHead>Plano base</TableHead>
                  <TableHead className="text-right">Ver</TableHead>
                  <TableHead className="text-right">Eliminar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loraMaps.map((heatmap) => {
                  const plan = heatmap.loraAuditId
                    ? planByAudit[heatmap.loraAuditId] ?? null
                    : null;
                  return (
                    <TableRow key={heatmap.id}>
                      <TableCell className="font-medium">
                        {heatmap.name}
                      </TableCell>
                      <TableCell>{formatDate(heatmap.createdAt)}</TableCell>
                      <TableCell className="text-center">
                        {heatmap.points.length}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {auditName(heatmap.loraAuditId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {plan?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/lora/map/${heatmap.id}`}>
                          <Button
                            size="icon"
                            title="Ir al mapa de calor"
                            className="bg-yellow-500 text-foreground hover:bg-yellow-500/90"
                          >
                            <LogInIcon className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteHeatmap(heatmap.id)}
                          disabled={deleteHeatmap.isPending}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Parte 2: planos de mapa exterior LoRa */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold sm:text-lg">
          <Upload className="h-5 w-5" />
          Planos de mapa exterior subidos (LoRa)
        </h2>
        <FloorPlansGrid
          plans={loraExteriorPlans}
          isLoading={plansLoading}
          emptyMessage="Aún no hay planos de mapa exterior LoRa. Pulsa «Crear plano desde mapa» para capturar uno."
        />
      </section>

      <CreateFloorPlanFromMapDialog
        open={mapUploadOpen}
        onOpenChange={setMapUploadOpen}
        onCreated={handleMapPlanCreated}
        initialPoints={mapInitialPoints}
        category="LORA"
      />
    </div>
  );
};

export default LoraMapPage;