import { useNavigate, useParams } from "react-router";
import { AlertTriangleIcon, RefreshCwIcon, ZapIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/core/atomic-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import { Progress } from "@/core/atomic-components/progress";
import CustomLoading from "@/core/components/CustomLoading";
import AuditHeader from "./AuditHeader";
import { EvalStatusBadge } from "@/features/audits/components/badges";
import { useAudit } from "@/features/audits/hooks/use-audits";
import {
  useAuditDashboard,
  useDataQuality,
  useRunEvaluation,
  useSyncAudit,
} from "@/features/audits/hooks/use-audit-workflow";

const KpiCard = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </CardContent>
  </Card>
);

const AuditDashboardPage = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const { data: audit, isLoading: loadingAudit } = useAudit(auditId);
  const { data: dashboard, isLoading: loadingDashboard } =
    useAuditDashboard(auditId);
  const runEvaluation = useRunEvaluation(auditId);
  const syncAudit = useSyncAudit(auditId);
  const { data: quality } = useDataQuality(auditId);

  if (loadingAudit || loadingDashboard || !audit || !dashboard) {
    return <CustomLoading />;
  }

  const evaluations = dashboard.evaluations;

  const handleEvaluate = async () => {
    try {
      const result = await runEvaluation.mutateAsync(undefined);
      toast.success(
        `Evaluación completada: ${result.total} métricas · resultado ${result.globalResult}`
      );
    } catch {
      // error gestionado globalmente
    }
  };

  const handleSync = async () => {
    try {
      toast.info("Sincronizando con Link-Live…");
      const result = await syncAudit.mutateAsync(undefined);
      toast.success(
        `Sincronización: ${result.measures.created + result.measures.updated} medidas, ${
          result.surveys.created + result.surveys.updated
        } surveys, ${result.analyses.created + result.analyses.updated} análisis.`
      );
    } catch {
      // error gestionado globalmente
    }
  };

  return (
    <div className="container max-w-6xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      <AuditHeader />

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex gap-2">
          <Button onClick={handleSync} disabled={syncAudit.isPending} variant="outline">
            <RefreshCwIcon className="w-4 h-4 mr-1" />
            {syncAudit.isPending ? "Sincronizando…" : "Sincronizar Link-Live"}
          </Button>
          <Button onClick={handleEvaluate} disabled={runEvaluation.isPending}>
            <ZapIcon className="w-4 h-4 mr-1" />
            {runEvaluation.isPending ? "Evaluando…" : "Evaluar criterios"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Última sincronización:{" "}
          {audit.lastSyncAt
            ? new Date(audit.lastSyncAt).toLocaleString("es-ES")
            : "nunca"}
        </p>
      </div>

      {quality && !quality.complete ? (
        <Card className="mb-4 border-amber-300 bg-amber-50/50">
          <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start">
            <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-medium text-amber-900">
                Calidad de datos: se detectaron {quality.problems.length} problema(s)
              </p>
              <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                {quality.problems.slice(0, 5).map((problem, index) => (
                  <li key={index}>
                    [{problem.severity}] {problem.message} ({problem.count})
                  </li>
                ))}
                {quality.problems.length > 5 ? (
                  <li>… y {quality.problems.length - 5} más (detalle en el informe)</li>
                ) : null}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <KpiCard
          label="Incidencias activas"
          value={
            (dashboard.issues.active ?? 0) ||
            dashboard.issues.suggested + (dashboard.issues.accepted ?? 0)
          }
          hint={`${Object.entries(dashboard.issues.bySeverity)
            .map(([severity, count]) => `${severity}: ${count}`)
            .join(" · ")}`}
        />
        <KpiCard
          label="Checklist completado"
          value={`${dashboard.checklist.pct}%`}
          hint={`${dashboard.checklist.completed}/${dashboard.checklist.required} obligatorios`}
        />
        <KpiCard
          label="Resultado de evaluación"
          value={
            dashboard.conclusion?.globalResult
              ? dashboard.conclusion.globalResult.replace(/_/g, " ")
              : evaluations.total > 0
                ? "Pendiente de concluir"
                : "Sin evaluar"
          }
          hint={
            evaluations.lastRunAt
              ? `Ejecutada: ${new Date(evaluations.lastRunAt).toLocaleString("es-ES")}`
              : "Aún no se ha ejecutado la evaluación"
          }
        />
        <KpiCard
          label="Descubrimiento"
          value={`${dashboard.discovery.aps} APs`}
          hint={`${dashboard.discovery.ssids} SSIDs · ${dashboard.discovery.clients} clientes`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resultados por criterio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-md border p-2 space-y-1">
                <EvalStatusBadge status="PASS" />
                <p className="text-xl font-semibold">{evaluations.PASS}</p>
              </div>
              <div className="rounded-md border p-2 space-y-1">
                <EvalStatusBadge status="WARNING" />
                <p className="text-xl font-semibold">{evaluations.WARNING}</p>
              </div>
              <div className="rounded-md border p-2 space-y-1">
                <EvalStatusBadge status="FAIL" />
                <p className="text-xl font-semibold">{evaluations.FAIL}</p>
              </div>
              <div className="rounded-md border p-2 space-y-1">
                <EvalStatusBadge status="UNKNOWN" />
                <p className="text-xl font-semibold">{evaluations.UNKNOWN}</p>
              </div>
            </div>
            {evaluations.total === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ejecuta «Evaluar criterios» para valorar las capturas contra el
                perfil «{audit.profile?.name ?? "sin perfil"}».
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Progreso del checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={dashboard.checklist.pct} />
            <ul className="space-y-1 text-sm">
              {dashboard.checklist.sections.map((section) => (
                <li key={section.section} className="flex items-center justify-between gap-2">
                  <span>{section.label}</span>
                  <span className="text-muted-foreground">
                    {section.completed}/{section.required}
                    {section.failing > 0 ? (
                      <span className="ml-2 font-medium text-destructive">
                        {section.failing} con fallo
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              variant="link"
              className="h-auto p-0"
              onClick={() => navigate(`/audits/${auditId}/tests`)}
            >
              Ir al checklist →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditDashboardPage;
