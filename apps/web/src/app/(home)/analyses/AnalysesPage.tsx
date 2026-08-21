import { Activity } from "lucide-react";

import { Card, CardContent } from "@/core/atomic-components/card";
import { AnalysesTable } from "@/features/analyses/components/table/AnalysesTable";
import { SyncAnalysesBtn } from "@/features/analyses/components/SyncAnalysesBtn";
import { GlobalAnalysesFilter } from "@/features/analyses/components/filters/GlobalAnalysesFilter";
import { useAnalyses } from "@/features/analyses/hooks/use-analyses";

const AnalysesPage = () => {
  const { data: analyses, isLoading, isError, refetch } = useAnalyses();

  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <div className="flex flex-col items-center justify-between gap-2 mt-2 mb-4 sm:flex-row">
        <h1 className="flex gap-4 px-2 mb-2 text-lg font-bold sm:items-center sm:text-2xl">
          <Activity className="w-6 h-6" />
          Análisis Wi‑Fi (Link-Live)
        </h1>
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <SyncAnalysesBtn />
          <GlobalAnalysesFilter className="w-full sm:w-64" />
        </div>
      </div>

      <Card>
        <CardContent className="mt-4">
          {isLoading ? (
            <p className="py-8 text-sm text-muted-foreground text-center">
              Cargando análisis…
            </p>
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Error al cargar los análisis.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 text-sm text-primary underline"
              >
                Reintentar
              </button>
            </div>
          ) : !analyses || analyses.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground text-center">
              No hay análisis. Pulsa «Sincronizar Análisis» para importarlos
              desde Link-Live.
            </p>
          ) : (
            <AnalysesTable analyses={analyses} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysesPage;