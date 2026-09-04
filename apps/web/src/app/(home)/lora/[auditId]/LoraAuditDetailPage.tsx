import { useState } from "react";
import { Link, useParams } from "react-router";
import { Link as LinkIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import { Button } from "@/core/atomic-components/button";
import CustomLoading from "@/core/components/CustomLoading";
import LoraAuditHeader from "./LoraAuditHeader";
import { LoraMeasuresTable } from "@/features/lora/components/LoraMeasuresTable";
import { LoraNoiseTable } from "@/features/lora/components/LoraNoiseTable";
import { LinkFloorPlanDialog } from "@/features/lora/components/LinkFloorPlanDialog";
import { useFloorPlans } from "@/features/floorplans/hooks/use-floorplans";
import { useLoraAudit } from "@/features/lora/hooks/use-lora";

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("es-ES") : "—";

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <dt className="font-medium text-muted-foreground">{label}</dt>
    <dd>{value || "—"}</dd>
  </div>
);

const LoraAuditDetailPage = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const { data: audit, isLoading } = useLoraAudit(auditId);
  const { data: allPlans = [] } = useFloorPlans();
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const auditFloorPlan = audit?.floorPlanId
    ? allPlans.find((p) => p.id === audit.floorPlanId) ?? null
    : null;

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
          <CardTitle className="text-base">
            Medida LoRa seleccionada{" "}
            {audit.measure ? (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                #{audit.measure.id}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {audit.measure ? (
            <LoraMeasuresTable measures={[audit.measure]} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No se seleccionó ninguna medida para esta auditoría.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Ruido seleccionado{" "}
            {audit.noise ? (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                #{audit.noise.id}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {audit.noise ? (
            <LoraNoiseTable noise={[audit.noise]} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No se seleccionó ningún ruido para esta auditoría.
            </p>
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
              {auditFloorPlan.image ? (
                <img
                  src={auditFloorPlan.image}
                  alt={auditFloorPlan.name}
                  className="max-h-[250px] rounded-lg border object-contain"
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Este plano no tiene imagen disponible.
                </p>
              )}
              {auditFloorPlan.geoCalibration ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Georreferenciado: sí
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin plano asociado. Vincula un plano para usarlo como base del mapa
              de calor.
            </p>
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
