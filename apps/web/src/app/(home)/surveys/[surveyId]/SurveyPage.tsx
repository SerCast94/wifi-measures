import { useEffect, useState } from "react";

import { Activity, Radar } from "lucide-react";
import { Link, useParams } from "react-router";

import { Badge } from "@/core/atomic-components/badge";
import { Button } from "@/core/atomic-components/button";
import { Card, CardContent } from "@/core/atomic-components/card";
import { Breadcrumbs } from "@/core/components/Breadcrumbs";
import { useAnalyses } from "@/features/analyses/hooks/use-analyses";
import { ImportToAreaDialog } from "@/features/surveys/components/ImportToAreaDialog";
import { MetricSelector } from "@/features/surveys/components/MetricSelector";
import { SurveyHeatmap } from "@/features/surveys/components/SurveyHeatmap";
import { useSurvey } from "@/features/surveys/hooks/use-survey";

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

const SurveyPage = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const numericId = Number(surveyId);
  const { data: survey, isLoading, isError, refetch } = useSurvey(numericId);
  const { data: analyses } = useAnalyses();

  const [activeMetricKey, setActiveMetricKey] = useState("signal");

  const relatedAnalysis =
    survey?.analysisGuid && analyses
      ? analyses.find(
          (analysis) =>
            analysis.guid === survey.analysisGuid ||
            analysis.analysisGuid === survey.analysisGuid ||
            analysis.idLinkLive === survey.analysisGuid
        )
      : undefined;

  useEffect(() => {
    if (!survey?.metrics || survey.metrics.length === 0) return;
    const signal = survey.metrics.find((metric) => metric.key === "signal");
    if (signal) {
      setActiveMetricKey(signal.key);
    } else {
      setActiveMetricKey(survey.metrics[0].key);
    }
  }, [survey]);

  if (isLoading) {
    return (
      <div className="container max-w-5xl px-2 py-2 mx-auto mb-4 sm:py-6">
        <p className="text-sm text-muted-foreground">Cargando encuesta…</p>
      </div>
    );
  }

  if (isError || !survey) {
    return (
      <div className="container max-w-5xl px-2 py-2 mx-auto mb-4 sm:py-6">
        <p className="text-sm text-muted-foreground">
          No se encontró la encuesta.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const activeMetric =
    survey.metrics?.find((metric) => metric.key === activeMetricKey) ??
    survey.metrics?.[0];

  return (
    <div className="container max-w-5xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <Breadcrumbs
          items={[
            { label: "Encuestas", to: "/surveys" },
            { label: survey.name ?? survey.surveyName ?? survey.idLinkLive },
          ]}
        />
        <ImportToAreaDialog
          surveyId={survey.id}
          surveyName={survey.name ?? survey.surveyName}
        />
      </div>

      <div className="flex flex-col items-center justify-between gap-2 mb-4 sm:flex-row">
        <h1 className="flex gap-4 px-2 text-lg font-bold sm:items-center sm:text-2xl">
          <Radar className="w-6 h-6" />
          {survey.name ?? survey.surveyName ?? survey.idLinkLive}
        </h1>
        <Badge variant="secondary">
          {survey.surveyPointCount} puntos · {survey.surveyMode}
        </Badge>
      </div>

      <Card>
        <CardContent className="mt-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Fecha</dt>
              <dd>{formatDate(survey.surveyStartTime)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Unidad</dt>
              <dd>{survey.unitName ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">SSID 1×1</dt>
              <dd>{survey.ssid1x1 ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Estado</dt>
              <dd>{survey.status ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Análisis relacionado</dt>
              <dd>
                {relatedAnalysis ? (
                  <Link
                    to={`/analyses/${relatedAnalysis.id}`}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    {relatedAnalysis.name ?? relatedAnalysis.idLinkLive}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="mt-4 space-y-4">
        {survey.metrics && survey.metrics.length > 0 && (
          <MetricSelector
            metrics={survey.metrics}
            activeKey={activeMetric?.key ?? ""}
            onChange={setActiveMetricKey}
          />
        )}

        {survey.image && activeMetric ? (
          <SurveyHeatmap
            image={survey.image}
            points={activeMetric.points}
            unit={activeMetric.unit}
            metricLabel={activeMetric.label}
          />
        ) : (
          <Card>
            <CardContent className="mt-4 text-sm text-muted-foreground">
              Esta encuesta no tiene plano ni datos de mapa de calor.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SurveyPage;