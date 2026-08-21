import { useState } from "react";

import {
  Activity as ActivityIcon,
  BarChart3,
  List,
  Network,
  Router,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { parseAsString, useQueryState } from "nuqs";

import { Badge } from "@/core/atomic-components/badge";
import { Button } from "@/core/atomic-components/button";
import { Card, CardContent } from "@/core/atomic-components/card";
import { Breadcrumbs } from "@/core/components/Breadcrumbs";
import { Tabs, TabsContent } from "@/core/atomic-components/tabs";
import { AnimatedTabs } from "@/core/atomic-components/animated-tabs";
import { HostsTable } from "@/features/analyses/components/table/HostsTable";
import { StatCards } from "@/features/analyses/components/StatCards";
import { AnalysisCharts } from "@/features/analyses/components/charts/AnalysisCharts";
import { AnalysisTopology } from "@/features/analyses/components/topology/AnalysisTopology";
import { useAnalysis } from "@/features/analyses/hooks/use-analysis";
import { useAnalysisHosts } from "@/features/analyses/hooks/use-analysis-hosts";
import { getAnalysisHostTypeLabel } from "@/features/analyses/types/analysis.types";

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

const AnalysisPage = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const numericId = Number(analysisId);
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault("dispositivos")
  );
  const { data: analysis, isLoading, isError, refetch } = useAnalysis(numericId);

  const [activeType, setActiveType] = useState("ap");
  const {
    data: hosts,
    isLoading: hostsLoading,
    isError: hostsError,
    refetch: refetchHosts,
  } = useAnalysisHosts(numericId, activeType);

  const { data: allHosts } = useAnalysisHosts(numericId);

  if (isLoading) {
    return (
      <div className="container max-w-7xl px-2 py-2 mx-auto mb-4 sm:py-6">
        <p className="text-sm text-muted-foreground">Cargando análisis…</p>
      </div>
    );
  }

  if (isError || !analysis) {
    return (
      <div className="container max-w-7xl px-2 py-2 mx-auto mb-4 sm:py-6">
        <p className="text-sm text-muted-foreground">
          No se encontró el análisis.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const analysisName =
    analysis.name ?? analysis.fileName ?? analysis.idLinkLive;

  return (
    <div className="container max-w-7xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      <div className="flex items-center justify-between gap-2 mb-4">
        <Breadcrumbs
          items={[{ label: "Análisis", to: "/analyses" }, { label: analysisName }]}
        />
        <Badge variant={analysis.status === "ready" ? "default" : "secondary"}>
          {analysis.status ?? "—"}
        </Badge>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 mb-4 sm:flex-row">
        <h1 className="flex gap-4 px-2 text-lg font-bold sm:items-center sm:text-2xl">
          <ActivityIcon />
          {analysisName}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {analysis.unitName && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/units?q=${encodeURIComponent(analysis.unitName)}`}>
                <Router className="w-4 h-4 mr-2" />
                Unidad: {analysis.unitName}
              </Link>
            </Button>
          )}
          <Badge variant="secondary">
            {analysis.hostCount ?? 0} dispositivos detectados
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="mt-4">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold text-muted-foreground uppercase">
                Inicio
              </dt>
              <dd className="mt-1 font-medium">{formatDate(analysis.startTime)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground uppercase">
                Fin
              </dt>
              <dd className="mt-1 font-medium">{formatDate(analysis.endTime)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground uppercase">
                Unidad
              </dt>
              <dd className="mt-1 font-medium break-words">
                {analysis.unitName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground uppercase">
                Hardware
              </dt>
              <dd className="mt-1 font-medium break-words">
                {analysis.unitHardware ?? analysis.unitType ?? "—"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
        <AnimatedTabs
          tabs={[
            {
              value: "dispositivos",
              label: "Dispositivos",
              icon: <List className="w-4 h-4" />,
            },
            {
              value: "graficas",
              label: "Gráficas",
              icon: <BarChart3 className="w-4 h-4" />,
            },
            {
              value: "topologia",
              label: "Topología",
              icon: <Network className="w-4 h-4" />,
            },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <TabsContent
          value="dispositivos"
          className="space-y-4 duration-300 animate-in fade-in-50 slide-in-from-bottom-5"
        >
          <div className="mt-4">
            <StatCards
              counts={analysis.hostCounts}
              activeType={activeType}
              onSelect={setActiveType}
            />
          </div>

          <Card>
            <CardContent className="mt-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  {getAnalysisHostTypeLabel(activeType)}
                </h2>
                {hostsError && (
                  <button
                    type="button"
                    onClick={() => refetchHosts()}
                    className="text-sm text-primary underline"
                  >
                    Reintentar
                  </button>
                )}
              </div>
              {hostsLoading ? (
                <p className="py-8 text-sm text-muted-foreground text-center">
                  Cargando dispositivos…
                </p>
              ) : hostsError ? (
                <p className="py-8 text-sm text-muted-foreground text-center">
                  Error al cargar los dispositivos.
                </p>
              ) : !hosts || hosts.length === 0 ? (
                <p className="py-8 text-sm text-muted-foreground text-center">
                  No hay dispositivos de este tipo.
                </p>
              ) : (
                <HostsTable hostType={activeType} hosts={hosts} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="graficas"
          className="duration-300 animate-in fade-in-50 slide-in-from-bottom-5"
        >
          <AnalysisCharts hosts={allHosts ?? []} />
        </TabsContent>

        <TabsContent
          value="topologia"
          className="duration-300 animate-in fade-in-50 slide-in-from-bottom-5"
        >
          <AnalysisTopology analysisName={analysisName} hosts={allHosts ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisPage;
