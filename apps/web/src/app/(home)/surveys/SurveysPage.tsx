import { Radar, LogInIcon } from "lucide-react";
import { Link } from "react-router";
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
import { SyncSurveysBtn } from "@/features/surveys/components/SyncSurveysBtn";
import { useSurveys } from "@/features/surveys/hooks/use-surveys";

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

const SurveysPage = () => {
  const { data: surveys, isLoading, isError, refetch } = useSurveys();

  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <div className="flex flex-col items-center justify-between gap-2 mt-2 mb-4 sm:flex-row">
        <h1 className="flex gap-4 px-2 mb-2 text-lg font-bold sm:items-center sm:text-2xl">
          <Radar className="w-6 h-6" />
          Mapas de calor Wi‑Fi (Link-Live)
        </h1>
        <SyncSurveysBtn />
      </div>

      <Card>
        <CardContent className="mt-4">
          {isLoading ? (
            <p className="py-8 text-sm text-muted-foreground text-center">
              Cargando mapas de calor…
            </p>
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Error al cargar los mapas de calor.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 text-sm text-primary underline"
              >
                Reintentar
              </button>
            </div>
          ) : !surveys || surveys.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground text-center">
              No hay mapas de calor. Pulsa «Sincronizar Mapas» para importarlos
              desde Link-Live.
            </p>
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
                {surveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell className="font-medium">
                      {survey.name ?? survey.surveyName ?? survey.idLinkLive}
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
                      <Link to={`/surveys/${survey.id}`}>
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
    </div>
  );
};

export default SurveysPage;