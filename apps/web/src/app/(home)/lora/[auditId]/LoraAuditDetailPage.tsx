import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  AudioWaveformIcon,
  Link as LinkIcon,
  MapIcon,
  RadioTowerIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import { Badge } from "@/core/atomic-components/badge";
import { Button } from "@/core/atomic-components/button";
import { EmptyState } from "@/core/atomic-components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/atomic-components/table";
import CustomLoading from "@/core/components/CustomLoading";
import LoraAuditHeader from "./LoraAuditHeader";
import { LoraMeasuresTable } from "@/features/lora/components/LoraMeasuresTable";
import { LoraNoiseTable } from "@/features/lora/components/LoraNoiseTable";
import { LinkFloorPlanDialog } from "@/features/lora/components/LinkFloorPlanDialog";
import { LoraPlanHeatmap } from "@/features/lora/components/LoraPlanHeatmap";
import { useFloorPlans } from "@/features/floorplans/hooks/use-floorplans";
import { normalizeGeoCalibration } from "@/features/floorplans/types/floorplan.types";
import { useLoraAudit, useUpdateLoraAudit } from "@/features/lora/hooks/use-lora";

const GEO_CORNERS = [
  {
    label: "Superior izquierda",
    lat: "topLeftLat" as const,
    lon: "topLeftLon" as const,
  },
  {
    label: "Superior derecha",
    lat: "topRightLat" as const,
    lon: "topRightLon" as const,
  },
  {
    label: "Inferior derecha",
    lat: "bottomRightLat" as const,
    lon: "bottomRightLon" as const,
  },
  {
    label: "Inferior izquierda",
    lat: "bottomLeftLat" as const,
    lon: "bottomLeftLon" as const,
  },
];

const formatCoord = (value: number): string => value.toFixed(6);

const GeoCornersTable = ({
  geoCalibration,
}: {
  geoCalibration: NonNullable<ReturnType<typeof normalizeGeoCalibration>>;
}) => (
  <div className="mt-3 overflow-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Esquina</TableHead>
          <TableHead>Latitud</TableHead>
          <TableHead>Longitud</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {GEO_CORNERS.map((corner) => (
          <TableRow key={corner.label}>
            <TableCell className="font-medium">{corner.label}</TableCell>
            <TableCell>{formatCoord(geoCalibration[corner.lat])}</TableCell>
            <TableCell>{formatCoord(geoCalibration[corner.lon])}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("es-ES") : "—";

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <dt className="font-medium text-muted-foreground">{label}</dt>
    <dd>{value || "—"}</dd>
  </div>
);

const IdChips = ({ ids }: { ids: number[] }) => (
  <div className="mb-3 flex flex-wrap gap-1">
    {ids.slice(0, 8).map((id) => (
      <Badge key={id} variant="outline">
        #{id}
      </Badge>
    ))}
    {ids.length > 8 ? (
      <Badge variant="outline">+{ids.length - 8} más</Badge>
    ) : null}
  </div>
);

const LoraAuditDetailPage = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const { data: audit, isLoading } = useLoraAudit(auditId);
  const { data: allPlans = [] } = useFloorPlans();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const updateAudit = useUpdateLoraAudit();

  const [draftRadius, setDraftRadius] = useState<number>(audit?.heatmapRadius ?? 0.16);
  const auditRadius = audit?.heatmapRadius ?? 0.16;
  useEffect(() => {
    setDraftRadius(auditRadius);
  }, [auditRadius]);

  const saveRadius = (value: number) => {
    if (!audit) return;
    updateAudit.mutate({
      id: audit.id,
      input: { heatmapRadius: Number(value) },
    });
  };

  const auditFloorPlan = audit?.floorPlanId
    ? allPlans.find((p) => p.id === audit.floorPlanId) ?? null
    : null;
  const geoCalibration = normalizeGeoCalibration(
    auditFloorPlan?.geoCalibration
  );

  if (isLoading || !audit) return <CustomLoading />;

  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <LoraAuditHeader />

      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Datos generales</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Código" value={audit.code} />
            <Field label="Cliente" value={audit.client} />
            <Field label="Proyecto" value={audit.project} />
            <Field label="Ubicación" value={audit.location} />
            <Field label="Técnico" value={audit.technician} />
            <Field label="Objetivo" value={audit.objective} />
            <Field label="Fecha inicio" value={formatDate(audit.startDate)} />
            <Field label="Fecha fin" value={formatDate(audit.endDate)} />
            <Field label="Fecha auditoría" value={formatDate(audit.auditDate)} />
          </dl>
          {audit.description ? (
            <p className="mt-4 text-sm text-muted-foreground">{audit.description}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base">
            Medidas LoRa seleccionadas
            {audit.measures.length > 0 ? (
              <Badge variant="secondary" className="ml-2">
                {audit.measures.length}
              </Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {audit.measures.length > 0 ? (
            <>
              <IdChips ids={audit.measures.map((m) => m.id)} />
              <LoraMeasuresTable measures={audit.measures} />
            </>
          ) : (
            <EmptyState
              icon={RadioTowerIcon}
              title="Sin medidas seleccionadas"
              description="Carga medidas en la sección «Medidas» y edita la auditoría para seleccionarlas."
            />
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base">
            Ruido seleccionado
            {audit.noise.length > 0 ? (
              <Badge variant="secondary" className="ml-2">
                {audit.noise.length}
              </Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {audit.noise.length > 0 ? (
            <>
              <IdChips ids={audit.noise.map((n) => n.id)} />
              <LoraNoiseTable noise={audit.noise} />
            </>
          ) : (
            <EmptyState
              icon={AudioWaveformIcon}
              title="Sin ruido seleccionado"
              description="Carga ruido en la sección «Ruido» y edita la auditoría para seleccionarlo."
            />
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Plano asociado</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLinkDialog(true)}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            {auditFloorPlan ? "Cambiar" : "Vincular plano"}
          </Button>
        </CardHeader>
        <CardContent>
          {auditFloorPlan ? (
            <div>
              <p className="mb-2 text-sm font-medium">{auditFloorPlan.name}</p>
              {geoCalibration && audit.measures.length > 0 ? (
                <div className="mb-3 flex items-center gap-3">
                  <label
                    htmlFor="heatmap-radius"
                    className="whitespace-nowrap text-xs font-medium text-muted-foreground"
                  >
                    Radio de medidas
                  </label>
                  <input
                    id="heatmap-radius"
                    type="range"
                    min={0.04}
                    max={0.5}
                    step={0.01}
                    value={draftRadius}
                    onChange={(event) => setDraftRadius(Number(event.target.value))}
                    onPointerUp={(event) =>
                      saveRadius(Number((event.target as HTMLInputElement).value))
                    }
                    onKeyUp={(event) =>
                      saveRadius(Number((event.target as HTMLInputElement).value))
                    }
                    className="w-full accent-primary"
                    title={`${Math.round(draftRadius * 100)}%`}
                  />
                  <span className="whitespace-nowrap text-xs font-semibold">
                    {Math.round(draftRadius * 100)}%
                  </span>
                </div>
              ) : null}
              {auditFloorPlan.image ? (
                geoCalibration ? (
                  <LoraPlanHeatmap
                    image={auditFloorPlan.image}
                    width={auditFloorPlan.width}
                    height={auditFloorPlan.height}
                    geoCalibration={geoCalibration}
                    measures={audit.measures}
                    noise={audit.noise}
                    radius={draftRadius}
                  />
                ) : (
                  <img
                    src={auditFloorPlan.image}
                    alt={auditFloorPlan.name}
                    className="max-h-[250px] rounded-lg border object-contain"
                  />
                )
              ) : (
                <p className="text-xs text-muted-foreground">
                  Este plano no tiene imagen disponible.
                </p>
              )}
              {geoCalibration ? (
                <GeoCornersTable geoCalibration={geoCalibration} />
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Este plano no está georreferenciado.
                </p>
              )}
            </div>
          ) : (
            <EmptyState
              icon={MapIcon}
              title="Sin plano asociado"
              description="Vincula un plano georreferenciado para usarlo como base del mapa de calor del informe."
            />
          )}
        </CardContent>
      </Card>

      <LinkFloorPlanDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        auditId={audit.id}
        currentFloorPlanId={audit.floorPlanId}
        onLinked={() => {}}
      />

      <div className="mt-6">
        <Link to="/lora" className="text-sm text-muted-foreground hover:underline">
          ← Volver a auditorías LoRa
        </Link>
      </div>
    </div>
  );
};

export default LoraAuditDetailPage;
