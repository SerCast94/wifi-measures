import { useParams } from "react-router";
import { Link } from "react-router";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import CustomLoading from "@/core/components/CustomLoading";
import AuditHeader from "../AuditHeader";
import { EvalStatusBadge } from "@/features/audits/components/badges";
import { useAuditEvaluations } from "@/features/audits/hooks/use-audit-workflow";
import type { AuditCategory, AuditEvaluation } from "@/features/audits/types/audit.types";

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  COBERTURA: "Cobertura",
  RADIO: "Radiofrecuencia",
  CONECTIVIDAD: "Conectividad",
  RENDIMIENTO: "Rendimiento",
  MOVILIDAD: "Movilidad / roaming",
};

const CATEGORY_ORDER: AuditCategory[] = [
  "COBERTURA",
  "RADIO",
  "CONECTIVIDAD",
  "RENDIMIENTO",
  "MOVILIDAD",
];

const METRIC_LABELS: Record<string, string> = {
  RSSI: "RSSI medio",
  SNR: "SNR medio",
  NOISE: "Ruido medio",
  CHANNEL_UTILIZATION: "Utilización de canal",
  NON_WIFI_UTILIZATION: "Utilización no Wi-Fi",
  CO_CHANNEL_INTERFERENCE: "APs co-canal",
  ADJACENT_CHANNEL_INTERFERENCE: "Redes adyacentes",
  ROGUE_APS: "APs rogue",
  OVERALL_RESULT: "Veredicto del equipo",
  ASSOCIATION: "Asociación",
  DHCP: "DHCP",
  GATEWAY: "Gateway",
  DNS: "DNS",
  INTERNET: "Internet",
  HTTP_HTTPS: "HTTP/HTTPS",
  COVERAGE_MIN_RSSI: "Cobertura mínima (RSSI)",
  COVERAGE_MIN_SNR: "Cobertura mínima (SNR)",
  COVERAGE_PASS_RATE: "Puntos fuera de objetivo",
  DOWNLOAD: "Descarga",
  UPLOAD: "Subida",
  LATENCY: "Latencia",
  PACKET_LOSS: "Pérdida de paquetes",
  ROAMING: "Roaming",
};

const EvaluationRow = ({ evaluation }: { evaluation: AuditEvaluation }) => (
  <div className="border-b py-2 last:border-b-0">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm font-medium">
        {METRIC_LABELS[evaluation.metric] ?? evaluation.metric}
        {evaluation.locationLabel ? (
          <span className="ml-2 text-xs text-muted-foreground">
            {evaluation.locationLabel}
          </span>
        ) : null}
      </span>
      <EvalStatusBadge status={evaluation.status} />
    </div>
    <p className="mt-0.5 text-sm text-muted-foreground">{evaluation.message}</p>
    {evaluation.threshold ? (
      <p className="mt-0.5 text-xs text-muted-foreground">
        Umbral aplicado: {evaluation.threshold.operator}{" "}
        {evaluation.threshold.value}
        {evaluation.threshold.unit ?? ""}
      </p>
    ) : null}
  </div>
);

const AuditDetailsPage = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const { data: evaluations, isLoading } = useAuditEvaluations(auditId);

  if (isLoading || !evaluations) return <CustomLoading />;

  return (
    <div className="container max-w-4xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      <AuditHeader />

      {evaluations.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Todavía no se ha ejecutado la evaluación para esta auditoría.
            Ejecútala desde el resumen.
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            Resultado detallado del último análisis ({evaluations.length}{" "}
            condiciones). Los visores interactivos siguen disponibles en{" "}
            <Link to="/surveys" className="underline">
              mapas de calor
            </Link>{" "}
            y{" "}
            <Link to="/analyses" className="underline">
              análisis
            </Link>
            .
          </p>
          {CATEGORY_ORDER.map((category) => {
            const rows = evaluations.filter(
              (evaluation) => evaluation.category === category
            );
            if (rows.length === 0) return null;
            return (
              <Card key={category} className="mb-4">
                <CardHeader className="pb-1">
                  <CardTitle className="text-base">
                    {CATEGORY_LABELS[category]}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({rows.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rows.map((evaluation) => (
                    <EvaluationRow key={evaluation.id} evaluation={evaluation} />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
};

export default AuditDetailsPage;
