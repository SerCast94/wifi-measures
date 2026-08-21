import { useState } from "react";

import { MapPinned, Radar } from "lucide-react";
import { Link } from "react-router";

import { Card, CardContent } from "@/core/atomic-components/card";
import { Button } from "@/core/atomic-components/button";
import { useAreaPlan } from "@/features/measures/hooks/use-area-plan";
import { PlanEditor } from "@/features/measures/components/plan/PlanEditor";
import { PlanHeatmap } from "@/features/measures/components/plan/PlanHeatmap";
import { useSurveys } from "@/features/surveys/hooks/use-surveys";
import type { Area } from "@/features/measures/types/areas.types";

interface HeatmapTabProps {
  area: Area;
}

export const HeatmapTab = ({ area }: HeatmapTabProps) => {
  const { data: plan, isLoading, refetch } = useAreaPlan(area.id);
  const { data: surveys } = useSurveys();
  const [editing, setEditing] = useState(false);

  const sourceSurvey =
    plan?.heatmap?.source === "linklive" && plan.heatmap.surveyId && surveys
      ? surveys.find((s) => s.idLinkLive === plan.heatmap?.surveyId)
      : undefined;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="mt-4 text-sm text-muted-foreground">
          Cargando plano…
        </CardContent>
      </Card>
    );
  }

  if (editing) {
    return (
      <PlanEditor
        areaId={area.id}
        areaName={area.name}
        measures={area.measures}
        initialPlan={plan}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          refetch();
        }}
      />
    );
  }

  const positionedCount = plan?.positions
    ? Object.keys(plan.positions).length
    : 0;

  return (
    <Card>
      <CardContent className="mt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPinned className="w-4 h-4" />
            Mapa de calor sobre plano
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/surveys">
                <Radar className="w-4 h-4" />
                Importar de Link-Live
              </Link>
            </Button>
            <Button onClick={() => setEditing(true)}>
              {plan ? "Editar plano" : "Subir plano"}
            </Button>
          </div>
        </div>

        {plan ? (
          positionedCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              El plano aún no tiene medidas posicionadas. Haz clic en
              «Editar plano» para colocar los puntos de medida sobre la imagen.
            </p>
          ) : (
            <PlanHeatmap plan={plan} measures={area.measures} />
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay plano para este área. Sube una imagen del plano y coloca los
            puntos de medida sobre ella para generar el mapa de calor.
          </p>
        )}

        {sourceSurvey && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Radar className="w-4 h-4" />
            <span>Heatmap importado de la encuesta:</span>
            <Link
              to={`/surveys/${sourceSurvey.id}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {sourceSurvey.name ?? sourceSurvey.surveyName ?? sourceSurvey.idLinkLive}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};