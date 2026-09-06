import { useState } from "react";
import { Link } from "react-router";
import { Flame, LogInIcon, Map, MapPinnedIcon, Upload } from "lucide-react";
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
import { isExteriorWifiPlan } from "@/features/floorplans/types/floorplan.types";
import { FloorPlansGrid } from "@/features/floorplans/components/FloorPlansGrid";
import { CreateFloorPlanFromMapDialog } from "@/features/floorplans/components/CreateFloorPlanFromMapDialog";
import { SyncSurveysBtn } from "@/features/surveys/components/SyncSurveysBtn";
import { useSurveys } from "@/features/surveys/hooks/use-surveys";
import type { FloorPlan } from "@/features/floorplans/types/floorplan.types";

const formatDate = (value: string | null): string => {
  if (!value) return "—";
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

const WifiMapPage = () => {
  const { data: plans, isLoading: plansLoading } = useFloorPlans();
  const {
    data: surveys,
    isLoading: surveysLoading,
    isError: surveysError,
    refetch: refetchSurveys,
  } = useSurveys();

  const [mapUploadOpen, setMapUploadOpen] = useState(false);

  const wifiExteriorPlans = (plans ?? []).filter(isExteriorWifiPlan);
  const exteriorWifiSurveys = (surveys ?? []).filter(
    (survey) => survey.isExteriorWifi
  );

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
          Mapas de calor exterior — Wi-Fi
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <SyncSurveysBtn />
          <Button onClick={() => setMapUploadOpen(true)}>
            <Map className="mr-2 h-4 w-4" />
            Crear plano desde mapa
          </Button>
        </div>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Los mapas exteriores Wi-Fi se importan desde Link-Live igual que los
        interiores. Solo aparecen aquí los que se han medido sobre un plano con
        la etiqueta «plano exterior wifi».
      </p>

      <Card>
        <CardContent className="mt-4">
          {surveysLoading ? (
            <CustomLoading />
          ) : surveysError ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Error al cargar los mapas de calor.
              </p>
              <button
                type="button"
                onClick={() => refetchSurveys()}
                className="mt-2 text-sm text-primary underline"
              >
                Reintentar
              </button>
            </div>
          ) : !exteriorWifiSurveys.length ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl p-8 text-center">
              <Flame className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Aún no hay mapas de calor exteriores Wi-Fi
              </p>
              <p className="text-xs text-muted-foreground">
                Crea un plano exterior desde el mapa y haz la medición en
                AirMapper sobre ese plano; luego pulsa «Sincronizar Mapas».
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mapa de calor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Puntos</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exteriorWifiSurveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell className="font-medium">
                      {survey.name ??
                        survey.surveyName ??
                        survey.idLinkLive}
                    </TableCell>
                    <TableCell>{formatDate(survey.surveyStartTime)}</TableCell>
                    <TableCell className="text-center">
                      {survey.surveyPointCount}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{survey.surveyMode}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {survey.unitName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          survey.status === "ready" ? "default" : "secondary"
                        }
                      >
                        {survey.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/surveys/map/${survey.id}`}>
                        <Button
                          size="icon"
                          title="Ir al mapa de calor"
                          className="bg-yellow-500 text-foreground hover:bg-yellow-500/90"
                        >
                          <LogInIcon className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold sm:text-lg">
          <Upload className="h-5 w-5" />
          Planos de mapa exterior subidos (Wi-Fi)
        </h2>
        <FloorPlansGrid
          plans={wifiExteriorPlans}
          isLoading={plansLoading}
          emptyMessage="Aún no hay planos de mapa exterior Wi-Fi. Pulsa «Crear plano desde mapa» para capturar uno."
        />
      </section>

      <CreateFloorPlanFromMapDialog
        open={mapUploadOpen}
        onOpenChange={setMapUploadOpen}
        onCreated={handleMapPlanCreated}
        category="WIFI"
      />
    </div>
  );
};

export default WifiMapPage;